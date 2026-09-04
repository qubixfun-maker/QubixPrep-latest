'use server';
import { callAIWithProvider } from '@/ai/genkit';

/**
 * Detects chapter boundaries using the AI's semantic understanding of a page's opening
 * text, rather than a fixed regex pattern. This exists because regex-based detection
 * (matching "CHAPTER N TITLE" or "Chapter N: Title" as a literal string) only works for
 * books that format themselves exactly that way, and breaks entirely if a page's running
 * header gets slightly mangled during PDF text extraction (a real, observed failure mode
 * for some books' font encodings). A model reading the snippet can usually still infer
 * "this looks like a fresh chapter opener, titled X" even when the exact wording is
 * corrupted or uses a different convention (e.g. "1. Introduction to Community Medicine"
 * instead of "CHAPTER 1").
 *
 * Only ever used as a fallback AFTER bookmark detection and regex detection have both
 * failed - those are cheaper and more precise when they work.
 */

export type PageSnippet = {
  page: number;
  snippet: string; // first ~250 chars of the page's extracted text
};

export type DetectedChapter = {
  title: string;
  page: number;
};

export type DetectChapterBoundariesOutput = {
  chapters?: DetectedChapter[];
  error?: string;
};

const BATCH_SIZE = 80; // pages per AI call - keeps each prompt a manageable size

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

function tryParseJson(raw: string): any | null {
  const clean = raw.replace(/```[a-zA-Z]*/g, '').replace(/```/g, '').trim();
  try {
    return JSON.parse(clean);
  } catch {
    const match = clean.match(/\{[\s\S]*\}/);
    if (match) {
      try { return JSON.parse(match[0]); } catch { /* fall through */ }
    }
    return repairByClosingBrackets(clean);
  }
}

function buildBatchPrompt(batch: PageSnippet[]): string {
  const pagesBlock = batch
    .map((p) => `PAGE ${p.page}: ${p.snippet.replace(/\s+/g, ' ').trim().slice(0, 250)}`)
    .join('\n');

  return `You are looking at the first ~250 characters of consecutive pages from a textbook PDF, in order. Some pages may have slightly garbled text due to PDF extraction quirks - use your judgment to see past minor corruption (stray spaces, broken words, odd characters).

PAGES:
${pagesBlock}

TASK: Identify which of these pages is the FIRST page of a new chapter (a major topic division - not a subsection, not a figure caption, not an index/reference page). Chapter openers commonly look like a numbered heading ("1. Introduction to X", "CHAPTER 3: Y", "Chapter 5 Z") or a large standalone title very different in style from the surrounding body text, often followed by author names or a fresh start to a topic. Do NOT mark pages that are clearly mid-chapter continuations, contents/index pages, or preface/acknowledgment pages.

For each chapter-start page you find, give its page number and its title (clean it up - remove page numbers, author name lines, and running-header noise, keep just the chapter title itself).

If NO clear chapter starts appear in this batch of pages (e.g. it's all mid-chapter content), return an empty array - do not force a guess.

Output ONLY valid JSON, no markdown fences, no commentary:
{"chapters": [{"page": 12, "title": "..."}]}`;
}

async function detectBatch(batch: PageSnippet[]): Promise<DetectedChapter[]> {
  const prompt = buildBatchPrompt(batch);
  const MAX_ATTEMPTS = 2;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const { content } = await callAIWithProvider([{ role: 'user', content: prompt }], 2000, true);
      if (!content) continue;

      const parsed = tryParseJson(content);
      if (parsed && Array.isArray(parsed.chapters)) {
        return parsed.chapters
          .filter((c: any) => typeof c.page === 'number' && typeof c.title === 'string' && c.title.trim())
          .map((c: any) => ({ page: c.page, title: c.title.trim() }));
      }
    } catch {
      // A failed batch just yields no detections for those pages - other batches
      // can still succeed, and a partial chapter list is far better than none.
    }
  }
  return [];
}

export async function detectChapterBoundariesWithAI(pages: PageSnippet[]): Promise<DetectChapterBoundariesOutput> {
  if (pages.length === 0) return { error: 'No page text provided.' };

  const batches: PageSnippet[][] = [];
  for (let i = 0; i < pages.length; i += BATCH_SIZE) {
    batches.push(pages.slice(i, i + BATCH_SIZE));
  }

  const allDetections: DetectedChapter[] = [];
  for (const batch of batches) {
    const found = await detectBatch(batch);
    allDetections.push(...found);
  }

  // Sort by page and drop anything out of order or duplicate - a chapter list must be
  // strictly increasing in page number to be usable as chapter boundaries.
  allDetections.sort((a, b) => a.page - b.page);
  const clean: DetectedChapter[] = [];
  let lastPage = -1;
  for (const d of allDetections) {
    if (d.page > lastPage) {
      clean.push(d);
      lastPage = d.page;
    }
  }

  if (clean.length < 2) {
    return { error: 'AI-based detection could not find at least 2 chapter boundaries.' };
  }

  return { chapters: clean };
}
