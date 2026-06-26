'use server';
import { getGroqClient, GROQ_MODEL } from '@/ai/genkit';
import { requireProPlan } from '@/lib/check-plan';

interface TestResult {
  topic: string;
  isCorrect: boolean;
  question: string;
}

export async function analyzeTestPerformance(results: TestResult[], userId?: string) {
  await requireProPlan(userId);

  const prompt = `As an expert medical education analyst, your task is to provide a detailed performance breakdown to a student who has just completed a test.
The student will provide you with a list of their results, including the topic of each question and whether they answered it correctly.
Your analysis should be structured, insightful, and encouraging. Follow these steps:
1. Start with a positive and encouraging tone — congratulate the student on completing the test.
2. Identify areas of strength — topics where the student performed well, framed as "Concepts Mastered" or "Strong Areas."
3. Pinpoint areas for improvement — topics where the student struggled, framed constructively as "Areas for Focused Review."
4. Provide actionable insights — a brief, high-yield action plan for each weak area.
5. Offer a concluding summary with a motivational note and suggested next steps.
6. Use Markdown for clarity (headings, bullet points, bold text).
Student's Test Results:
${JSON.stringify(results, null, 2)}
Now, generate the performance analysis.`;
  const groqClient = getGroqClient();
  const response = await groqClient.chat.completions.create({
    model: GROQ_MODEL,
    messages: [{ role: 'user', content: prompt }],
  });
  return response.choices[0]?.message?.content ?? '';
}
