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

/** Recursively finds one topic by name, including nested subtopics. */
function findTopicByName(topics: any[], name: string): any | null {
  for (const t of topics) {
    if (t.name === name) return t;
    if (t.subtopics?.length) {
      const found = findTopicByName(t.subtopics, name);
      if (found) return found;
    }
  }
  return null;
}

/** Flattens every flashcard-tagged fact across ALL topics/subtopics in a chapter. */
function allFlashcardFactsInChapter(knowledge: ChapterKnowledge): string[] {
  const out: string[] = [];
  function walk(topics: any[]) {
    for (const t of topics) {
      (t.facts || []).forEach((f: any) => {
        if (!f.bestFor || f.bestFor.includes('flashcard')) out.push(f.fact);
      });
      if (t.subtopics?.length) walk(t.subtopics);
    }
  }
  walk(knowledge.topics);
  return out;
}

/**
 * Generates flashcards for ONE topic (or the whole chapter, if topicName is empty) -
 * used when an admin tool lets the user pick a specific topic and card count, rather
 * than generating a deck per topic for the whole chapter in one pass. Reuses the same
 * prompt/model logic as knowledgeToFlashcards, just scoped to one topic's facts (or all
 * of them, capped to cardCount, for the "whole chapter" case).
 */
export async function generateFlashcardsForOneTopic(
  knowledge: ChapterKnowledge,
  topicName: string,
  cardCount: number,
  options?: { useClaude?: boolean; useGeminiNative?: boolean; forceVertex?: boolean }
): Promise<{ cards?: FlashcardPair[]; error?: string }> {
  let facts: string[];
  if (topicName) {
    const topic = findTopicByName(knowledge.topics, topicName);
    if (!topic) return { error: `Topic "${topicName}" not found in extracted knowledge.` };
    facts = (topic.facts || [])
      .filter((f: any) => !f.bestFor || f.bestFor.includes('flashcard'))
      .map((f: any) => f.fact);
  } else {
    facts = allFlashcardFactsInChapter(knowledge);
  }

  if (facts.length === 0) return { error: 'No flashcard-suitable facts found.' };
  if (cardCount > 0 && facts.length > cardCount) facts = facts.slice(0, cardCount);

  const prompt = buildPrompt(topicName || knowledge.centralTopic, facts);
  const MAX_ATTEMPTS = 2;
  let lastError = '';

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const { content: raw } = await callModel(prompt, 2000, options?.useClaude, options?.useGeminiNative, options?.forceVertex);
      const parsed = tryParseArray(raw);
      if (parsed && parsed.length > 0) return { cards: parsed };
      lastError = 'AI response was not a valid flashcard array';
    } catch (err: any) {
      lastError = err.message || 'Unknown error';
    }
  }
  return { error: `${lastError} (after ${MAX_ATTEMPTS} attempts)` };
}

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
  }

  if (decks.length === 0) return { error: 'No decks could be generated from any topic.' };
  return { decks };
}
