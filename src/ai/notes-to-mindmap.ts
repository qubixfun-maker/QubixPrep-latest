'use server';
import { callAIWithProvider, callGeminiNative, callClaudeOnly } from '@/ai/genkit';

/**
 * Generates mindmap data for a chapter's notes topics. The notes are used as a
 * REFERENCE ONLY (what to prioritize, what's already been taught) - the actual
 * depth and structure of each branch is authored by Gemini itself, drawing on
 * standard Indian MBBS textbook knowledge, the same way the mindmap BULK generator
 * (ai-mindmap-data-generator.ts) builds a full recursive sub-tree per branch in one
 * call. This fixes the old behavior where a node only got branches if the notes
 * happened to already have nested subtopics (which AI Notes Generator's flat
 * depth:0 topics never do) - now every topic gets real depth regardless of how
 * flat the underlying notes are.
 */

export type MindmapNode = {
  name: string;
  definition?: string;
  mechanism?: string;
  examples?: string;
  branches?: MindmapNode[];
};

type NotesTopic = { name: string; markdown: string; depth: number };

type HierarchyNode = { name: string; markdown: string; children: HierarchyNode[] };

/**
 * Reconstructs the nested topic tree from the flat, depth-tagged list notes are stored
 * as - a standard "flatten with depth" tree reconstruction: each item attaches as a
 * child of the most recent item at (depth - 1). With AI Notes Generator output this
 * will almost always just produce a flat list of roots (all depth 0) - that's fine,
 * each root still gets full model-authored depth below.
 */
function reconstructHierarchy(flatTopics: NotesTopic[]): HierarchyNode[] {
  const roots: HierarchyNode[] = [];
  const stack: HierarchyNode[] = [];

  for (const item of flatTopics) {
    const node: HierarchyNode = { name: item.name, markdown: item.markdown, children: [] };
    if (item.depth === 0 || !stack[item.depth - 1]) {
      roots.push(node);
    } else {
      stack[item.depth - 1].children.push(node);
    }
    stack[item.depth] = node;
    stack.length = item.depth + 1; // truncate - moving to a new branch invalidates deeper ancestors
  }
  return roots;
}

// Flattens a node's own notes plus any real subtopic notes it already has (rare, but
// possible from the other notes pipeline) into one reference block, so nothing written
// in the actual notes is lost even though we no longer recurse into children separately.
function collectReferenceMarkdown(node: HierarchyNode): string {
  const parts = [node.markdown];
  function walk(children: HierarchyNode[]) {
    for (const child of children) {
      parts.push(`\n--- Sub-topic in notes: "${child.name}" ---\n${child.markdown}`);
      if (child.children.length > 0) walk(child.children);
    }
  }
  walk(node.children);
  return parts.join('\n');
}

// Salvages a truncated JSON object by discarding any incomplete trailing element and
// closing the structure - a full recursive branch tree is a much bigger response than
// the old flat 3-field summary, so truncation on a token-limit cutoff is more likely.
// Ported from ai-mindmap-data-generator.ts (the bulk generator).
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

  const trimmed = str.slice(0, lastElementEnd);
  return repairByClosingBrackets(trimmed);
}

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

function tryParseNode(raw: string): MindmapNode | null {
  const clean = raw.replace(/```[a-zA-Z]*/g, '').replace(/```/g, '').trim();
  try {
    const parsed = JSON.parse(clean);
    if (parsed && parsed.name) return parsed;
  } catch {
    const match = clean.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        const parsed = JSON.parse(match[0]);
        if (parsed && parsed.name) return parsed;
      } catch { /* fall through to repair */ }
    }
    const repaired = repairTruncatedJson(clean);
    if (repaired && repaired.name) return repaired;
  }
  return null;
}

