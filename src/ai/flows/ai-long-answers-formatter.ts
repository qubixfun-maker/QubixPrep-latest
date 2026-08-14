'use server';
import { callAI } from '@/ai/genkit';

export type FormatLongAnswersInput = {
  rawText: string;
  subject: string;
  chapter: string;
  sectionType: 'long-essays' | 'short-essays' | 'short-answers';
};

export type FormatLongAnswersOutput = {
  html: string;
  error?: string;
};

function buildPrompt(input: FormatLongAnswersInput): string {
  const sectionLabel = input.sectionType === 'long-essays' ? 'Long Essay' : input.sectionType === 'short-essays' ? 'Short Essay' : 'Short Answer'

  return `You are a formatting assistant for an MBBS exam-prep platform. You are given a student's own rough notes containing exam questions and his own rough answers already written out. Your ONLY job is to clean up formatting and structure - you must NOT invent, add, or embellish any medical content that is not already present in the student's own answer text.

Subject: ${input.subject}
Chapter: ${input.chapter}
Section: ${sectionLabel}

RAW INPUT (questions with the student's own rough answers, repeat-frequency noted inline in brackets):
---
${input.rawText}
---

TASK:
1. Split the input into individual question+answer items.
2. For each question, extract any inline repeat-frequency bracket the student wrote, e.g. "[asked 3x: 2015, 2018, 2022]" - pull this out into a separate qa-repeat span and REMOVE the bracket text from the visible question text. If a question has no such bracket, omit the qa-repeat span entirely for that question - do not write "Asked 0 times" or similar.
3. Take the student's own rough answer text and organize it into clean HTML using headings (h4), paragraphs (p), and lists (ul/ol) where the content naturally has structure (e.g. causes, types, steps, clinical features) - but do NOT add facts, causes, steps, or details that are not already present in the student's rough answer. This is a formatting pass only.
4. Number the questions sequentially starting from 1 within this section.
5. Output ONLY the following HTML structure, repeated for each question - no markdown code fences, no commentary, no explanation of what you did:

<div class="qa-item">
  <div class="qa-question">
    <span class="qa-number">1.</span>
    Question text here (without the repeat bracket)
    <span class="qa-repeat">Asked 3 times - 2015, 2018, 2022</span>
  </div>
  <div class="qa-answer">
    <h4>Section heading if applicable</h4>
    <p>...</p>
    <ul><li>...</li></ul>
  </div>
</div>

Output raw HTML only. No markdown fences (no \`\`\`html). No preamble or closing remarks.`
}

export async function formatLongAnswers(input: FormatLongAnswersInput): Promise<FormatLongAnswersOutput> {
  if (!input.rawText.trim()) {
    return { html: '', error: 'No text provided to format.' }
  }

  try {
    const prompt = buildPrompt(input)
    const raw = await callAI([{ role: 'user', content: prompt }], 6000)
    if (!raw) return { html: '', error: 'Empty response from AI model' }

    let clean = raw.replace(/```html|```/g, '').trim()

    if (!clean.includes('qa-item')) {
      return { html: '', error: 'AI response did not contain the expected qa-item structure. Try again.' }
    }

    return { html: clean }
  } catch (err: any) {
    return { html: '', error: err.message || 'Unknown error during formatting' }
  }
}
