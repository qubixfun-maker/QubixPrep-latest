'use server';
import { callAI } from '@/ai/genkit';

export type ChapterSource = {
  textbookTitle: string;
  chapterTitle: string;
  text: string;
};

export type ExtractTopicsInput = {
  sources: ChapterSource[];
};

export type ExtractTopicsOutput = {
  topics: string[];
  error?: string;
};

const MAX_CHARS_PER_SOURCE = 60000;

function buildPrompt(input: ExtractTopicsInput): string {
  const sourcesBlock = input.sources.map((s, i) => {
    const truncated = s.text.length > MAX_CHARS_PER_SOURCE ? s.text.slice(0, MAX_CHARS_PER_SOURCE) + '\n[...excerpt truncated...]' : s.text;
    return `--- SOURCE ${i + 1}: "${s.textbookTitle}", Chapter: "${s.chapterTitle}" ---\n${truncated}`;
  }).join('\n\n');

  return `You are analyzing a textbook chapter excerpt to identify its distinct testable sub-topics, for a medical student building a flashcard deck.

CHAPTER EXCERPT(S):
${sourcesBlock}

TASK: List the distinct sub-topics covered in this chapter that a professor could test separately (e.g. for "Cell Injury" this might include: "Causes of Cell Injury", "Reversible Cell Injury", "Free Radical Injury", "Necrosis - Morphologic Patterns", "Apoptosis Mechanisms", "Cellular Accumulations").

Rules:
- Each topic name should be short (2-6 words), specific, and drawn from headings or clear thematic divisions actually present in the excerpt - do not invent topics not covered in the text.
- List topics in the order they appear in the chapter.
- Aim for 4-15 topics depending on how much distinct content the chapter has. Do not split into topics smaller than a professor would realistically test as a unit.
- Do not create duplicate or overlapping topics.

Output ONLY a valid JSON array of strings, no markdown fences, no commentary:
["Topic 1", "Topic 2", "Topic 3"]`
}

export async function extractChapterTopics(input: ExtractTopicsInput): Promise<ExtractTopicsOutput> {
  if (!input.sources.length) {
    return { topics: [], error: 'No chapter source excerpts provided.' }
  }

  try {
    const prompt = buildPrompt(input)
    const raw = await callAI([{ role: 'user', content: prompt }], 1500)
    if (!raw) return { topics: [], error: 'Empty response from AI model' }

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
      return { topics: [], error: 'AI response was not a valid topic list. Try again.' }
    }

    const topics: string[] = parsed
      .filter((t: any) => typeof t === 'string' && t.trim())
      .map((t: string) => t.trim())

    if (topics.length === 0) {
      return { topics: [], error: 'AI response did not contain valid topic names.' }
    }

    return { topics }
  } catch (err: any) {
    return { topics: [], error: err.message || 'Unknown error during topic extraction' }
  }
}
