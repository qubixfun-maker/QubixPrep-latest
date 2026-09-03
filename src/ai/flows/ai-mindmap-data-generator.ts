'use server';
import { callAIWithProvider } from '@/ai/genkit';

export type ChapterSource = {
  textbookTitle: string;
  chapterTitle: string;
  text: string;
};

export type MindmapNode = {
  name: string;
  definition?: string;
  mechanism?: string;
  examples?: string;
  branches?: MindmapNode[];
};

export type MindmapData = {
  centralTopic: string;
  branches: MindmapNode[];
};

const MAX_CHARS_PER_SOURCE = 60000;

function buildSourcesBlock(sources: ChapterSource[]): string {
  return sources.map((s, i) => {
    const truncated = s.text.length > MAX_CHARS_PER_SOURCE ? s.text.slice(0, MAX_CHARS_PER_SOURCE) + '\n[...excerpt truncated...]' : s.text;
    return `--- SOURCE ${i + 1}: "${s.textbookTitle}", Chapter: "${s.chapterTitle}" ---\n${truncated}`;
  }).join('\n\n');
}

function buildPyqBlock(pyqQuestions?: string[]): string {
  if (!pyqQuestions || pyqQuestions.length === 0) return '';
  const list = pyqQuestions.map((q, i) => (i + 1) + '. ' + q).join('\n');
  return '\n\nPAST EXAM QUESTIONS FOR THIS CHAPTER (real questions students have been asked - use these to prioritize which topics need more depth, but source every actual fact from the textbook excerpt above, never from this question list itself, since these are questions only, not answers):\n' + list;
}

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

// ============ PHASE 1: extract just the branch list (cheap, always fits) ============

export type ExtractBranchesInput = {
  sources: ChapterSource[];
  topicFocus?: string;
  pyqQuestions?: string[];
  forceVertex?: boolean;
};

export type ExtractBranchesOutput = {
  centralTopic?: string;
  branchNames?: string[];
  error?: string;
};

export async function extractMindmapBranches(input: ExtractBranchesInput): Promise<ExtractBranchesOutput> {
  if (!input.sources.length) return { error: 'No chapter source excerpts provided.' };

  try {
    const sourcesBlock = buildSourcesBlock(input.sources);
    const pyqBlock = buildPyqBlock(input.pyqQuestions);
    const focusLine = input.topicFocus
      ? `Focus specifically on this topic/disease within the chapter: "${input.topicFocus}"`
      : `Cover the whole chapter - identify every distinct disease/topic/concept it discusses in meaningful depth.`;

    const prompt = `You are planning the top-level structure of an exam-oriented mind map for a medical student.

CHAPTER EXCERPT(S):
${sourcesBlock}
${pyqBlock}

${focusLine}

TASK: List the top-level branch names only (one per distinct disease/topic/concept covered in real depth) - do NOT go into any further detail yet, that comes in a later step. A rich chapter may need 6-10 branches; a thin chapter may only need 2-3. Do not pad with weak/filler branches, and do not omit a real topic just to hit a "nice" number. Also give a short central topic name for the whole chapter/focus area.

Output ONLY valid JSON, no markdown fences, no commentary:
{"centralTopic": "...", "branchNames": ["...", "..."]}`;

    const MAX_ATTEMPTS = 3;
    let lastError = 'Unknown error extracting branches';
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        const { content: raw } = await callAIWithProvider([{ role: 'user', content: prompt }], 1500, input.forceVertex);
        if (!raw) { lastError = 'Empty response from AI model'; continue; }

        const parsed = tryParseJson(raw);
        if (parsed && parsed.centralTopic && Array.isArray(parsed.branchNames)) {
          return { centralTopic: parsed.centralTopic, branchNames: parsed.branchNames };
        }
        // Surface what the model actually said instead of a generic message -
        // needed to diagnose consistent failures that aren't network errors.
        lastError = `AI response was not valid JSON for branch list. Raw response started with: "${raw.slice(0, 300).replace(/\n/g, ' ')}"`;
      } catch (err: any) {
        lastError = err.message || 'Unknown error extracting branches';
      }
    }
    return { error: `${lastError} (after ${MAX_ATTEMPTS} attempts). Try again.` };
  } catch (err: any) {
    return { error: err.message || 'Unknown error extracting branches' };
  }
}

