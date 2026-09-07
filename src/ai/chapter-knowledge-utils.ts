import type { ChapterKnowledge, KnowledgeTopic, KnowledgeFact, FeatureTag } from '@/ai/chapter-knowledge';
import { FORMAT_TEMPLATES, resolveTemplateForSubject, type FormatTemplate } from '@/ai/subject-templates';

// ============ Consumer-facing views over the knowledge record ============
// These are pure transforms - no AI calls, no cost. Features that only need a
// re-shaping of what's already extracted should use these rather than calling a model.

/** Flattens the knowledge tree into plain text, for prompts that want prose context. */
export function knowledgeToText(k: ChapterKnowledge): string {
  const lines: string[] = [`# ${k.centralTopic}`, k.overview, ''];

  function walk(topics: KnowledgeTopic[], depth: number) {
    for (const t of topics) {
      const indent = '  '.repeat(depth);
      lines.push(`${indent}## ${t.name}${t.suggestedFormat ? ` [format: ${t.suggestedFormat}]` : ''}`);
      if (t.summary) lines.push(`${indent}${t.summary}`);
      t.definitions?.forEach((d) => lines.push(`${indent}- Definition: ${d}`));
      t.mechanisms?.forEach((m) => lines.push(`${indent}- Mechanism: ${m}`));
      t.classifications?.forEach((c) => lines.push(`${indent}- Classification: ${c}`));
      t.facts?.forEach((f) => lines.push(`${indent}- ${f.fact}${f.detail ? ` (${f.detail})` : ''}`));
      t.clinicalCorrelations?.forEach((c) => lines.push(`${indent}- Clinical: ${c}`));
      t.namedEntities?.forEach((n) => lines.push(`${indent}- Named: ${n}`));
      if (t.subtopics?.length) walk(t.subtopics, depth + 1);
      lines.push('');
    }
  }
  walk(k.topics, 0);
  return lines.join('\n');
}

/** Every atomic fact in the chapter, flattened - the raw material for flashcards/QBank. */
export function knowledgeToFacts(k: ChapterKnowledge): { topicName: string; fact: KnowledgeFact }[] {
  const out: { topicName: string; fact: KnowledgeFact }[] = [];
  function walk(topics: KnowledgeTopic[]) {
    for (const t of topics) {
      t.facts?.forEach((f) => out.push({ topicName: t.name, fact: f }));
      if (t.subtopics?.length) walk(t.subtopics);
    }
  }
  walk(k.topics);
  return out;
}

/** Every atomic fact tagged as suited for a given feature - lets flashcard/QBank
 *  generation pull only the facts the extraction already judged fit for them. */
export function knowledgeToFactsFor(k: ChapterKnowledge, feature: FeatureTag): { topicName: string; fact: KnowledgeFact }[] {
  return knowledgeToFacts(k).filter(({ fact }) => !fact.bestFor || fact.bestFor.includes(feature));
}

/** Top-level topic names - what mindmap branch planning and notes page planning need. */
export function knowledgeToTopicNames(k: ChapterKnowledge): string[] {
  return k.topics.map((t) => t.name);
}

/** One topic's full subtree as text - for generating a single mindmap branch or notes page. */
export function topicToText(k: ChapterKnowledge, topicName: string): string | null {
  function find(topics: KnowledgeTopic[]): KnowledgeTopic | null {
    for (const t of topics) {
      if (t.name === topicName) return t;
      if (t.subtopics?.length) {
        const found = find(t.subtopics);
        if (found) return found;
      }
    }
    return null;
  }
  const topic = find(k.topics);
  if (!topic) return null;
  return knowledgeToText({ ...k, topics: [topic] });
}

/** The format template assigned to a specific topic, with graceful fallback to the
 *  subject's default template if this topic wasn't tagged (e.g. an older record). */
export function topicFormat(k: ChapterKnowledge, topicName: string): FormatTemplate {
  function find(topics: KnowledgeTopic[]): KnowledgeTopic | null {
    for (const t of topics) {
      if (t.name === topicName) return t;
      if (t.subtopics?.length) {
        const found = find(t.subtopics);
        if (found) return found;
      }
    }
    return null;
  }
  const topic = find(k.topics);
  if (topic?.suggestedFormat) {
    const match = Object.values(FORMAT_TEMPLATES).find((t) => t.name === topic.suggestedFormat);
    if (match) return match;
  }
  return resolveTemplateForSubject(k.subjectName || '');
}
