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
  short_essay: 'a structured 150-250 word answer with clear headings/points (definition, classification, key features, etc. as relevant)',
  long_answer: 'a comprehensive 400-600 word answer with proper structure (definition, etiology, clinical features, investigations, management, etc. as relevant), suitable for a university theory exam'
};

export async function generateProfPyqAnswer(input: GenerateProfAnswerInput): Promise<GenerateProfAnswerOutput> {
  const prompt = `You are an expert medical educator writing a model answer for an Indian MBBS university professional exam ("Prof exam").

Subject: ${input.subject}
Chapter: ${input.chapter}
Question Type: ${input.type}
Question: ${input.question}

Write ${LENGTH_GUIDE[input.type] || LENGTH_GUIDE.short_answer}. Use plain text with simple line breaks and dashes for lists where helpful (no markdown headers, no asterisks for bold). Base the answer on standard textbook content (as relevant: K. Park for PSM, BD Chaurasia/Vishram Singh for Anatomy, Guyton for Physiology, Harsh Mohan for Pathology, etc.) and typical university exam expectations in India.

Respond with ONLY the answer text, nothing else - no preamble, no "Here is the answer", no quotation marks around it.`;

  try {
    const raw = await callAI([{ role: 'user', content: prompt }], 1500);
    if (!raw) return { error: 'Empty response from AI model' };
    return { answer: raw.trim() };
  } catch (err: any) {
    return { error: err.message || 'Unknown error generating answer' };
  }
}
