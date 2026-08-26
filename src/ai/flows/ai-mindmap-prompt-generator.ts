'use server';
import { callAI } from '@/ai/genkit';

export type ChapterSource = {
  textbookTitle: string;
  chapterTitle: string;
  text: string;
};

export type MindmapPromptInput = {
  sources: ChapterSource[];
  topics: string[]; // one topic = single-topic prompt, multiple = combined prompt
};

export type MindmapPromptOutput = {
  prompt: string;
  error?: string;
};

const MAX_CHARS_PER_SOURCE = 60000;

function buildPrompt(input: MindmapPromptInput): string {
  const sourcesBlock = input.sources.map((s, i) => {
    const truncated = s.text.length > MAX_CHARS_PER_SOURCE ? s.text.slice(0, MAX_CHARS_PER_SOURCE) + '\n[...excerpt truncated...]' : s.text;
    return `--- SOURCE ${i + 1}: "${s.textbookTitle}", Chapter: "${s.chapterTitle}" ---\n${truncated}`;
  }).join('\n\n');

  const topicLine = input.topics.length === 1
    ? `Focus ONLY on this topic within the chapter: "${input.topics[0]}"`
    : `Cover ALL of these topics together in one unified mind map: ${input.topics.map(t => `"${t}"`).join(', ')}`;

  return `You are a medical education AI. Read the textbook chapter excerpt(s) below and write ONE detailed, ready-to-use image-generation prompt (for a tool like Midjourney/DALL-E/Ideogram) that would produce a clear, exam-useful mind map diagram.

CHAPTER EXCERPT(S):
${sourcesBlock}

${topicLine}

TASK: Write a single image-generation prompt (plain text paragraph, not JSON, not markdown) that describes:
- The central concept/topic to put in the middle of the mind map.
- The main branches radiating from the center, drawn strictly from facts in the excerpt(s) above (never invent facts not present in the source).
- The key sub-points or facts under each branch, kept short (a few words each) since they'll be diagram labels, not full sentences.
- A suggested visual style suitable for medical students - e.g. clean flat design, color-coded branches, small relevant icons, high contrast, legible text, no photorealism, no watermarks or text artifacts.

Rules:
- Output ONLY the final prompt text as one paragraph (or a few short paragraphs) - no preamble, no "Here is the prompt:", no markdown fences, no JSON.
- Every branch/fact in the prompt must come from the excerpt(s) - do not add outside knowledge.
- Keep it specific and concrete (name the actual branches/facts), not generic ("include relevant facts").
- Do not mention "the textbook", "the excerpt", "the chapter", or "the source" inside the prompt itself - write it as a standalone description of the diagram to generate.`;
}

export async function generateMindmapPrompt(input: MindmapPromptInput): Promise<MindmapPromptOutput> {
  if (!input.sources.length) {
    return { prompt: '', error: 'No chapter source excerpts provided.' };
  }
  if (!input.topics.length) {
    return { prompt: '', error: 'No topic(s) selected.' };
  }

  try {
    const prompt = buildPrompt(input);
    const raw = await callAI([{ role: 'user', content: prompt }], 1200);
    if (!raw || !raw.trim()) {
      return { prompt: '', error: 'Empty response from AI model' };
    }
    const clean = raw.replace(/```[a-z]*|```/gi, '').trim();
    return { prompt: clean };
  } catch (err: any) {
    return { prompt: '', error: err.message || 'Unknown error during mind map prompt generation' };
  }
}
