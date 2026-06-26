'use server';
import { getGroqClient, GROQ_MODEL } from '@/ai/genkit';
import { requireProPlan } from '@/lib/check-plan';

export type GenerateQuizAndFlashcardsInput = {
  studyTopic: string;
  numQuestions?: number;
  userId?: string;
};
export type QuizQuestion = {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
};
export type Flashcard = {
  front: string;
  back: string;
};
export type GenerateQuizAndFlashcardsOutput = {
  quizzes: QuizQuestion[];
  flashcards: Flashcard[];
};

export async function generateQuizAndFlashcards(
  input: GenerateQuizAndFlashcardsInput
): Promise<GenerateQuizAndFlashcardsOutput> {
  await requireProPlan(input.userId);

  const count = Math.min(Math.max(input.numQuestions ?? 5, 1), 25);
  const groqClient = getGroqClient();
  const response = await groqClient.chat.completions.create({
    model: GROQ_MODEL,
    messages: [
      {
        role: 'user',
        content: `You are an expert medical educator for MBBS and NEET-PG students.
Generate exactly ${count} MCQs for the following topic: ${input.studyTopic}
Respond ONLY with a valid JSON object in this exact format, no extra text:
{
  "quizzes": [
    {
      "question": "...",
      "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
      "correctAnswer": "A. ...",
      "explanation": "..."
    }
  ],
  "flashcards": []
}`,
      },
    ],
  });
  const raw = response.choices[0]?.message?.content ?? '{}';
  const clean = raw.replace(/```json|```/g, '').trim();
  try {
    return JSON.parse(clean);
  } catch {
    return { quizzes: [], flashcards: [] };
  }
}
