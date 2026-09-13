'use server';
import { callAIWithProvider, callGeminiNative } from '@/ai/genkit';
import type { ChapterKnowledge } from '@/ai/chapter-knowledge';
import { allTemplatesForPrompt } from '@/ai/subject-templates';

/**
 * Renders a chapter's already-extracted knowledge into well-formatted, student-facing
 * Markdown notes - one topic at a time, each written using its OWN assigned format
 * template (Etiology/Pathogenesis/... for a Pathology-shaped topic, a real Markdown
 * table for a Comparison-Table topic, numbered steps for a Process/Flowchart topic).
 *
 * Deliberately cheap and safe: this step never re-reads the raw textbook and never
 * introduces new facts - it only reshapes what getChapterKnowledge() already extracted
 * and verified. That's exactly the kind of "fill in the shape you were told" task a
 * cheap/fast model handles well, per the mother-record architecture.
 */

function tryParseText(raw: string): string {
  return raw.replace(/^```[a-zA-Z]*\n?/, '').replace(/```\s*$/, '').trim();
}

function buildTopicPrompt(chapterTitle: string, subjectName: string, topicJson: string, formatName: string, formatSections: string[]): string {
  return `You are writing ONE topic's section of student-facing study notes for "${chapterTitle}" (${subjectName}).

SOURCE DATA (already extracted and verified from the textbook - use ONLY this, do not add outside facts):
${topicJson}

FORMAT TO USE: "${formatName}" - organize the content under these sections, in this order: ${formatSections.join(' -> ')}. Skip a section only if the source data genuinely has nothing for it - do not pad with filler.

TASK: Write clean, well-presented Markdown notes for this ONE topic:
- Use a top-level heading with the topic name, then a subheading per format section.
- Write in clear, exam-ready prose and bullet points - not just a raw list of facts strung together.
- Reproduce named entities (eponyms, staging systems, classifications) exactly as given.
- If the format is "Comparison Table", render an actual Markdown table, not prose.
- If the format is "Process/Mechanism Flowchart", render an actual numbered step sequence.
- Do not invent examples, numbers, or facts beyond what's in the source data above.

Output ONLY the Markdown notes for this topic - no preamble, no commentary, no code fences.`;
}

export type GenerateNotesOutput = {
  topics?: { name: string; markdown: string; depth: number }[];
  error?: string;
};

async function renderOneTopic(chapterTitle: string, subjectName: string, topic: any, forceVertex?: boolean, useGeminiNative?: boolean): Promise<string> {
  const formats = allTemplatesForPrompt(subjectName);
  const formatName = topic.suggestedFormat || formats[0].name;
  const match = formats.find((f) => f.name === formatName) || formats[0];

  const topicJson = JSON.stringify(topic, null, 2);
  const prompt = buildTopicPrompt(chapterTitle, subjectName, topicJson, match.name, match.sections);

  const MAX_ATTEMPTS = 2;
  let lastError = '';
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const { content: raw } = useGeminiNative
        ? await callGeminiNative([{ role: 'user', content: prompt }], 3000)
        : await callAIWithProvider([{ role: 'user', content: prompt }], 3000, forceVertex);
      if (raw && raw.trim().length > 20) return tryParseText(raw);
      lastError = 'Empty or too-short response';
    } catch (err: any) {
      lastError = err.message || 'Unknown error';
    }
  }
  return `## ${topic.name}\n\n*(Notes generation failed for this topic after retries: ${lastError})*`;
}

/**
 * Generates notes as a separate entry per topic AND every nested subtopic (recursively,
 * depth-first) - a topic tree with real subtopics previously lost all subtopic content
 * silently, since only top-level topics were rendered. Each entry carries its depth so
 * the topic-list page can show proper indentation/hierarchy.
 */
export async function generateChapterNotes(knowledge: ChapterKnowledge, forceVertex?: boolean, useGeminiNative?: boolean): Promise<GenerateNotesOutput> {
  if (!knowledge.topics?.length) return { error: 'Chapter knowledge has no topics to render.' };

  const topics: { name: string; markdown: string; depth: number }[] = [];

  async function walk(topicList: any[], depth: number) {
    for (const topic of topicList) {
      const rendered = await renderOneTopic(knowledge.chapterTitle, knowledge.subjectName || '', topic, forceVertex, useGeminiNative);
      topics.push({ name: topic.name, markdown: rendered, depth });
      if (topic.subtopics?.length) {
        await walk(topic.subtopics, depth + 1);
      }
    }
  }

  await walk(knowledge.topics, 0);
  return { topics };
}
