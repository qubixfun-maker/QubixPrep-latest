'use server';
import { callAI } from '@/ai/genkit';

export type ChapterSource = {
  textbookTitle: string;
  chapterTitle: string;
  text: string;
};

export type MindmapDataInput = {
  sources: ChapterSource[];
  topicFocus?: string; // optional - focus on one topic/disease within the chapter
  pyqQuestions?: string[]; // optional - real past exam questions for this chapter, used to prioritize depth/topics
};

export type MindmapNode = {
  name: string;
  definition: string;
  mechanism?: string;
  examples?: string;
  branches?: MindmapNode[];
};

export type MindmapData = {
  centralTopic: string;
  branches: MindmapNode[];
};

export type MindmapDataOutput = {
  data?: MindmapData;
  error?: string;
};

// If the model's response got cut off mid-generation (hit the token ceiling),
// plain JSON.parse fails entirely even though most of the tree is valid. This
// walks the string tracking bracket/brace depth (respecting string literals),
// finds the last point where a complete branch object had just closed, cuts
// there, and appends whatever closing brackets are needed to make the
// truncated-but-mostly-complete tree parse as valid JSON.
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
      // A safe cut point: we just closed something, and what's left open
      // (if anything) is an array - meaning this was a complete element
      // inside a "branches": [ ... ] list.
      if (stack.length > 0 && stack[stack.length - 1] === ']') {
        lastSafeCut = i;
      }
    }
  }

  if (lastSafeCut === -1) return null;

  const truncated = str.slice(0, lastSafeCut + 1);
  // Figure out what's still open at the cut point by re-running the same scan
  // only up to lastSafeCut, then append closers in reverse order.
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

const MAX_CHARS_PER_SOURCE = 60000;

function buildPrompt(input: MindmapDataInput): string {
  const sourcesBlock = input.sources.map((s, i) => {
    const truncated = s.text.length > MAX_CHARS_PER_SOURCE ? s.text.slice(0, MAX_CHARS_PER_SOURCE) + '\n[...excerpt truncated...]' : s.text;
    return `--- SOURCE ${i + 1}: "${s.textbookTitle}", Chapter: "${s.chapterTitle}" ---\n${truncated}`;
  }).join('\n\n');

  const pyqList = (input.pyqQuestions || []).map((q, i) => (i + 1) + ". " + q).join("\n")
  const pyqBlock = input.pyqQuestions && input.pyqQuestions.length > 0
    ? "\n\nPAST EXAM QUESTIONS FOR THIS CHAPTER (real questions students have been asked - use these to prioritize which topics need more depth/branches, and make sure the mind map has enough detail to answer them, but source every actual FACT from the textbook excerpt above, never from this question list itself, since these are questions only, not answers):\n" + pyqList
    : ""

  const focusLine = input.topicFocus
    ? `Focus specifically on this topic/disease within the chapter: "${input.topicFocus}"`
    : `Cover the whole chapter - every distinct disease/topic the excerpt discusses in meaningful depth.`;

  return `You are a medical education AI building an interactive, exam-oriented mind map for a medical student preparing for university theory exams (long essays, short essays, short answers) and practical/viva questions.

CHAPTER EXCERPT(S):
${sourcesBlock}

${focusLine}

TASK: Produce a mind map as a tree of nodes (centralTopic + recursive branches). The structure should scale with how much the excerpt actually covers - do not force a fixed shape.

STRUCTURE GUIDANCE:
- Top level: one branch per distinct disease/topic/concept covered in real depth in the excerpt. A rich chapter may need 6-10 top-level branches; a thin chapter may only need 2-3. Do not pad with weak/filler branches, and do not omit a real topic just to hit a "nice" number.
- For sub-branches, DERIVE the natural organizing categories from how the source material itself discusses each topic - do not force a fixed template, since different subjects and even different topics within a subject organize their content differently. For example, a pathology disease entry often naturally breaks into etiology / pathogenesis / morphology / complications / lab diagnosis; a pharmacology drug entry often naturally breaks into mechanism of action / pharmacokinetics / adverse effects / clinical uses; an anatomy structure often naturally breaks into origin / insertion / nerve supply / blood supply / clinical correlation. These are illustrative, not mandatory - follow whatever structure the actual excerpt uses, including subheadings already present in the source text.
- Each sub-branch can itself have leaf facts as its own branches when there's enough distinct content.
- Leaves (deepest nodes, no further branches) should be concrete, exam-ready facts - not vague restatements.

CRITICAL - NAMED EPONYMS AND SPECIFIC TERMS: Wherever the excerpt names a specific eponym, sign, cell type, test, staging system, classification, or other precise term, give it its OWN leaf node using that exact name - do not paraphrase it away into a generic description. These exact terms are what exam questions ask for by name.

CLINICAL VIGNETTES: When the excerpt includes a clinical vignette or describes a classic presentation for a condition, capture the key identifying features as their own branch under that topic. Skip this entirely for non-clinical subjects where it does not apply.

OTHER RULES:
- Every fact must come directly from the excerpt(s) - never invent details, numbers, or examples not present in the source.
- Definitions/mechanisms/examples fields are concise (1-2 sentences). Leaf node "definition" fields can run to 2-3 sentences when the source genuinely has that much detail for it (e.g. a named lesion's full morphology) - don't artificially shorten real content.
- Branch and node names are short (2-6 words), suitable as diagram labels - the DETAIL goes in the definition/mechanism/examples fields, not the name.
- Do not add a "branches" array to true leaf nodes.

Output ONLY valid JSON in this exact shape, no markdown fences, no commentary:
{
  "centralTopic": "...",
  "branches": [
    {
      "name": "...",
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
    }
  ]
}`;
}

export async function generateMindmapData(input: MindmapDataInput): Promise<MindmapDataOutput> {
  if (!input.sources.length) {
    return { error: 'No chapter source excerpts provided.' };
  }

  try {
    const prompt = buildPrompt(input);
    const raw = await callAI([{ role: 'user', content: prompt }], 16000);
    if (!raw) return { error: 'Empty response from AI model' };

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

    if (!parsed || typeof parsed !== 'object' || !parsed.centralTopic || !Array.isArray(parsed.branches)) {
      return { error: 'AI response was not valid mind map JSON. Try again, or narrow with a topicFocus if the chapter is very large.' };
    }

    return { data: parsed as MindmapData };
  } catch (err: any) {
    return { error: err.message || 'Unknown error during mind map generation' };
  }
}
