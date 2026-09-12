'use server';
import { callAIWithProvider, callGeminiNative, callClaudeOnly } from '@/ai/genkit';
import type { ChapterKnowledge } from '@/ai/chapter-knowledge';
import { knowledgeToText } from '@/ai/chapter-knowledge-utils';

/**
 * Generates a model answer to a real exam question, grounded strictly in a chapter's
 * already-extracted knowledge (never the raw textbook text again). This is the same
 * "cheap, safe downstream step" pattern as notes generation: the hard work of correctly
 * reading the chapter happened once, during extraction - this step only needs to select
 * and organize already-verified facts to answer a specific question, not interpret
 * anything new.
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

function buildPrompt(question: string, sectionType: SectionType, knowledgeText: string): string {
  return `You are writing a model exam answer for an MBBS student, using ONLY the chapter knowledge given below - never invent facts, numbers, or examples beyond what's here.

CHAPTER KNOWLEDGE (the only source of truth - already extracted and verified from the textbook):
${knowledgeText}

QUESTION: ${question}

TASK: Write a complete model answer to this question.
STEP 1 - Before writing, identify every distinct part of this question (many exam questions ask for several things at once - e.g. "define X. Mention the types. Explain Y" has three parts; "(a)...(b)...(c)" has three parts). List them to yourself, then make sure your answer gives EACH part its own real paragraph of substance - do not answer only the first part and stop.
STEP 2 - Write the answer:
- HARD MINIMUM LENGTH: ${TARGET_WORDS[sectionType]}. This is a firm requirement, not a suggestion - a short, single-paragraph answer is an INCOMPLETE answer for this task, even if it sounds finished.
- Use ONLY facts present in the chapter knowledge above. If the knowledge doesn't fully cover some part of the question, cover that part as completely as the given facts allow rather than inventing the rest or skipping it.
- Write in clear exam-answer prose, organized into multiple paragraphs (one per part of the question, per Step 1). Use "-" at the start of a line for bullet points where a list genuinely helps (e.g. types, causes, features).
- Do not repeat the question back or add a preamble like "Answer:" - start directly with the content.
- Do not stop after covering just the first clause of the question - continue through every part you identified in Step 1.
- PACE YOURSELF: as you write, keep track of how much you've covered versus how much room you likely have left. If you sense you're approaching your limit, do NOT start a new subtopic or mechanism you won't have room to finish - instead, wrap up your current point and end with a short, complete concluding sentence. A shorter answer that ends cleanly is far better than a longer one that cuts off mid-thought.

Output ONLY the answer text - no markdown headers, no code fences, no restating the parts you identified in Step 1. Your final sentence must be a complete, properly punctuated sentence - never end mid-clause or mid-word.`;
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
  knowledge: ChapterKnowledge,
  options?: { useClaude?: boolean; useGeminiNative?: boolean; forceVertex?: boolean }
): Promise<GenerateAnswerOutput> {
  const knowledgeText = knowledgeToText(knowledge);
  // Generous headroom above the actual target length - a multi-part question needs real
  // room to cover every clause in full without hitting the ceiling mid-sentence, and some
  // models spend part of this budget on internal reasoning before the visible answer.
  const maxTokens = sectionType === 'long-essays' ? 2500 : sectionType === 'short-essays' ? 1200 : 400;
  const minWords = MIN_WORDS[sectionType];

  const MAX_ATTEMPTS = 3;
  let lastError = 'Unknown error';
  let bestAttempt = '';
  let bestAttemptWasTruncated = false;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      let prompt = buildPrompt(question, sectionType, knowledgeText);
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