// ============ PHASE 2: flesh out ONE branch in full depth ============

export type GenerateBranchDetailInput = {
  sources: ChapterSource[];
  centralTopic: string;
  branchName: string;
  pyqQuestions?: string[];
  forceVertex?: boolean;
};

export type GenerateBranchDetailOutput = {
  branch?: MindmapNode;
  error?: string;
  provider?: string;
};

export async function generateMindmapBranchDetail(input: GenerateBranchDetailInput): Promise<GenerateBranchDetailOutput> {
  if (!input.sources.length) return { error: 'No chapter source excerpts provided.' };

  try {
    const sourcesBlock = buildSourcesBlock(input.sources);
    const pyqBlock = buildPyqBlock(input.pyqQuestions);

    const prompt = `You are building ONE branch of a larger exam-oriented mind map for a medical student. The overall chapter/topic is "${input.centralTopic}". You are fleshing out ONLY this one branch in full depth: "${input.branchName}" - do not cover any other branch.

CHAPTER EXCERPT(S):
${sourcesBlock}
${pyqBlock}

TASK: Produce the full recursive sub-tree for the branch "${input.branchName}" only.

STRUCTURE GUIDANCE:
- Derive natural organizing sub-categories from how the source material itself discusses this topic - do not force a fixed template, since different subjects and topics organize their content differently. For example, a pathology disease entry often naturally breaks into etiology / pathogenesis / morphology / complications / lab diagnosis; a pharmacology drug entry often naturally breaks into mechanism of action / pharmacokinetics / adverse effects / clinical uses; an anatomy structure often naturally breaks into origin / insertion / nerve supply / blood supply / clinical correlation. These are illustrative, not mandatory - follow whatever structure the actual excerpt uses.
- Go as deep as the source material genuinely supports for this one branch - since this call only covers this single branch, there is no need to compress or shorten to save space.
- Leaves (deepest nodes, no further branches) should be concrete, exam-ready facts.

CRITICAL - NAMED EPONYMS AND SPECIFIC TERMS: Wherever the excerpt names a specific eponym, sign, cell type, test, staging system, classification, or other precise term relevant to this branch, give it its own leaf node using that exact name - do not paraphrase it away.

CLINICAL VIGNETTES: If the excerpt has a clinical vignette or classic presentation relevant to this branch, capture it as its own sub-branch. Skip entirely if not applicable.

RULES:
- Every fact must come directly from the excerpt(s) - never invent details, numbers, or examples not present in the source.
- Node names are short (2-6 words). Detail goes in definition/mechanism/examples fields, each 1-2 sentences (leaf definitions can run to 2-3 sentences when the source genuinely supports it).
- Do not add a "branches" array to true leaf nodes.

Output ONLY valid JSON for this ONE branch, no markdown fences, no commentary:
{
  "name": "${input.branchName}",
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
    const MAX_ATTEMPTS = 3;
    let lastError = 'Unknown error generating branch detail';
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        const { content: raw, provider } = await callAIWithProvider([{ role: 'user', content: prompt }], 8000, input.forceVertex);
        if (!raw) { lastError = 'Empty response from AI model'; continue; }

        const parsed = tryParseJson(raw);
        if (parsed && parsed.name) {
          return { branch: parsed as MindmapNode, provider };
        }
        lastError = 'AI response was not valid JSON for this branch.';
      } catch (err: any) {
        lastError = err.message || 'Unknown error generating branch detail';
      }
    }
    return { error: `${lastError} (after ${MAX_ATTEMPTS} attempts). Try again.` };
  } catch (err: any) {
    return { error: err.message || 'Unknown error generating branch detail' };
  }
}
