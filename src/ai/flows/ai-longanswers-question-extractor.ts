'use server';
import { callAI } from '@/ai/genkit';

export type ExtractQuestionsInput = {
  chapterTitle: string;
  rawText: string;
};

export type ExtractQuestionsOutput = {
  longEssays: string[];
  shortEssays: string[];
  shortAnswers: string[];
  error?: string;
};

function buildPrompt(input: ExtractQuestionsInput): string {
  return `You are extracting exam questions from a raw, messily-formatted text dump of one chapter from an exam question bank PDF.

CHAPTER: "${input.chapterTitle}"

RAW TEXT:
---
${input.rawText}
---

TASK: Find every question listed under headings like "Long Essay(s)", "Short Essay(s)", and "Short Answer(s)" (headings may vary slightly in wording/capitalization/plurality - match them loosely). Extract each question's exact text, dropping only the leading number.

CRITICAL RULES:
- COMPLETELY IGNORE any "MCQ" / "MCQs" / "Multiple Choice" section and every question inside it - do not include a single MCQ in the output.
- Do not invent, merge, or rephrase questions - copy each question's wording as it appears (minus the leading number).
- If a question has sub-parts (a, b, c) as part of a clinical vignette, keep them together as ONE question, exactly as one item.
- If a section is entirely absent from this chapter's text, return an empty array for it - do not invent placeholder questions.

Output ONLY valid JSON in this exact shape, no markdown fences, no commentary:
{"longEssays": ["...", "..."], "shortEssays": ["...", "..."], "shortAnswers": ["...", "..."]}`;
}

export async function extractLongAnswerQuestions(input: ExtractQuestionsInput): Promise<ExtractQuestionsOutput> {
  if (!input.rawText.trim()) {
    return { longEssays: [], shortEssays: [], shortAnswers: [], error: 'No text provided.' };
  }

  try {
    const prompt = buildPrompt(input);
    const raw = await callAI([{ role: 'user', content: prompt }], 4000);
    if (!raw) return { longEssays: [], shortEssays: [], shortAnswers: [], error: 'Empty response from AI model' };

    let clean = raw.replace(/```json|```/g, '').trim();
    let parsed: any;
    try {
      parsed = JSON.parse(clean);
    } catch {
      const match = clean.match(/\{[\s\S]*\}/);
      if (match) {
        try { parsed = JSON.parse(match[0]); } catch { /* fall through */ }
      }
    }

    if (!parsed || typeof parsed !== 'object') {
      return { longEssays: [], shortEssays: [], shortAnswers: [], error: 'AI response was not valid JSON.' };
    }

    const clean_arr = (arr: any) => Array.isArray(arr) ? arr.filter((q: any) => typeof q === 'string' && q.trim()).map((q: string) => q.trim()) : [];

    return {
      longEssays: clean_arr(parsed.longEssays),
      shortEssays: clean_arr(parsed.shortEssays),
      shortAnswers: clean_arr(parsed.shortAnswers),
    };
  } catch (err: any) {
    return { longEssays: [], shortEssays: [], shortAnswers: [], error: err.message || 'Unknown error during question extraction' };
  }
}
