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
 *
 * CHUNKING: chapters longer than SAFE_CHUNK_SIZE are split into sequential chunks (at
 * paragraph boundaries where possible), each extracted separately, then merged into one
 * combined record. This replaced a silent single-cutoff truncation that was discarding
 * entire back halves of long, multi-topic chapters (discovered when a chapter titled
 * "Inflammation and Healing" turned out to have NO healing-related topics at all - the
 * cutoff landed entirely within the inflammation portion).
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
  chunkCount?: number; // >1 means this record was assembled from multiple sequential passes
};

// Bump when the shape above changes so stale records are regenerated rather than misread.
// v2: added per-fact feature tagging (bestFor) and per-topic format tagging (suggestedFormat).
const KNOWLEDGE_SCHEMA_VERSION = 2;

// Chapters longer than this are split into multiple sequential extraction passes rather
// than truncated. Kept comfortably under typical model input limits to leave room for
// the prompt instructions and format templates alongside the excerpt itself.
const SAFE_CHUNK_SIZE = 55000;

/**
 * Splits long text into chunks at paragraph boundaries where possible, so a chunk
 * doesn't cut a sentence or table in half. Falls back to a hard split only if no
 * paragraph break exists in a reasonable range.
 */
function splitIntoChunks(text: string, maxSize: number): string[] {
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

function buildSourcesBlock(sources: ChapterSource[], chunkText?: string, partInfo?: string): string {
  return sources.map((s, i) => {
    const text = chunkText !== undefined ? chunkText : s.text;
    const header = partInfo
      ? `--- SOURCE ${i + 1}: "${s.textbookTitle}", Chapter: "${s.chapterTitle}" (${partInfo}) ---`
      : `--- SOURCE ${i + 1}: "${s.textbookTitle}", Chapter: "${s.chapterTitle}" ---`;
    return `${header}\n${text}`;
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

function buildPrompt(input: BuildKnowledgeInput, sourcesBlock: string, templates: FormatTemplate[], partInfo?: string): string {
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

type SingleExtractionResult = { centralTopic: string; overview: string; topics: any[] } | { error: string };

async function runExtraction(prompt: string, forceVertex?: boolean, useClaude?: boolean, useGeminiNative?: boolean): Promise<SingleExtractionResult> {
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
        return { centralTopic: parsed.centralTopic, overview: parsed.overview || '', topics: parsed.topics };
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
 *
 * For chapters longer than SAFE_CHUNK_SIZE, this runs multiple sequential extraction
 * passes (one per chunk) and merges the resulting topic lists into one combined record,
 * rather than silently truncating and losing whatever came after the cutoff.
 */
export async function getChapterKnowledge(input: BuildKnowledgeInput): Promise<BuildKnowledgeOutput> {
  if (!input.sources.length) return { error: 'No chapter source excerpts provided.' };

  const chapterTitle = input.sources[0].chapterTitle;
  const templates = allTemplatesForPrompt(input.subjectName);
  const fullText = input.sources[0].text;
  const chunks = splitIntoChunks(fullText, SAFE_CHUNK_SIZE);

  // Fingerprint on the FULL untruncated text, so a chapter that previously produced an
  // incomplete record (from the old silent-truncation behavior) gets a different
  // fingerprint here only if the text itself changed - callers that already have a
  // stored record from before this fix should explicitly delete it to force
  // re-extraction; this cache layer alone won't detect "was previously truncated".
  const scope = input.sources.map((s) => `${s.textbookTitle}::${s.chapterTitle}`).join('|');
  const fingerprint = await fingerprintInput(fullText, String(KNOWLEDGE_SCHEMA_VERSION), input.subjectName, String(chunks.length));

  const result = await withCache<BuildKnowledgeOutput>(
    'chapterKnowledge',
    scope,
    fingerprint,
    async () => {
      const allTopics: any[] = [];
      let centralTopic = '';
      const overviewParts: string[] = [];

      for (let i = 0; i < chunks.length; i++) {
        const partInfo = chunks.length > 1 ? `part ${i + 1} of ${chunks.length}` : undefined;
        const sourcesBlock = buildSourcesBlock(input.sources, chunks[i], partInfo);
        const prompt = buildPrompt(input, sourcesBlock, templates, partInfo);
        const chunkResult = await runExtraction(prompt, input.forceVertex, input.useClaude, input.useGeminiNative);

        if ('error' in chunkResult) {
          // If even one chunk fails outright and we have nothing yet, fail the whole
          // extraction. If later chunks fail after earlier ones succeeded, keep what
          // was extracted rather than discarding real progress.
          if (allTopics.length === 0) return { error: `Chunk ${i + 1}/${chunks.length} failed: ${chunkResult.error}` };
          continue;
        }
        if (!centralTopic) centralTopic = chunkResult.centralTopic;
        if (chunkResult.overview) overviewParts.push(chunkResult.overview);
        allTopics.push(...chunkResult.topics);
      }

      if (allTopics.length === 0) return { error: 'No topics extracted from any chunk.' };

      return {
        knowledge: {
          chapterTitle,
          subjectName: input.subjectName,
          centralTopic: centralTopic || chapterTitle,
          overview: overviewParts.join(' '),
          topics: allTopics,
          extractedAt: new Date().toISOString(),
          schemaVersion: KNOWLEDGE_SCHEMA_VERSION,
          chunkCount: chunks.length,
        },
      };
    },
    { shouldCache: (v) => !v.error && !!v.knowledge },
  );

  return { ...result.value, cached: result.cached };
}
