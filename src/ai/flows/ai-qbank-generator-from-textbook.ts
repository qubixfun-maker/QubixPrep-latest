'use server';
import { callAIWithProvider } from '@/ai/genkit';

export type GenerateQBankFromTextbookInput = {
  subject: string;
  unitName?: string;
  chapterTitle: string;
  textbookTitle: string;
  chapterExcerpt: string;
  numQuestions: number;
  forceVertex?: boolean;
};

export type QBankQuestion = {
  topic_title: string;
  question_text: string;
  option1: string;
  option2: string;
  option3: string;
  option4: string;
  correct_answer_index: number;
  explanation: string;
};

export type GenerateQBankFromTextbookOutput = {
  questions: QBankQuestion[];
  provider?: string;
  error?: string;
  usedFallback?: boolean;
};

const SUBJECT_LENS: Record<string, string> = {
  "Anatomy": "Focus strictly on gross anatomical structure, relations, embryological development, histology, and clinical/applied anatomy (anatomical basis of clinical signs). Do NOT cover physiological function, biochemistry, or disease management.",
  "Physiology": "Focus strictly on normal organ system function, regulatory mechanisms, and physiological processes. Do NOT cover gross anatomical structure, histopathology, or disease management - only normal function and its regulation.",
  "Biochemistry": "Focus strictly on metabolic pathways, enzymology, molecular biology, genetics at the biochemical level, and laboratory biochemical correlations. Do NOT cover gross anatomy, organ-level physiology, or clinical disease management.",
  "Pathology": "Focus strictly on the disease process: gross and microscopic morphological changes, pathophysiology, staging/grading systems, and correlation between pathology findings and clinical presentation. Do NOT cover treatment protocols, drug mechanisms, or public health epidemiology.",
  "Microbiology": "Focus strictly on the organism itself: morphology, classification, virulence factors, pathogenesis at the cellular/molecular level, laboratory diagnosis (culture, staining, serology), and antimicrobial sensitivity. Do NOT cover epidemiology, national health programs, clinical management, or public health policy - that belongs to Community Medicine or clinical subjects.",
  "Pharmacology": "Focus strictly on drugs: mechanism of action, pharmacokinetics, pharmacodynamics, adverse effects, drug interactions, and contraindications. Do NOT cover disease pathophysiology, organism biology, or epidemiology in depth.",
  "Forensic Medicine": "Focus strictly on medico-legal aspects: cause/manner/mechanism of death, postmortem findings, legal procedures (Indian law: IPC, CrPC sections relevant to medicine), toxicology, and forensic significance. Do NOT cover clinical management of living patients.",
  "Community Medicine": "Focus on the public health and programmatic angle of the topic: disease burden, national health programs and policies, prevention strategies at population level, screening program design, health education, and health system response. Use biostatistics/epidemiological calculations (rates, ratios, OR/RR, Hardy-Weinberg, sensitivity/specificity) ONLY when the unit or topic name explicitly indicates a biostatistics/epidemiology methods topic - do NOT default to calculation-heavy questions for topics that are about specific diseases or programs unless the topic itself is about measurement/statistics. Do NOT cover organism biology, individual clinical management, or drug mechanisms - that belongs to Microbiology, Pathology, Pharmacology, or clinical subjects.",
  "Medicine": "Focus on clinical presentation, diagnosis, investigation, and management of conditions in adult patients as tested in internal medicine. Include relevant subspecialties (cardiology, nephrology, neurology, endocrinology, gastroenterology, pulmonology, rheumatology, infectious disease, hematology, oncology) at a general medicine level.",
  "Surgery": "Focus on surgical indications, operative principles, pre/post-operative management, and surgical complications as tested in general surgery. Include relevant subspecialties (urology, vascular surgery, trauma, GI surgery, endocrine surgery) at a general surgery level.",
  "Obstetrics & Gynaecology": "Focus on antenatal/intranatal/postnatal care, obstetric complications, gynaecological conditions, contraception, and reproductive health as tested in O&G.",
  "Paediatrics": "Focus on growth and development, neonatal care, paediatric-specific diseases, immunization, and management of common childhood conditions, strictly in the paediatric age group.",
  "Orthopaedics": "Focus on fractures, dislocations, bone/joint pathology, orthopaedic trauma management, and musculoskeletal conditions as tested in orthopaedics.",
  "Ophthalmology": "Focus on eye anatomy/physiology as clinically applied, common ophthalmic conditions, diagnosis, and management as tested in ophthalmology.",
  "ENT": "Focus on ear, nose, and throat anatomy as clinically applied, common ENT conditions, diagnosis, and management as tested in otorhinolaryngology.",
  "Psychiatry": "Focus on psychiatric diagnosis (DSM/ICD criteria), psychopharmacology, and management of mental health conditions as tested in psychiatry.",
  "Dermatology": "Focus on skin, hair, nail conditions, dermatological diagnosis, and management as tested in dermatology and venereology.",
  "Radiology": "Focus on imaging modalities, radiological findings/signs, and image interpretation as tested in radiodiagnosis.",
  "Anaesthesia": "Focus on anaesthetic agents, techniques, perioperative monitoring, pain management, and critical care as tested in anaesthesiology.",
}

