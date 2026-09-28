'use server';
import { callGeminiNative } from '@/ai/genkit';

// Generates one full OSCE-style clinical station from the model's own medical knowledge -
// no textbook dependency. Generated ONCE per station and saved to Firestore (osceStations
// collection) by the admin generator page; every student who attempts the station reuses
// the same cached JSON, so this expensive call never runs per-student, only per-station.

export type HistoryQA = { triggerQuestion: string; answer: string };
export type ExamFinding = { system: string; findings: string };
export type Investigation = { name: string; result: string };
export type ExaminerQuestion = { question: string; markingPoints: string[]; modelAnswer: string; timeSeconds: number };

export type OsceStation = {
  title: string;
  specialty: string;
  difficulty: 'easy' | 'medium' | 'hard';
  candidateStem: string;
  patient: { name: string; age: number; gender: string; chiefComplaint: string };
  readingTimeSeconds: number;
  consultationTimeSeconds: number;
  vitals: { temp: string; hr: string; bp: string; rr: string; spo2: string };
  historyQABank: HistoryQA[];
  examinationFindings: ExamFinding[];
  investigations: Investigation[];
  examinerQuestions: ExaminerQuestion[];
  provisionalDiagnosis: string;
  differentials: string[];
};

export type GenerateOsceStationOutput = { station?: OsceStation; error?: string };

function tryParseJson(raw: string): any | null {
  const cleaned = raw.replace(/^```[a-zA-Z]*\n?/, '').replace(/```\s*$/, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start === -1 || end === -1 || end <= start) return null;
    try {
      return JSON.parse(cleaned.slice(start, end + 1));
    } catch {
      return null;
    }
  }
}

const STATION_PROMPT = (subjectName: string, topic: string) => `You are an expert Indian medical faculty member writing ONE OSCE/AMC-style clinical station for the topic "${topic}" in ${subjectName}, at the level of an Indian MBBS final-year student / AMC clinical exam candidate.

Design a station where a candidate takes a focused history from a simulated patient, requests examination findings and investigations, and answers the examiner's questions - all against the clock, exactly like a real OSCE/AMC station.

Return ONLY a single JSON object, no commentary, no markdown fences, matching EXACTLY this shape:

{
  "title": "short station title",
  "specialty": "e.g. Cardiology",
  "difficulty": "easy" | "medium" | "hard",
  "candidateStem": "2-4 sentences: candidate's role, the setting, the patient, and the explicit task (take history, examine, investigate, present provisional diagnosis)",
  "patient": { "name": "string", "age": number, "gender": "male"|"female", "chiefComplaint": "one line" },
  "readingTimeSeconds": 90,
  "consultationTimeSeconds": 360,
  "vitals": { "temp": "e.g. 37.4 C", "hr": "e.g. 96/min regular", "bp": "e.g. 128/82 mmHg", "rr": "e.g. 18/min", "spo2": "e.g. 98% room air" },
  "historyQABank": [ { "triggerQuestion": "a plausible history question the candidate might ask, in plain natural phrasing", "answer": "the patient's natural spoken-style answer" } ],
  "examinationFindings": [ { "system": "e.g. Cardiovascular", "findings": "what the candidate finds if they examine this system" } ],
  "investigations": [ { "name": "e.g. ECG", "result": "the result text/description" } ],
  "examinerQuestions": [ { "question": "a question the examiner asks at the end, spoken aloud", "markingPoints": ["specific fact or reasoning step a full-marks answer must include"], "modelAnswer": "a concise ideal spoken answer", "timeSeconds": 60 } ],
  "provisionalDiagnosis": "the correct provisional diagnosis",
  "differentials": ["2-4 important differential diagnoses"]
}

Rules:
- historyQABank must have 18-28 entries covering: onset/duration, character/site/radiation (if pain), severity, aggravating/relieving factors, associated symptoms, relevant systems review, past medical/surgical history, drug history and allergies, family history, and social history (smoking, alcohol, occupation, ideas/concerns/expectations as relevant) - phrase each triggerQuestion the way a real candidate would actually ask it, in several different plausible phrasings where a topic could be asked multiple ways is not necessary, one natural phrasing per line item is enough.
- examinationFindings should cover 3-6 relevant systems/exams for this case (not every system - only what's clinically relevant).
- investigations should include 3-8 relevant tests with plausible, internally consistent results supporting the diagnosis.
- examinerQuestions should have 3-5 questions (e.g. provisional diagnosis + justification, key differential to exclude and why, initial management, a specific mechanism/pharmacology/anatomy point relevant to the case).
- Everything must be internally consistent (history, exam, investigations and diagnosis must all fit together) and reflect genuine standard clinical knowledge - do not fabricate implausible combinations.
- Write patient answers in natural first-person spoken style (not textbook style), since this text will be read aloud as the patient's voice.`;

export async function generateOsceStation(subjectName: string, topic: string): Promise<GenerateOsceStationOutput> {
  const prompt = STATION_PROMPT(subjectName, topic);
  const MAX_ATTEMPTS = 2;
  let lastError = '';
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const { content: raw } = await callGeminiNative([{ role: 'user', content: prompt }], 16000, 1024);
      const parsed = tryParseJson(raw);
      if (
        parsed &&
        typeof parsed.title === 'string' &&
        Array.isArray(parsed.historyQABank) && parsed.historyQABank.length > 0 &&
        Array.isArray(parsed.examinerQuestions) && parsed.examinerQuestions.length > 0
      ) {
        return { station: parsed as OsceStation };
      }
      lastError = `Model response was not a valid station JSON. Raw response: ${raw.slice(0, 300)}`;
    } catch (err: any) {
      lastError = err.message || 'Unknown error calling Gemini';
    }
  }
  return { error: lastError };
}
