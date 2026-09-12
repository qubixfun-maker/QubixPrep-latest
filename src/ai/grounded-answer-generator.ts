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

TASK: Write a model answer to this question.
- Length/depth: ${TARGET_WORDS[sectionType]}.
- Use ONLY facts present in the chapter knowledge above. If the knowledge doesn't fully cover some part of the question, answer as completely as the given facts allow rather than inventing the rest.
- Write in clear exam-answer prose. Use "-" at the start of a line for bullet points where a list genuinely helps (e.g. types, causes, features) - otherwise write in paragraphs.
- Do not repeat the question back or add a preamble like "Answer:" - start directly with the content.

Output ONLY the answer text - no markdown headers, no code fences.`;
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
  const maxTokens = sectionType === 'long-essays' ? 1200 : sectionType === 'short-essays' ? 600 : 250;
  const minWords = MIN_WORDS[sectionType];

  const MAX_ATTEMPTS = 3;
  let lastError = 'Unknown error';
  let bestAttempt = '';

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      let prompt = buildPrompt(question, sectionType, knowledgeText);
      if (attempt > 1 && bestAttempt) {
        prompt += `\n\nYour previous attempt was too short (needs at least ${minWords} words): "${bestAttempt}"\nElaborate further using more of the chapter knowledge above, while still only using given facts.`;
      }
      const { content: raw } = await callModel(prompt, maxTokens, options?.useClaude, options?.useGeminiNative, options?.forceVertex);
      const wordCount = raw.trim().split(/\s+/).length;
      if (raw && wordCount >= minWords) return { answer: raw.trim() };
      if (raw && raw.length > bestAttempt.length) bestAttempt = raw.trim();
      lastError = `Answer too short (${wordCount} words, need ${minWords})`;
    } catch (err: any) {
      lastError = err.message || 'Unknown error';
    }
  }
  // Return the longest attempt rather than nothing, matching the existing generator's
  // graceful-degradation behavior for this exact situation.
  if (bestAttempt) return { answer: bestAttempt };
  return { error: `${lastError} (after ${MAX_ATTEMPTS} attempts)` };
}
