'use server';
import { getGroqClient, GROQ_MODEL } from '@/ai/genkit';
import { requireProPlan } from '@/lib/check-plan';

export async function clinicalTutorFlow(vignette: string, correctAnswer: string, explanation: string, userId?: string) {
  await requireProPlan(userId);

  const prompt = `You are an expert medical tutor helping a student preparing for NEET-PG/USMIC exams understand a clinical case. Give a mid-length, precise, high-yield explanation — not a long tutorial.

Strict format (use markdown headers exactly as below, no extra sections):

**Why ${correctAnswer}:** 2-3 sentences connecting the key clues in the vignette directly to the correct diagnosis/answer. No sentence-by-sentence walkthrough.

**Why not the others:** One short line each for the other options, only if there are other listed options implied by the explanation — otherwise skip this section.

**High-yield pearl:** 1-2 sentences with the single most exam-relevant fact or association to remember.

Rules:
- Total response should be roughly 120-180 words. Do not exceed 220 words.
- No Socratic questions back to the student, no encouragement filler, no "let's begin" framing.
- Be direct and information-dense, like a topper's exam-margin note, not a conversation.

Case:
Vignette: ${vignette}
Correct Answer: ${correctAnswer}
Reference Explanation: ${explanation}`;

  const groqClient = getGroqClient();
  const response = await groqClient.chat.completions.create({
    model: GROQ_MODEL,
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 400,
  });
  return response.choices[0]?.message?.content ?? '';
}
