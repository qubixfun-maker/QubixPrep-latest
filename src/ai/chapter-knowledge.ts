'use server';
import { callAIWithProvider } from '@/ai/genkit';
import { withCache, fingerprintInput } from '@/ai/ai-cache';

/**
 * THE SHARED CHAPTER KNOWLEDGE LAYER ("mother record").
 *
 * Problem this solves: every feature (mindmaps, flashcards, QBank, long answers, notes)
 * used to independently re-read the same raw chapter text and re-pay for it. Four features
 * over one chapter meant paying to "understand" that chapter four times.
 *
 * Instead: read each chapter ONCE into a rich structured representation that is deliberately
 * shaped to serve every consumer, store it, and have all features derive from it.
 *
 * The extraction is intentionally richer (and so individually more expensive) than any one
 * old per-feature call, because it must carry everything downstream features need:
 *   - topics + hierarchy        -> mindmaps, notes page planning
 *   - atomic facts              -> flashcards, QBank stems
 *   - confusables               -> QBank distractors (the piece a mindmap tree can't give)
 *   - definitions / mechanisms  -> long answers, notes content
 *   - clinical correlations     -> case-based questions, high-yield boxes
 * Paid once, reused by all - so total cost falls even though this single call costs more.
 */

export type ChapterSource = {
  textbookTitle: string;
  chapterTitle: string;
  text: string;
};

// A single testable/learnable unit of knowledge from the chapter.
export type KnowledgeFact = {
  fact: string;              // the atomic statement itself
  detail?: string;           // supporting explanation/mechanism where the source gives one
  confusedWith?: string[];   // things students mix this up with - powers QBank distractors
};

export type KnowledgeTopic = {
  name: string;
  summary: string;                 // 1-2 sentence orientation for this topic
  definitions?: string[];          // formal definitions stated in the source
  mechanisms?: string[];           // pathogenesis / how-it-works, where applicable
  classifications?: string[];      // types, stages, grading systems, named criteria
  facts: KnowledgeFact[];          // atomic exam-ready facts
  clinicalCorrelations?: string[]; // presentations, signs, applied points
  namedEntities?: string[];        // eponyms, tests, cell types, staging systems - kept verbatim
  subtopics?: KnowledgeTopic[];    // recursive, gives mindmaps their hierarchy
};

export type ChapterKnowledge = {
  chapterTitle: string;
  centralTopic: string;
  overview: string;
  topics: KnowledgeTopic[];
  extractedAt: string;
  schemaVersion: number;
};

// Bump when the shape above changes so stale records are regenerated rather than misread.
export const KNOWLEDGE_SCHEMA_VERSION = 1;

const MAX_CHARS_PER_SOURCE = 60000;

function buildSourcesBlock(sources: ChapterSource[]): string {
  return sources.map((s, i) => {
    const truncated = s.text.length > MAX_CHARS_PER_SOURCE
      ? s.text.slice(0, MAX_CHARS_PER_SOURCE) + '\n[...excerpt truncated...]'
      : s.text;
    return `--- SOURCE ${i + 1}: "${s.textbookTitle}", Chapter: "${s.chapterTitle}" ---\n${truncated}`;
  }).join('\n\n');
}

function repairByClosingBrackets(str: string): any | null {
  const stack: string[] = [];
  let inString = false;
  let escapeNext = false;
  let lastSafeCut = -1;

  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    if (escapeNext) { escapeNext = false; continue; }
    if (ch === '\\') { escapeNext = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === '{' || ch === '[') {
      stack.push(ch === '{' ? '}' : ']');
    } else if (ch === '}' || ch === ']') {
      stack.pop();
      if (stack.length > 0 && stack[stack.length - 1] === ']') lastSafeCut = i;
    }
  }
  if (lastSafeCut === -1) return null;

  const truncated = str.slice(0, lastSafeCut + 1);
  const stack2: string[] = [];
  let inString2 = false;
  let escapeNext2 = false;
  for (let i = 0; i <= lastSafeCut; i++) {
    const ch = truncated[i];
    if (escapeNext2) { escapeNext2 = false; continue; }
    if (ch === '\\') { escapeNext2 = true; continue; }
    if (ch === '"') { inString2 = !inString2; continue; }
    if (inString2) continue;
    if (ch === '{' || ch === '[') stack2.push(ch === '{' ? '}' : ']');
    else if (ch === '}' || ch === ']') stack2.pop();
  }
  try {
    return JSON.parse(truncated + stack2.slice().reverse().join(''));
  } catch {
    return null;
  }
}

function repairTruncatedJson(str: string): any | null {
  const direct = repairByClosingBrackets(str);
  if (direct) return direct;

  let inString = false;
  let escapeNext = false;
  let lastElementEnd = -1;
  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    if (escapeNext) { escapeNext = false; continue; }
    if (ch === '\\') { escapeNext = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === ',' || ch === '[' || ch === '{') lastElementEnd = i;
  }
  if (lastElementEnd === -1) return null;
  return repairByClosingBrackets(str.slice(0, lastElementEnd));
}

function tryParseJson(raw: string): any | null {
  const clean = raw.replace(/```[a-zA-Z]*/g, '').replace(/```/g, '').trim();
  try {
    return JSON.parse(clean);
  } catch {
    const match = clean.match(/\{[\s\S]*\}/);
    if (match) {
      try { return JSON.parse(match[0]); } catch { /* fall through */ }
    }
    return repairTruncatedJson(clean);
  }
}

export type BuildKnowledgeInput = {
  sources: ChapterSource[];
  pyqQuestions?: string[];
  forceVertex?: boolean;
};

