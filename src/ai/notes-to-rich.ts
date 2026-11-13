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
7. Output ONLY the JSON object, written compactly on as few lines as possible (no indentation). No commentary and no code fences. Keep the whole note under about 3500 words so the answer is never cut off.`;

/** Repairs the usual slips in long model JSON: raw line breaks inside strings, trailing commas, missing closers. */
function repairJson(t: string): string {
  let out = '';
  const stack: string[] = [];
  let inStr = false;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (inStr) {
      if (c === '\\') { out += c + (t[i + 1] ?? ''); i++; continue; }
      if (c === '"') { inStr = false; out += c; continue; }
      if (c === '\n') { out += '\\n'; continue; }
      if (c === '\r') continue;
      if (c === '\t') { out += '\\t'; continue; }
      out += c; continue;
    }
    if (c === '"') { inStr = true; out += c; continue; }
    if (c === '{') stack.push('}');
    else if (c === '[') stack.push(']');
    else if (c === '}' || c === ']') {
      out = out.replace(/,\s*$/, '');
      if (stack[stack.length - 1] === c) stack.pop(); else continue; // drop a stray closer
    }
    out += c;
  }
  if (inStr) out += '"';
  out = out.replace(/,\s*$/, '');
  while (stack.length) out += stack.pop();
  return out;
}

function parseJson(raw: string): any | null {
  const cleaned = raw.replace(/^\s*```[a-zA-Z]*\s*/, '').replace(/```\s*$/, '').trim();
  const s0 = cleaned.indexOf('{');
  if (s0 === -1) return null;
  const body = cleaned.slice(s0);
  try { return JSON.parse(body); } catch {}
  try { return JSON.parse(repairJson(body)); } catch { return null; }
}

async function runModel(prompt: string): Promise<{ note?: RichNote; error?: string }> {
  let lastError = '';
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const { content } = await callGeminiNative([{ role: 'user', content: prompt }], 24000, 512);
      const parsed = parseJson(content);
      if (!parsed) {
        lastError = `The AI reply was not valid JSON (${content.length} characters; it may have been cut off). Start: ${content.slice(0, 160).replace(/\s+/g, ' ')} ... End: ${content.slice(-120).replace(/\s+/g, ' ')}`;
        continue;
      }
      const note = sanitizeRichNote(parsed);
      if (note) return { note };
      lastError = 'The AI reply was valid JSON but had no usable note (needs a title, a definition and at least one section). Keys seen: ' + Object.keys(parsed || {}).join(', ');
    } catch (e: any) {
      lastError = e?.message || 'AI call failed';
      await new Promise((r) => setTimeout(r, 4000 * attempt));
    }
  }
  return { error: lastError };
}

export async function convertTopicToRich(subject: string, chapter: string, topic: string, markdown: string): Promise<{ note?: RichNote; error?: string }> {
  return runModel(PROMPT(subject, chapter, topic, markdown.slice(0, 24000)));
}

const MERGE_PROMPT = (subject: string, chapter: string, body: string, count: number) => `You are combining ALL ${count} existing topic notes of ONE chapter into a SINGLE revision note for Indian MBBS students, in the QubixPrep exam-notes format. Subject: ${subject}. Chapter: ${chapter}.

The topic notes below were written separately, so many of them repeat the same definition, classification, mnemonic, table or clinical point. Your job is to remove that repetition and produce one clean note for the whole chapter.

EXISTING TOPIC NOTES (the base - every distinct fact, number, name, table row and mnemonic must be kept; do not contradict them):
"""
${body}
"""

Return ONE JSON object that follows this schema exactly:
${SCHEMA}

RULES:
1. The title is the chapter title. The definition is ONE definition covering the whole chapter. "answerGuide" is the heading order for a 10-mark answer on the chapter.
2. Organise by logical sections of the chapter (for example overview, layers, spaces, organs, supply, clinical correlates), not by the original topic order. Each fact appears ONCE, in the most suitable place. When topics repeat the same thing, keep the most complete version and drop the others. When two versions disagree, keep the one that is standard in Indian MBBS textbooks.
3. Keep everything that appears only in one topic. Do not summarise away tables, classifications, numbers, mnemonics or clinical points; merge them. If a mnemonic appears in several topics, show it once.
4. Classifications become "tree" blocks, processes and pathways become "flow" blocks, comparisons become "table" blocks. Mark the single most important step in a flow with "key": true.
5. Keep every text short: tree items under 8 words, table cells under 25 words, flow steps under 15 words. One idea per block. Use as many sections as the content needs (typically 8 to 16).
6. In any text you may mark a phrase in bold with **double asterisks** (sparingly) and a key term in maroon with [[double square brackets]]. Never use other markup or LaTeX; use the real symbols (→, ↑, ↓, μ, ≥).
7. The exam pointers (m10, m5, m3, viva) and the recap (6 to 10 bullets) must cover the whole chapter. Fold quiz blocks into them; do not output quiz blocks.
8. Output ONLY the JSON object, written compactly on as few lines as possible (no indentation). No commentary and no code fences. Keep the whole note under about 6500 words so the answer is never cut off.`;

/** Combines every topic of a chapter into ONE de-duplicated note. */
export async function convertChapterToRich(subject: string, chapter: string, topics: { name: string; markdown: string }[]): Promise<{ note?: RichNote; error?: string; truncated?: boolean }> {
  const LIMIT = 90000;
  let body = topics.map((t, i) => `### TOPIC ${i + 1}: ${t.name}\n${t.markdown || ''}`).join('\n\n');
  const truncated = body.length > LIMIT;
  if (truncated) body = body.slice(0, LIMIT);
  const out = await runModel(MERGE_PROMPT(subject, chapter, body, topics.length));
  return { ...out, truncated };
}
