'use server';
import { callAI } from '@/ai/genkit';

export type CaseOption = {
  id: string;
  label: string;
  outcome: 'optimal' | 'acceptable' | 'unsafe' | 'wrong';
  points: number;
  feedback: string;
};

export type CaseStage = {
  id: string;
  type: 'history' | 'examination' | 'investigation' | 'diagnosis' | 'management';
  prompt: string;
  options: CaseOption[];
};

export type Flashcard = { front: string; back: string };

export type ClinicalCase = {
  title: string;
  difficulty: 'easy' | 'medium' | 'hard';
  stem: string;
  stages: CaseStage[];
  finalDiagnosis: string;
  keyLearnings: string[];
  pitfalls: string[];
  flashcards: Flashcard[];
};

export type GenerateCaseInput = {
  subject: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
};

export type GenerateCaseOutput = {
  case?: ClinicalCase;
  error?: string;
};

function buildPrompt(subject: string, topic: string, difficulty: string): string {
  return `You are an expert medical educator building an interactive clinical-reasoning case for MBBS students in India preparing for NEET-PG/INICET.

Subject: ${subject}
Topic: ${topic}
Difficulty: ${difficulty}

Build ONE realistic patient case as a sequence of decision stages, simulating real clinical reasoning (not a plain MCQ). The player reads an opening scenario, then at each stage picks one option from several plausible choices representing real clinical decisions (what to ask, what to examine, what test to order, what the diagnosis is, how to manage). Each option must be graded:
- "optimal": the best real-world choice, points 8-10
- "acceptable": a reasonable but suboptimal choice, points 3-6
- "unsafe": a choice that could harm the patient or cause a missed diagnosis, points -5 to -10
- "wrong": simply incorrect/irrelevant, points 0

Structure exactly 5 stages in this order: "history" (what to ask next), "examination" (what to check), "investigation" (what test to order), "diagnosis" (what is the most likely diagnosis), "management" (what to do next). Each stage must have 3-4 options with realistic feedback text explaining the clinical reasoning for why that option is optimal/acceptable/unsafe/wrong.

After the stages, provide the confirmed final diagnosis, 3-5 concise key learning points, 2-3 common pitfalls students make with this presentation, and 3-4 flashcards (front = question/prompt, back = concise answer) for spaced review.

Respond ONLY with valid JSON, no markdown, no extra text, no trailing commas, in this exact shape:
{
  "title": "short case title, e.g. '45-year-old with chest pain'",
  "difficulty": "${difficulty}",
  "stem": "2-4 sentence opening scenario: age, sex, presenting complaint, brief context",
  "stages": [
    {
      "id": "stage-1",
      "type": "history",
      "prompt": "question posed to the player at this stage",
      "options": [
        { "id": "opt-1", "label": "short option text", "outcome": "optimal", "points": 10, "feedback": "why this is correct/best" }
      ]
    }
  ],
  "finalDiagnosis": "...",
  "keyLearnings": ["...", "..."],
  "pitfalls": ["...", "..."],
  "flashcards": [{ "front": "...", "back": "..." }]
}

Rules:
- Exactly 5 stages in the order: history, examination, investigation, diagnosis, management
- Each stage: 3-4 options, ids unique within the case (stage-1..stage-5, opt-1..opt-N)
- Points must be integers matching the outcome ranges above
- CRITICAL - NO SPOILERS: the "title" and "stem" must describe only the patient's age, sex, presenting complaint, and basic context. They must NEVER name, hint at, or imply the diagnosis or topic. A player reading only the title and stem should have no way to guess the diagnosis in advance - that is the whole point of the case.
- Output must be complete, valid JSON - do not truncate`;
}

export async function generateClinicalCase(input: GenerateCaseInput): Promise<GenerateCaseOutput> {
  const prompt = buildPrompt(input.subject, input.topic, input.difficulty);

  try {
    const raw = await callAI([{ role: 'user', content: prompt }], 4000);
    if (!raw) return { error: 'Empty response from AI model' };

    let clean = raw.replace(/```json|```/g, '').trim();
    const firstBrace = clean.indexOf('{');
    const lastBrace = clean.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      clean = clean.slice(firstBrace, lastBrace + 1);
    }

    const parsed = JSON.parse(clean);
    if (!parsed.stages || !Array.isArray(parsed.stages) || parsed.stages.length === 0) {
      return { error: 'AI response was missing valid stages' };
    }
    return { case: parsed as ClinicalCase };
  } catch (err: any) {
    return { error: err.message || 'Unknown error during case generation' };
  }
}