export type BuildKnowledgeOutput = {
  knowledge?: ChapterKnowledge;
  error?: string;
  cached?: boolean;
};

function buildPrompt(input: BuildKnowledgeInput, sourcesBlock: string): string {
  const pyqBlock = input.pyqQuestions?.length
    ? `\n\nPAST EXAM QUESTIONS FOR THIS CHAPTER (use to judge which topics deserve the most depth - source every fact from the textbook excerpt, never from this list):\n${input.pyqQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}`
    : '';

  return `You are building a complete structured knowledge record of one textbook chapter for a medical education platform. This single record will be the ONLY source for generating mind maps, flashcards, MCQ question banks, long-answer model answers, and study notes - the raw chapter will not be read again. So it must capture everything those need, comprehensively.

CHAPTER EXCERPT(S):
${sourcesBlock}
${pyqBlock}

TASK: Produce a structured knowledge record covering the WHOLE chapter in depth.

For each distinct topic the chapter covers in real depth, capture:
- "name": short topic name
- "summary": 1-2 sentence orientation
- "definitions": formal definitions the source states (omit if none)
- "mechanisms": pathogenesis / how the process works (omit if not applicable)
- "classifications": types, stages, grading systems, named criteria (omit if none)
- "facts": the atomic exam-ready facts. Each has "fact" (one self-contained statement), optional "detail" (supporting explanation), and optional "confusedWith" (other entities students commonly mix this up with - this is essential for writing good multiple-choice distractors later, so include it wherever a genuine confusable exists)
- "clinicalCorrelations": clinical presentations, signs, applied points (omit if none)
- "namedEntities": eponyms, named tests, cell types, staging systems, classifications - reproduce these EXACTLY as written, never paraphrased
- "subtopics": nested topics, same structure, where the chapter genuinely subdivides

CRITICAL RULES:
- Every item must come directly from the excerpt. Never invent facts, numbers, or examples.
- Be comprehensive on facts - they are what flashcards and question banks are built from. A rich chapter should yield many facts per topic, not a token few.
- Reproduce named eponyms/tests/classifications verbatim; do not paraphrase them away.
- Prefer several precise atomic facts over one long compound statement.

Output ONLY valid JSON, no markdown fences, no commentary:
{"centralTopic": "...", "overview": "...", "topics": [{"name": "...", "summary": "...", "definitions": ["..."], "mechanisms": ["..."], "classifications": ["..."], "facts": [{"fact": "...", "detail": "...", "confusedWith": ["..."]}], "clinicalCorrelations": ["..."], "namedEntities": ["..."], "subtopics": []}]}`;
}

async function runExtraction(prompt: string, chapterTitle: string, forceVertex?: boolean): Promise<BuildKnowledgeOutput> {
  const MAX_ATTEMPTS = 3;
  let lastError = 'Unknown error building chapter knowledge';

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      // Large budget: this record carries everything every downstream feature needs, so
      // truncation here would silently starve all of them.
      const { content: raw } = await callAIWithProvider([{ role: 'user', content: prompt }], 16000, forceVertex);
      if (!raw) { lastError = 'Empty response from AI model'; continue; }

      const parsed = tryParseJson(raw);
      if (parsed && parsed.centralTopic && Array.isArray(parsed.topics) && parsed.topics.length > 0) {
        return {
          knowledge: {
            chapterTitle,
            centralTopic: parsed.centralTopic,
            overview: parsed.overview || '',
            topics: parsed.topics,
            extractedAt: new Date().toISOString(),
            schemaVersion: KNOWLEDGE_SCHEMA_VERSION,
          },
        };
      }
      lastError = `AI response was not valid knowledge JSON. Raw response started with: "${raw.slice(0, 300).replace(/\n/g, ' ')}"`;
    } catch (err: any) {
      lastError = err.message || 'Unknown error building chapter knowledge';
    }
  }
  return { error: `${lastError} (after ${MAX_ATTEMPTS} attempts)` };
}

/**
 * Gets the chapter's knowledge record, building it only if it doesn't already exist.
 * Every feature should call THIS instead of sending raw chapter text to the model.
 */
export async function getChapterKnowledge(input: BuildKnowledgeInput): Promise<BuildKnowledgeOutput> {
  if (!input.sources.length) return { error: 'No chapter source excerpts provided.' };

  const sourcesBlock = buildSourcesBlock(input.sources);
  const chapterTitle = input.sources[0].chapterTitle;
  const prompt = buildPrompt(input, sourcesBlock);

  const scope = input.sources.map((s) => `${s.textbookTitle}::${s.chapterTitle}`).join('|');
  const fingerprint = await fingerprintInput(sourcesBlock, String(KNOWLEDGE_SCHEMA_VERSION));

  const result = await withCache<BuildKnowledgeOutput>(
    'chapterKnowledge',
    scope,
    fingerprint,
    async () => runExtraction(prompt, chapterTitle, input.forceVertex),
    { shouldCache: (v) => !v.error && !!v.knowledge },
  );

  return { ...result.value, cached: result.cached };
}

// ============ Consumer-facing views over the knowledge record ============
// These are pure transforms - no AI calls, no cost. Features that only need a
// re-shaping of what's already extracted should use these rather than calling a model.

/** Flattens the knowledge tree into plain text, for prompts that want prose context. */
export function knowledgeToText(k: ChapterKnowledge): string {
  const lines: string[] = [`# ${k.centralTopic}`, k.overview, ''];

  function walk(topics: KnowledgeTopic[], depth: number) {
    for (const t of topics) {
      const indent = '  '.repeat(depth);
      lines.push(`${indent}## ${t.name}`);
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
