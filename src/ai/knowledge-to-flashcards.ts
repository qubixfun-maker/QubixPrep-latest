'use server';
import { callAIWithProvider, callGeminiNative, callClaudeOnly } from '@/ai/genkit';
import type { ChapterKnowledge } from '@/ai/chapter-knowledge';
import { knowledgeToFactsFor } from '@/ai/chapter-knowledge-utils';

/**
 * Generates flashcard front/back pairs from facts the extraction ALREADY tagged as
 * suited for flashcards (fact.bestFor includes 'flashcard') - this step never re-reads
 * raw text or re-judges what's flashcard-worthy, it only rephrases already-selected
 * facts into a question/answer shape. One AI call per topic (batching all that topic's
 * flashcard facts together), not one call per fact, since phrasing several related facts
 * as questions is cheap and reliable for a model to do in one pass.
 */

export type FlashcardPair = { front: string; back: string };

function buildPrompt(topicName: string, facts: string[]): string {
  const factsList = facts.map((f, i) => `${i + 1}. ${f}`).join('\n');
  return `Convert each of these already-verified facts about "${topicName}" into a flashcard question/answer pair. Use ONLY the facts given - do not add outside information.

FACTS:
${factsList}

For each fact, write:
- "front": a clear, specific question that the fact answers (not a restatement of the fact as a question - a genuine question someone would ask)
- "back": the answer, using the fact's own wording as closely as possible

Output ONLY a JSON array, no commentary, no code fences:
[{"front": "...", "back": "..."}]

The array must have exactly ${facts.length} items, in the same order as the facts above.`;
}

function tryParseArray(raw: string): FlashcardPair[] | null {
  const clean = raw.replace(/```[a-zA-Z]*/g, '').replace(/```/g, '').trim();
  try {
    const parsed = JSON.parse(clean);
    if (Array.isArray(parsed)) return parsed;
  } catch {
    const match = clean.match(/\[[\s\S]*\]/);
    if (match) {
      try {
        const parsed = JSON.parse(match[0]);
        if (Array.isArray(parsed)) return parsed;
      } catch { /* fall through */ }
    }
  }
  return null;
}

async function callModel(prompt: string, maxTokens: number, useClaude?: boolean, useGeminiNative?: boolean, forceVertex?: boolean) {
  if (useClaude) return callClaudeOnly([{ role: 'user', content: prompt }], maxTokens);
  if (useGeminiNative) return callGeminiNative([{ role: 'user', content: prompt }], maxTokens);
  return callAIWithProvider([{ role: 'user', content: prompt }], maxTokens, forceVertex);
}

export type TopicFlashcards = { topicName: string; cards: FlashcardPair[] };

/**
 * Generates one deck's worth of flashcards per topic that has flashcard-tagged facts.
 * Topics with no such facts are skipped entirely rather than forcing empty decks.
 */
export async function knowledgeToFlashcards(
  knowledge: ChapterKnowledge,
  options?: { useClaude?: boolean; useGeminiNative?: boolean; forceVertex?: boolean }
): Promise<{ decks?: TopicFlashcards[]; error?: string }> {
  const allFacts = knowledgeToFactsFor(knowledge, 'flashcard');
  if (allFacts.length === 0) return { error: 'No facts tagged as flashcard-suitable in this chapter.' };

  // Group by topic, matching the existing app's convention of one deck per topic.
  const byTopic = new Map<string, string[]>();
  for (const { topicName, fact } of allFacts) {
    if (!byTopic.has(topicName)) byTopic.set(topicName, []);
    byTopic.get(topicName)!.push(fact.fact);
  }

  const decks: TopicFlashcards[] = [];
  for (const [topicName, facts] of byTopic) {
    const prompt = buildPrompt(topicName, facts);
    const MAX_ATTEMPTS = 2;
    let cards: FlashcardPair[] | null = null;
    let lastError = '';

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        const { content: raw } = await callModel(prompt, 2000, options?.useClaude, options?.useGeminiNative, options?.forceVertex);
        const parsed = tryParseArray(raw);
        if (parsed && parsed.length > 0) {
          cards = parsed;
          break;
        }
        lastError = 'AI response was not a valid flashcard array';
      } catch (err: any) {
        lastError = err.message || 'Unknown error';
      }
    }

    if (cards) {
      decks.push({ topicName, cards });
    }
    // A topic that fails after retries is skipped, not fatal to the whole chapter -
    // matches the same graceful-degradation approach used elsewhere tonight.
  }

  if (decks.length === 0) return { error: 'No decks could be generated from any topic.' };
  return { decks };
}