const MAX_CHARS_EXCERPT = 60000

function buildPrompt(input: GenerateQBankFromTextbookInput, count: number): string {
  const subjectScope = SUBJECT_LENS[input.subject] || `Stay strictly within the scope of ${input.subject} as a distinct subject from other MBBS subjects - do not drift into content that belongs to a different subject.`
  const unitContext = input.unitName ? `Unit: ${input.unitName}\n` : ''
  const excerpt = input.chapterExcerpt.length > MAX_CHARS_EXCERPT
    ? input.chapterExcerpt.slice(0, MAX_CHARS_EXCERPT) + '\n[...excerpt truncated...]'
    : input.chapterExcerpt

  return `You are an expert medical educator writing NEET-PG and INICET level multiple choice questions for MBBS students in India, strictly grounded in the textbook excerpt provided below - you must NOT use any outside knowledge, even if you know more about the topic from your own training. Every question and its correct answer must be verifiable from the excerpt.

Subject: ${input.subject}
${unitContext}Chapter: ${input.chapterTitle}

TEXTBOOK EXCERPT (from "${input.textbookTitle}"):
${excerpt}

SUBJECT SCOPE (critical - follow exactly):
${subjectScope}

DIFFICULTY LEVEL (critical):
Write at NEET-PG / INICET exam difficulty - application-based and scenario-based questions, not simple one-line recall. Where the excerpt supports it, frame as brief clinical vignettes.

Generate exactly ${count} high-yield multiple choice questions using ONLY facts present in the excerpt above, strictly within the subject scope. Vary the question type - do not repeat the same question format/structure across the set.

Respond ONLY with a valid JSON array, no markdown, no extra text, no trailing commas, in this exact format:
[{"topic_title":"${input.chapterTitle}","question_text":"...","option1":"...","option2":"...","option3":"...","option4":"...","correct_answer_index":0,"explanation":"..."}]

Rules:
- correct_answer_index must be an integer 0-3
- No markdown bold (**) inside any field
- Vary the correct answer position, do not always pick 0
- Each option must be a genuinely plausible distractor, not circular or self-referential to the question
- Output must be complete, valid JSON - do not truncate`
}

async function generateBatch(input: GenerateQBankFromTextbookInput, count: number): Promise<{ questions: QBankQuestion[], provider?: string, rawError?: string }> {
  const prompt = buildPrompt(input, count)

  try {
    const { content: raw, provider } = await callAIWithProvider([{ role: 'user', content: prompt }], 4000, input.forceVertex)
    if (!raw) return { questions: [], rawError: 'Empty response from AI model' }

    let clean = raw.replace(/```json|```/g, '').trim()
    const firstBracket = clean.indexOf('[')
    const lastBracket = clean.lastIndexOf(']')
    if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
      clean = clean.slice(firstBracket, lastBracket + 1)
    }

    const parsed = JSON.parse(clean)
    if (!Array.isArray(parsed)) return { questions: [], rawError: 'AI response was not a JSON array' }
    return { questions: parsed, provider }
  } catch (err: any) {
    return { questions: [], rawError: err.message || 'Unknown error during generation' }
  }
}

async function generateAtCount(input: GenerateQBankFromTextbookInput, total: number): Promise<{ questions: QBankQuestion[], provider?: string, error?: string }> {
  const BATCH_SIZE = 8
  const allQuestions: QBankQuestion[] = []
  const errors: string[] = []
  let lastProvider: string | undefined

  for (let done = 0; done < total; done += BATCH_SIZE) {
    const batchCount = Math.min(BATCH_SIZE, total - done)
    const result = await generateBatch(input, batchCount)
    if (result.questions.length > 0) {
      allQuestions.push(...result.questions.map((q) => ({ ...q, topic_title: input.chapterTitle })))
      lastProvider = result.provider
    } else if (result.rawError) {
      errors.push(result.rawError)
    }
  }

  if (allQuestions.length === 0) {
    return { questions: [], error: errors[0] || 'AI returned no usable questions from this chapter.' }
  }
  return { questions: allQuestions, provider: lastProvider }
}

// Tries the requested count first (default 12/chapter). If that yields nothing usable -
// e.g. the chapter excerpt is too thin or oddly structured for the AI to extract that many
// distinct, non-repetitive questions - falls back to one larger attempt (120) covering the
// whole chapter broadly, rather than leaving the chapter with zero questions.
export async function generateQBankQuestionsFromTextbook(input: GenerateQBankFromTextbookInput): Promise<GenerateQBankFromTextbookOutput> {
  const requested = Math.min(Math.max(input.numQuestions, 1), 120)

  const first = await generateAtCount(input, requested)
  if (first.questions.length > 0) {
    return { questions: first.questions, provider: first.provider }
  }

  if (requested >= 120) {
    return { questions: [], error: first.error }
  }

  const fallback = await generateAtCount(input, 120)
  if (fallback.questions.length > 0) {
    return { questions: fallback.questions, provider: fallback.provider, usedFallback: true }
  }

  return { questions: [], error: fallback.error || first.error }
}
