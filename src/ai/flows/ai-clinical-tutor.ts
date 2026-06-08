'use server';

import { groqClient, GROQ_MODEL } from '@/ai/genkit';

export type ExplainCaseInput = {
  question: string;
  options: string[];
  correctAnswer: string;
  userAnswer?: string;
};

export type PerformanceInput = {
  results: {
    topic: string;
    isCorrect: boolean;
    question: string;
  }[];
};

export async function explainClinicalCase(input: ExplainCaseInput): Promise<string> {
  const response = await groqClient.chat.completions.create({
    model: GROQ_MODEL,
    messages: [
      {
        role: 'user',
        content: `You are an expert medical tutor for MBBS/USMLE students.
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
      },
    ],
  });
  return response.choices[0]?.message?.content ?? '';
}

export async function analyzeTestPerformance(input: PerformanceInput): Promise<string> {
  const response = await groqClient.chat.completions.create({
    model: GROQ_MODEL,
    messages: [
      {
        role: 'user',
        content: `You are a clinical academic advisor. Analyze the following test results for a medical student:
${JSON.stringify(input.results)}

Based on the topics where they missed questions:
1. Identify the 3 most critical knowledge gaps.
2. Provide a "Prescription for Study" (which units or concepts to review).
3. Offer a word of encouragement in a professional medical tone.

Output in clean Markdown.`,
      },
    ],
  });
  return response.choices[0]?.message?.content ?? '';
}
