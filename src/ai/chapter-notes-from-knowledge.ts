'use server';
import { callGeminiNative } from '@/ai/genkit';

// Two-stage generation, purely from the model's own trained medical knowledge -
// no textbook PDF, no chapterKnowledge extraction dependency. Stage 1 asks for a
// topic breakdown; stage 2 writes each topic's notes independently (parallelized,
// same pattern as chapter-notes-generator.ts) so one slow/failed topic doesn't
// block the rest.

function tryParseJson(raw: string): any | null {
  const cleaned = raw.replace(/^```[a-zA-Z]*\n?/, '').replace(/```\s*$/, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf('[');
    const end = cleaned.lastIndexOf(']');
    if (start === -1 || end === -1 || end <= start) return null;
    try {
      return JSON.parse(cleaned.slice(start, end + 1));
    } catch {
      return null;
    }
  }
}

function tryParseText(raw: string): string {
  return raw.replace(/^```[a-zA-Z]*\n?/, '').replace(/```\s*$/, '').trim();
}

export type GeneratedTopic = { name: string; markdown: string; depth: number };
export type GenerateFromKnowledgeOutput = { topics?: GeneratedTopic[]; error?: string };

const TOPIC_LIST_PROMPT = (subjectName: string, chapterTitle: string) => `You are an expert Indian MBBS faculty member planning a revision-notes chapter for the topic "${chapterTitle}" in ${subjectName}, for an Indian medical undergraduate (following the depth, scope and emphasis typical of standard Indian MBBS textbooks for this subject, and the National Medical Commission's competency-based undergraduate curriculum for MBBS).

Break this chapter down into the logical sequence of topics a student should study, in teaching order (not alphabetical). Use the granularity of a coaching-institute (e.g. Marrow-style) revision notes chapter - typically 4 to 10 topics, each a coherent, exam-relevant unit (not too broad, not trivially small).

Return ONLY a JSON array of topic name strings, in study order, no commentary, no markdown fences. Example shape: ["Topic One", "Topic Two", "Topic Three"]`;

const TOPIC_NOTES_PROMPT = (subjectName: string, chapterTitle: string, topicName: string) => `You are writing ONE topic's section of colorful, high-yield revision notes for Indian MBBS students, for the topic "${topicName}" (part of the chapter "${chapterTitle}", ${subjectName}). Write from your own medical knowledge, at the depth and scope typically covered in standard Indian MBBS textbooks for this subject and the NMC competency-based curriculum.

FORMAT RULES - follow exactly:
1. Start with a level-2 heading (##) naming the topic.
2. Write dense, punchy bullet points and short paragraphs - NOT long prose. Bold (**text**) every key term, named structure, drug name, or numeric value a student must memorize.
3. Wherever there is a natural sequential process, pathway, or mechanism (e.g. a physiological pathway, a diagnostic algorithm, a drug mechanism), render it as a flow block using EXACTLY this custom syntax (this is not real Markdown - a renderer parses it specially, follow the syntax precisely):

\`\`\`flow
Branch: optional label for this branch (omit the "Branch:" line entirely if there is only one branch)
Step one text
Step two text
Step three text
\`\`\`

   - Each line inside the fence (other than a "Branch:" line) becomes one box in a downward arrow chain.
   - To show branching (e.g. two pathways diverging from a shared point, or comparing parallel processes), include multiple "Branch:" groups separated by a single blank line within the SAME flow block - they render side by side.
   - Use at least one flow block if the topic has any process, pathway, cycle, or mechanism - this is a core part of the format, not optional.
4. Wherever the topic naturally involves comparing 2 or more named things across shared attributes (e.g. comparing conditions, drugs, structures), use a real Markdown table.
5. Where there's a classic mnemonic, include it clearly under a "**Mnemonic:**" line.
6. End the topic with 2 to 4 self-test questions using EXACTLY this custom syntax:

\`\`\`quiz
Q: question text
A: answer text
Q: question text
A: answer text
\`\`\`

   Questions should test recall of the specific facts/values/names just covered in this topic, answerable in one short line.
7. Write everything in plain text/Unicode only - never LaTeX or math notation (no $...$, no \\rightarrow, no \\mu, no \\text{}). Use the actual symbol directly, e.g. "→" not "$\\rightarrow$", and "μm" not "$\\mu\\text{m}$".
8. Do not invent fake statistics or fabricate specific study citations - stated facts should reflect genuine, standard medical knowledge.

Output ONLY the Markdown for this one topic - no preamble, no commentary, no outer code fences around the whole response.`;

async function generateTopicList(subjectName: string, chapterTitle: string): Promise<string[] | null> {
  const prompt = TOPIC_LIST_PROMPT(subjectName, chapterTitle)
  const MAX_ATTEMPTS = 2
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const { content: raw } = await callGeminiNative([{ role: 'user', content: prompt }], 800)
      const parsed = tryParseJson(raw)
      if (Array.isArray(parsed) && parsed.every((t) => typeof t === 'string') && parsed.length > 0) {
        return parsed
      }
    } catch {
      // retry
    }
  }
  return null
}

async function generateOneTopicNotes(subjectName: string, chapterTitle: string, topicName: string): Promise<string> {
  const prompt = TOPIC_NOTES_PROMPT(subjectName, chapterTitle, topicName)
  const MAX_ATTEMPTS = 2
  let lastError = ''
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const { content: raw } = await callGeminiNative([{ role: 'user', content: prompt }], 3000)
      if (raw && raw.trim().length > 20) {
        return tryParseText(raw)
      }
      lastError = 'Empty or too-short response'
    } catch (err: any) {
      lastError = err.message || 'Unknown error'
    }
  }
  return `## ${topicName}\n\n*(Notes generation failed for this topic after retries: ${lastError})*`
}

export async function generateChapterNotesFromKnowledge(subjectName: string, chapterTitle: string): Promise<GenerateFromKnowledgeOutput> {
  const topicNames = await generateTopicList(subjectName, chapterTitle)
  if (!topicNames) return { error: 'Could not generate a topic breakdown for this chapter.' }

  const results: GeneratedTopic[] = new Array(topicNames.length)
  const CONCURRENCY = 4
  let nextIndex = 0
  async function worker() {
    while (true) {
      const i = nextIndex++
      if (i >= topicNames!.length) return
      const markdown = await generateOneTopicNotes(subjectName, chapterTitle, topicNames![i])
      results[i] = { name: topicNames![i], markdown, depth: 0 }
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, topicNames.length) }, () => worker()))

  return { topics: results }
}
