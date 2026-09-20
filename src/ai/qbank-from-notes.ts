'use server';
import { callGeminiNative } from '@/ai/genkit';

export type QBankQuestion = {
  topic_title: string
  question_text: string
  option1: string
  option2: string
  option3: string
  option4: string
  correct_answer_index: number
  explanation: string
}

export type NotesTopicInput = { name: string; markdown: string }

export type GenerateQBankFromNotesInput = {
  subject: string
  unitName?: string
  chapterTitle: string
  notesTopics: NotesTopicInput[]
  numQuestions: number
}

export type GenerateQBankFromNotesOutput = {
  questions: QBankQuestion[]
  requested: number
  error?: string
}

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

const MAX_NOTES_CHARS = 40000

function buildPrompt(input: GenerateQBankFromNotesInput, count: number): string {
  const subjectScope = SUBJECT_LENS[input.subject] || `Stay strictly within the scope of ${input.subject} as a distinct subject from other MBBS subjects - do not drift into content that belongs to a different subject.`
  const unitContext = input.unitName ? `Unit: ${input.unitName}\n` : ''

  let notesText = input.notesTopics.map((t) => `### ${t.name}\n${t.markdown}`).join('\n\n')
  if (notesText.length > MAX_NOTES_CHARS) {
    notesText = notesText.slice(0, MAX_NOTES_CHARS) + '\n[...notes truncated...]'
  }

  return `You are an expert medical educator writing NEET-PG and INICET level multiple choice questions for MBBS students in India.

Subject: ${input.subject}
${unitContext}Chapter: ${input.chapterTitle}

Below are this chapter's already-written revision notes. Use them as a REFERENCE for which subtopics this chapter covers and what's been prioritized - you are NOT limited to only facts stated in these notes. Draw on standard Indian MBBS textbook knowledge for ${input.subject} and the NMC curriculum to write accurate, complete questions and explanations, exactly as you would working from the full textbook chapter.

CHAPTER NOTES (reference):
${notesText}

SUBJECT SCOPE (critical - follow exactly):
${subjectScope}

DIFFICULTY LEVEL (critical):
Write at NEET-PG / INICET exam difficulty - application-based reasoning, not simple one-line recall.

QUESTION FORMAT MIX (critical - do NOT default every question to a clinical vignette):
Real NEET-PG/INICET papers mix several question formats. Across this set of ${count} questions, deliberately mix:
- Direct factual/reasoning questions with no patient scenario at all (e.g. "Which of the following is true about X?", "All of the following are features of X EXCEPT", "X is caused by which of the following mechanisms?")
- Comparison/classification questions (differentiating between related entities, staging or grading systems, distinguishing look-alike conditions or drugs)
- Mechanism/process questions framed as reasoning, not recall ("By which mechanism does X lead to Y?")
- Clinical vignette / case-based questions (a brief patient presentation leading to a diagnosis, next best step, or interpretation)
No more than about HALF of the ${count} questions should be clinical vignettes. The rest must be genuinely non-scenario, direct-reasoning questions of the other types above. Do not open every question with a patient presentation - that is a format failure for this set.

GOAL - MASTERY, NOT JUST TESTING (critical):
This question set is a student's primary revision tool for this entire chapter, not just a quiz. Design the SET of ${count} questions to collectively sample every major subtopic covered in the notes above (and any standard-textbook subtopic the notes may have compressed or omitted), so that a student who works through all of them has effectively reviewed the whole chapter. Do not cluster all questions on one or two subtopics while ignoring the rest.

EXPLANATIONS MUST TEACH, NOT JUST JUSTIFY (critical):
For every question, write a genuinely thorough explanation such that after reading it, the student is CRYSTAL CLEAR on the underlying concept - not just why the marked answer is correct, but a real understanding of what's being tested. Each explanation must:
- Explain the core concept/mechanism/fact being tested, in enough depth to actually teach it, not just restate the correct option's name.
- Briefly say why each of the other three options is wrong, or why it's a plausible-but-incorrect distractor (one clause each is enough - this is what turns the wrong-answer path into a learning moment too).
- Where relevant, add the one clinical pearl, mnemonic, or distinguishing feature that would help the student recognize this fact again in a different question or a real vignette.
Treat the explanation as a compact teaching paragraph (roughly 3-6 sentences), not a one-line answer key.

Generate EXACTLY ${count} high-yield multiple choice questions - not fewer, not more - strictly within the subject scope above, following the format mix rule exactly. Vary the question type and which subtopic each one covers - do not repeat the same question format/structure or cluster on one subtopic across the set.

Respond ONLY with a valid JSON array of EXACTLY ${count} objects, no markdown, no extra text, no trailing commas, in this exact format:
[{"topic_title":"${input.chapterTitle}","question_text":"...","option1":"...","option2":"...","option3":"...","option4":"...","correct_answer_index":0,"explanation":"..."}]

Rules:
- The array must contain exactly ${count} questions - count them before responding
- correct_answer_index must be an integer 0-3
- No markdown bold (**) inside any field
- Vary the correct answer position, do not always pick 0
- Each option must be a genuinely plausible distractor, not circular or self-referential to the question
- Output must be complete, valid JSON - do not truncate`
}

