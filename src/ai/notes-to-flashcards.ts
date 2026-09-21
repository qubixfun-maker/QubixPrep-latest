'use server';
import { callGeminiNative } from '@/ai/genkit';

/**
 * Generates flashcard front/back pairs directly from a topic's already-written NOTES
 * markdown - unlike knowledgeToFlashcards (which only rephrases facts an earlier
 * extraction step already tagged), this reads the raw notes prose itself and both
 * identifies and phrases the flashcard-worthy facts in one pass. Gemini-only by
 * design (no multi-provider fallback), matching notes-to-mindmap.ts.
 */

export type FlashcardPair = { front: string; back: string };
export type TopicFlashcards = { topicName: string; cards: FlashcardPair[] };

type NotesTopic = { name: string; markdown: string; depth: number };

function buildPrompt(topicName: string, markdown: string): string {
  return `You are making flashcards from a medical student's revision notes on "${topicName}". Use ONLY what's in the notes below - do not add outside information.

NOTES:
${markdown}

Note: the notes may contain fenced code blocks labeled \`\`\`flow (a step-by-step pathway/process) and \`\`\`quiz (existing self-test questions). You may draw flashcard facts from a \`\`\`flow block's steps, but do NOT reuse the \`\`\`quiz block's questions verbatim - write your own distinct questions.

TASK: Pick the 5 to 10 most important, distinct, exam-relevant facts in these notes (named values, mechanisms, classifications, distinguishing features - whatever is actually memorable and testable here, not padding). For each, write:
- "front": a clear, specific question that fact answers (a genuine question someone would ask, not just the fact restated with a question mark)
- "back": a concise, direct answer

Output ONLY a JSON array, no commentary, no code fences:
[{"front": "...", "back": "..."}]`;
}

function tryParseArray(raw: string): FlashcardPair[] | null {
  const clean = raw.replace(/```[a-zA-Z]*/g, '').replace(/```/g, '').trim();
  try {
    const parsed = JSON.parse(clean);
    if (Array.isArray(parsed)) return parsed;
  } catch {
    const match = clean.match(/\[[\s\S]*\]/);
    if (match) {
      try {
        const parsed = JSON.parse(match[0]);
        if (Array.isArray(parsed)) return parsed;
      } catch { /* fall through */ }
    }
  }
  return null;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRateLimitError(message: string | undefined): boolean {
  if (!message) return false;
  return message.includes('429') || message.toLowerCase().includes('resource exhausted');
}

async function generateOneDeck(topicName: string, markdown: string): Promise<{ cards?: FlashcardPair[]; error?: string }> {
  const prompt = buildPrompt(topicName, markdown);
  const MAX_ATTEMPTS = 3;
  let lastError = '';
  let consecutiveRateLimitHits = 0;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      // A small fixed pace before every call, on top of the backoff below for
      // actual 429s - especially important here since topics run with concurrency,
      // so several of these can otherwise fire at once.
      await sleep(1000);
      const { content: raw } = await callGeminiNative([{ role: 'user', content: prompt }], 2000, 256);
      const parsed = tryParseArray(raw);
      if (parsed && parsed.length > 0) return { cards: parsed };
      lastError = 'AI response was not a valid flashcard array';
      consecutiveRateLimitHits = 0;
    } catch (err: any) {
      lastError = err.message || 'Unknown error';
      if (isRateLimitError(lastError)) {
        // Real quota wall - back off before retrying instead of immediately hitting
        // the same limit again. Backoff grows with consecutive hits (8s, 16s, capped
        // by MAX_ATTEMPTS anyway).
        consecutiveRateLimitHits++;
        const waitMs = Math.min(60000, 8000 * Math.pow(2, consecutiveRateLimitHits - 1));
        await sleep(waitMs);
      }
    }
  }
  return { error: `${lastError} (after ${MAX_ATTEMPTS} attempts)` };
}

/**
 * Generates one deck per topic in the chapter's notes. A topic whose deck generation
 * fails is skipped (not the whole chapter) so one bad topic doesn't block the rest.
 */
export async function generateFlashcardDecksFromNotes(
  notesTopics: NotesTopic[]
): Promise<{ decks?: TopicFlashcards[]; error?: string }> {
  if (notesTopics.length === 0) return { error: 'This chapter has no notes topics.' };

  // Lower concurrency than before (was 4) - fewer simultaneous Vertex calls means a
  // burst of parallel requests is less likely to trip the per-minute rate limit.
  const CONCURRENCY = 2;
  const decks: (TopicFlashcards | null)[] = new Array(notesTopics.length).fill(null)
  const topicErrors: string[] = []
  let nextIndex = 0
  async function worker() {
    while (true) {
      const i = nextIndex++
      if (i >= notesTopics.length) return
      const topic = notesTopics[i]
      const result = await generateOneDeck(topic.name, topic.markdown)
      if (result.cards) decks[i] = { topicName: topic.name, cards: result.cards }
      else if (result.error) topicErrors.push(`${topic.name}: ${result.error}`)
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, notesTopics.length) }, () => worker()))

  const successfulDecks = decks.filter((d): d is TopicFlashcards => d !== null)
  if (successfulDecks.length === 0) {
    // Surface the actual reason instead of a generic message - it's almost always a
    // rate limit (429/RESOURCE_EXHAUSTED), and the vague message previously hid that.
    return { error: topicErrors[0] || 'No decks could be generated from any topic.' }
  }
  return { decks: successfulDecks }
}
