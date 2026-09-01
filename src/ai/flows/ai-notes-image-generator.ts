'use server';
import { callAI } from '@/ai/genkit';
import { generateVertexImage, transcribeVertexImage } from '@/ai/genkit';

const MAX_CHARS_SOURCE = 60000;

function tryParseJson(raw: string): any | null {
  const clean = raw.replace(/```json|```/g, '').trim();
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

// Recovers a usable object from JSON that got cut off mid-response (e.g. hit a token
// limit) by walking the string, tracking bracket depth, and closing it off at the last
// point where doing so yields valid JSON. Ported from the mindmap flow.
function repairTruncatedJson(str: string): any | null {
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
      if (stack.length > 0 && stack[stack.length - 1] === ']') {
        lastSafeCut = i;
      }
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

  const closers = stack2.slice().reverse().join('');
  const candidate = truncated + closers;
  try {
    return JSON.parse(candidate);
  } catch {
    return null;
  }
}

function tokenize(text: string): string[] {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
}

// Fraction of the intended text's words that actually show up in the transcription of the
// generated image - a cheap, dependency-free gate against hallucinated/garbled text.
function textSimilarity(source: string, transcribed: string): number {
  const sourceTokens = new Set(tokenize(source));
  const transcribedTokens = new Set(tokenize(transcribed));
  if (sourceTokens.size === 0) return 0;
  let matched = 0;
  sourceTokens.forEach((t) => { if (transcribedTokens.has(t)) matched++; });
  return matched / sourceTokens.size;
}

// ============ PHASE 1: plan the chapter into page titles (cheap, small JSON) ============

export type NotesPlanInput = {
  chapterTitle: string;
  textbookText: string;
  qbankQuestions?: string[];
};

export type PagePlanItem = {
  topicTitle: string;
  scope: string;
};

export type NotesPlanOutput = {
  pages?: PagePlanItem[];
  error?: string;
};

export async function planNotesPages(input: NotesPlanInput): Promise<NotesPlanOutput> {
  if (!input.textbookText.trim()) return { error: 'No chapter text provided.' };

  const truncatedText = input.textbookText.length > MAX_CHARS_SOURCE
    ? input.textbookText.slice(0, MAX_CHARS_SOURCE) + '\n[...excerpt truncated...]'
    : input.textbookText;

  const qbankBlock = input.qbankQuestions && input.qbankQuestions.length > 0
    ? `\n\nQBANK QUESTIONS FOR THIS CHAPTER (use these to judge which topics are tested more and deserve their own page/more depth):\n${input.qbankQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}`
    : '';

  const prompt = `You are planning exam-focused handwritten-style study notes for a medical student, based on a textbook chapter.

CHAPTER: "${input.chapterTitle}"

CHAPTER TEXT:
${truncatedText}
${qbankBlock}

TASK: Break this chapter into a sequence of note PAGES. Each page covers ONE topic/subtopic and always starts fresh - never mix two different topics on one page. If a topic needs more than one page, split it into separate pages labeled clearly (e.g. "Topic (contd.)"). Decide the number of pages yourself based on how much the chapter and QBank actually call for - a short topic may need only 1 page, a heavily-tested one may need 2-3.

Do NOT write the full page content yet - just list each page's title and a one-sentence scope of exactly what that page should cover.

Output ONLY valid JSON, no markdown fences, no commentary:
{"pages": [{"topicTitle": "...", "scope": "..."}]}`;

  const MAX_ATTEMPTS = 3;
  let lastError = 'Unknown error planning notes pages';
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const raw = await callAI([{ role: 'user', content: prompt }], 2000);
      if (!raw) { lastError = 'Empty response from AI model'; continue; }

      const parsed = tryParseJson(raw);
      if (parsed && Array.isArray(parsed.pages) && parsed.pages.length > 0) {
        return { pages: parsed.pages };
      }
      lastError = 'AI response was not valid JSON for notes plan.';
    } catch (err: any) {
      lastError = err.message || 'Unknown error planning notes pages';
    }
  }
  return { error: `${lastError} (after ${MAX_ATTEMPTS} attempts). Try again.` };
}

// ============ PHASE 2: write the full content for ONE page (plain text, no JSON) ============

export type GeneratePageContentInput = {
  chapterTitle: string;
  textbookText: string;
  qbankQuestions?: string[];
  topicTitle: string;
  scope: string;
};

export type GeneratePageContentOutput = {
  content?: string;
  error?: string;
};

