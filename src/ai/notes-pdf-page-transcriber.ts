'use server';
import { callGeminiNativeMultimodal } from '@/ai/genkit';

export type TranscribedPage = {
  topicName: string;
  pageOfTopic: number;
  totalPagesOfTopic: number;
  markdown: string;
};

function tryParseJson(raw: string): any | null {
  const cleaned = raw.replace(/^```[a-zA-Z]*\n?/, '').replace(/```\s*$/, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    // Model sometimes wraps in prose before/after the JSON - try to isolate the outermost braces.
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start === -1 || end === -1 || end <= start) return null;
    try {
      return JSON.parse(cleaned.slice(start, end + 1));
    } catch {
      return null;
    }
  }
}

const TRANSCRIBE_PROMPT = `You are transcribing ONE page of a medical student's already-condensed revision notes (its own one-page PDF, exactly as it appears in the source document (preserving its original layout, any embedded text, and any images/diagrams on the page)) into clean Markdown, for direct use as study notes in an app.

This is NOT a textbook page - it is already dense, condensed notes (like Marrow-style coaching notes), so your job is faithful TRANSCRIPTION and light formatting cleanup, not summarization or rewriting into prose. Preserve the page's own structure exactly: bullet points, arrows/flowchart-style sequences, mnemonics, tables, headings, colored/highlighted terms (note them as **bold** since color can't be preserved in Markdown).

Return ONLY a JSON object (no markdown code fences, no commentary before or after) with exactly these fields:
{
  "topicName": "the topic heading shown on this page (the bold/large heading near the top). If this page continues a topic from a prior page (shown by a 'Page X/Y' style counter where X is greater than 1), give the SAME topic name the topic's first page would have - infer it from context (e.g. a running header) if the heading itself isn't repeated on this page.",
  "pageOfTopic": <the X from a 'Page X/Y' style counter visible on this page (often bottom-right), as a number. If no such counter is visible, use 1.>,
  "totalPagesOfTopic": <the Y from that same counter, as a number. If not visible, use 1.>,
  "markdown": "the full transcribed content of this page as clean Markdown. Preserve every bullet, table, mnemonic, and arrow/flowchart sequence exactly as written - do not skip small details, footnotes, or side annotations, and do not invent content that isn't visible. Use an actual '→' character for arrows, proper Markdown table syntax for any tabular content, and for a diagram that carries information not otherwise captured in the surrounding text, add a short 'Diagram:' sub-list describing its key labeled parts. If any text is genuinely illegible, write [illegible] in its place rather than guessing at it."
}`;

export async function transcribeNotesPage(fileBase64: string, mimeType: string = 'application/pdf'): Promise<{ page?: TranscribedPage; error?: string }> {
  const MAX_ATTEMPTS = 2;
  let lastError = '';
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const { content: raw } = await callGeminiNativeMultimodal(TRANSCRIBE_PROMPT, [fileBase64], 3000, mimeType);
      const parsed = tryParseJson(raw);
      if (parsed && typeof parsed.markdown === 'string' && parsed.markdown.trim().length > 5) {
        return {
          page: {
            topicName: String(parsed.topicName || 'Untitled Topic').trim(),
            pageOfTopic: Number(parsed.pageOfTopic) || 1,
            totalPagesOfTopic: Number(parsed.totalPagesOfTopic) || 1,
            markdown: parsed.markdown.trim(),
          },
        };
      }
      lastError = 'AI response was not valid JSON with a markdown field';
    } catch (err: any) {
      lastError = err.message || 'Unknown error';
    }
  }
  return { error: lastError };
}
