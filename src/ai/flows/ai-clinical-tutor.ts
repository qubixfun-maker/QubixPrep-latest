'use server';
/**
 * @fileOverview AI Clinical Tutor for QBank and Test Series.
 * 
 * - explainClinicalCase - Provides a deep explanation of an MCQ.
 * - analyzeTestPerformance - Summarizes strengths and weaknesses after a test session.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ExplainCaseInputSchema = z.object({
  question: z.string(),
  options: z.array(z.string()),
  correctAnswer: z.string(),
  userAnswer: z.string().optional(),
});
export type ExplainCaseInput = z.infer<typeof ExplainCaseInputSchema>;

const PerformanceInputSchema = z.object({
  results: z.array(z.object({
    topic: z.string(),
    isCorrect: z.boolean(),
    question: z.string(),
  })),
});
export type PerformanceInput = z.infer<typeof PerformanceInputSchema>;

const safetySettings: any = [
  { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
  { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
  { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
  { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
];

export async function explainClinicalCase(input: ExplainCaseInput) {
  return explainClinicalCaseFlow(input);
}

export async function analyzeTestPerformance(input: PerformanceInput) {
  return analyzeTestPerformanceFlow(input);
}

const explainClinicalCaseFlow = ai.defineFlow(
  {
    name: 'explainClinicalCaseFlow',
    inputSchema: ExplainCaseInputSchema,
    outputSchema: z.string(),
  },
  async (input) => {
    const { text } = await ai.generate({
      prompt: `You are an expert medical tutor for MBBS/USMLE students. 
      Explain the following clinical case. Provide:
      1. A brief summary of the presentation.
      2. Why the correct answer is right.
      3. Why the other options are wrong (clinical correlation).
      4. A "High-Yield Pearl" for this topic.

      Question: ${input.question}
      Options: ${input.options.join(', ')}
      Correct Answer: ${input.correctAnswer}
      ${input.userAnswer ? `Student selected: ${input.userAnswer}` : ''}

      Output in clean Markdown.`,
      config: { safetySettings }
    });
    return text;
  }
);

const analyzeTestPerformanceFlow = ai.defineFlow(
  {
    name: 'analyzeTestPerformanceFlow',
    inputSchema: PerformanceInputSchema,
    outputSchema: z.string(),
  },
  async (input) => {
    const { text } = await ai.generate({
      prompt: `You are a clinical academic advisor. Analyze the following test results for a medical student:
      ${JSON.stringify(input.results)}

      Based on the topics where they missed questions:
      1. Identify the 3 most critical knowledge gaps.
      2. Provide a "Prescription for Study" (which units or concepts to review).
      3. Offer a word of encouragement in a professional medical tone.

      Output in clean Markdown.`,
      config: { safetySettings }
    });
    return text;
  }
);