async function generateBatch(input: GenerateQBankFromNotesInput, count: number): Promise<{ questions: QBankQuestion[], rawError?: string }> {
  const prompt = buildPrompt(input, count)

  try {
    const { content: raw } = await callGeminiNative([{ role: 'user', content: prompt }], 6000)
    if (!raw) return { questions: [], rawError: 'Empty response from AI model' }

    let clean = raw.replace(/```json|```/g, '').trim()
    const firstBracket = clean.indexOf('[')
    const lastBracket = clean.lastIndexOf(']')
    if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
      clean = clean.slice(firstBracket, lastBracket + 1)
    }

    const parsed = JSON.parse(clean)
    if (!Array.isArray(parsed)) return { questions: [], rawError: 'AI response was not a JSON array' }
    return { questions: parsed.map((q: QBankQuestion) => ({ ...q, topic_title: input.chapterTitle })) }
  } catch (err: any) {
    return { questions: [], rawError: err.message || 'Unknown error during generation' }
  }
}

const BATCH_SIZE = 8
// Enough rounds to top up a shortfall (a malformed/truncated batch, a batch that came
// back short of what was asked) until the exact requested count is reached, without
// looping forever if the model is genuinely stuck.
const MAX_ROUNDS = 8

export async function generateQBankFromNotes(input: GenerateQBankFromNotesInput): Promise<GenerateQBankFromNotesOutput> {
  const total = Math.min(Math.max(input.numQuestions, 5), 40)
  const allQuestions: QBankQuestion[] = []
  const errors: string[] = []

  let round = 0
  while (allQuestions.length < total && round < MAX_ROUNDS) {
    round++
    const shortfall = total - allQuestions.length
    const batchCount = Math.min(BATCH_SIZE, shortfall)
    const result = await generateBatch(input, batchCount)
    if (result.questions.length > 0) {
      allQuestions.push(...result.questions)
    } else if (result.rawError) {
      errors.push(result.rawError)
    }
  }

  // A batch can occasionally come back with one or two extra/fewer than asked - trim
  // to the exact requested count rather than over- or under-delivering by a couple.
  const finalQuestions = allQuestions.slice(0, total)

  if (finalQuestions.length === 0) {
    return { questions: [], requested: total, error: errors[0] || 'AI returned no usable questions for this chapter.' }
  }
  if (finalQuestions.length < total) {
    return {
      questions: finalQuestions,
      requested: total,
      error: `Only generated ${finalQuestions.length} of ${total} requested after ${MAX_ROUNDS} attempts - the model kept returning malformed output for the rest. Try regenerating this chapter.`,
    }
  }
  return { questions: finalQuestions, requested: total }
}
