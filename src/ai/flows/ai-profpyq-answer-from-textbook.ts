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
  long_answer: 'a comprehensive 400-600 word answer',
};

const STRUCTURE_GUIDE: Record<string, string> = {
  short_answer: "Use plain text with simple line breaks and dashes for lists where helpful. Use **bold** for 1-2 key terms only. No section headers needed for an answer this short.",
  short_essay: "Structure the answer using short section headers on their own line, each prefixed with '## ' (e.g. '## Definition', '## Key features'), choosing headers relevant to the topic - skip any that don't apply to this question. Use '-' prefixed lines for lists within a section. Use **bold** for key terms and important facts.",
  long_answer: "Structure the answer using short section headers on their own line, each prefixed with '## ' (e.g. '## Definition', '## Etiology', '## Clinical features', '## Investigations', '## Management', '## Complications'), choosing only headers relevant to this specific topic - skip any that don't apply. Use '-' prefixed lines for lists within a section. Use **bold** for key terms and important facts.",
};

// Minimum word counts below which an answer is treated as too short and retried with
// an explicit elaboration instruction. Previously this function had no length floor of
// its own at all - it relied entirely on the calling page's fallback check, which had
// a regex typo breaking it, so short answers were shipping unnoticed.
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

// Rough safety cap so we don't blow past a reasonable prompt size
const MAX_CHARS_EXCERPT = 60000;

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function buildPrompt(input: GenerateProfAnswerFromTextbookInput, excerpt: string, elaborateFrom?: string): string {
  const elaborateBlock = elaborateFrom
    ? `\n\nA PREVIOUS ATTEMPT WAS TOO SHORT AND IS REJECTED - DO NOT REPEAT IT:\n"${elaborateFrom}"\n\nWrite a genuinely more complete answer this time, reaching the expected length for a "${input.type}".`
    : '';

  return `You are answering an exam question for a medical student, using the textbook excerpt below as your PRIMARY source.

Subject: ${input.subject}
Chapter: ${input.chapter}
Question Type: ${input.type}
Question: ${input.question}

TEXTBOOK EXCERPT (from "${input.textbookTitle}"):
${excerpt}
${elaborateBlock}

GROUNDING RULES:
- Prioritize and prefer facts stated in the excerpt above - use its wording, emphasis, and specific details wherever it covers the question.
- The excerpt is a full chapter, so it likely covers this specific question only briefly among much other content. If the excerpt's treatment of THIS SPECIFIC QUESTION is thin, elaborate using standard, well-established medical knowledge for the topic so the answer still reaches the expected length and depth below - do not write a thin answer just because the excerpt's coverage of this one question is thin. Never contradict the excerpt; only add accepted supplementary detail where it is genuinely sparse.

Write ${LENGTH_GUIDE[input.type] || LENGTH_GUIDE.short_answer}. ${STRUCTURE_GUIDE[input.type] || STRUCTURE_GUIDE.short_answer}

NEVER reference the source in the answer text itself. Do not write "the excerpt states", "according to the textbook", or similar phrases - state facts directly and confidently, the way a student would on an exam.

Respond with ONLY the answer text, nothing else - no preamble, no "Here is the answer", no quotation marks around it.`;
}

export async function generateProfPyqAnswerFromTextbook(input: GenerateProfAnswerFromTextbookInput): Promise<GenerateProfAnswerFromTextbookOutput> {
  const excerpt = input.chapterExcerpt.length > MAX_CHARS_EXCERPT
    ? input.chapterExcerpt.slice(0, MAX_CHARS_EXCERPT) + '\n[...excerpt truncated...]'
    : input.chapterExcerpt;

  const minWords = MIN_WORDS[input.type] || MIN_WORDS.short_answer;
  const maxTokens = MAX_TOKENS[input.type] || MAX_TOKENS.short_answer;
  const MAX_ATTEMPTS = 3;

  let lastError = 'Unknown error generating answer';
  let bestAnswer: { answer: string; provider: string; words: number } | null = null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const prompt = buildPrompt(input, excerpt, attempt > 1 ? bestAnswer?.answer : undefined);
      const { content, provider } = await callAIWithProvider([{ role: 'user', content: prompt }], maxTokens);
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

  if (bestAnswer) {
    return { answer: bestAnswer.answer, provider: bestAnswer.provider };
  }
  return { error: `${lastError} (after ${MAX_ATTEMPTS} attempts)` };
}
