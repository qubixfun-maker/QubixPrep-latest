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

  const prompt = `You are writing ONE page of exam-focused handwritten-style study notes for a medical student. The overall chapter is "${input.chapterTitle}". You are writing ONLY this one page: "${input.topicTitle}" - scope: ${input.scope}

CHAPTER TEXT:
${truncatedText}
${qbankBlock}

TASK: Write out the exact text content for this one page: a short title, then organized notes using short headings, bullet points, arrows for cause->effect relationships, and simple tables where useful - written the way a topper's handwritten notes would look. Every fact must come from the chapter text. Keep it to what would realistically fit on one clean page (concise, not a wall of text).

Output ONLY the plain page text - no JSON, no markdown fences, no commentary, no preamble like "Here is the page".`;

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
  return `Create a single clean handwritten-style study notes page image, like a topper's medical school notebook page.

STYLE: White/off-white notebook page background. Neat handwriting-style lettering (not a typed/print font). Use 3-4 ink colors (e.g. black, blue, dark red, dark green) to distinguish headings, key terms, and structure, the way students color-code notes. Use underlines, boxes, and simple arrows to organize information and show relationships. No cartoon doodles or stickers beyond simple hand-drawn-style dividers/arrows/boxes.

RENDER THIS EXACT TEXT ON THE PAGE, ARRANGED CLEARLY (do not add, omit, or reword anything):
Topic: ${page.topicTitle}
Chapter: ${chapterTitle}

${page.content}

Reproduce every word above exactly as written. Do not invent additional facts or headings beyond what's given.`;
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

export async function generateVerifiedNoteImage(page: NotesPage, chapterTitle: string): Promise<GenerateNoteImageOutput> {
  const prompt = buildNoteImagePrompt(page, chapterTitle);
  let best: VerifiedImageResult | null = null;

  for (let attempt = 1; attempt <= MAX_IMAGE_ATTEMPTS; attempt++) {
    try {
      const img = await generateVertexImage(prompt);
      if (!img) continue;

      const transcribed = await transcribeVertexImage(img.base64, img.mimeType).catch(() => '');
      const score = textSimilarity(page.content, transcribed);
      const result: VerifiedImageResult = { base64: img.base64, mimeType: img.mimeType, needsReview: score < ACCURACY_THRESHOLD, matchScore: score };

      if (score >= ACCURACY_THRESHOLD) return result;
      if (!best || score > best.matchScore) best = result;
    } catch {
      continue;
    }
  }

  if (best) return best; // best attempt across retries, flagged needsReview for admin follow-up
  return { error: `Failed to generate an image for "${page.topicTitle}" after ${MAX_IMAGE_ATTEMPTS} attempts.` };
}
