'use server';

import { getGroqClient, GROQ_MODEL } from '@/ai/genkit';

export type GenerateQBankInput = {
  topic: string;
  subject: string;
  numQuestions: number;
};

export type QBankQuestion = {
  topic_title: string;
  question_text: string;
  option1: string;
  option2: string;
  option3: string;
  option4: string;
  correct_answer_index: number;
  explanation: string;
};

export type GenerateQBankOutput = {
  questions: QBankQuestion[];
};

export async function generateQBankQuestions(input: GenerateQBankInput): Promise<GenerateQBankOutput> {
  const count = Math.min(Math.max(input.numQuestions, 1), 30);
  const groqClient = getGroqClient();

  const prompt = `You are an expert medical educator writing board-exam-style MCQs for MBBS and NEET-PG students.

Subject: ${input.subject}
Topic: ${input.topic}

Generate exactly ${count} high-yield multiple choice questions on this topic.

Respond ONLY with a valid JSON array, no markdown, no extra text, in this exact format:
[
  {
    "topic_title": "${input.topic}",
    "question_text": "the full question text",
    "option1": "first option",
    "option2": "second option",
    "option3": "third option",
    "option4": "fourth option",
    "correct_answer_index": 0,
    "explanation": "a 2-4 sentence high-yield explanation of why the correct answer is right"
  }
]

Rules:
- correct_answer_index must be an integer 0, 1, 2, or 3 (0=option1, 1=option2, 2=option3, 3=option4)
- Do not use markdown bold (**) inside any field
- Each question must be clinically relevant and exam-realistic
- Vary the correct answer position across questions, do not always pick 0`

  const response = await groqClient.chat.completions.create({
    model: GROQ_MODEL,
    messages: [{ role: 'user', content: prompt }],
  })

  const raw = response.choices[0]?.message?.content ?? '[]'
  const clean = raw.replace(/```json|```/g, '').trim()

  try {
    const parsed = JSON.parse(clean)
    return { questions: Array.isArray(parsed) ? parsed : [] }
  } catch {
    return { questions: [] }
  }
}
