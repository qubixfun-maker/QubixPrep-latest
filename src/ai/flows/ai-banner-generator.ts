'use server';
import { callAI } from '@/ai/genkit';

export type BannerDraft = {
  badgeText: string;
  headline: string;
  headlineHighlight: string;
  bullets: string[];
  buttonText: string;
};

export type GenerateBannerInput = {
  prompt: string;
};

export type GenerateBannerOutput = {
  draft?: BannerDraft;
  error?: string;
};

export async function generateBannerCopy(input: GenerateBannerInput): Promise<GenerateBannerOutput> {
  const prompt = `You are a marketing copywriter for QubixPrep, a NEET-PG/MBBS exam prep app in India.

Write short, punchy promotional copy for a dashboard banner ad based on this brief:
"${input.prompt}"

Respond ONLY with valid JSON, no markdown, no extra text, in this exact shape:
{
  "badgeText": "short badge label, max 5 words, e.g. 'New - Limited Time'",
  "headline": "one punchy sentence, max 14 words, written so the LAST few words are the price/hook (they will be highlighted separately)",
  "headlineHighlight": "the exact last few words of the headline that should be highlighted in a different color, e.g. 'just Rs 149'",
  "bullets": ["short value point 1, max 8 words", "short value point 2, max 8 words", "short value point 3, max 8 words"],
  "buttonText": "call to action, max 4 words, e.g. 'Browse Year Notes'"
}

Rules:
- headline must literally end with the exact text in headlineHighlight
- Keep tone confident and exam-focused, not gimmicky
- No emojis
- Output must be complete, valid JSON`;

  try {
    const raw = await callAI([{ role: 'user', content: prompt }], 500);
    if (!raw) return { error: 'Empty response from AI model' };

    let clean = raw.replace(/```json|```/g, '').trim();
    const firstBrace = clean.indexOf('{');
    const lastBrace = clean.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      clean = clean.slice(firstBrace, lastBrace + 1);
    }

    const parsed = JSON.parse(clean);
    if (!parsed.headline || !Array.isArray(parsed.bullets)) {
      return { error: 'AI response was missing required fields' };
    }
    return { draft: parsed as BannerDraft };
  } catch (err: any) {
    return { error: err.message || 'Unknown error generating banner copy' };
  }
}
