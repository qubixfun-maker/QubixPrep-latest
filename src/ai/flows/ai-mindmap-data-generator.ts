'use server';
import { callAI } from '@/ai/genkit';

export type ChapterSource = {
  textbookTitle: string;
  chapterTitle: string;
  text: string;
};

export type MindmapDataInput = {
  sources: ChapterSource[];
  topicFocus?: string; // optional - focus on one topic within the chapter
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

const MAX_CHARS_PER_SOURCE = 60000;

function buildPrompt(input: MindmapDataInput): string {
  const sourcesBlock = input.sources.map((s, i) => {
    const truncated = s.text.length > MAX_CHARS_PER_SOURCE ? s.text.slice(0, MAX_CHARS_PER_SOURCE) + '\n[...excerpt truncated...]' : s.text;
    return `--- SOURCE ${i + 1}: "${s.textbookTitle}", Chapter: "${s.chapterTitle}" ---\n${truncated}`;
  }).join('\n\n');

  const focusLine = input.topicFocus
    ? `Focus specifically on this topic within the chapter: "${input.topicFocus}"`
    : `Cover the whole chapter's main topics.`;

  return `You are a medical education AI building an interactive mind map for a medical student.

CHAPTER EXCERPT(S):
${sourcesBlock}

${focusLine}

TASK: Produce a two-level mind map structure:
- A central topic (the chapter or focused topic name).
- 3-6 main branches, each a distinct sub-topic covered in the excerpt (e.g. for "Cell Injury": Causes, Reversible Changes, Necrosis, Apoptosis).
- Each main branch has: a one-sentence definition, an optional one-sentence mechanism, an optional one-sentence examples line, and 2-4 leaf subtopics.
- Each leaf subtopic has: a name and a "detail" field - 1-3 sentences of real explanatory content (not just a repeated definition).

CRITICAL RULES:
- Every fact must come directly from the excerpt(s) - never invent details not present in the source.
- Keep every text field concise: definitions/mechanisms/examples are ONE sentence each; leaf "detail" fields are 1-3 sentences maximum.
- Branch and subtopic names are short (2-5 words), suitable as diagram labels.
- Do not add a "branches" array to leaf subtopics - they are the deepest level.

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
        { "name": "...", "definition": "..." }
      ]
    }
  ]
}

Note: leaf subtopics use "definition" as their one-line summary; if you have more to say, put the fuller explanation there instead of a separate "detail" field - keep the shape exactly as shown above.`;
}

export async function generateMindmapData(input: MindmapDataInput): Promise<MindmapDataOutput> {
  if (!input.sources.length) {
    return { error: 'No chapter source excerpts provided.' };
  }

  try {
    const prompt = buildPrompt(input);
    const raw = await callAI([{ role: 'user', content: prompt }], 3000);
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
    }

    if (!parsed || typeof parsed !== 'object' || !parsed.centralTopic || !Array.isArray(parsed.branches)) {
      return { error: 'AI response was not valid mind map JSON. Try again.' };
    }

    return { data: parsed as MindmapData };
  } catch (err: any) {
    return { error: err.message || 'Unknown error during mind map generation' };
  }
}
