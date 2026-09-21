'use server';
import { callAIWithProvider, callGeminiNative, callClaudeOnly } from '@/ai/genkit';
import { allTemplatesForPrompt } from '@/ai/subject-templates';

/**
 * Generates a model answer to a real exam question, grounded strictly in already-
 * written source material (never the raw textbook text again). Takes a plain
 * "grounding text" string rather than a ChapterKnowledge object, so the same
 * retry/formatting logic here works whether the caller grounds the answer in the
 * extracted knowledge JSON (via knowledgeToText) or in already-generated notes
 * (concatenated topic markdown) - the caller decides the source, this only cares
 * that it gets verified, already-correct text to work from.
 */

export type SectionType = 'long-essays' | 'short-essays' | 'short-answers';

const MIN_WORDS: Record<SectionType, number> = {
  'long-essays': 200,
  'short-essays': 80,
  'short-answers': 15,
};

const TARGET_WORDS: Record<SectionType, string> = {
  'long-essays': '250-400 words, covering the question in real depth',
  'short-essays': '100-180 words, covering the key points concisely',
  'short-answers': '20-50 words, direct and to the point',
};

function buildPrompt(question: string, sectionType: SectionType, groundingText: string, subjectName: string): string {
  const templates = allTemplatesForPrompt(subjectName);
  const templateBlock = templates.map((t) =>
    `- "${t.name}": structure as [${t.sections.join(' -> ')}] - use when: ${t.description}`
  ).join('\n');

  return `You are writing a model exam answer for an MBBS student, using ONLY the source material given below - never invent facts, numbers, or examples beyond what's here.

SOURCE MATERIAL (the only source of truth - already written and verified from the textbook):
${groundingText}

QUESTION: ${question}

TASK: Write a complete model answer to this question.

STEP 1 - Before writing, identify every distinct part of this question (many exam questions ask for several things at once - e.g. "define X. Mention the types. Explain Y" has three parts; "(a)...(b)...(c)" has three parts). Make sure your answer gives EACH part its own real coverage - do not answer only the first part and stop.

STEP 2 - Choose the best presentation format for THIS SPECIFIC question from the list below. Different questions genuinely suit different shapes - do not default to plain prose for every question.
${templateBlock}
- If the question asks to compare/differentiate/contrast two or more things, use "Comparison Table" and render an ACTUAL Markdown table (using | pipes |), not prose describing a comparison.
- If the question describes a clinical case/scenario (e.g. "A 42-year-old male presented with..."), use "Clinical Vignette Card" with clear sub-headers for each part asked (e.g. "### Diagnosis", "### Etiopathogenesis", "### Findings").
- If the question asks to describe a sequence/steps/mechanism, use "Process/Mechanism Flowchart" and render an ACTUAL numbered list (1. 2. 3. ...) for the steps, not prose.
- Otherwise use the subject's own default template, with a "###" sub-header per major part of the question.

STEP 3 - Write the answer using real Markdown structure matching your chosen format:
- Use "###" for section sub-headers when the format calls for named sections.
- Use real Markdown tables (| Column | Column |) for comparisons - never describe a comparison in prose instead.
- Use real numbered lists (1. 2. 3.) for sequences/steps.
- Use "**bold**" for key terms worth highlighting.
- HARD MINIMUM LENGTH: ${TARGET_WORDS[sectionType]}. This is a firm requirement - a short answer is an INCOMPLETE answer for this task, even if it sounds finished.
- Use ONLY facts present in the source material above. If it doesn't fully cover some part of the question, cover that part as completely as the given material allows rather than inventing the rest or skipping it.
- Do not repeat the question back or add a preamble like "Answer:" - start directly with the content.
- PACE YOURSELF: if you sense you're approaching your limit, do NOT start a new subtopic you won't have room to finish - wrap up cleanly instead. A shorter answer that ends properly is far better than one that cuts off mid-thought.

Output ONLY the answer as Markdown - no commentary about which format you chose, no code fences around the whole answer. Your final sentence must be complete and properly punctuated - never end mid-clause or mid-word.`;
}