export async function generatePageContent(input: GeneratePageContentInput): Promise<GeneratePageContentOutput> {
  const truncatedText = input.textbookText.length > MAX_CHARS_SOURCE
    ? input.textbookText.slice(0, MAX_CHARS_SOURCE) + '\n[...excerpt truncated...]'
    : input.textbookText;

  const qbankBlock = input.qbankQuestions && input.qbankQuestions.length > 0
    ? `\n\nPAST EXAM QUESTIONS FOR THIS CHAPTER (use to prioritize depth, but source every fact from the chapter text, never from this list itself):\n${input.qbankQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}`
    : '';

  const prompt = `You are writing ONE page of exam-focused handwritten-style study notes for a medical student, in a fixed template style. The overall chapter is "${input.chapterTitle}". You are writing ONLY this one page: "${input.topicTitle}" - scope: ${input.scope}

CHAPTER TEXT:
${truncatedText}
${qbankBlock}

TASK: Write this page using this exact structure - skip any section that doesn't genuinely apply to this topic, never pad a section just to fill it:

1. TITLE line - the topic name only.
2. MAIN CONTENT - the core facts. If this topic is naturally a comparison between two or more things, format it as a TABLE with a header row and short row labels (max 6 rows). Otherwise, a short bulleted list of definitions/causes/features (max 6 bullets, each one short line).
3. (Optional, only if a genuine one exists) A section headed exactly "MNEMONIC" with one short mnemonic line.
4. (Optional, only if genuinely warranted) A section headed exactly "CLINICAL CORRELATION" with 2-3 short bullet lines.
5. (Optional, only if genuinely warranted) A section headed exactly "HIGH-YIELD POINTS" with 2-3 short exam-tip bullet lines.

HARD LIMITS - these matter more than completeness:
- The ENTIRE page must total under 150 words including the title. A shorter, cleaner page beats a dense one - cut detail rather than exceed this.
- Do NOT describe a multi-step flowchart, pathway diagram, or cell/organelle illustration - this format is table-and-bullet only, no diagrams.
- Every fact must come from the chapter text - never invent.

Output ONLY the plain page text (headers as plain text, no markdown formatting, no JSON, no commentary, no preamble like "Here is the page").`;

  const MAX_ATTEMPTS = 3;
  let lastError = 'Unknown error generating page content';
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const raw = await callAI([{ role: 'user', content: prompt }], 1500);
      if (raw && raw.trim()) {
        return { content: raw.trim() };
      }
      lastError = 'Empty response from AI model';
    } catch (err: any) {
      lastError = err.message || 'Unknown error generating page content';
    }
  }
  return { error: `${lastError} (after ${MAX_ATTEMPTS} attempts). Try again.` };
}

// ============ PHASE 3: generate + verify one page image ============

export type NotesPage = {
  topicTitle: string;
  content: string;
};

function buildNoteImagePrompt(page: NotesPage, chapterTitle: string): string {
  return `Create a single clean handwritten-style exam study notes page image, following this EXACT template layout (this is a fixed brand template, not free-form):

LAYOUT (top to bottom, with GENEROUS white space between every section - do not fill the page edge to edge, leave clear margins all around):
1. Page title in bold colorful hand-lettered display text at the very top, centered, with two small decorative asterisk/star marks flanking it.
2. The main content directly below: if the given text contains a table, draw it as a clean rectangular table with a distinct header row and thin black grid lines. Otherwise render it as a simple bulleted list with generous line spacing. Use only 3-4 ink colors total (black, blue, dark red, dark green) to color-code headings and key terms - the way students color-code notes.
3. Below that, ONLY for each optional section actually present in the given text (skip entirely if not present): draw it as its own small rounded rectangle box with a colored border and the section's heading in bold at the top of its box - "MNEMONIC" gets a purple border, "CLINICAL CORRELATION" gets a blue border, "HIGH-YIELD POINTS" gets a pink border. Each box should be compact, uncluttered, with clear space around it.

Do not draw any flowchart, pathway diagram, arrows-between-boxes, or cell/organelle illustration - this template is title + table/bullets + small colored callout boxes only.

RENDER THIS EXACT TEXT ON THE PAGE (do not add, omit, or reword anything; distribute it into the layout above based on its own section headers):
Chapter: ${chapterTitle}

${page.content}

Reproduce every word above exactly as written. Do not invent additional facts, headings, or sections beyond what's given. Prioritize a clean, uncluttered, readable result over fitting more in - leave visible white space.`;
}

export type VerifiedImageResult = {
  base64: string;
  mimeType: string;
  needsReview: boolean;
  matchScore: number;
};

export type GenerateNoteImageOutput = VerifiedImageResult | { error: string };

const ACCURACY_THRESHOLD = 0.75;
const MAX_IMAGE_ATTEMPTS = 3;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function generateVerifiedNoteImage(page: NotesPage, chapterTitle: string): Promise<GenerateNoteImageOutput> {
  const prompt = buildNoteImagePrompt(page, chapterTitle);
  let best: VerifiedImageResult | null = null;
  let lastError = 'Image model returned no image';

  for (let attempt = 1; attempt <= MAX_IMAGE_ATTEMPTS; attempt++) {
    try {
      const img = await generateVertexImage(prompt);
      if (!img) { lastError = 'Image model returned no image (check GOOGLE_VERTEX_IMAGE_MODEL is enabled for your project/region)'; continue; }

      const transcribed = await transcribeVertexImage(img.base64, img.mimeType).catch((e: any) => { lastError = `Vision transcription failed: ${e?.message || e}`; return ''; });
      const score = textSimilarity(page.content, transcribed);
      const result: VerifiedImageResult = { base64: img.base64, mimeType: img.mimeType, needsReview: score < ACCURACY_THRESHOLD, matchScore: score };

      if (score >= ACCURACY_THRESHOLD) return result;
      if (!best || score > best.matchScore) best = result;
    } catch (err: any) {
      lastError = err?.message || String(err);
      // Rate-limit/quota errors need real backoff, not an instant retry that just
      // hits the same limit again - wait progressively longer (10s, 20s, 30s).
      if (String(lastError).includes('429') || String(lastError).includes('RESOURCE_EXHAUSTED')) {
        await sleep(attempt * 10000);
      }
    }
  }

  if (best) return best; // best attempt across retries, flagged needsReview for admin follow-up
  return { error: `Failed to generate an image for "${page.topicTitle}" after ${MAX_IMAGE_ATTEMPTS} attempts: ${lastError}` };
}
