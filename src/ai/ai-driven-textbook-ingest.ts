import { callGeminiNativeMultimodal, callGeminiNative } from '@/ai/genkit';

/**
 * AI-driven textbook ingestion - reads the book page by page (batched) and has Gemini
 * both determine chapter boundaries/titles AND transcribe text for scanned/image-based
 * pages, rather than relying on the existing bookmark/regex-based heuristics (which work
 * well for many books but can misfire on unusual layouts, as seen with a Physiology PDF
 * whose Learning-Objectives-boundary heuristic picked up stray preceding text into the
 * chapter title).
 *
 * This is a NEW, separate path - it does not touch or replace the existing ingestion
 * route, so anything that already works there keeps working. This is specifically for
 * difficult books (scanned, inconsistent formatting) where the existing heuristics
 * struggle.
 *
 * Cost control: only pages with little/no extractable text (genuinely scanned/image-only)
 * are sent to Gemini as images (more expensive, vision input). Pages with real text are
 * sent as plain text (cheap) - most books are mostly-if-not-entirely this case, so actual
 * image-based calls should be rare even for a "just in case" run on a text-based book.
 */

export type PageInput = {
  pageNum: number;
  text: string; // from pdfjs getTextContent() - may be empty/minimal for scanned pages
  imageBase64?: string; // only set for pages needing vision (rendered page image)
};

export type PageResult = {
  pageNum: number;
  text: string; // final text for this page (extracted, or transcribed via vision)
  isChapterStart: boolean;
  chapterTitle?: string; // only set when isChapterStart is true
};

// Below this character count, a page's extracted text is treated as unreliable/absent -
// common for a scanned page where pdfjs still picks up a stray watermark or page number.
const MIN_RELIABLE_TEXT_LENGTH = 40;

export function pageNeedsVision(page: PageInput): boolean {
  return page.text.trim().length < MIN_RELIABLE_TEXT_LENGTH;
}

function buildBatchPrompt(pages: PageInput[], needsVision: boolean[]): string {
  const pageBlocks = pages.map((p, i) => {
    if (needsVision[i]) {
      return `--- PAGE ${p.pageNum} --- (image attached, transcribe this page's text)`;
    }
    return `--- PAGE ${p.pageNum} ---\n${p.text}`;
  }).join('\n\n');

  return `You are processing consecutive pages of a medical textbook to identify chapter structure and (where marked) transcribe scanned page images.

${pageBlocks}

TASK: For EACH page above, determine:
1. "text": For pages marked "(image attached, transcribe this page's text)", transcribe the page's text as accurately as possible from the attached image, preserving paragraph structure. For pages with text already given, just return that same text unchanged.
2. "isChapterStart": true if THIS PAGE is where a new chapter genuinely begins (a real chapter heading, not a section/subsection within an ongoing chapter, not a running header/footer repeating the current chapter's name).
3. "chapterTitle": if isChapterStart is true, the chapter's real title (clean, no page numbers, no stray preceding text, no "Learning Objectives" or similar boilerplate mixed in). Omit this field if isChapterStart is false.

Be conservative about "isChapterStart" - only mark it true for a genuine new chapter opening, not a subsection heading, review question set, or appendix within the same chapter.

Output ONLY valid JSON, no markdown fences, no commentary:
{"pages": [{"pageNum": <number>, "text": "...", "isChapterStart": <boolean>, "chapterTitle": "..."}]}

The "pages" array must have exactly ${pages.length} items, one per page above, in the same order.`;
}

function tryParseBatchResult(raw: string): PageResult[] | null {
  const clean = raw.replace(/```[a-zA-Z]*/g, '').replace(/```/g, '').trim();
  try {
    const parsed = JSON.parse(clean);
    if (Array.isArray(parsed.pages)) return parsed.pages;
  } catch {
    const match = clean.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        const parsed = JSON.parse(match[0]);
        if (Array.isArray(parsed.pages)) return parsed.pages;
      } catch { /* fall through */ }
    }
  }
  return null;
}

/**
 * Processes one batch of consecutive pages (typically 5-10), sending any page needing
 * vision as an image alongside the rest as plain text, in a single Gemini call.
 */
export async function processPageBatch(pages: PageInput[]): Promise<{ results?: PageResult[]; error?: string }> {
  const needsVision = pages.map(pageNeedsVision);
  const prompt = buildBatchPrompt(pages, needsVision);
  const images = pages
    .map((p, i) => (needsVision[i] && p.imageBase64 ? p.imageBase64 : null))
    .filter((b): b is string => !!b);

  const MAX_ATTEMPTS = 2;
  let lastError = '';
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const { content: raw } = images.length > 0
        ? await callGeminiNativeMultimodal(prompt, images, 16000)
        : await callGeminiNative([{ role: 'user', content: prompt }], 8000);
      const parsed = tryParseBatchResult(raw);
      if (parsed && parsed.length === pages.length) return { results: parsed };
      lastError = `AI response did not have ${pages.length} page results`;
    } catch (err: any) {
      lastError = err.message || 'Unknown error';
    }
  }
  return { error: `${lastError} (after ${MAX_ATTEMPTS} attempts)` };
}

export type StitchedChapter = {
  title: string;
  text: string;
  startPage: number;
  endPage: number;
};

/**
 * Walks the full sequence of per-page results (across all batches, in page order) and
 * splits them into chapters wherever isChapterStart is true, concatenating each
 * chapter's page texts into one continuous block - matching the existing chapter shape
 * ({title, text, startPage, endPage}) so nothing downstream needs to change.
 */
export function stitchChapters(allPages: PageResult[]): StitchedChapter[] {
  const sorted = [...allPages].sort((a, b) => a.pageNum - b.pageNum);
  const chapters: StitchedChapter[] = [];

  for (const page of sorted) {
    if (page.isChapterStart && page.chapterTitle) {
      chapters.push({ title: page.chapterTitle, text: page.text, startPage: page.pageNum, endPage: page.pageNum });
    } else if (chapters.length > 0) {
      const current = chapters[chapters.length - 1];
      current.text += '\n' + page.text;
      current.endPage = page.pageNum;
    }
  }

  return chapters;
}
