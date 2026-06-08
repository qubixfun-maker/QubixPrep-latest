'use server';

import { groqClient, GROQ_MODEL } from '@/ai/genkit';

export type GenerateQuizAndFlashcardsInput = {
  studyTopic: string;
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
  const response = await groqClient.chat.completions.create({
    model: GROQ_MODEL,
    messages: [
      {
        role: 'user',
        content: `You are an expert medical educator for MBBS and NEET-PG students.

Generate 5 MCQs and 5 flashcards for the following topic: ${input.studyTopic}

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
  "flashcards": [
    {
      "front": "...",
      "back": "..."
    }
  ]
}`,
      },
    ],
  });

  const raw = response.choices[0]?.message?.content ?? '{}';
  const clean = raw.replace(/```json|```/g, '').trim();
  return JSON.parse(clean);
}
