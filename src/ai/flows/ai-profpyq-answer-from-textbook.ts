'use server';
import { callAIWithProvider } from '@/ai/genkit';

export type GenerateProfAnswerFromTextbookInput = {
  subject: string;
  chapter: string;
  type: 'short_answer' | 'short_essay' | 'long_answer';
  question: string;
  textbookTitle: string;
  chapterExcerpt: string;
};

export type GenerateProfAnswerFromTextbookOutput = {
  answer?: string;
  provider?: string;
  error?: string;
};

const LENGTH_GUIDE: Record<string, string> = {
  short_answer: 'a crisp 2-4 sentence answer, exam-point format',
  short_essay: 'a structured 150-250 word answer',
  long_answer: 'a comprehensive 400-600 word answer'
};

const STRUCTURE_GUIDE: Record<string, string> = {
  short_answer: 'Use plain text with simple line breaks and dashes for lists where helpful. Use **bold** for 1-2 key terms only. No section headers needed for an answer this short.',
  short_essay: "Structure the answer using short section headers on their own line, each prefixed with '## ' (e.g. '## Definition', '## Key features'), choosing headers relevant to the topic - skip any that don't apply to this question. Use '-' prefixed lines for lists within a section. Use **bold** for key terms and important facts.",
  long_answer: "Structure the answer using short section headers on their own line, each prefixed with '## ' (e.g. '## Definition', '## Etiology', '## Clinical features', '## Investigations', '## Management', '## Complications'), choosing only headers relevant to this specific topic - skip any that don't apply. Use '-' prefixed lines for lists within a section. Use **bold** for key terms and important facts."
};

// Rough safety cap so we don't blow past a reasonable prompt size
const MAX_CHARS_EXCERPT = 60000;

export async function generateProfPyqAnswerFromTextbook(input: GenerateProfAnswerFromTextbookInput): Promise<GenerateProfAnswerFromTextbookOutput> {
  const excerpt = input.chapterExcerpt.length > MAX_CHARS_EXCERPT
    ? input.chapterExcerpt.slice(0, MAX_CHARS_EXCERPT) + '\n[...excerpt truncated...]'
    : input.chapterExcerpt

  const prompt = `You are answering an exam question strictly using the textbook excerpt provided below - you must NOT use any outside knowledge, even if you know more about the topic from your own training. If the excerpt doesn't contain enough information to fully answer, answer as completely as the excerpt allows and briefly note that the source doesn't cover certain aspects, rather than filling gaps from memory.

Subject: ${input.subject}
Chapter: ${input.chapter}
Question Type: ${input.type}
Question: ${input.question}

TEXTBOOK EXCERPT (from "${input.textbookTitle}"):
${excerpt}

Write ${LENGTH_GUIDE[input.type] || LENGTH_GUIDE.short_answer} using ONLY facts present in the excerpt above. ${STRUCTURE_GUIDE[input.type] || STRUCTURE_GUIDE.short_answer}

NEVER reference the source in the answer text itself. Do not write "the excerpt states", "according to the textbook", or similar phrases - state facts directly and confidently, the way a student would on an exam.

Respond with ONLY the answer text, nothing else - no preamble, no "Here is the answer", no quotation marks around it.`;

  try {
    const { content, provider } = await callAIWithProvider([{ role: 'user', content: prompt }], 1500);
    if (!content) return { error: 'Empty response from AI model' };
    return { answer: content.trim(), provider };
  } catch (err: any) {
    return { error: err.message || 'Unknown error generating answer' };
  }
}
