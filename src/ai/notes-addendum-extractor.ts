'use server';
import { callAIWithProvider } from '@/ai/genkit';

/**
 * Closes the loop the other direction from grounded-answer-generator.ts: that generator
 * is now allowed to fill gaps in a chapter's notes with the model's own accurate medical
 * knowledge when writing a long answer. This flow catches whatever it added that wasn't
 * already in the notes, and hands back a small addition per topic so the CALLER can fold
 * it back into that chapter's actual notes - so the extra knowledge a student's long
 * answers benefited from becomes a permanent part of their notes too, not something that
 * only ever lived inside one generated answer.
 */

export type NotesAddendum = { topicName: string; additionMarkdown: string };

function safeParseJsonArray(raw: string): any[] {
  const jsonMatch = raw.match(/\[[\s\S]*\]/);
  if (!jsonMatch) return [];
  try {
    const parsed = JSON.parse(jsonMatch[0]);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function extractNotesAddendum(
  question: string,
  answer: string,
  topics: { name: string; markdown: string }[],
  subjectName: string
): Promise<NotesAddendum[]> {
  if (!answer || topics.length === 0) return [];

  const topicsBlock = topics.map((t) => `### ${t.name}\n${t.markdown}`).join('\n\n');
  const topicNames = topics.map((t) => `"${t.name}"`).join(', ');

  const prompt = `You are auditing a generated exam answer against a student's existing notes, to catch supplementary medical facts the answer includes that are NOT yet written in the notes.

SUBJECT: ${subjectName}

EXISTING NOTES (topics the student already has for this chapter):
${topicsBlock}

QUESTION: ${question}

GENERATED ANSWER:
${answer}

TASK: Compare the answer against the notes above. Identify any genuinely NEW factual content in the answer - facts, mechanisms, classifications, numbers, or details - that is not already covered in the notes under any topic. Ignore anything that is just a restatement or light rewording of what the notes already say - only flag real additions.

For each piece of new information found, decide which EXISTING topic it belongs under (you MUST choose exactly one name from this list, verbatim: ${topicNames}), and write a short, clean Markdown addition (a sentence or two, or a short bullet list) suitable for appending directly to that topic's notes - written in the same factual, note-taking style as the existing notes, never as answer prose (do not write things like "the answer explains" or "as mentioned above").

If the answer added nothing genuinely new beyond the notes, return an empty array - this is the common case and is expected most of the time.

Respond with ONLY a JSON array, no other text, in this exact shape:
[{"topicName": "<one of the topic names above, verbatim>", "additionMarkdown": "<the new content to append>"}]`;

  try {
    const { content } = await callAIWithProvider([{ role: 'user', content: prompt }], 2000);
    const parsed = safeParseJsonArray(content);
    return parsed.filter(
      (item: any) =>
        item &&
        typeof item.topicName === 'string' &&
        typeof item.additionMarkdown === 'string' &&
        item.additionMarkdown.trim().length > 0
    );
  } catch {
    // Best-effort enrichment - a failure here must never affect the answer that was
    // already generated, only skip growing the notes for this one question.
    return [];
  }
}
