import { callGeminiNative } from '@/ai/genkit';

// Every well-formed topic (per chapter-notes-from-knowledge.ts's format rules) ends
// with a closed ```quiz ... ``` fence of 2-4 self-test questions. A response cut off
// by the token cap will almost always be missing that block entirely, or leave some
// earlier code fence (```flow or a table) unclosed - both are reliable truncation
// signals without needing to guess at prose completeness.
export function looksTruncated(markdown: string): boolean {
  if (!markdown || markdown.trim().length < 30) return true
  const fenceCount = (markdown.match(/```/g) || []).length
  if (fenceCount % 2 !== 0) return true // an unclosed code fence - definitely mid-block
  const hasClosedQuiz = /```quiz[\s\S]*?```/.test(markdown)
  if (!hasClosedQuiz) return true
  const trimmed = markdown.trimEnd()
  const lastChar = trimmed[trimmed.length - 1]
  if (!/[.!?:)\]}`]/.test(lastChar)) return true
  return false
}

const CONTINUE_PROMPT = (subjectName: string, chapterTitle: string, topicName: string, partial: string) => `You are continuing a topic's revision notes that were cut off mid-way through generation, for Indian MBBS students - topic "${topicName}" (part of the chapter "${chapterTitle}", ${subjectName}).

Here is everything already written for this topic, exactly as it was cut off:

--- BEGIN EXISTING TEXT ---
${partial}
--- END EXISTING TEXT ---

Continue EXACTLY from where it stops. Do NOT repeat any earlier content, do NOT restart the heading, do NOT summarize what came before - pick up mid-sentence/mid-bullet/mid-block if that's where it cut off, and write only the remaining new content.

Follow these format rules for anything you add from here on:
1. Dense, punchy bullet points and short paragraphs - NOT long prose. Bold (**text**) every key term, named structure, drug name, or numeric value a student must memorize.
2. If a process/pathway/mechanism section was left unfinished (an open \`\`\`flow fence with no closing \`\`\`), finish it using EXACTLY this custom syntax:
\`\`\`flow
Branch: optional label for this branch (omit the "Branch:" line entirely if there is only one branch)
Step one text
Step two text
\`\`\`
3. Where there's a classic mnemonic still to cover, include it under a "**Mnemonic:**" line.
4. The topic MUST end with 2 to 4 self-test questions using EXACTLY this custom syntax (add this now if it's missing entirely):
\`\`\`quiz
Q: question text
A: answer text
Q: question text
A: answer text
\`\`\`
5. Plain text/Unicode only - never LaTeX or math notation (no $...$, no \\rightarrow, no \\mu). Use the actual symbol directly, e.g. "→" not "$\\rightarrow$".

Output ONLY the continuation text (what comes after the existing text above) - no preamble, no commentary, no repeated heading, no outer code fences around your whole response.`

export async function continueTruncatedTopic(
  subjectName: string, chapterTitle: string, topicName: string, partialMarkdown: string
): Promise<{ markdown: string; stillTruncated: boolean; error?: string }> {
  const prompt = CONTINUE_PROMPT(subjectName, chapterTitle, topicName, partialMarkdown)
  const MAX_ATTEMPTS = 2
  let lastError = ''
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const { content: raw } = await callGeminiNative([{ role: 'user', content: prompt }], 9000, 1024)
      if (raw && raw.trim().length > 5) {
        const cleanContinuation = raw.replace(/^```[a-zA-Z]*\n?/, '').replace(/```\s*$/, '').trim()
        const merged = partialMarkdown.trimEnd() + '\n' + cleanContinuation
        return { markdown: merged, stillTruncated: looksTruncated(merged) }
      }
      lastError = 'Empty or too-short response'
    } catch (err: any) {
      lastError = err.message || 'Unknown error'
    }
  }
  return { markdown: partialMarkdown, stillTruncated: true, error: lastError }
}
