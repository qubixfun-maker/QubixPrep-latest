'use server';

export type GenerateQBankInput = {
  topic: string;
  subject: string;
  numQuestions: number;
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

export type GenerateQBankOutput = {
  questions: QBankQuestion[];
  error?: string;
};

const SUBJECT_LENS: Record<string, string> = {
  "Anatomy": "Focus strictly on gross anatomical structure, relations, embryological development, histology, and clinical/applied anatomy (anatomical basis of clinical signs). Do NOT cover physiological function, biochemistry, or disease management.",
  "Physiology": "Focus strictly on normal organ system function, regulatory mechanisms, and physiological processes. Do NOT cover gross anatomical structure, histopathology, or disease management - only normal function and its regulation.",
  "Biochemistry": "Focus strictly on metabolic pathways, enzymology, molecular biology, genetics at the biochemical level, and laboratory biochemical correlations. Do NOT cover gross anatomy, organ-level physiology, or clinical disease management.",
  "Pathology": "Focus strictly on the disease process: gross and microscopic morphological changes, pathophysiology, staging/grading systems, and correlation between pathology findings and clinical presentation. Do NOT cover treatment protocols, drug mechanisms, or public health epidemiology.",
  "Microbiology": "Focus strictly on the organism itself: morphology, classification, virulence factors, pathogenesis at the cellular/molecular level, laboratory diagnosis (culture, staining, serology), and antimicrobial sensitivity. Do NOT cover epidemiology, national health programs, clinical management, or public health policy - that belongs to Community Medicine or clinical subjects.",
  "Pharmacology": "Focus strictly on drugs: mechanism of action, pharmacokinetics, pharmacodynamics, adverse effects, drug interactions, and contraindications. Do NOT cover disease pathophysiology, organism biology, or epidemiology in depth.",
  "Forensic Medicine": "Focus strictly on medico-legal aspects: cause/manner/mechanism of death, postmortem findings, legal procedures (Indian law: IPC, CrPC sections relevant to medicine), toxicology, and forensic significance. Do NOT cover clinical management of living patients.",
  "Community Medicine": "Focus strictly on the public health and epidemiological angle: incidence/prevalence, national control programs (e.g. NTEP/RNTCP, NVBDCP, UIP), prevention strategies, screening, biostatistics, demography, and health system administration. Do NOT cover organism biology, pathophysiology, or individual clinical management - that belongs to Microbiology, Pathology, or clinical subjects.",
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

function buildPrompt(subject: string, topic: string, count: number): string {
  const subjectScope = SUBJECT_LENS[subject] || `Stay strictly within the scope of ${subject} as a distinct subject from other MBBS subjects - do not drift into content that belongs to a different subject.`

  return `You are an expert medical educator writing NEET-PG and INICET level multiple choice questions for MBBS students in India preparing for postgraduate medical entrance exams.

Subject: ${subject}
Topic: ${topic}

DIFFICULTY LEVEL (critical):
Write at NEET-PG / INICET exam difficulty - application-based and scenario-based questions, not simple one-line recall. Where appropriate, frame as brief clinical vignettes.

SUBJECT SCOPE (critical - follow exactly):
${subjectScope}

REFERENCE STANDARD:
Base every question on content found in standard Indian MBBS textbooks for this subject. Match the style and difficulty of recent NEET-PG and INICET exams.

Generate exactly ${count} high-yield multiple choice questions on this topic, strictly within the subject scope above.

Respond ONLY with a valid JSON array, no markdown, no extra text, no trailing commas, in this exact format:
[{"topic_title":"${topic}","question_text":"...","option1":"...","option2":"...","option3":"...","option4":"...","correct_answer_index":0,"explanation":"..."}]

Rules:
- correct_answer_index must be an integer 0-3
- No markdown bold (**) inside any field
- Vary the correct answer position, do not always pick 0
- Output must be complete, valid JSON - do not truncate`
}

async function generateBatch(subject: string, topic: string, count: number): Promise<{ questions: QBankQuestion[], rawError?: string }> {
  const apiKey = process.env.CEREBRAS_API_KEY
  if (!apiKey) return { questions: [], rawError: 'CEREBRAS_API_KEY is not set in environment variables.' }

  const prompt = buildPrompt(subject, topic, count)

  try {
    const res = await fetch('https://api.cerebras.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-oss-120b',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
      }),
    })

    if (!res.ok) {
      const errText = await res.text()
      return { questions: [], rawError: `Cerebras API error ${res.status}: ${errText.slice(0, 200)}` }
    }

    const data = await res.json()
    const raw = data.choices?.[0]?.message?.content ?? ''
    if (!raw) return { questions: [], rawError: 'Empty response from AI model' }

    let clean = raw.replace(/```json|```/g, '').trim()
    const firstBracket = clean.indexOf('[')
    const lastBracket = clean.lastIndexOf(']')
    if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
      clean = clean.slice(firstBracket, lastBracket + 1)
    }

    const parsed = JSON.parse(clean)
    if (!Array.isArray(parsed)) return { questions: [], rawError: 'AI response was not a JSON array' }
    return { questions: parsed }
  } catch (err: any) {
    return { questions: [], rawError: err.message || 'Unknown error during generation' }
  }
}

export async function generateQBankQuestions(input: GenerateQBankInput): Promise<GenerateQBankOutput> {
  const total = Math.min(Math.max(input.numQuestions, 1), 30);
  const BATCH_SIZE = 8
  const allQuestions: QBankQuestion[] = []
  const errors: string[] = []

  for (let done = 0; done < total; done += BATCH_SIZE) {
    const batchCount = Math.min(BATCH_SIZE, total - done)
    const result = await generateBatch(input.subject, input.topic, batchCount)
    if (result.questions.length > 0) {
      allQuestions.push(...result.questions)
    } else if (result.rawError) {
      errors.push(result.rawError)
    }
  }

  if (allQuestions.length === 0) {
    return { questions: [], error: errors[0] || 'AI returned no usable questions. Try a more specific topic or fewer questions.' }
  }

  return { questions: allQuestions }
}
