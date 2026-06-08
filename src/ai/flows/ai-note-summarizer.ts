
'use server';
/**
 * @fileOverview AI Note Summarizer powered by Groq.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AiNoteSummarizerInputSchema = z.object({
  noteContent: z.string().describe('The full text content of the medical note to be summarized.'),
});
export type AiNoteSummarizerInput = z.infer<typeof AiNoteSummarizerInputSchema>;

const AiNoteSummarizerOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the critical information from the medical note.'),
});
export type AiNoteSummarizerOutput = z.infer<typeof AiNoteSummarizerOutputSchema>;

export async function aiNoteSummarizer(input: AiNoteSummarizerInput): Promise<AiNoteSummarizerOutput> {
  return aiNoteSummarizerFlow(input);
}

const summarizeMedicalNotePrompt = ai.definePrompt({
  name: 'summarizeMedicalNotePrompt',
  input: { schema: AiNoteSummarizerInputSchema },
  output: { schema: AiNoteSummarizerOutputSchema },
  prompt: `You are an AI assistant specialized in summarizing medical notes for MBBS and NEET-PG students. Your goal is to provide a concise summary, highlighting the most critical information relevant for study and quick review.

Analyze the provided medical note content and identify the key concepts, important definitions, diagnostic criteria, treatment protocols, and high-yield facts. Focus on what a medical student would need to know for exams.

Medical Note Content:
{{{noteContent}}}

Provide a concise summary of the critical information from the note.`,
});

const aiNoteSummarizerFlow = ai.defineFlow(
  {
    name: 'aiNoteSummarizerFlow',
    inputSchema: AiNoteSummarizerInputSchema,
    outputSchema: AiNoteSummarizerOutputSchema,
  },
  async (input) => {
    const { output } = await summarizeMedicalNotePrompt(input);
    return output!;
  }
);
