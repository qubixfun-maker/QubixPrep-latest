'use server';
import { callAIWithProvider, callClaudeOnly, callGeminiNative } from '@/ai/genkit';
import { withCache, fingerprintInput } from '@/ai/ai-cache';
import { allTemplatesForPrompt, resolveTemplateForSubject, FORMAT_TEMPLATES, type FormatTemplate } from '@/ai/subject-templates';
import { SAFE_CHUNK_SIZE, splitIntoChunks, buildSourcesBlock, buildPrompt as buildPromptUtil } from '@/ai/chapter-knowledge-utils';

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
 * combined record. Chunking (SAFE_CHUNK_SIZE, splitIntoChunks) and buildSourcesBlock/
 * buildPrompt live in chapter-knowledge-utils.ts, not here - this file has 'use server',
 * which only permits async function exports, and those are plain sync helpers.
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

export type SingleExtractionResult = { centralTopic: string; overview: string; topics: any[] } | { error: string };

export async function runExtraction(prompt: string, forceVertex?: boolean, useClaude?: boolean, useGeminiNative?: boolean): Promise<SingleExtractionResult> {
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
        const prompt = buildPromptUtil(input, sourcesBlock, templates, partInfo);
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
