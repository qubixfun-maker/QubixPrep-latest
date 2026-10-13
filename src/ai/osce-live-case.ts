'use server';
import { callGeminiNative } from '@/ai/genkit';

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

function stripQuotes(s: string): string {
  return s.trim().replace(/^["']+/, '').replace(/["']+$/, '').trim();
}

export type CaseBrief = {
  specialty: string;
  topic: string;
  patient: { name: string; age: number; gender: string; occupation: string; address: string; dateOfAdmission: string; dateOfExamination: string };
  chiefComplaint: string;
  hopi: string;
  negativeHistory: string[];
  pastHistory: string;
  familyHistory: string;
  personalHistory: string;
  generalPhysicalExam: string;
  localExamination: { inspection: string; palpation: string; percussion: string; auscultation: string };
  investigations: { name: string; result: string }[];
  provisionalDiagnosis: string;
  differentials: string[];
  managementPlan: string;
  imageSearchQuery: string;
};

export const TOTAL_VIVA_QUESTIONS = 4;

function caseBriefPrompt(specialty: string, topic: string): string {
  return `You are creating a single, complete, internally-consistent OSCE/clinical long-case for an Indian MBBS student, in the specialty "${specialty}", on the topic/condition "${topic}".

Invent one realistic patient and case, exactly as it would appear in a real Indian medical college clinical long-case examination. Be clinically accurate and internally consistent - vitals, history, exam findings, and investigations must all plausibly support the same diagnosis.

Return ONLY a JSON object, no commentary, no markdown fences, matching EXACTLY this shape:
{
  "specialty": "${specialty}",
  "topic": "${topic}",
  "patient": {
    "name": "a plausible Indian patient name",
    "age": <number>,
    "gender": "Male" or "Female",
    "occupation": "...",
    "address": "a plausible Indian village/town/city and state",
    "dateOfAdmission": "a plausible recent date, e.g. 10/10/2026",
    "dateOfExamination": "1-3 days after dateOfAdmission"
  },
  "chiefComplaint": "the chief complaint(s) IN CHRONOLOGICAL ORDER exactly as the patient would state them, each with duration, e.g. 'Pain abdomen x 3 days, Fever x 2 days'",
  "hopi": "a detailed History of Present Illness narrative covering onset, duration, progression, aggravating and relieving factors, and character/site/radiation of pain if relevant, plus associated symptoms, written as a flowing clinical narrative the patient could plausibly describe when asked, following standard clinical history-taking practice",
  "negativeHistory": [<6 to 10 short strings, each a symptom the patient explicitly denies, relevant to this case, e.g. "No vomiting", "No hematuria", "No history of trauma" - drawn from a standard systemic review relevant to ruling out differentials for this case>],
  "pastHistory": "similar complaints in the past (or none), past surgical history, and presence/absence of diabetes mellitus and hypertension, as a short narrative",
  "familyHistory": "relevant family history as a short narrative, or 'No significant family history'",
  "personalHistory": "diet, appetite, bowel/bladder habits, sleep, and addictions (smoking/alcohol/tobacco) as a short narrative appropriate to age and context",
  "generalPhysicalExam": "general physical examination findings: build, nutrition, pallor, icterus, cyanosis, clubbing, lymphadenopathy, edema, and vitals (temperature, pulse, BP, respiratory rate, SpO2) as a short clinical narrative with plausible numeric vitals consistent with the diagnosis",
  "localExamination": {
    "inspection": "inspection findings relevant to the system/region involved in this case",
    "palpation": "palpation findings",
    "percussion": "percussion findings, or 'Not applicable to this examination' if genuinely not relevant to this system",
    "auscultation": "auscultation findings, or 'Not applicable to this examination' if genuinely not relevant"
  },
  "investigations": [<3 to 6 objects: {"name": "investigation name", "result": "the result, with plausible specific values/units where relevant"}>],
  "provisionalDiagnosis": "the single most likely diagnosis",
  "differentials": [<2 to 4 differential diagnosis strings>],
  "managementPlan": "a concise but specific management plan appropriate to this diagnosis (investigations to confirm, initial treatment, definitive treatment/procedure if relevant, and follow-up)",
  "imageSearchQuery": "a short (2-5 word) web image search query for a clinical photo related to this disease/condition"
}

Make the case specific, plausible, and fully internally consistent - a student who takes a thorough history and examination should be able to correctly arrive at "${topic}" as the diagnosis.`;
}

export type GenerateCaseBriefOutput = { brief?: CaseBrief; error?: string };

export async function generateCaseBrief(specialty: string, topic: string): Promise<GenerateCaseBriefOutput> {
  const MAX_ATTEMPTS = 2;
  let lastError = '';
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    try {
      const { content: raw } = await callGeminiNative(
        [{ role: 'user', content: caseBriefPrompt(specialty, topic) }],
        4000,
        1024,
        'gemini-2.5-pro'
      );
      const parsed = tryParseJson(raw);
      if (
        parsed &&
        parsed.patient &&
        typeof parsed.chiefComplaint === 'string' &&
        typeof parsed.hopi === 'string' &&
        Array.isArray(parsed.negativeHistory) &&
        Array.isArray(parsed.investigations) &&
        typeof parsed.provisionalDiagnosis === 'string'
      ) {
        return { brief: parsed as CaseBrief };
      }
      lastError = 'Generated case was missing required fields.';
    } catch (e: any) {
      lastError = e.message || 'Generation failed';
    }
  }
  return { error: lastError || 'Could not generate a case right now.' };
}

function inCharacterPrompt(brief: CaseBrief, transcript: string, utterance: string, language: string): string {
  return `You are playing a simulated clinical case for an Indian MBBS OSCE-style long-case exam. Respond as whichever role fits what the student just said:
- If they ask the PATIENT something (identification details, chief complaint, history, negative history, past/family/personal history), answer AS THE PATIENT, in first person, naturally and conversationally.
- If they request an EXAMINATION finding (general physical exam, inspection, palpation, percussion, auscultation, vitals) or an INVESTIGATION result, respond as a clinical narrator stating the finding/result directly and factually (not in first person).
- Stay strictly consistent with the hidden case ground truth below. Never reveal the diagnosis, differentials, or management plan, even if asked directly - if asked, deflect naturally in character.
- If asked something not explicitly covered by the ground truth, improvise a plausible, clinically consistent answer rather than saying you don't know.
- Respond ONLY in ${language}. Keep the reply conversational and concise (1-4 sentences) - this is spoken dialogue, not a report.

HIDDEN CASE GROUND TRUTH (never reveal diagnosis/differentials/management):
Patient: ${JSON.stringify(brief.patient)}
Chief complaint: ${brief.chiefComplaint}
HOPI: ${brief.hopi}
Negative history: ${brief.negativeHistory.join('; ')}
Past history: ${brief.pastHistory}
Family history: ${brief.familyHistory}
Personal history: ${brief.personalHistory}
General physical exam: ${brief.generalPhysicalExam}
Local examination - Inspection: ${brief.localExamination.inspection}
Local examination - Palpation: ${brief.localExamination.palpation}
Local examination - Percussion: ${brief.localExamination.percussion}
Local examination - Auscultation: ${brief.localExamination.auscultation}
Investigations: ${brief.investigations.map((i) => `${i.name}: ${i.result}`).join('; ')}

Conversation so far:
${transcript || '(nothing yet)'}

The student just said: "${utterance}"

Respond with ONLY the in-character reply text, nothing else - no labels, no quotes, no JSON.`;
}

export type InCharacterReplyOutput = { reply?: string; error?: string };

export async function generateInCharacterReply(brief: CaseBrief, transcript: string, utterance: string, language: string): Promise<InCharacterReplyOutput> {
  try {
    const { content: raw } = await callGeminiNative(
      [{ role: 'user', content: inCharacterPrompt(brief, transcript, utterance, language) }],
      400,
      0,
      'gemini-2.5-flash'
    );
    const reply = stripQuotes(raw);
    if (!reply) return { error: 'Empty reply' };
    return { reply };
  } catch (e: any) {
    return { error: e.message || 'Failed to generate reply' };
  }
}

function assessmentPrompt(brief: CaseBrief, transcript: string, studentPresentation: string, language: string): string {
  return `You are a senior clinical examiner grading an Indian MBBS student's OSCE long-case performance.

HIDDEN CASE GROUND TRUTH:
${JSON.stringify(brief)}

The student's full history-taking and examination conversation:
${transcript}

The student's final case presentation (their stated diagnosis, differentials, and management plan):
${studentPresentation || '(not provided)'}

Score the student out of 25 in each of these four areas, being fair but rigorous:
- historyScore: did they elicit the chief complaint, HOPI details, relevant negative history, and past/family/personal history thoroughly and in good order?
- examinationScore: did they perform a sensible general and local examination (inspection/palpation/percussion/auscultation as relevant)?
- diagnosisScore: how close is their stated provisional diagnosis and differentials to the ground truth?
- managementScore: how appropriate and specific is their management plan?

Then write "feedback": 3-5 sentences, spoken naturally as if a senior doctor were addressing the student directly after their presentation - praise what they did well, clearly state what was missing or incorrect and why it matters, and note anything they should have asked, examined, or concluded differently. This will be read aloud to the student by an avatar, so write it as natural spoken feedback, not a bullet list.

Return ONLY a JSON object, no commentary, no markdown fences, matching exactly:
{"historyScore": <0-25>, "examinationScore": <0-25>, "diagnosisScore": <0-25>, "managementScore": <0-25>, "feedback": "..."}

Respond in ${language}.`;
}

export type FinalAssessmentOutput = {
  assessment?: {
    historyScore: number; examinationScore: number; diagnosisScore: number; managementScore: number; totalScore: number;
    feedback: string; actualDiagnosis: string; actualDifferentials: string[]; actualManagement: string;
  };
  error?: string;
};

export async function generateFinalAssessment(brief: CaseBrief, transcript: string, studentPresentation: string, language: string): Promise<FinalAssessmentOutput> {
  try {
    const { content: raw } = await callGeminiNative(
      [{ role: 'user', content: assessmentPrompt(brief, transcript, studentPresentation, language) }],
      1200,
      512,
      'gemini-2.5-pro'
    );
    const parsed = tryParseJson(raw);
    if (!parsed || typeof parsed.historyScore !== 'number') {
      return { error: 'Could not generate the assessment.' };
    }
    const clamp = (n: any) => Math.max(0, Math.min(25, Math.round(Number(n) || 0)));
    const historyScore = clamp(parsed.historyScore);
    const examinationScore = clamp(parsed.examinationScore);
    const diagnosisScore = clamp(parsed.diagnosisScore);
    const managementScore = clamp(parsed.managementScore);
    return {
      assessment: {
        historyScore,
        examinationScore,
        diagnosisScore,
        managementScore,
        totalScore: historyScore + examinationScore + diagnosisScore + managementScore,
        feedback: typeof parsed.feedback === 'string' ? parsed.feedback : '',
        actualDiagnosis: brief.provisionalDiagnosis,
        actualDifferentials: brief.differentials,
        actualManagement: brief.managementPlan,
      },
    };
  } catch (e: any) {
    return { error: e.message || 'Failed to generate assessment' };
  }
}

function examinerChatPrompt(
  brief: CaseBrief,
  caseTranscript: string,
  studentPresentation: string,
  assessmentFeedback: string,
  chatTranscript: string,
  studentMessage: string,
  language: string
): string {
  return `You are a senior clinical examiner. You just gave an Indian MBBS student this spoken feedback on their long-case presentation:
"${assessmentFeedback}"

HIDDEN CASE GROUND TRUTH:
${JSON.stringify(brief)}

The student's history-taking and examination conversation:
${caseTranscript}

The student's case presentation:
${studentPresentation || '(not provided)'}

Your conversation with the student since giving feedback:
${chatTranscript || '(nothing yet)'}

The student just said: "${studentMessage}"

Respond as the examiner, directly and helpfully, in 2-4 sentences, staying in character as a supportive but rigorous senior doctor. Reference the real case facts where relevant. Respond ONLY in ${language}, with ONLY the spoken reply text - no labels, no quotes, no JSON.`;
}

export type ExaminerChatReplyOutput = { reply?: string; error?: string };

export async function generateExaminerChatReply(
  brief: CaseBrief,
  caseTranscript: string,
  studentPresentation: string,
  assessmentFeedback: string,
  chatTranscript: string,
  studentMessage: string,
  language: string
): Promise<ExaminerChatReplyOutput> {
  try {
    const { content: raw } = await callGeminiNative(
      [{ role: 'user', content: examinerChatPrompt(brief, caseTranscript, studentPresentation, assessmentFeedback, chatTranscript, studentMessage, language) }],
      350,
      0,
      'gemini-2.5-flash'
    );
    const reply = stripQuotes(raw);
    if (!reply) return { error: 'Empty reply' };
    return { reply };
  } catch (e: any) {
    return { error: e.message || 'Failed to generate reply' };
  }
}

function vivaTurnPrompt(
  brief: CaseBrief,
  caseTranscript: string,
  studentPresentation: string,
  vivaTranscript: string,
  studentAnswer: string,
  questionNumber: number,
  language: string
): string {
  const isFirst = !studentAnswer.trim();
  const isLast = questionNumber >= TOTAL_VIVA_QUESTIONS;
  const instruction = isFirst
    ? `Ask the FIRST viva question now - probe pathophysiology, differential diagnosis reasoning, relevant anatomy/pharmacology, or management rationale specific to this case. Go beyond what was already covered during history-taking.`
    : `The student just answered: "${studentAnswer}". Give a brief one-sentence reaction (correct / partially correct / incorrect), referencing the real facts of the case. ${
        isLast
          ? `This was the final question - after your reaction, give a short closing remark thanking the student for the viva. Do NOT ask another question.`
          : `Then ask viva question number ${questionNumber + 1} of ${TOTAL_VIVA_QUESTIONS}, again probing pathophysiology, differentials, anatomy/pharmacology, or management rationale not already covered.`
      }`;

  return `You are a strict but fair clinical examiner conducting a short oral viva (${TOTAL_VIVA_QUESTIONS} questions) on this case for an Indian MBBS student, after their long-case presentation.

HIDDEN CASE GROUND TRUTH:
${JSON.stringify(brief)}

The student's history-taking and examination conversation:
${caseTranscript}

The student's case presentation:
${studentPresentation || '(not provided)'}

Viva conversation so far (question ${questionNumber} of ${TOTAL_VIVA_QUESTIONS}):
${vivaTranscript || '(nothing yet - this is the first question)'}

${instruction}

Respond ONLY in ${language}, with ONLY the spoken message text - no labels, no quotes, no JSON.`;
}

export type VivaTurnOutput = { message?: string; error?: string };

export async function generateVivaTurn(
  brief: CaseBrief,
  caseTranscript: string,
  studentPresentation: string,
  vivaTranscript: string,
  studentAnswer: string,
  questionNumber: number,
  language: string
): Promise<VivaTurnOutput> {
  try {
    const { content: raw } = await callGeminiNative(
      [{ role: 'user', content: vivaTurnPrompt(brief, caseTranscript, studentPresentation, vivaTranscript, studentAnswer, questionNumber, language) }],
      350,
      0,
      'gemini-2.5-flash'
    );
    const message = stripQuotes(raw);
    if (!message) return { error: 'Empty reply' };
    return { message };
  } catch (e: any) {
    return { error: e.message || 'Failed to generate viva turn' };
  }
}

function vivaResultPrompt(brief: CaseBrief, vivaTranscript: string, language: string): string {
  return `You are a senior clinical examiner. Score this student's oral viva performance on the case below, out of 20.

HIDDEN CASE GROUND TRUTH:
${JSON.stringify(brief)}

Full viva transcript:
${vivaTranscript}

Return ONLY a JSON object, no commentary, no markdown fences, matching exactly:
{"score": <0-20 integer>, "feedback": "2-3 sentences of spoken feedback on their viva performance, in ${language}"}`;
}

export type VivaResultOutput = { assessment?: { score: number; feedback: string }; error?: string };

export async function generateVivaResult(brief: CaseBrief, vivaTranscript: string, language: string): Promise<VivaResultOutput> {
  try {
    const { content: raw } = await callGeminiNative(
      [{ role: 'user', content: vivaResultPrompt(brief, vivaTranscript, language) }],
      400,
      256,
      'gemini-2.5-pro'
    );
    const parsed = tryParseJson(raw);
    if (!parsed || typeof parsed.score !== 'number') {
      return { error: 'Could not grade the viva.' };
    }
    return {
      assessment: {
        score: Math.max(0, Math.min(20, Math.round(parsed.score))),
        feedback: typeof parsed.feedback === 'string' ? parsed.feedback : '',
      },
    };
  } catch (e: any) {
    return { error: e.message || 'Failed to grade viva' };
  }
}
