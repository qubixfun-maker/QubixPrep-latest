'use server';

import { getGroqClient, GROQ_MODEL } from '@/ai/genkit';

export async function clinicalTutorFlow(vignette: string, correctAnswer: string, explanation: string) {
  const prompt = `As an expert medical tutor, your goal is to help a student preparing for their board exams (like NEET-PG and USMLE) understand a clinical case.

The student will provide you with a clinical vignette, the correct diagnosis, and the explanation. Your task is to act as their personal tutor, guiding them to a deeper understanding of the case.

Instructions:
1. Assume the role of a helpful and encouraging medical tutor.
2. Analyze the question, the correct option, and the explanation provided.
3. Create a mini-tutorial around the case, not a simple reiteration.
4. Use the Socratic method — ask probing questions to make the student think.
5. Deconstruct the vignette sentence by sentence, explaining significance and asking guiding questions.
6. Briefly discuss why incorrect options are less likely, with concise clinical reasoning.
7. Elaborate on the student's explanation with clinical pearls, high-yield facts, and connections to other concepts.
8. Maintain a conversational, encouraging tone.
9. Use markdown for clarity (bolding, bullet points).
10. Keep the tutorial focused and concise.

Here's the case:

**Vignette:** ${vignette}
**Correct Answer:** ${correctAnswer}
**Explanation:** ${explanation}

Now, begin the tutorial session.`;

  const groqClient = getGroqClient();

  const response = await groqClient.chat.completions.create({
    model: GROQ_MODEL,
    messages: [{ role: 'user', content: prompt }],
  });

  return response.choices[0]?.message?.content ?? '';
}
