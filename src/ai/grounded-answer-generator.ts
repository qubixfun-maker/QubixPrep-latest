'use server';
import { callAIWithProvider, callGeminiNative, callClaudeOnly } from '@/ai/genkit';
import { allTemplatesForPrompt } from '@/ai/subject-templates';
import { GoogleAuth } from 'google-auth-library';
void callGeminiNative;

// Long answers call Gemini Pro DIRECTLY (no shared fallback chain), so no other model can ever
// answer, and a busy (429) response is retried within seconds instead of after hidden waits.
let proTokenCache: { token: string; expiresAt: number } | null = null;

function loadServiceAccountKey(): any {
  const norm = (v?: string): string | undefined => {
    if (!v) return undefined;
    const t = v.trim().replace(/^["']|["']$/g, '');
    if (!t) return undefined;
    if (t.startsWith('{')) return t;
    try { return Buffer.from(t, 'base64').toString('utf8').trim(); } catch { return undefined; }
  };
  for (const v of [process.env.GOOGLE_SERVICE_ACCOUNT_KEY_B64, process.env.GOOGLE_SERVICE_ACCOUNT_KEY]) {
    const s = norm(v);
    if (!s) continue;
    try { return JSON.parse(s); } catch { /* try the next candidate */ }
  }
  throw new Error('No valid Google service account key found in env');
}

async function getProToken(): Promise<string> {
  if (proTokenCache && proTokenCache.expiresAt > Date.now() + 60_000) return proTokenCache.token;
  const auth = new GoogleAuth({ credentials: loadServiceAccountKey(), scopes: ['https://www.googleapis.com/auth/cloud-platform'] });
  const client = await auth.getClient();
  const tr = await client.getAccessToken();
  if (!tr.token) throw new Error('Could not get a Google access token');
  proTokenCache = { token: tr.token, expiresAt: Date.now() + 50 * 60_000 };
  return tr.token;
}

async function callProDirect(prompt: string, maxTokens: number): Promise<{ content: string; provider: string }> {
  const model = process.env.LONG_ANSWER_MODEL || 'gemini-2.5-pro';
  const project = process.env.GOOGLE_CLOUD_PROJECT_ID;
  if (!project) throw new Error('GOOGLE_CLOUD_PROJECT_ID is not set');
  const regional = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';
  let locations = ['global', regional];
  const body = JSON.stringify({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { maxOutputTokens: maxTokens, temperature: 0.4, thinkingConfig: { thinkingBudget: 2048 } },
  });
  let lastErr = 'unknown error';
  for (let attempt = 0; attempt < 8; attempt++) {
    const location = locations[attempt % locations.length];
    const host = location === 'global' ? 'aiplatform.googleapis.com' : location + '-aiplatform.googleapis.com';
    const url = 'https://' + host + '/v1/projects/' + project + '/locations/' + location + '/publishers/google/models/' + model + ':generateContent';
    const backoff = () => new Promise((r) => setTimeout(r, Math.min(15000, 1500 * Math.pow(2, Math.floor(attempt / locations.length))) + Math.random() * 1000));
    let res: Response;
    try {
      const token = await getProToken();
      res = await fetch(url, { method: 'POST', headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' }, body, signal: AbortSignal.timeout(150000) });
    } catch (e: any) {
      lastErr = 'Network/auth error: ' + (e?.message || String(e));
      await backoff();
      continue;
    }
    if (res.ok) {
      const json: any = await res.json();
      const parts = json?.candidates?.[0]?.content?.parts || [];
      const text = parts.filter((p: any) => !p.thought).map((p: any) => p.text || '').join('');
      if (text.trim()) return { content: text, provider: 'Gemini (Vertex, ' + model + ', ' + location + ')' };
      lastErr = 'Empty response (finishReason ' + (json?.candidates?.[0]?.finishReason || 'unknown') + ')';
      continue;
    }
    const errText = (await res.text().catch(() => '')).slice(0, 300);
    lastErr = 'Vertex ' + res.status + ': ' + errText;
    if ([400, 403, 404].includes(res.status) && location === 'global') { locations = [regional]; continue; }
    if (res.status === 429 || res.status === 500 || res.status === 503) { await backoff(); continue; }
    throw new Error(lastErr);
  }
  throw new Error(lastErr + ' (after retries)');
}


/**
 * Generates a model answer to a real exam question, grounded strictly in already-
 * written source material (never the raw textbook text again). Takes a plain
 * "grounding text" string rather than a ChapterKnowledge object, so the same
 * retry/formatting logic here works whether the caller grounds the answer in the
 * extracted knowledge JSON (via knowledgeToText) or in already-generated notes
 * (concatenated topic markdown) - the caller decides the source, this only cares
 * that it gets verified, already-correct text to work from.
 */

export type SectionType = 'long-essays' | 'short-essays' | 'short-answers';

const MIN_WORDS: Record<SectionType, number> = {
  'long-essays': 200,
  'short-essays': 80,
  'short-answers': 15,
};

const TARGET_WORDS: Record<SectionType, string> = {
  'long-essays': '250-400 words, covering the question in real depth',
  'short-essays': '100-180 words, covering the key points concisely',
  'short-answers': '20-50 words, direct and to the point',
};

function buildPrompt(question: string, sectionType: SectionType, groundingText: string, subjectName: string): string {
  const templates = allTemplatesForPrompt(subjectName);
  const templateBlock = templates.map((t) =>
    `- "${t.name}": structure as [${t.sections.join(' -> ')}] - use when: ${t.description}`
  ).join('\n');

  return `You are writing a model exam answer for an MBBS student. Base your answer primarily on the source material below, since it reflects the student's own verified notes and its terminology/emphasis should be preferred wherever it applies. Where the source material doesn't fully cover some part of the question, use your own accurate medical knowledge to complete that part correctly - never leave a part of the question thin, vague, or skipped just because the notes don't mention it.

SOURCE MATERIAL (the student's own notes - prefer this wherever it covers the topic):
${groundingText}

QUESTION: ${question}

TASK: Write a complete model answer to this question.

STEP 1 - Before writing, identify every distinct part of this question (many exam questions ask for several things at once - e.g. "define X. Mention the types. Explain Y" has three parts; "(a)...(b)...(c)" has three parts). Make sure your answer gives EACH part its own real coverage - do not answer only the first part and stop.

STEP 2 - Choose the best presentation format for THIS SPECIFIC question from the list below. Different questions genuinely suit different shapes - do not default to plain prose for every question.
${templateBlock}
- If the question asks to compare/differentiate/contrast two or more things, use "Comparison Table" and render an ACTUAL Markdown table (using | pipes |), not prose describing a comparison.
- If the question describes a clinical case/scenario (e.g. "A 42-year-old male presented with..."), use "Clinical Vignette Card" with clear sub-headers for each part asked (e.g. "### Diagnosis", "### Etiopathogenesis", "### Findings").
- If the question asks to describe a sequence/steps/mechanism, use "Process/Mechanism Flowchart" and render an ACTUAL numbered list (1. 2. 3. ...) for the steps, not prose.
- Otherwise use the subject's own default template, with a "###" sub-header per major part of the question.

STEP 3 - Write the answer using real Markdown structure matching your chosen format:
- Use "###" for section sub-headers when the format calls for named sections.
- Use real Markdown tables (| Column | Column |) for comparisons - never describe a comparison in prose instead.
- Use real numbered lists (1. 2. 3.) for sequences/steps.
- Use "**bold**" for key terms worth highlighting.
- HARD MINIMUM LENGTH: ${TARGET_WORDS[sectionType]}. This is a firm requirement - a short answer is an INCOMPLETE answer for this task, even if it sounds finished.
- Prefer facts, terminology, and emphasis from the source material above wherever it covers the topic. Where it doesn't fully cover some part of the question, fill that part in with your own accurate medical knowledge so every part of the question gets a complete, correct answer - never leave a part thin, vague, or skipped just because the notes don't mention it.
- Do not repeat the question back or add a preamble like "Answer:" - start directly with the content.
- PACE YOURSELF: if you sense you're approaching your limit, do NOT start a new subtopic you won't have room to finish - wrap up cleanly instead. A shorter answer that ends properly is far better than one that cuts off mid-thought.

Output ONLY the answer as Markdown - no commentary about which format you chose, no code fences around the whole answer. Your final sentence must be complete and properly punctuated - never end mid-clause or mid-word.`;
}

export type GenerateAnswerOutput = {
  answer?: string;
  error?: string;
};

async function callModel(prompt: string, maxTokens: number, useClaude?: boolean, useGeminiNative?: boolean, forceVertex?: boolean) {
  if (useClaude) return callClaudeOnly([{ role: 'user', content: prompt }], maxTokens);
  if (useGeminiNative) return callProDirect(prompt, maxTokens);
  return callAIWithProvider([{ role: 'user', content: prompt }], maxTokens, forceVertex);
}
// NOTE: HTML-formatting helpers (rebuildQaHtml, answerTextToHtml) moved to
// grounded-answer-utils.ts - a "use server" file may only export async functions as
// runtime values, and these are deliberately synchronous pure string transforms.

// Keeps only the notes topics that match the question, instead of sending the whole
// chapter's notes with every question (the biggest input-token cost of bulk generation).
// Falls back to a truncated copy of the full text when nothing matches.
function selectRelevantGrounding(question: string, groundingText: string): string {
  const MAX_CHARS = 12000
  if (groundingText.length <= MAX_CHARS) return groundingText
  const blocks = groundingText.split(/\n(?=## )/)
  if (blocks.length < 2) return groundingText.slice(0, MAX_CHARS)
  const stop = new Set(['what', 'with', 'that', 'this', 'from', 'write', 'short', 'note', 'notes', 'explain', 'describe', 'discuss', 'mention', 'define', 'give', 'list', 'about', 'their', 'which', 'these', 'those', 'briefly', 'enumerate', 'classify', 'differentiate', 'between'])
  const words = Array.from(new Set(question.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter((w) => w.length > 3 && !stop.has(w))))
  const scored = blocks.map((b, i) => {
    const nl = b.indexOf('\n')
    const title = (nl === -1 ? b : b.slice(0, nl)).toLowerCase()
    const body = b.toLowerCase()
    let score = 0
    for (const w of words) { if (title.includes(w)) score += 5; if (body.includes(w)) score += 1 }
    return { b, i, score }
  })
  scored.sort((a, b) => b.score - a.score || a.i - b.i)
  const out: string[] = []
  let total = 0
  for (const x of scored) {
    if (x.score === 0) break
    if (total + x.b.length > MAX_CHARS && out.length > 0) continue
    out.push(x.b.slice(0, MAX_CHARS))
    total += x.b.length
    if (total >= MAX_CHARS) break
  }
  return out.length ? out.join('\n\n') : groundingText.slice(0, MAX_CHARS)
}

const KNOWLEDGE_ONLY_NOTE = '(No student notes are provided for this question. Answer entirely from your own accurate, up-to-date medical knowledge, using the standard Indian MBBS textbooks and the NMC curriculum as your reference for facts, terminology, classifications and exam emphasis - for example K. Park (PSM), BD Chaurasia and Vishram Singh (Anatomy), Guyton and AK Jain (Physiology), Harper and Satyanarayana (Biochemistry), Harsh Mohan and Robbins (Pathology), KD Tripathi (Pharmacology), Ananthanarayan (Microbiology), Reddy and Modi (Forensic Medicine), Bailey and Love and SRB (Surgery), Harrison and Davidson (Medicine), Dutta and Williams (Obstetrics and Gynaecology), Ghai and Nelson (Paediatrics), Khurana (Ophthalmology), Dhingra (ENT), Maheshwari and Apley (Orthopaedics). Do not invent facts, page numbers or citations. If you are unsure of an exact figure, give the standard accepted value or omit it.)'

export async function generateGroundedAnswer(
  question: string,
  sectionType: SectionType,
  groundingText: string,
  subjectName: string,
  options?: { useClaude?: boolean; useGeminiNative?: boolean; forceVertex?: boolean }
): Promise<GenerateAnswerOutput> {
  // No artificial cap below the model's own output ceiling - previously this budget was
  // set close to the target length, which is exactly what caused the earlier AI Notes
  // truncation bug for chapters that genuinely needed more room. Gemini 2.5 Pro/Flash (the
  // callGeminiNative fallback chain) has a hard output ceiling around 8192 tokens per
  // response, so 8000 is effectively "no cap" - the answer will never be cut short by this
  // budget, only by the model's own real maximum.
  const maxTokens = 8000;
  groundingText = selectRelevantGrounding(question, groundingText);
  if (!groundingText || !groundingText.trim()) groundingText = KNOWLEDGE_ONLY_NOTE;
  const minWords = MIN_WORDS[sectionType];

  const MAX_ATTEMPTS = 2;
  let lastError = 'Unknown error';
  let bestAttempt = '';
  let bestAttemptWasTruncated = false;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      let prompt = buildPrompt(question, sectionType, groundingText, subjectName);
      if (attempt > 1 && bestAttempt) {
        prompt += bestAttemptWasTruncated
          ? `\n\nYour previous attempt was REJECTED for stopping mid-sentence before finishing (it reached a reasonable length but got cut off): "${bestAttempt}"\nWrite a NEW answer that covers the same ground more concisely per point, so the FULL answer (covering every part of the question) fits and finishes with a complete final sentence. Do not trail off - make sure the answer properly concludes.`
          : `\n\nYour previous attempt was REJECTED for being too short and incomplete (only ${bestAttempt.trim().split(/\s+/).length} words, needs at least ${minWords}): "${bestAttempt}"\nThis attempt stopped after covering only part of the question. Write a NEW, LONGER answer from scratch that addresses EVERY part of the question with real depth. Do not just add a sentence to the old answer - restructure it into multiple full paragraphs covering each part identified in Step 1.`;
      }
      const { content: raw } = await callModel(prompt, maxTokens, options?.useClaude, options?.useGeminiNative, options?.forceVertex);
      const wordCount = raw.trim().split(/\s+/).length;
      // A response can pass the word-count bar and still be truncated mid-sentence right
      // at that boundary (seen in testing: a multi-part answer cut off mid-word on its
      // final point). Checking for proper closing punctuation catches this even when the
      // length itself looks sufficient.
      const endsProperly = /[.!?]['"]?\s*$/.test(raw.trim()) || /<\/(ul|ol)>\s*$/.test(raw.trim());
      if (raw && wordCount >= minWords && endsProperly) return { answer: raw.trim() };
      if (raw && raw.length > bestAttempt.length) {
        bestAttempt = raw.trim();
        bestAttemptWasTruncated = wordCount >= minWords && !endsProperly;
      }
      lastError = wordCount < minWords
        ? `Answer too short (${wordCount} words, need ${minWords})`
        : `Answer appears cut off mid-sentence despite reaching ${wordCount} words`;
    } catch (err: any) {
      lastError = err.message || 'Unknown error';
      // Rate-limit / non-Pro rejections: stop retrying immediately - the caller backs off for everyone.
      if (/429|resource exhausted|quota|non-pro/i.test(lastError)) break;
    }
  }
  // Return the longest attempt rather than nothing, matching the existing generator's
  // graceful-degradation behavior for this exact situation.
  if (bestAttempt) return { answer: bestAttempt };
  return { error: `${lastError} (after ${MAX_ATTEMPTS} attempts)` };
}
