'use server';
import { callAI } from '@/ai/genkit';

export type TextbookSource = {
  textbookTitle: string;
  chapterTitle: string;
  text: string;
};

export type GenerateFromTextbookInput = {
  sources: TextbookSource[];
  questionsRaw: string;
  subject: string;
  chapter: string;
  sectionType: 'long-essays' | 'short-essays' | 'short-answers';
};

export type GenerateFromTextbookOutput = {
  html: string;
  error?: string;
};

// Rough safety cap so we don't blow past a reasonable prompt size across multiple sources
const MAX_CHARS_PER_SOURCE = 60000;

function buildPrompt(input: GenerateFromTextbookInput): string {
  const sectionLabel = input.sectionType === 'long-essays' ? 'Long Essay' : input.sectionType === 'short-essays' ? 'Short Essay' : 'Short Answer';

  const sourcesBlock = input.sources.map((s, i) => {
    const truncated = s.text.length > MAX_CHARS_PER_SOURCE ? s.text.slice(0, MAX_CHARS_PER_SOURCE) + '\n[...excerpt truncated...]' : s.text;
    return `--- SOURCE ${i + 1}: "${s.textbookTitle}", Chapter: "${s.chapterTitle}" ---\n${truncated}`;
  }).join('\n\n');

  return `You are answering exam questions strictly using the textbook excerpt(s) provided below - you must NOT use any outside knowledge, even if you know more about the topic from your own training. If the excerpts don't contain enough information to fully answer a question, answer as completely as the excerpts allow and note briefly that the source material doesn't cover certain aspects, rather than filling gaps from memory.

Subject: ${input.subject}
Chapter: ${input.chapter}
Section: ${sectionLabel}

TEXTBOOK EXCERPT(S):
${sourcesBlock}

QUESTIONS TO ANSWER (answer ALL of them, in order):
${input.questionsRaw}

TASK:
1. For each question, write a complete answer using ONLY facts, mechanisms, and details present in the excerpt(s) above.
2. Organize each answer into clean HTML using headings (h4), paragraphs (p), lists (ul/ol), and TABLES where the content naturally has structure. If the excerpt presents information as a comparison, classification, or side-by-side listing (e.g. "Table 3.2: Classification of..."), reproduce it as a proper HTML table using <table><thead><tr><th>...</th></tr></thead><tbody><tr><td>...</td></tr></tbody></table> - preserve the actual rows and columns from the source, do not flatten a table into a plain list.
3. FLOWCHART DETECTION: if the excerpt describes a sequential process or pathway (e.g. "Factor X -> Prothrombin -> Thrombin -> Fibrin", or numbered steps of a cascade or cycle), render that specific part as a flowchart instead of a plain list, using this structure:
<div class="qa-flowchart">
  <div class="qa-flow-step">Step text here</div>
  <div class="qa-flow-step">Next step text here</div>
</div>
Only include the step text itself in each qa-flow-step div - no arrows or numbers, those are added by styling. If the process is described as a CYCLE that repeats back to the start, add data-cycle="true" to the outer qa-flowchart div. Only use this for genuine sequential processes described with clear steps - not for normal lists.
4. If a question in the input has a repeat-frequency bracket like "[asked 3x: 2015, 2018, 2022]", extract it into a separate qa-repeat span and remove the bracket text from the visible question.
5. Number the questions sequentially starting from 1.
6. Output ONLY the following HTML structure, repeated for each question - no markdown fences, no commentary:

<div class="qa-item">
  <div class="qa-question">
    <span class="qa-number">1.</span>
    Question text here
    <span class="qa-repeat">Asked 3 times - 2015, 2018, 2022</span>
  </div>
  <div class="qa-answer">
    <h4>Section heading if applicable</h4>
    <p>...</p>
  </div>
</div>

Output raw HTML only. No markdown fences. No preamble or closing remarks.`
}

export async function generateFromTextbook(input: GenerateFromTextbookInput): Promise<GenerateFromTextbookOutput> {
  if (!input.questionsRaw.trim()) {
    return { html: '', error: 'No questions provided.' }
  }
  if (!input.sources.length) {
    return { html: '', error: 'No textbook source excerpts provided.' }
  }

  try {
    const prompt = buildPrompt(input)
    const raw = await callAI([{ role: 'user', content: prompt }], 7000)
    if (!raw) return { html: '', error: 'Empty response from AI model' }

    let clean = raw.replace(/```html|```/g, '').trim()

    if (!clean.includes('qa-item')) {
      return { html: '', error: 'AI response did not contain the expected qa-item structure. Try again, or try fewer questions per batch.' }
    }

    return { html: clean }
  } catch (err: any) {
    return { html: '', error: err.message || 'Unknown error during generation' }
  }
}
