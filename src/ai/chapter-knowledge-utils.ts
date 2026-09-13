import type { ChapterKnowledge, KnowledgeTopic, KnowledgeFact, FeatureTag, BuildKnowledgeInput } from '@/ai/chapter-knowledge';
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

// ============ Chunking + prompt-building (moved here from chapter-knowledge.ts) ============
// chapter-knowledge.ts has 'use server', which only permits async function exports -
// these are plain sync functions used by both the regular and resumable extraction
// paths, so they live here instead.

// Chapters longer than this are split into multiple sequential extraction passes rather
// than truncated. Kept comfortably under typical model input limits to leave room for
// the prompt instructions and format templates alongside the excerpt itself.
export const SAFE_CHUNK_SIZE = 55000;

/**
 * Splits long text into chunks at paragraph boundaries where possible, so a chunk
 * doesn't cut a sentence or table in half. Falls back to a hard split only if no
 * paragraph break exists in a reasonable range.
 */
export function splitIntoChunks(text: string, maxSize: number): string[] {
  if (text.length <= maxSize) return [text];
  const chunks: string[] = [];
  let remaining = text;
  while (remaining.length > maxSize) {
    let splitPoint = remaining.lastIndexOf('\n\n', maxSize);
    if (splitPoint < maxSize * 0.5) {
      splitPoint = remaining.lastIndexOf('\n', maxSize);
    }
    if (splitPoint < maxSize * 0.5) {
      splitPoint = maxSize; // no good break found - hard split rather than lose content
    }
    chunks.push(remaining.slice(0, splitPoint));
    remaining = remaining.slice(splitPoint).trimStart();
  }
  if (remaining) chunks.push(remaining);
  return chunks;
}

export function buildSourcesBlock(sources: { textbookTitle: string; chapterTitle: string; text: string }[], chunkText?: string, partInfo?: string): string {
  return sources.map((s, i) => {
    const text = chunkText !== undefined ? chunkText : s.text;
    const header = partInfo
      ? `--- SOURCE ${i + 1}: "${s.textbookTitle}", Chapter: "${s.chapterTitle}" (${partInfo}) ---`
      : `--- SOURCE ${i + 1}: "${s.textbookTitle}", Chapter: "${s.chapterTitle}" ---`;
    return `${header}\n${text}`;
  }).join('\n\n');
}

export function buildPrompt(input: BuildKnowledgeInput, sourcesBlock: string, templates: FormatTemplate[], partInfo?: string): string {
  const pyqBlock = input.pyqQuestions?.length
    ? `\n\nPAST EXAM QUESTIONS FOR THIS CHAPTER (use to judge which topics deserve the most depth - source every fact from the textbook excerpt, never from this list):\n${input.pyqQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}`
    : '';

  const templateBlock = templates.map((t) =>
    `- "${t.name}": sections [${t.sections.join(' -> ')}] - use when: ${t.description}`
  ).join('\n');

  const partNote = partInfo
    ? `\n\nNOTE: This excerpt is ${partInfo} of this chapter (the chapter was split because it is unusually long). Extract topics from ONLY what appears in this excerpt - do not worry about content that might appear in other parts, and do not assume this excerpt covers the whole chapter.`
    : '';

  return `You are building a complete structured knowledge record of one textbook chapter for a medical education platform ("${input.subjectName}"). This single record will be the ONLY source for generating mind maps, flashcards, MCQ question banks, long-answer model answers, and study notes - the raw chapter will not be read again. So it must capture everything those need, comprehensively.

CHAPTER EXCERPT(S):
${sourcesBlock}
${pyqBlock}${partNote}

TASK: Produce a structured knowledge record covering the WHOLE excerpt in depth.

For each distinct topic the excerpt covers in real depth, capture:
- "name": short topic name
- "summary": 1-2 sentence orientation
- "definitions": formal definitions the source states (omit if none)
- "mechanisms": pathogenesis / how-it-works, where applicable
- "classifications": types, stages, grading systems, named criteria (omit if none)
- "facts": the atomic exam-ready facts. Each has "fact" (one self-contained statement), optional "detail" (supporting explanation), optional "confusedWith" (other entities students commonly mix this up with - essential for writing good multiple-choice distractors later, include wherever a genuine confusable exists), and "bestFor": an array of which feature(s) this fact is naturally suited for, from ["mindmap", "flashcard", "qbank", "notes", "longAnswer"]. A short isolated fact with a clear right/wrong answer suits "flashcard"/"qbank"; something needing surrounding context suits "notes"/"longAnswer"/"mindmap". A fact can suit more than one.
- "clinicalCorrelations": clinical presentations, signs, applied points (omit if none)
- "namedEntities": eponyms, named tests, cell types, staging systems, classifications - reproduce these EXACTLY as written, never paraphrased
- "subtopics": nested topics, same structure, where the chapter genuinely subdivides
- "suggestedFormat": the name of the BEST-FIT format template for presenting this topic as notes, chosen from the list below
- "formatReason": one short sentence on why that template fits this topic

AVAILABLE FORMAT TEMPLATES for this subject (pick per-topic, not one for the whole chapter - a chapter can mix templates):
${templateBlock}

CRITICAL RULES:
- Every item must come directly from the excerpt. Never invent facts, numbers, or examples.
- Be comprehensive on facts - they are what flashcards and question banks are built from. A rich chapter should yield many facts per topic, not a token few.
- Reproduce named eponyms/tests/classifications verbatim; do not paraphrase them away.
- Prefer several precise atomic facts over one long compound statement.
- Pick "suggestedFormat" per-topic based on how THIS topic's own content is organized, not a default guess from the subject name alone - e.g. a pathology chapter's topic that directly contrasts two diseases should get "Comparison Table" even though the subject's default is "Pathology".

Output ONLY valid JSON, no markdown fences, no commentary:
{"centralTopic": "...", "overview": "...", "topics": [{"name": "...", "summary": "...", "definitions": ["..."], "mechanisms": ["..."], "classifications": ["..."], "facts": [{"fact": "...", "detail": "...", "confusedWith": ["..."], "bestFor": ["..."]}], "clinicalCorrelations": ["..."], "namedEntities": ["..."], "suggestedFormat": "...", "formatReason": "...", "subtopics": []}]}`;
}