function buildPrompt(node: HierarchyNode, subjectName: string): string {
  const referenceMarkdown = collectReferenceMarkdown(node);

  return `You are building ONE branch of an exam-oriented mind map for Indian MBBS students, for the "${subjectName}" topic "${node.name}".

Below are this topic's already-written revision notes. Use them ONLY as a REFERENCE for what's already been taught and what to prioritize - do NOT limit the mind map to only what's written in them. Wherever a standard Indian MBBS textbook for ${subjectName} (e.g. Robbins/Harsh Mohan for Pathology, KD Tripathi for Pharmacology, BD Chaurasia/Gray's for Anatomy, Park's for Community Medicine, or the equivalent standard text for this subject) and the NMC competency-based curriculum would cover this topic in more depth or breadth than these notes do, draw on that standard textbook knowledge directly and build the mind map at that full depth - the notes are a starting point, not a ceiling.

EXISTING NOTES FOR THIS TOPIC (reference only):
${referenceMarkdown}

TASK: Produce the full recursive sub-tree for the topic "${node.name}" - the same depth and completeness you would produce if you were building this branch directly from a standard textbook chapter, not just summarizing the notes above.

STRUCTURE GUIDANCE:
- Derive natural organizing sub-categories the way a standard textbook itself would structure this topic - do not force a fixed template, since different subjects and topics organize differently. For example, a pathology disease entry often naturally breaks into etiology / pathogenesis / morphology / clinical features / complications / investigations; a pharmacology drug entry often naturally breaks into mechanism of action / pharmacokinetics / adverse effects / clinical uses / contraindications; an anatomy structure often naturally breaks into origin / insertion / nerve supply / blood supply / clinical correlation. These are illustrative, not mandatory - follow whatever structure is standard for this actual topic and subject.
- Go as deep as a standard Indian MBBS textbook genuinely covers this topic - multiple levels of nesting are expected for any topic with real depth, not just one flat layer of facts.
- Leaves (deepest nodes, no further branches) should be concrete, exam-ready facts.

CRITICAL - NAMED EPONYMS AND SPECIFIC TERMS: Wherever a specific eponym, sign, cell type, test, staging system, classification, or other precise term is relevant to this branch, give it its own leaf node using that exact name - do not paraphrase it away.

CLINICAL VIGNETTES: If there is a clinical vignette or classic presentation relevant to this branch, capture it as its own sub-branch. Skip entirely if not applicable.

RULES:
- Every fact must be genuine, standard medical knowledge (from the notes above and/or standard Indian MBBS textbooks) - never invent details, numbers, or examples that aren't real.
- Node names are short (2-6 words). Detail goes in definition/mechanism/examples fields, each 1-2 sentences (leaf definitions can run to 2-3 sentences when genuinely warranted).
- Do not add a "branches" array to true leaf nodes.

Output ONLY valid JSON for this ONE branch, no markdown fences, no commentary:
{
  "name": "${node.name}",
  "definition": "...",
  "mechanism": "...",
  "examples": "...",
  "branches": [
    {
      "name": "...",
      "definition": "...",
      "branches": [
        { "name": "...", "definition": "..." }
      ]
    }
  ]
}`;
}

// Tried pinning this to gemini-2.5-pro to save cost (skipping the app-wide fallback
// chain's pricier gemini-3.1-pro-preview first choice), with and without thinking
// enabled - in both cases gemini-2.5-pro returned a valid but nearly flat JSON tree
// (depth ~2, ~10 nodes) for every topic, versus depth 6-10 and hundreds of nodes from
// the frontier model. So the pin itself, not the prompt or thinking budget, was the
// actual regression. Left undefined here to use the normal fallback chain again
// (gemini-3.1-pro-preview first, same as before any of this feature's cost work).
const MINDMAP_MODEL = undefined;
const MINDMAP_THINKING_BUDGET = undefined;

async function callModel(prompt: string, maxTokens: number, useClaude?: boolean, useGeminiNative?: boolean, forceVertex?: boolean) {
  if (useClaude) return callClaudeOnly([{ role: 'user', content: prompt }], maxTokens, MINDMAP_MODEL, MINDMAP_THINKING_BUDGET);
  if (useGeminiNative) return callGeminiNative([{ role: 'user', content: prompt }], maxTokens, MINDMAP_THINKING_BUDGET, MINDMAP_MODEL);
  return callAIWithProvider([{ role: 'user', content: prompt }], maxTokens, forceVertex, MINDMAP_MODEL, MINDMAP_THINKING_BUDGET);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRateLimitError(message: string | undefined): boolean {
  if (!message) return false;
  return message.includes('429') || message.toLowerCase().includes('resource exhausted');
}

// A full recursive tree is a much bigger response than the old 3-field summary -
// matches the bulk generator's per-branch token budget (ai-mindmap-data-generator.ts
// uses 8000 for the same "one branch, full depth" shape).
const MAX_TOKENS = 8000;
// Shared wall-clock budget across the WHOLE chapter (all top-level branches, all
// workers) - without this, stacked backoff waits across several branches can push
// total request time past the hosting platform's own timeout, which kills the
// request mid-flight (a 504, all work lost) instead of returning cleanly with
// whatever branches did finish.
const DEADLINE_MS = 80000;

async function generateOneNode(
  node: HierarchyNode,
  subjectName: string,
  startTime: number,
  options?: { useClaude?: boolean; useGeminiNative?: boolean; forceVertex?: boolean }
): Promise<{ node: MindmapNode; provider?: string }> {
  const prompt = buildPrompt(node, subjectName);
  const MAX_ATTEMPTS = 3;
  let result: MindmapNode | null = null;
  let provider: string | undefined;
  let consecutiveRateLimitHits = 0;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    if (Date.now() - startTime > DEADLINE_MS) break; // shared budget spent - fall through to the plain-text fallback below
    try {
      // A small fixed pace before every call, on top of the backoff below for
      // actual 429s - important here since branches run with concurrency, so
      // several of these can otherwise fire at once.
      await sleep(1000);
      const { content: raw, provider: usedProvider } = await callModel(prompt, MAX_TOKENS, options?.useClaude, options?.useGeminiNative, options?.forceVertex);
      const parsed = tryParseNode(raw || '');
      if (parsed) { result = parsed; provider = usedProvider; break; }
      consecutiveRateLimitHits = 0;
    } catch (err: any) {
      if (isRateLimitError(err?.message)) {
        // Real quota wall - back off before retrying instead of immediately hitting
        // the same limit again. Capped low (15s) and clamped to whatever's left of
        // the shared deadline, so one branch's backoff can't eat the whole budget.
        consecutiveRateLimitHits++;
        const waitMs = Math.min(15000, 4000 * Math.pow(2, consecutiveRateLimitHits - 1));
        const remaining = DEADLINE_MS - (Date.now() - startTime);
        await sleep(Math.max(0, Math.min(waitMs, remaining)));
      }
    }
  }

  if (!result) {
    // Graceful fallback: use the raw notes markdown directly rather than losing this
    // branch entirely if the AI generation failed after retries.
    return { node: { name: node.name, examples: node.markdown.slice(0, 300) }, provider: 'FALLBACK (no AI response)' };
  }

  // Always keep our own node name (from the notes topic list) as the source of truth,
  // in case the model didn't echo it back exactly.
  return { node: { ...result, name: node.name }, provider };
}

