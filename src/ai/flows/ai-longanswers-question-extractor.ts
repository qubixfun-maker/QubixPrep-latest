'use server';
import { callVertexOnly } from '@/ai/genkit';

export type ExtractQuestionsInput = {
  chapterTitle: string;
  rawText: string;
};

export type ExtractQuestionsOutput = {
  longEssays: string[];
  shortEssays: string[];
  shortAnswers: string[];
  error?: string;
};

function buildPrompt(chapterTitle: string, chunkText: string): string {
  return `You are extracting exam questions from a raw, messily-formatted text dump of one chapter (or part of one chapter) from an exam question bank PDF.

CHAPTER: "${chapterTitle}"

RAW TEXT:
---
${chunkText}
---

TASK: Find every question listed under headings like "Long Essay(s)", "Short Essay(s)", and "Short Answer(s)" (headings may vary slightly in wording/capitalization/plurality - match them loosely). Extract each question's exact text, dropping only the leading number.

CRITICAL RULES:
- COMPLETELY IGNORE any "MCQ" / "MCQs" / "Multiple Choice" section and every question inside it - do not include a single MCQ in the output.
- Do not invent, merge, or rephrase questions - copy each question's wording as it appears (minus the leading number).
- If a question has sub-parts (a, b, c) as part of a clinical vignette, keep them together as ONE question, exactly as one item.
- If a section is entirely absent from this text, return an empty array for it - do not invent placeholder questions.
- This may be a partial excerpt of a larger chapter - extract only complete questions found here.

Output ONLY valid JSON in this exact shape, no markdown fences, no commentary:
{"longEssays": ["...", "..."], "shortEssays": ["...", "..."], "shortAnswers": ["...", "..."]}`;
}

// Recovers a usable object from JSON that got cut off mid-response (e.g. hit a token
// limit) by walking the string, tracking bracket depth, and closing it off at the last
// point where doing so yields valid JSON. Kept as a last-resort safety net - the real
// fix against truncation is chunking the input (below), which keeps this from being
// needed in the first place for all but pathological cases.
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

// Splits a large chapter's raw text into smaller pieces, always cutting at a numbered
// question boundary (never mid-question) so nothing gets sliced in half. This is what
// actually prevents truncation-driven data loss: each chunk stays comfortably within
// what the model can extract and return in full, instead of gambling on one huge call.
const CHUNK_CHAR_LIMIT = 12000;

function splitIntoQuestionSafeChunks(text: string): string[] {
  if (text.length <= CHUNK_CHAR_LIMIT) return [text];

  const boundaryPattern = /\n\s*\d+[\.\)]\s/g;
  const boundaries: number[] = [0];
  let match: RegExpExecArray | null;
  while ((match = boundaryPattern.exec(text)) !== null) {
    boundaries.push(match.index);
  }
  boundaries.push(text.length);

  if (boundaries.length <= 2) {
    // No recognizable numbered-question boundaries found - fall back to the whole
    // text as a single chunk rather than risk cutting content mid-question blindly.
    return [text];
  }

  const chunks: string[] = [];
  let chunkStart = boundaries[0];
  let lastBoundary = boundaries[0];

  for (let i = 1; i < boundaries.length; i++) {
    const candidateEnd = boundaries[i];
    if (candidateEnd - chunkStart > CHUNK_CHAR_LIMIT && lastBoundary > chunkStart) {
      chunks.push(text.slice(chunkStart, lastBoundary));
      chunkStart = lastBoundary;
    }
    lastBoundary = candidateEnd;
  }
  chunks.push(text.slice(chunkStart));

  return chunks.filter((c) => c.trim().length > 0);
}

async function extractFromChunk(chapterTitle: string, chunkText: string): Promise<ExtractQuestionsOutput> {
  const prompt = buildPrompt(chapterTitle, chunkText);
  const MAX_ATTEMPTS = 3;
  let lastError = 'Unknown error during question extraction';

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const raw = await callVertexOnly([{ role: 'user', content: prompt }], 8000);
      if (!raw) { lastError = 'Empty response from AI model'; continue; }

      let clean = raw.replace(/```json|```/g, '').trim();
      let parsed: any;
      try {
        parsed = JSON.parse(clean);
      } catch {
        const match = clean.match(/\{[\s\S]*\}/);
        if (match) {
          try { parsed = JSON.parse(match[0]); } catch { /* fall through */ }
        }
        if (!parsed) {
          parsed = repairTruncatedJson(clean);
        }
      }

      if (!parsed || typeof parsed !== 'object') {
        lastError = 'AI response was not valid JSON.';
        continue;
      }

      const clean_arr = (arr: any) => Array.isArray(arr) ? arr.filter((q: any) => typeof q === 'string' && q.trim()).map((q: string) => q.trim()) : [];

      return {
        longEssays: clean_arr(parsed.longEssays),
        shortEssays: clean_arr(parsed.shortEssays),
        shortAnswers: clean_arr(parsed.shortAnswers),
      };
    } catch (err: any) {
      lastError = err.message || 'Unknown error during question extraction';
    }
  }

  return { longEssays: [], shortEssays: [], shortAnswers: [], error: `${lastError} (after ${MAX_ATTEMPTS} attempts)` };
}

export async function extractLongAnswerQuestions(input: ExtractQuestionsInput): Promise<ExtractQuestionsOutput> {
  if (!input.rawText.trim()) {
    return { longEssays: [], shortEssays: [], shortAnswers: [], error: 'No text provided.' };
  }

  const chunks = splitIntoQuestionSafeChunks(input.rawText);

  if (chunks.length === 1) {
    return extractFromChunk(input.chapterTitle, chunks[0]);
  }

  const longEssays: string[] = [];
  const shortEssays: string[] = [];
  const shortAnswers: string[] = [];
  const chunkErrors: string[] = [];

  for (let i = 0; i < chunks.length; i++) {
    const result = await extractFromChunk(input.chapterTitle, chunks[i]);
    longEssays.push(...result.longEssays);
    shortEssays.push(...result.shortEssays);
    shortAnswers.push(...result.shortAnswers);
    if (result.error) {
      chunkErrors.push(`part ${i + 1}/${chunks.length}: ${result.error}`);
    }
  }

  return {
    longEssays,
    shortEssays,
    shortAnswers,
    error: chunkErrors.length > 0 ? `Some content may be missing - ${chunkErrors.join('; ')}` : undefined,
  };
}