export type GenerateAnswerOutput = {
  answer?: string;
  error?: string;
};

async function callModel(prompt: string, maxTokens: number, useClaude?: boolean, useGeminiNative?: boolean, forceVertex?: boolean) {
  if (useClaude) return callClaudeOnly([{ role: 'user', content: prompt }], maxTokens);
  if (useGeminiNative) return callGeminiNative([{ role: 'user', content: prompt }], maxTokens);
  return callAIWithProvider([{ role: 'user', content: prompt }], maxTokens, forceVertex);
}
// NOTE: HTML-formatting helpers (rebuildQaHtml, answerTextToHtml) moved to
// grounded-answer-utils.ts - a "use server" file may only export async functions as
// runtime values, and these are deliberately synchronous pure string transforms.

export async function generateGroundedAnswer(
  question: string,
  sectionType: SectionType,
  groundingText: string,
  subjectName: string,
  options?: { useClaude?: boolean; useGeminiNative?: boolean; forceVertex?: boolean }
): Promise<GenerateAnswerOutput> {
  // No artificial cap below the model's own output ceiling - previously this budget was
  // set close to the target length, which is exactly what caused the earlier AI Notes
  // truncation bug for chapters that genuinely needed more room. Gemini 2.5 Pro/Flash (the
  // callGeminiNative fallback chain) has a hard output ceiling around 8192 tokens per
  // response, so 8000 is effectively "no cap" - the answer will never be cut short by this
  // budget, only by the model's own real maximum.
  const maxTokens = 8000;
  const minWords = MIN_WORDS[sectionType];

  const MAX_ATTEMPTS = 3;
  let lastError = 'Unknown error';
  let bestAttempt = '';
  let bestAttemptWasTruncated = false;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      let prompt = buildPrompt(question, sectionType, groundingText, subjectName);
      if (attempt > 1 && bestAttempt) {
        prompt += bestAttemptWasTruncated
          ? `\n\nYour previous attempt was REJECTED for stopping mid-sentence before finishing (it reached a reasonable length but got cut off): "${bestAttempt}"\nWrite a NEW answer that covers the same ground more concisely per point, so the FULL answer (covering every part of the question) fits and finishes with a complete final sentence. Do not trail off - make sure the answer properly concludes.`
          : `\n\nYour previous attempt was REJECTED for being too short and incomplete (only ${bestAttempt.trim().split(/\s+/).length} words, needs at least ${minWords}): "${bestAttempt}"\nThis attempt stopped after covering only part of the question. Write a NEW, LONGER answer from scratch that addresses EVERY part of the question with real depth. Do not just add a sentence to the old answer - restructure it into multiple full paragraphs covering each part identified in Step 1.`;
      }
      const { content: raw } = await callModel(prompt, maxTokens, options?.useClaude, options?.useGeminiNative, options?.forceVertex);
      const wordCount = raw.trim().split(/\s+/).length;
      // A response can pass the word-count bar and still be truncated mid-sentence right
      // at that boundary (seen in testing: a multi-part answer cut off mid-word on its
      // final point). Checking for proper closing punctuation catches this even when the
      // length itself looks sufficient.
      const endsProperly = /[.!?]['"]?\s*$/.test(raw.trim()) || /<\/(ul|ol)>\s*$/.test(raw.trim());
      if (raw && wordCount >= minWords && endsProperly) return { answer: raw.trim() };
      if (raw && raw.length > bestAttempt.length) {
        bestAttempt = raw.trim();
        bestAttemptWasTruncated = wordCount >= minWords && !endsProperly;
      }
      lastError = wordCount < minWords
        ? `Answer too short (${wordCount} words, need ${minWords})`
        : `Answer appears cut off mid-sentence despite reaching ${wordCount} words`;
    } catch (err: any) {
      lastError = err.message || 'Unknown error';
    }
  }
  // Return the longest attempt rather than nothing, matching the existing generator's
  // graceful-degradation behavior for this exact situation.
  if (bestAttempt) return { answer: bestAttempt };
  return { error: `${lastError} (after ${MAX_ATTEMPTS} attempts)` };
}
