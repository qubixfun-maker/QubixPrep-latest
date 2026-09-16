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

async function generateOneDeck(topicName: string, markdown: string): Promise<{ cards?: FlashcardPair[]; error?: string }> {
  const prompt = buildPrompt(topicName, markdown);
  const MAX_ATTEMPTS = 2;
  let lastError = '';

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const { content: raw } = await callGeminiNative([{ role: 'user', content: prompt }], 2000, 256);
      const parsed = tryParseArray(raw);
      if (parsed && parsed.length > 0) return { cards: parsed };
      lastError = 'AI response was not a valid flashcard array';
    } catch (err: any) {
      lastError = err.message || 'Unknown error';
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

  const CONCURRENCY = 4;
  const decks: (TopicFlashcards | null)[] = new Array(notesTopics.length).fill(null)
  let nextIndex = 0
  async function worker() {
    while (true) {
      const i = nextIndex++
      if (i >= notesTopics.length) return
      const topic = notesTopics[i]
      const result = await generateOneDeck(topic.name, topic.markdown)
      if (result.cards) decks[i] = { topicName: topic.name, cards: result.cards }
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, notesTopics.length) }, () => worker()))

  const successfulDecks = decks.filter((d): d is TopicFlashcards => d !== null)
  if (successfulDecks.length === 0) return { error: 'No decks could be generated from any topic.' }
  return { decks: successfulDecks }
}
