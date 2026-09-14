'use server';
import { callAIWithProvider, callGeminiNative } from '@/ai/genkit';
import type { ChapterKnowledge } from '@/ai/chapter-knowledge';
import { allTemplatesForPrompt } from '@/ai/subject-templates';

function tryParseText(raw: string): string {
  return raw.replace(/^```[a-zA-Z]*\n?/, '').replace(/```\s*$/, '').trim();
}

function buildTopicPrompt(chapterTitle: string, subjectName: string, topicJson: string, format: { name: string; sections: string[]; renderAs?: 'subheadings' | 'table' | 'steps' }): string {
  const renderAs = format.renderAs || 'subheadings'

  let structureInstruction: string
  if (renderAs === 'table') {
    structureInstruction = `- Render this topic as ONE single Markdown table with columns in this order: ${format.sections.join(' | ')}. Use the actual real names being compared (e.g. real disease/drug names from the source data) as column headers in place of placeholder labels like "Entity A" - never leave a literal placeholder in the output. Do NOT add a separate subheading for each column name - the table's own header row is the only place those names should appear.`
  } else if (renderAs === 'steps') {
    structureInstruction = `- Render this topic as ONE single numbered list (1. 2. 3. ...), one step per list item, weaving the step name and its detail into a clear sentence per item. Do NOT add a separate subheading for each step.`
  } else {
    structureInstruction = `- Use a top-level heading with the topic name, then a subheading per format section, in this order: ${format.sections.join(' -> ')}. Skip a section only if the source data genuinely has nothing for it - do not pad with filler.`
  }

  return `You are writing ONE topic's section of student-facing study notes for "${chapterTitle}" (${subjectName}).

SOURCE DATA (already extracted and verified from the textbook - use ONLY this, do not add outside facts):
${topicJson}

FORMAT TO USE: "${format.name}"

TASK: Write clean, well-presented Markdown notes for this ONE topic:
${structureInstruction}
- Write in clear, exam-ready prose and bullet points - not just a raw list of facts strung together.
- Reproduce named entities (eponyms, staging systems, classifications) exactly as given.
- Do not invent examples, numbers, or facts beyond what's in the source data above.
- Write everything in plain text/Unicode only - never use LaTeX or math notation (no $...$, no \\rightarrow, no \\mu, no \\text{}, etc.). Use the actual symbol directly instead, e.g. "→" not "$\\rightarrow$", and "μm" not "$\\mu\\text{m}$".

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
  const prompt = buildTopicPrompt(chapterTitle, subjectName, topicJson, match);

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

function flattenTopics(topicList: any[], depth: number, out: { topic: any; depth: number }[]) {
  for (const topic of topicList) {
    out.push({ topic, depth });
    if (topic.subtopics?.length) {
      flattenTopics(topic.subtopics, depth + 1, out);
    }
  }
}

export async function generateChapterNotes(knowledge: ChapterKnowledge, forceVertex?: boolean, useGeminiNative?: boolean): Promise<GenerateNotesOutput> {
  if (!knowledge.topics?.length) return { error: 'Chapter knowledge has no topics to render.' };

  const flat: { topic: any; depth: number }[] = [];
  flattenTopics(knowledge.topics, 0, flat);

  const results: { name: string; markdown: string; depth: number }[] = new Array(flat.length);

  const CONCURRENCY = 4;
  let nextIndex = 0;
  async function worker() {
    while (true) {
      const i = nextIndex++;
      if (i >= flat.length) return;
      const { topic, depth } = flat[i];
      const rendered = await renderOneTopic(knowledge.chapterTitle, knowledge.subjectName || '', topic, forceVertex, useGeminiNative);
      results[i] = { name: topic.name, markdown: rendered, depth };
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, flat.length) }, () => worker()));

  return { topics: results };
}
