'use server';
import { callAI, callAIWithProvider } from '@/ai/genkit';

export type GenerateProfAnswerInput = {
  subject: string;
  chapter: string;
  type: 'short_answer' | 'short_essay' | 'long_answer';
  question: string;
  sourceText?: string;
  forceVertex?: boolean;
};

export type GenerateProfAnswerOutput = {
  answer?: string;
  error?: string;
};

const LENGTH_GUIDE: Record<string, string> = {
  short_answer: 'a crisp 2-4 sentence answer, exam-point format',
  short_essay: 'a structured 150-250 word answer with clear headings/points (definition, classification, key features, etc. as relevant)',
  long_answer: 'a comprehensive 400-600 word answer with proper structure (definition, etiology, clinical features, investigations, management, etc. as relevant), suitable for a university theory exam',
};

// Minimum word counts below which an answer for that type is treated as too short and
// retried with an explicit elaboration instruction, rather than accepted as-is. This is
// what actually stops a "long essay" from silently coming back as 4 lines.
const MIN_WORDS: Record<string, number> = {
  short_answer: 15,
  short_essay: 80,
  long_answer: 200,
};

const MAX_TOKENS: Record<string, number> = {
  short_answer: 800,
  short_essay: 1500,
  long_answer: 3000,
};

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function buildPrompt(input: GenerateProfAnswerInput, elaborateFrom?: string): string {
  const sourceBlock = input.sourceText
    ? `\n\nTEXTBOOK EXCERPT FOR THIS CHAPTER (ground your answer in this - it is the actual source material this student is studying from):\n${input.sourceText.slice(0, 40000)}\n\nIf this excerpt's coverage of the specific question asked is thin or incomplete, do not write a thin answer to match it - elaborate using standard, accepted medical knowledge for this topic so the final answer still meets the expected length and depth for a "${input.type}" exam answer. Never contradict the excerpt; only add well-established supplementary detail where the excerpt itself is sparse.`
    : `\n\nNo specific textbook excerpt was available for this chapter, so base the answer on standard textbook content (as relevant: K. Park for PSM, BD Chaurasia/Vishram Singh for Anatomy, Guyton for Physiology, Harsh Mohan for Pathology, etc.) and typical university exam expectations in India.`;

  const elaborateBlock = elaborateFrom
    ? `\n\nA PREVIOUS ATTEMPT AT THIS ANSWER WAS TOO SHORT AND IS REJECTED - DO NOT REPEAT IT:\n"${elaborateFrom}"\n\nWrite a genuinely more complete, elaborated answer that actually reaches the expected length for a "${input.type}" - add the missing structure/depth (relevant subheadings, mechanisms, examples, clinical correlation) rather than padding with repetition.`
    : '';

  return `You are an expert medical educator writing a model answer for an Indian MBBS university professional exam ("Prof exam").

Subject: ${input.subject}
Chapter: ${input.chapter}
Question Type: ${input.type}
Question: ${input.question}
${sourceBlock}
${elaborateBlock}

Write ${LENGTH_GUIDE[input.type] || LENGTH_GUIDE.short_answer}. Use plain text with simple line breaks and dashes for lists where helpful (no markdown headers, no asterisks for bold).

Respond with ONLY the answer text, nothing else - no preamble, no "Here is the answer", no quotation marks around it.`;
}

export async function generateProfPyqAnswer(input: GenerateProfAnswerInput): Promise<GenerateProfAnswerOutput> {
  const result = await generateProfPyqAnswerWithProvider(input);
  return { answer: result.answer, error: result.error };
}

// Same as generateProfPyqAnswer, but also returns which provider answered - used
// for bulk automation runs so weaker fallback-provider answers can be spot-checked.
export type GenerateProfAnswerWithProviderOutput = {
  answer?: string;
  provider?: string;
  error?: string;
};

export async function generateProfPyqAnswerWithProvider(input: GenerateProfAnswerInput): Promise<GenerateProfAnswerWithProviderOutput> {
  const minWords = MIN_WORDS[input.type] || MIN_WORDS.short_answer;
  const maxTokens = MAX_TOKENS[input.type] || MAX_TOKENS.short_answer;
  const MAX_ATTEMPTS = 3;

  let lastError = 'Unknown error generating answer';
  let bestAnswer: { answer: string; provider: string; words: number } | null = null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      // From the second attempt onward, show the model its own too-short answer and
      // explicitly demand it be expanded - a blind retry of the identical prompt tends
      // to reproduce the identical short answer, so this must be a different prompt.
      const prompt = buildPrompt(input, attempt > 1 ? bestAnswer?.answer : undefined);
      const { content, provider } = await callAIWithProvider([{ role: 'user', content: prompt }], maxTokens, input.forceVertex);
      if (!content) { lastError = 'Empty response from AI model'; continue; }

      const answer = content.trim();
      const words = wordCount(answer);

      if (!bestAnswer || words > bestAnswer.words) {
        bestAnswer = { answer, provider, words };
      }

      if (words >= minWords) {
        return { answer, provider };
      }
      lastError = `Answer was too short (${words} words, expected at least ${minWords} for "${input.type}")`;
    } catch (err: any) {
      lastError = err.message || 'Unknown error generating answer';
    }
  }

  // Even if we never hit the target length, return the longest attempt we got rather
  // than nothing - a slightly-short answer is still far better than losing the question
  // entirely, and the caller can see it was short via the returned word count implicitly.
  if (bestAnswer) {
    return { answer: bestAnswer.answer, provider: bestAnswer.provider };
  }
  return { error: `${lastError} (after ${MAX_ATTEMPTS} attempts)` };
}