const TOP_LEVEL_CONCURRENCY = 2; // lowered from 3 - fewer simultaneous Vertex calls means a burst is less likely to trip the per-minute quota

export async function generateMindmapFromNotes(
  notesTopics: NotesTopic[],
  centralTopic: string,
  subjectName: string,
  options?: { useClaude?: boolean; useGeminiNative?: boolean; forceVertex?: boolean }
): Promise<{ centralTopic: string; branches: MindmapNode[]; providers: (string | undefined)[] }> {
  const hierarchy = reconstructHierarchy(notesTopics);
  const branches: MindmapNode[] = new Array(hierarchy.length);
  const providers: (string | undefined)[] = new Array(hierarchy.length);
  const startTime = Date.now();
  let nextIndex = 0;
  async function worker() {
    while (true) {
      if (Date.now() - startTime > DEADLINE_MS) return; // shared budget spent - stop picking up new branches
      const i = nextIndex++;
      if (i >= hierarchy.length) return;
      const { node: generated, provider } = await generateOneNode(hierarchy[i], subjectName, startTime, options);
      branches[i] = generated;
      providers[i] = provider;
    }
  }
  await Promise.all(Array.from({ length: Math.min(TOP_LEVEL_CONCURRENCY, hierarchy.length) }, () => worker()));
  // If the shared deadline ran out before every index got claimed by a worker, those
  // slots in the pre-allocated array are real `undefined` holes (never written at all) -
  // Firestore rejects `undefined` anywhere in a document, so this crashed the whole save
  // with no indication of which branch caused it. Fill any such holes with the same
  // graceful plain-text fallback generateOneNode itself uses on failure, so a chapter
  // that ran out of time still saves cleanly with every branch present (some just less
  // AI-elaborated) instead of losing the whole mindmap to one unclaimed index.
  for (let i = 0; i < branches.length; i++) {
    if (!branches[i]) {
      branches[i] = { name: hierarchy[i].name, examples: hierarchy[i].markdown.slice(0, 300) };
      providers[i] = 'FALLBACK (deadline exceeded, never attempted)';
    }
  }
  return { centralTopic, branches, providers };
}

/** Recursively finds one hierarchy node by name. */
function findNodeByName(nodes: HierarchyNode[], name: string): HierarchyNode | null {
  for (const n of nodes) {
    if (n.name === name) return n;
    const found = findNodeByName(n.children, name);
    if (found) return found;
  }
  return null;
}

/**
 * Generates a mindmap node for ONE specific topic name (found within the reconstructed
 * notes hierarchy) - used when only some branches of a chapter are selected for
 * generation, so only those get an AI call rather than generating the whole chapter's
 * branches regardless of what's actually queued.
 */
export async function generateMindmapNodeForTopicNameFromNotes(
  notesTopics: NotesTopic[],
  topicName: string,
  subjectName: string,
  options?: { useClaude?: boolean; useGeminiNative?: boolean; forceVertex?: boolean }
): Promise<MindmapNode | null> {
  const hierarchy = reconstructHierarchy(notesTopics);
  const node = findNodeByName(hierarchy, topicName);
  if (!node) return null;
  const { node: generated } = await generateOneNode(node, subjectName, Date.now(), options);
  return generated;
}
