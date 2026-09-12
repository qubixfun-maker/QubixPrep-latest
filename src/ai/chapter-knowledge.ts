'use server';
import { callAIWithProvider, callClaudeOnly, callGeminiNative } from '@/ai/genkit';
import { withCache, fingerprintInput } from '@/ai/ai-cache';
import { allTemplatesForPrompt, resolveTemplateForSubject, FORMAT_TEMPLATES, type FormatTemplate } from '@/ai/subject-templates';

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
 * Two things happen in this single expensive pass, not just extraction:
 *   1. Each fact is tagged with which feature(s) it best suits (mindmap/flashcard/qbank/notes),
 *      so the cheap downstream model never has to guess what a piece of content is "for".
 *   2. Each topic is tagged with its best-fit FORMAT TEMPLATE (from a small, fixed,
 *      subject-aware library - see subject-templates.ts), so the cheap downstream model's
 *      job becomes "fill in the shape you were told" rather than "invent a structure",
 *      which is a much safer task for a weaker model.
 *
 * The extraction is intentionally richer (and so individually more expensive) than any one
 * old per-feature call, because it must carry everything downstream features need. Paid
 * once, reused by all - so total cost falls even though this single call costs more.
 */

export type ChapterSource = {
  textbookTitle: string;
  chapterTitle: string;
  text: string;
};

export type FeatureTag = 'mindmap' | 'flashcard' | 'qbank' | 'notes' | 'longAnswer';

// A single testable/learnable unit of knowledge from the chapter.
export type KnowledgeFact = {
  fact: string;              // the atomic statement itself
  detail?: string;           // supporting explanation/mechanism where the source gives one
  confusedWith?: string[];   // things students mix this up with - powers QBank distractors
  bestFor?: FeatureTag[];    // which feature(s) this fact is naturally suited for
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
  suggestedFormat?: string;        // best-fit template name from subject-templates.ts
  formatReason?: string;           // one-line reason, for admin review/debugging
};

export type ChapterKnowledge = {
  chapterTitle: string;
  subjectName?: string;
  centralTopic: string;
  overview: string;
  topics: KnowledgeTopic[];
  extractedAt: string;
  schemaVersion: number;
};

// Bump when the shape above changes so stale records are regenerated rather than misread.
// v2: added per-fact feature tagging (bestFor) and per-topic format tagging (suggestedFormat).
const KNOWLEDGE_SCHEMA_VERSION = 2;

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
  subjectName: string;
  pyqQuestions?: string[];
  forceVertex?: boolean;
  useClaude?: boolean; // route this extraction through Claude instead of the usual provider chain
  useGeminiNative?: boolean; // route through Vertex's native endpoint (for models not yet on the OpenAI-compat shim, e.g. gemini-3.8-flash)
};

export type BuildKnowledgeOutput = {
  knowledge?: ChapterKnowledge;
  error?: string;
  cached?: boolean;
};

function buildPrompt(input: BuildKnowledgeInput, sourcesBlock: string, templates: FormatTemplate[]): string {
  const pyqBlock = input.pyqQuestions?.length
    ? `\n\nPAST EXAM QUESTIONS FOR THIS CHAPTER (use to judge which topics deserve the most depth - source every fact from the textbook excerpt, never from this list):\n${input.pyqQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}`
    : '';

  const templateBlock = templates.map((t) =>
    `- "${t.name}": sections [${t.sections.join(' -> ')}] - use when: ${t.description}`
  ).join('\n');

  return `You are building a complete structured knowledge record of one textbook chapter for a medical education platform ("${input.subjectName}"). This single record will be the ONLY source for generating mind maps, flashcards, MCQ question banks, long-answer model answers, and study notes - the raw chapter will not be read again. So it must capture everything those need, comprehensively.

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

async function runExtraction(prompt: string, chapterTitle: string, subjectName: string, forceVertex?: boolean, useClaude?: boolean, useGeminiNative?: boolean): Promise<BuildKnowledgeOutput> {
  const MAX_ATTEMPTS = 3;
  let lastError = 'Unknown error building chapter knowledge';

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      // Large budget: this record carries everything every downstream feature needs, so
      // truncation here would silently starve all of them.
      const { content: raw } = useClaude
        ? await callClaudeOnly([{ role: 'user', content: prompt }], 16000)
        : useGeminiNative
        ? await callGeminiNative([{ role: 'user', content: prompt }], 16000)
        : await callAIWithProvider([{ role: 'user', content: prompt }], 16000, forceVertex);
      if (!raw) { lastError = 'Empty response from AI model'; continue; }

      const parsed = tryParseJson(raw);
      if (parsed && parsed.centralTopic && Array.isArray(parsed.topics) && parsed.topics.length > 0) {
        return {
          knowledge: {
            chapterTitle,
            subjectName,
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
  const templates = allTemplatesForPrompt(input.subjectName);
  const prompt = buildPrompt(input, sourcesBlock, templates);

  const scope = input.sources.map((s) => `${s.textbookTitle}::${s.chapterTitle}`).join('|');
  // Subject name is part of the fingerprint: the same chapter text can yield a different
  // record if the subject (and therefore template set) differs, e.g. a cross-listed chapter.
  const fingerprint = await fingerprintInput(sourcesBlock, String(KNOWLEDGE_SCHEMA_VERSION), input.subjectName);

  const result = await withCache<BuildKnowledgeOutput>(
    'chapterKnowledge',
    scope,
    fingerprint,
    async () => runExtraction(prompt, chapterTitle, input.subjectName, input.forceVertex, input.useClaude, input.useGeminiNative),
    { shouldCache: (v) => !v.error && !!v.knowledge },
  );

  return { ...result.value, cached: result.cached };
}
