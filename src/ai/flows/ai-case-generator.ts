'use server';
import { callAI } from '@/ai/genkit';

export type CaseOption = {
  id: string;
  label: string;
  outcome: 'optimal' | 'acceptable' | 'unsafe' | 'wrong';
  points: number;
  feedback: string;
  finding?: string;
};

export type CaseStage = {
  id: string;
  type: 'history' | 'examination' | 'investigation' | 'diagnosis' | 'management';
  prompt: string;
  options: CaseOption[];
};

export type Flashcard = { front: string; back: string };

export type CaseVitals = { hr: number; bp: string; rr: number; temp: number; spo2: number };
export type CasePatient = { name: string; age: number; ageUnit?: 'years' | 'months' | 'days'; sex: 'M' | 'F'; occupation?: string; place?: string };

export type ClinicalCase = {
  title: string;
  difficulty: 'easy' | 'medium' | 'hard';
  stem: string;
  stages: CaseStage[];
  finalDiagnosis: string;
  keyLearnings: string[];
  pitfalls: string[];
  flashcards: Flashcard[];
  patient?: CasePatient;
  setting?: string;
  region?: string;
  appearance?: string;
  vitals?: CaseVitals;
  rhythm?: string;
  consultantNote?: string;
  topic?: string;
};

export type GenerateCaseInput = {
  subject: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  setting?: string;
};

export type GenerateCaseOutput = {
  case?: ClinicalCase;
  error?: string;
};

const SETTINGS = ['emergency', 'opd', 'ward', 'icu', 'ot', 'labour', 'community', 'paeds', 'forensic'];
const REGIONS = ['chest', 'abdomen', 'head', 'limb', 'skin', 'eye', 'ear', 'throat', 'pelvis', 'general'];
const RHYTHMS = ['sinus', 'af', 'st-elevation', 'vt', 'brady', 'tachy'];
const LOOKS = ['comfortable', 'distressed', 'breathless', 'drowsy', 'in-pain'];

function buildPrompt(subject: string, topic: string, difficulty: string, setting?: string): string {
  return `You are an expert medical educator building an interactive "Ward Round" clinical-reasoning case for MBBS students in India preparing for university exams and NEET-PG/INICET. Use Indian context (names, places, drugs, protocols such as NHM/ICMR/Indian guidelines where relevant).

Subject: ${subject}
Topic: ${topic}
Difficulty: ${difficulty}
${setting ? `Setting: ${setting}` : ''}

Build ONE realistic patient case as 5 decision stages. At each stage the player picks ONE option. Outcomes:
- "optimal": best real-world choice, points 8-10
- "acceptable": reasonable but suboptimal, points 3-6
- "unsafe": could harm the patient or miss the diagnosis, points -5 to -10
- "wrong": simply incorrect or irrelevant, points 0

Every option has a "finding": what the player learns/sees after choosing it, written as it would appear in a real chart (the patient's reply for history, the sign for examination, the report values for investigation, the senior's reaction for diagnosis, the patient's response for management). Findings for wrong/irrelevant options are brief and unhelpful ("Normal", "No new information"). Findings for optimal options carry the useful clinical information (with realistic numbers/units).

Respond ONLY with valid JSON, no markdown, no trailing commas, in exactly this shape:
{
  "title": "short NON-revealing title, e.g. '45-year-old with chest pain'",
  "difficulty": "${difficulty}",
  "stem": "2-4 sentence opening scenario: age, sex, presenting complaint, context",
  "patient": { "name": "Indian first name + surname", "age": 45, "ageUnit": "years", "sex": "M", "occupation": "short", "place": "city/town/village" },
  "setting": "one of: ${SETTINGS.join(' | ')}",
  "region": "main body region affected, one of: ${REGIONS.join(' | ')}",
  "appearance": "one of: ${LOOKS.join(' | ')}",
  "vitals": { "hr": 110, "bp": "100/60", "rr": 22, "temp": 37.2, "spo2": 94 },
  "rhythm": "one of: ${RHYTHMS.join(' | ')} (the ECG monitor rhythm that fits the case)",
  "stages": [
    {
      "id": "stage-1",
      "type": "history",
      "prompt": "question posed to the player at this stage",
      "options": [
        { "id": "opt-1", "label": "short option text", "outcome": "optimal", "points": 10, "feedback": "why this is right/wrong", "finding": "what the player sees after choosing" }
      ]
    }
  ],
  "finalDiagnosis": "...",
  "consultantNote": "2-3 sentences in the voice of a friendly senior consultant summarising the ideal approach",
  "keyLearnings": ["3-5 concise points"],
  "pitfalls": ["2-3 common student mistakes"],
  "flashcards": [{ "front": "...", "back": "..." }]
}

Rules:
- Exactly 5 stages in order: history, examination, investigation, diagnosis, management
- Each stage 3-4 options; ids unique (stage-1..stage-5, opt-1..opt-N); exactly one "optimal" per stage
- Points integers matching outcome ranges
- Vitals must be realistic for the baseline presentation of this patient
- CRITICAL - NO SPOILERS: "title" and "stem" must describe only age, sex, presenting complaint and basic context. Never name, hint at or imply the diagnosis or topic.
- Medically accurate, exam-relevant, 3-4 flashcards
- Output must be complete valid JSON - do not truncate`;
}

function normalize(p: any, input: GenerateCaseInput): ClinicalCase {
  const num = (v: any, d: number) => (Number.isFinite(Number(v)) ? Number(v) : d);
  const pick = (v: any, list: string[], d: string) => (typeof v === 'string' && list.includes(v.toLowerCase()) ? v.toLowerCase() : d);
  const v = p.vitals || {};
  p.vitals = { hr: num(v.hr, 88), bp: typeof v.bp === 'string' ? v.bp : '120/80', rr: num(v.rr, 16), temp: num(v.temp, 37), spo2: num(v.spo2, 98) };
  p.setting = pick(p.setting, SETTINGS, input.setting && SETTINGS.includes(input.setting) ? input.setting : 'ward');
  p.region = pick(p.region, REGIONS, 'general');
  p.rhythm = pick(p.rhythm, RHYTHMS, 'sinus');
  p.appearance = pick(p.appearance, LOOKS, 'distressed');
  const pt = p.patient || {};
  p.patient = { name: pt.name || 'Patient', age: num(pt.age, 40), ageUnit: pt.ageUnit || 'years', sex: pt.sex === 'F' ? 'F' : 'M', occupation: pt.occupation || '', place: pt.place || '' };
  p.stages = (p.stages || []).map((s: any, i: number) => ({
    ...s,
    id: s.id || `stage-${i + 1}`,
    options: (s.options || []).map((o: any, j: number) => ({ ...o, id: o.id || `opt-${j + 1}`, points: num(o.points, 0), finding: o.finding || '' })),
  }));
  p.topic = input.topic;
  return p as ClinicalCase;
}

export async function generateClinicalCase(input: GenerateCaseInput): Promise<GenerateCaseOutput> {
  const prompt = buildPrompt(input.subject, input.topic, input.difficulty, input.setting);

  try {
    const raw = await callAI([{ role: 'user', content: prompt }], 8000);
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
    return { case: normalize(parsed, input) };
  } catch (err: any) {
    return { error: err.message || 'Unknown error during case generation' };
  }
}
