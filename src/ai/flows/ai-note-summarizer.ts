'use server';

import { groqClient, GROQ_MODEL } from '@/ai/genkit';

export type AiNoteSummarizerInput = {
  noteContent: string;
};

export type AiNoteSummarizerOutput = {
  summary: string;
};

export async function aiNoteSummarizer(input: AiNoteSummarizerInput): Promise<AiNoteSummarizerOutput> {
  const response = await groqClient.chat.completions.create({
    model: GROQ_MODEL,
    messages: [
      {
        role: 'user',
        content: `You are an AI assistant specialized in summarizing medical notes for MBBS and NEET-PG students. Provide a concise summary highlighting key concepts, definitions, diagnostic criteria, treatment protocols, and high-yield facts.

Medical Note Content:
${input.noteContent}

Provide a concise summary of the critical information.`,
      },
    ],
  });
  return { summary: response.choices[0]?.message?.content ?? '' };
}
