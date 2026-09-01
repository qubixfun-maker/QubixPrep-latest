'use server';
import { callAI } from '@/ai/genkit';

export type GenerateProfAnswerInput = {
  subject: string;
  chapter: string;
  type: 'short_answer' | 'short_essay' | 'long_answer';
  question: string;
};

export type GenerateProfAnswerOutput = {
  answer?: string;
  error?: string;
};

const LENGTH_GUIDE: Record<string, string> = {
  short_answer: 'a crisp 2-4 sentence answer, exam-point format',
  short_essay: 'a structured 150-250 word answer',
  long_answer: 'a comprehensive 400-600 word answer'
};

const STRUCTURE_GUIDE: Record<string, string> = {
  short_answer: 'Use plain text with simple line breaks and dashes for lists where helpful. Use **bold** for 1-2 key terms only. No section headers needed for an answer this short.',
  short_essay: "Structure the answer using short section headers on their own line, each prefixed with '## ' (e.g. '## Definition', '## Key features'), choosing headers relevant to the topic - skip any that don't apply to this question. Use '-' prefixed lines for lists within a section. Use **bold** for key terms and important facts.",
  long_answer: "Structure the answer using short section headers on their own line, each prefixed with '## ' (e.g. '## Definition', '## Etiology', '## Clinical features', '## Investigations', '## Management', '## Complications'), choosing only headers relevant to this specific topic - skip any that don't apply. Use '-' prefixed lines for lists within a section. Use **bold** for key terms and important facts."
};

export async function generateProfPyqAnswer(input: GenerateProfAnswerInput): Promise<GenerateProfAnswerOutput> {
  const prompt = `You are an expert medical educator writing a model answer for an Indian MBBS university professional exam ("Prof exam").

Subject: ${input.subject}
Chapter: ${input.chapter}
Question Type: ${input.type}
Question: ${input.question}

Write ${LENGTH_GUIDE[input.type] || LENGTH_GUIDE.short_answer}. ${STRUCTURE_GUIDE[input.type] || STRUCTURE_GUIDE.short_answer} Base the answer on standard textbook content (as relevant: K. Park for PSM, BD Chaurasia/Vishram Singh for Anatomy, Guyton for Physiology, Harsh Mohan for Pathology, etc.) and typical university exam expectations in India.

Respond with ONLY the answer text, nothing else - no preamble, no "Here is the answer", no quotation marks around it.`;

  try {
    const raw = await callAI([{ role: 'user', content: prompt }], 1500);
    if (!raw) return { error: 'Empty response from AI model' };
    return { answer: raw.trim() };
  } catch (err: any) {
    return { error: err.message || 'Unknown error generating answer' };
  }
}

// Same as generateProfPyqAnswer, but also returns which provider answered - used
// for bulk automation runs so weaker fallback-provider answers can be spot-checked.
import { callAIWithProvider } from '@/ai/genkit';

export type GenerateProfAnswerWithProviderOutput = {
  answer?: string;
  provider?: string;
  error?: string;
};

export async function generateProfPyqAnswerWithProvider(input: GenerateProfAnswerInput): Promise<GenerateProfAnswerWithProviderOutput> {
  const prompt = `You are an expert medical educator writing a model answer for an Indian MBBS university professional exam ("Prof exam").
Subject: ${input.subject}
Chapter: ${input.chapter}
Question Type: ${input.type}
Question: ${input.question}
Write ${LENGTH_GUIDE[input.type] || LENGTH_GUIDE.short_answer}. ${STRUCTURE_GUIDE[input.type] || STRUCTURE_GUIDE.short_answer} Base the answer on standard textbook content (as relevant: K. Park for PSM, BD Chaurasia/Vishram Singh for Anatomy, Guyton for Physiology, Harsh Mohan for Pathology, etc.) and typical university exam expectations in India.
Respond with ONLY the answer text, nothing else - no preamble, no "Here is the answer", no quotation marks around it.`;
  try {
    const { content, provider } = await callAIWithProvider([{ role: 'user', content: prompt }], 1500);
    if (!content) return { error: 'Empty response from AI model' };
    return { answer: content.trim(), provider };
  } catch (err: any) {
    return { error: err.message || 'Unknown error generating answer' };
  }
}
