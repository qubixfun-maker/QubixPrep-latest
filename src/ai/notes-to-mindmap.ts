'use server';
import { callAIWithProvider, callGeminiNative, callClaudeOnly } from '@/ai/genkit';

/**
 * Generates mindmap data from already-generated NOTES (polished Markdown prose, with
 * the right format template - table, steps, etc. - already applied), rather than the
 * raw knowledge JSON. The model reads real, well-organized text and summarizes it into
 * a mindmap node, instead of parsing structured data.
 *
 * This creates a real dependency: notes must already be generated for a chapter before
 * its mindmap can be. If notes generation failed or is incomplete for a topic, mindmap
 * generation fails for that topic too - accepted tradeoff for reading better-organized
 * source material.
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
 * child of the most recent item at (depth - 1).
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

function buildPrompt(node: HierarchyNode, subjectName: string): string {
  return `You are building ONE branch of a mindmap for a "${subjectName}" topic, from its already-written study notes below (these notes are already verified against the source textbook - use ONLY what's in them, do not add outside information).

NOTES FOR THIS TOPIC:
${node.markdown}

Note: the notes may contain fenced code blocks labeled \`\`\`flow (a step-by-step pathway/process, optionally split into labeled branches) and \`\`\`quiz (self-test questions). Treat a \`\`\`flow block as the structured source for "mechanism" - describe the pathway/sequence it shows in prose, don't quote its raw step lines verbatim. Ignore \`\`\`quiz blocks entirely, they're not content to summarize.

TASK: Summarize these notes into a mindmap node:
- "definition": a clear, concise 1-2 sentence definition/orientation for this topic, drawn from the notes.
- "mechanism": if the notes describe a real mechanism/pathogenesis/process (including one shown as a \`\`\`flow block), a concise prose summary of it. Omit entirely if not applicable.
- "examples": the most important, illustrative facts from these notes (you decide which matter most), as a short, punchy 2-4 sentence set of examples. Prioritize memorable, distinctive, or exam-relevant details over generic ones.

Output ONLY valid JSON, no markdown fences, no commentary:
{"definition": "...", "mechanism": "...", "examples": "..."}

Omit "mechanism" or "examples" entirely from the JSON if not applicable - never output them as null or empty string.`;
}

function tryParseSummary(raw: string): { definition?: string; mechanism?: string; examples?: string } | null {
  const clean = raw.replace(/```[a-zA-Z]*/g, '').replace(/```/g, '').trim();
  try {
    return JSON.parse(clean);
  } catch {
    const match = clean.match(/\{[\s\S]*\}/);
    if (match) {
      try { return JSON.parse(match[0]); } catch { /* fall through */ }
    }
  }
  return null;
}

async function callModel(prompt: string, maxTokens: number, useClaude?: boolean, useGeminiNative?: boolean, forceVertex?: boolean) {
  if (useClaude) return callClaudeOnly([{ role: 'user', content: prompt }], maxTokens);
  if (useGeminiNative) return callGeminiNative([{ role: 'user', content: prompt }], maxTokens);
  return callAIWithProvider([{ role: 'user', content: prompt }], maxTokens, forceVertex);
}

async function generateOneNode(
  node: HierarchyNode,
  subjectName: string,
  options?: { useClaude?: boolean; useGeminiNative?: boolean; forceVertex?: boolean }
): Promise<MindmapNode> {
  const prompt = buildPrompt(node, subjectName);
  const MAX_ATTEMPTS = 2;
  let summary: { definition?: string; mechanism?: string; examples?: string } | null = null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const { content: raw } = await callModel(prompt, 2000, options?.useClaude, options?.useGeminiNative, options?.forceVertex);
      summary = tryParseSummary(raw);
      if (summary) break;
    } catch {
      // retry, then fall through to a plain-text fallback below
    }
  }

  const branches = node.children.length > 0
    ? await Promise.all(node.children.map((child) => generateOneNode(child, subjectName, options)))
    : undefined;

  if (!summary) {
    // Graceful fallback: use the raw notes markdown directly rather than losing this
    // branch entirely if the AI summarization failed after retries.
    return {
      name: node.name,
      examples: node.markdown.slice(0, 300),
      ...(branches ? { branches } : {}),
    };
  }

  return {
    name: node.name,
    ...(summary.definition ? { definition: summary.definition } : {}),
    ...(summary.mechanism ? { mechanism: summary.mechanism } : {}),
    ...(summary.examples ? { examples: summary.examples } : {}),
    ...(branches ? { branches } : {}),
  };
}

export async function generateMindmapFromNotes(
  notesTopics: NotesTopic[],
  centralTopic: string,
  subjectName: string,
  options?: { useClaude?: boolean; useGeminiNative?: boolean; forceVertex?: boolean }
): Promise<{ centralTopic: string; branches: MindmapNode[] }> {
  const hierarchy = reconstructHierarchy(notesTopics);
  const branches = await Promise.all(hierarchy.map((node) => generateOneNode(node, subjectName, options)));
  return { centralTopic, branches };
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
  return generateOneNode(node, subjectName, options);
}
