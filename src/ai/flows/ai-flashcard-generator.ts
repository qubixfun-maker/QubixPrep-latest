'use server';
import { callAI } from '@/ai/genkit';

export type FlashcardSource = {
  textbookTitle: string;
  chapterTitle: string;
  text: string;
};

export type GenerateFlashcardsInput = {
  sources: FlashcardSource[];
  topicFocus?: string;
  cardCount: number;
};

export type FlashcardPair = {
  front: string;
  back: string;
};

export type GenerateFlashcardsOutput = {
  cards: FlashcardPair[];
  error?: string;
};

const MAX_CHARS_PER_SOURCE = 60000;

function buildPrompt(input: GenerateFlashcardsInput): string {
  const sourcesBlock = input.sources.map((s, i) => {
    const truncated = s.text.length > MAX_CHARS_PER_SOURCE ? s.text.slice(0, MAX_CHARS_PER_SOURCE) + '\n[...excerpt truncated...]' : s.text;
    return `--- SOURCE ${i + 1}: "${s.textbookTitle}", Chapter: "${s.chapterTitle}" ---\n${truncated}`;
  }).join('\n\n');

  const focusLine = input.topicFocus?.trim()
    ? `Focus specifically on: ${input.topicFocus.trim()}. Only draw cards from parts of the excerpt(s) relevant to this focus.`
    : `Draw cards from across the whole excerpt(s), covering the most important, testable facts.`;

  return `You are creating study flashcards strictly from the textbook excerpt(s) below - do NOT use any outside knowledge, even if you know more about the topic from your own training.

TEXTBOOK EXCERPT(S):
${sourcesBlock}

${focusLine}

TASK: Create exactly ${input.cardCount} flashcards. Use whichever format best helps a student understand and remember each specific fact - do not force every card into the same template. Good formats include (mix freely, pick whatever fits the specific fact):
- Term -> Definition (e.g. front: "Pyknosis", back: the definition)
- Question -> Answer (e.g. front: "What are the two essential phenomena of irreversible cell injury?", back: the answer)
- Clinical/case vignette -> Diagnosis or mechanism (e.g. front: a short scenario, back: what it represents)
- Identification -> Feature (e.g. front: "Name the three nuclear changes in necrosis, in order", back: the answer)
- Fill-in-the-blank style facts, comparisons, or classifications

Rules:
- Every fact on both sides must come directly from the excerpt(s) - never invent details, numbers, or examples not present in the source.
- Keep the front concise (a question, term, or short prompt) and the back focused (the specific answer, not a restatement of the whole excerpt).
- Do not create duplicate or near-duplicate cards.
- Prioritize the most important, most testable facts if the excerpt has more material than ${input.cardCount} cards' worth.
- Never reference the source itself inside a card - do not write phrases like "listed in the textbook", "mentioned in the excerpt", "according to the chapter", "as per the source", etc. Write each card as a standalone fact or question, exactly as it would appear on an exam, with no meta-reference to where the information came from.

Output ONLY a valid JSON array, no markdown fences, no commentary, no explanation - just the array:
[{"front": "...", "back": "..."}, {"front": "...", "back": "..."}]`
}

export async function generateFlashcards(input: GenerateFlashcardsInput): Promise<GenerateFlashcardsOutput> {
  if (!input.sources.length) {
    return { cards: [], error: 'No textbook source excerpts provided.' }
  }
  if (!input.cardCount || input.cardCount < 1) {
    return { cards: [], error: 'Invalid card count.' }
  }

  try {
    const prompt = buildPrompt(input)
    const raw = await callAI([{ role: 'user', content: prompt }], 6000)
    if (!raw) return { cards: [], error: 'Empty response from AI model' }

    let clean = raw.replace(/```json|```/g, '').trim()

    let parsed: any
    try {
      parsed = JSON.parse(clean)
    } catch {
      const match = clean.match(/\[[\s\S]*\]/)
      if (match) {
        try { parsed = JSON.parse(match[0]) } catch { /* fall through */ }
      }
    }

    if (!Array.isArray(parsed) || parsed.length === 0) {
      return { cards: [], error: 'AI response was not a valid card array. Try again, or try fewer cards per batch.' }
    }

    const cards: FlashcardPair[] = parsed
      .filter((c: any) => c && typeof c.front === 'string' && typeof c.back === 'string')
      .map((c: any) => ({ front: c.front.trim(), back: c.back.trim() }))

    if (cards.length === 0) {
      return { cards: [], error: 'AI response did not contain valid front/back pairs.' }
    }

    return { cards }
  } catch (err: any) {
    return { cards: [], error: err.message || 'Unknown error during generation' }
  }
}
