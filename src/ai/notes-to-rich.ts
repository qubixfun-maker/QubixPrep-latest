'use server';
import { callGeminiNative } from '@/ai/genkit';
import { sanitizeRichNote, type RichNote } from '@/lib/richnotes/schema';

// Rewrites ONE existing topic note (markdown) into the structured QubixPrep exam-notes format.
// The existing note is the base: nothing in it is dropped or changed. Where the format needs a
// section the note does not have, the model completes it with standard textbook knowledge.

const SCHEMA = `{
  "title": "topic title, plain text",
  "citation": "optional short line, e.g. 'Standard MBBS textbook topic · 10-mark long answer'",
  "definition": { "text": "formal definition (write this first)", "simple": "optional one line in simple words" },
  "answerGuide": ["Definition","Classification","Etiology", "... heading order for a 10-mark answer"],
  "sections": [
    { "heading": "CLASSIFICATION", "blocks": [ BLOCK, BLOCK ] }
  ],
  "examPointers": { "m10": "what to write for 10 marks", "m5": "...for 5 marks", "m3": "...for 3 marks", "viva": "likely viva questions" },
  "recap": ["5 to 6 short bullets"]
}
BLOCK is one of:
{ "type":"para", "text":"..." }
{ "type":"bullets", "title":"optional", "items":["..."] }
{ "type":"table", "title":"optional", "headers":["Col A","Col B"], "rows":[["..",".."]] }
{ "type":"tree", "title":"optional", "root":"ROOT NAME", "branches":[ { "label":"Branch name", "items":["short item","short item"] } ] }
{ "type":"flow", "title":"optional", "steps":[ { "text":"step", "key":false }, { "text":"key step", "key":true } ] }
{ "type":"callout", "tone":"green|yellow|pink", "title":"...", "text":"..." or "items":["..."] }
{ "type":"mnemonic", "title":"optional", "text":"THE MNEMONIC", "expansion":["letter = meaning"] }`;

const PROMPT = (subject: string, chapter: string, topic: string, markdown: string) => `You are restructuring ONE topic's existing revision note for Indian MBBS students into the QubixPrep exam-notes format. Subject: ${subject}. Chapter: ${chapter}. Topic: ${topic}.

EXISTING NOTE (the base - keep every fact, number, name and mnemonic from it; do not contradict it):
"""
${markdown}
"""

Return ONE JSON object that follows this schema exactly:
${SCHEMA}

RULES:
1. Keep the note's own facts. If the format needs something the note lacks (for example etiology, complications, investigations, treatment, differential diagnosis), complete it using standard Indian MBBS textbook knowledge, and keep it accurate and concise. Never invent statistics or citations.
2. Section order when relevant: CLASSIFICATION, ETIOLOGY, PATHOLOGY / MECHANISM, SYMPTOMS (table: Symptom | Features | Why it happens), SIGNS (grouped by structure), COMPLICATIONS (numbered table + mnemonic), DIFFERENTIAL DIAGNOSIS (table), INVESTIGATIONS (grouped, with purpose), TREATMENT (flow + table: Drug | Dose | Action | Points, plus a pink callout for contraindications and side effects). Leave out sections that do not apply to the topic (for example a physiology topic has no complications or treatment); do not pad.
3. Classifications become "tree" blocks (include every classification the note gives). Processes, pathways and treatment algorithms become "flow" blocks. Comparisons become "table" blocks. Mark the single most important step in a flow with "key": true.
4. Keep every text short: tree items under 8 words, table cells under 25 words, flow steps under 15 words. One idea per block. Aim for 6 to 12 sections.
5. In any text you may mark a phrase to be written in bold with **double asterisks** (use sparingly for the most important phrases) and a key term in maroon with [[double square brackets]] (use for disease names, structure names, drug names and values to memorise). Never use any other markup, never LaTeX; use the real symbols (→, ↑, ↓, μ, ≥).
6. Where the note contains a quiz block, fold its facts into the exam pointers or recap; do not output quiz blocks.
7. Output ONLY the JSON object. No commentary and no code fences.`;

function parseJson(raw: string): any | null {
  const cleaned = raw.replace(/^```[a-zA-Z]*\n?/, '').replace(/```\s*$/, '').trim();
  try { return JSON.parse(cleaned); } catch {
    const s = cleaned.indexOf('{'); const e = cleaned.lastIndexOf('}');
    if (s === -1 || e <= s) return null;
    try { return JSON.parse(cleaned.slice(s, e + 1)); } catch { return null; }
  }
}

export async function convertTopicToRich(subject: string, chapter: string, topic: string, markdown: string): Promise<{ note?: RichNote; error?: string }> {
  const prompt = PROMPT(subject, chapter, topic, markdown.slice(0, 24000));
  let lastError = '';
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const { content } = await callGeminiNative([{ role: 'user', content: prompt }], 12000, 1024);
      const parsed = parseJson(content);
      const note = sanitizeRichNote(parsed);
      if (note) return { note };
      lastError = 'Model output could not be read as a valid note.';
    } catch (e: any) {
      lastError = e?.message || 'AI call failed';
      await new Promise((r) => setTimeout(r, 4000 * attempt));
    }
  }
  return { error: lastError };
}
