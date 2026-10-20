import { createHash } from 'crypto'
import { FieldValue } from 'firebase-admin/firestore'
import { getAdminFirestore } from '@/lib/firebase-admin'
import { osceCall, osceStream, parseJson } from '@/ai/osce-ai'
import { examReference } from '@/lib/osce/examref'
import { type OsceBrief, type VivaItem, TOTAL_VIVA, kindOf, localAnswer, normTokens, jaccard, isContextual, roleOf, looksLikeSkip } from '@/lib/osce/shared'

/* ---------- Shared memory: every question answered once is remembered for all later students ---------- */
type Mem = { id: string; q: string; a: string; lang: string; role: string; set: Set<string> }
const memCache = new Map<string, { at: number; items: Mem[] }>()

async function loadMemory(caseId: string): Promise<Mem[]> {
  const hit = memCache.get(caseId)
  if (hit && Date.now() - hit.at < 60_000) return hit.items
  const snap = await getAdminFirestore().collection('osceMemory').doc(caseId).collection('qa').orderBy('t', 'desc').limit(300).get()
  const items = snap.docs.map((d) => { const x = d.data() as any; return { id: d.id, q: x.q, a: x.a, lang: x.lang, role: x.role, set: new Set(normTokens(x.q || '')) } })
  memCache.set(caseId, { at: Date.now(), items })
  return items
}

async function lookupMemory(caseId: string, question: string, lang: string): Promise<Mem | null> {
  if (isContextual(question)) return null
  const items = await loadMemory(caseId)
  const s = new Set(normTokens(question))
  let best: Mem | null = null; let score = 0
  for (const m of items) {
    if (m.lang !== lang) continue
    const j = jaccard(s, m.set)
    if (j > score) { score = j; best = m }
  }
  if (best && score >= 0.75) {
    getAdminFirestore().collection('osceMemory').doc(caseId).collection('qa').doc(best.id).set({ hits: FieldValue.increment(1) }, { merge: true }).catch(() => {})
    return best
  }
  return null
}

async function saveMemory(caseId: string, question: string, answer: string, lang: string, role: string) {
  if (isContextual(question) || answer.length > 700) return
  const id = createHash('sha1').update(`${lang}|${normTokens(question).join(' ')}`).digest('hex').slice(0, 20)
  await getAdminFirestore().collection('osceMemory').doc(caseId).collection('qa').doc(id).set({ q: question.slice(0, 300), a: answer, lang, role, hits: 0, t: Date.now() }, { merge: true })
  const c = memCache.get(caseId)
  if (c) c.items.unshift({ id, q: question, a: answer, lang, role, set: new Set(normTokens(question)) })
}

/* ---------- Case sheet (compact text, much cheaper than JSON) ---------- */
function sheet(b: OsceBrief): string {
  const p = b.patient
  return [
    `Patient: ${p.name}, ${p.age}y ${p.gender}, ${p.occupation}, ${p.address}`,
    `Chief complaints: ${b.chiefComplaint}`,
    `HOPI: ${b.hopi}`,
    `Denies: ${b.negativeHistory.join('; ')}`,
    `Past: ${b.pastHistory}`, `Family: ${b.familyHistory}`, `Personal: ${b.personalHistory}`,
    `General exam: ${b.generalPhysicalExam}`,
    `Inspection: ${b.localExamination.inspection}`, `Palpation: ${b.localExamination.palpation}`,
    `Percussion: ${b.localExamination.percussion}`, `Auscultation: ${b.localExamination.auscultation}`,
    `Investigations: ${b.investigations.map((i) => `${i.name}: ${i.result}`).join('; ')}`,
  ].join('\n')
}

const SCRIPT: Record<string, string> = {
  English: 'English', Hindi: 'Hindi in Devanagari script', Kannada: 'Kannada in Kannada script', Tamil: 'Tamil in Tamil script',
  Telugu: 'Telugu in Telugu script', Malayalam: 'Malayalam in Malayalam script', Marathi: 'Marathi in Devanagari script', Bengali: 'Bengali in Bengali script',
}

const EXAM_RULES = `- This is an examination or investigation request. If the CASE SHEET already states the finding, read it out as written. If it does not, improvise the finding as a real patient with the hidden diagnosis would show it: the classic positive sign for signs that belong to this disease, normal for every other system or unrelated sign. Use the terms of the EXAMINATION REFERENCE. If an investigation is asked that is not on the sheet, give a plausible result that fits the diagnosis. Never contradict the sheet or the earlier answers, and never name the diagnosis.`

export type Evt = { t: 'meta'; role: 'patient' | 'examiner'; src: 'local' | 'memory' | 'ai' } | { t: 'd'; x: string } | { t: 'end' }

/** Answers one student utterance: instant for standard requests, remembered answers next, otherwise streamed from the AI. */
export async function* answer(b: OsceBrief, history: string, utterance: string, language: string): AsyncGenerator<Evt> {
  const kind = kindOf(utterance)
  const examiner = kind !== 'history'
  const role = examiner ? 'examiner' : 'patient'

  const local = examiner ? localAnswer(b, utterance) : null
  if (local) { yield { t: 'meta', role, src: 'local' }; yield { t: 'd', x: local }; yield { t: 'end' }; return }

  const lang = examiner ? 'English' : language
  let canon = ''
  if (b.caseId) {
    try {
      const m = await lookupMemory(b.caseId, utterance, lang)
      if (m) { yield { t: 'meta', role, src: 'memory' }; yield { t: 'd', x: m.a }; yield { t: 'end' }; return }
      canon = (await loadMemory(b.caseId)).slice(0, 12).map((x) => `Q: ${x.q} / A: ${x.a}`).join('\n')
    } catch {}
  }

  yield { t: 'meta', role, src: 'ai' }
  const r = roleOf(b)
  const ref = examiner ? examReference(b.proformaId) : ''
  const who = examiner
    ? `You are the examiner reading out clinical findings of the case below, in English, in a flat factual voice (no first person).`
    : r.kind === 'informant'
      ? `You are the ${r.relation.toLowerCase()} of the patient, giving the history on the patient's behalf in an Indian hospital. Speak in first person about the patient ("my ${b.patient.age < 12 ? (/^f/i.test(b.patient.gender) ? 'daughter' : 'son') : 'family member'}", "he/she"). Your name is not needed.`
      : `You are the patient ${b.patient.name}, speaking in first person like a real ${b.patient.occupation} from ${b.patient.address}: simple lay words, not medical jargon.`
  const system = `${who}
This is a clinical long-case exam for an Indian MBBS student.
RULES:
- Answer ONLY what was asked, in ${examiner ? '1 to 3 short factual sentences (under 50 words)' : '1 or 2 short sentences (under 35 words)'}. Do not volunteer extra ${examiner ? 'findings' : 'symptoms'}.
- Stay consistent with the CASE SHEET. Never reveal or hint at the diagnosis, differentials or management.
- If asked something the sheet does not cover, invent a small plausible detail that fits the diagnosis, and stay consistent with the earlier answers below.
${examiner ? EXAM_RULES : '- If the question is vague, answer briefly as a real person would.'}
- ${examiner ? 'Write in English.' : `Reply STRICTLY in ${SCRIPT[language] || language}, using only that language's own script and natural spoken words. No English sentences; only words people really say in English (BP, sugar, tablet, X-ray) may stay.`}
CASE SHEET:
${sheet(b)}
${examiner ? `Hidden diagnosis (only to keep findings consistent, never say it): ${b.provisionalDiagnosis}\n${ref ? `EXAMINATION REFERENCE (what the standard proforma for this case type examines; use its terms and signs):\n${ref}\n` : ''}` : ''}${canon ? `EARLIER ANSWERS GIVEN TO OTHER STUDENTS (stay consistent):\n${canon}` : ''}`
  const user = `${history ? `Recent conversation:\n${history}\n\n` : ''}Student: ${utterance}`

  let full = ''
  try {
    for await (const piece of osceStream([{ role: 'system', content: system }, { role: 'user', content: user }], 220, 0, 'fast')) {
      full += piece; yield { t: 'd', x: piece }
    }
  } catch (e: any) {
    if (!full) throw e
  }
  yield { t: 'end' }
  const text = full.trim().replace(/^["']+|["']+$/g, '')
  if (b.caseId && text) saveMemory(b.caseId, utterance, text, lang, role).catch(() => {})
}

/* ---------- Viva ---------- */
export async function vivaPlan(b: OsceBrief): Promise<VivaItem[]> {
  if (b.viva && b.viva.length >= TOTAL_VIVA) return b.viva.slice(0, TOTAL_VIVA)
  const prompt = `You are a strict Indian MBBS clinical examiner. Prepare ${TOTAL_VIVA} viva questions for the case below, in the style of a real university viva, rising in difficulty:
1 recall (definition/classification/cause), 2 mechanism or anatomy/pathophysiology, 3 investigation choice and interpretation, 4 treatment (drug of choice, doses or procedure), 5 complication or applied/tricky question.
Each question must be specific to THIS case and under 25 words. "ans" is the model answer in at most 40 words. "key" lists the 3 to 5 must-have points, comma separated.
Return ONLY JSON: {"questions":[{"q":"","ans":"","key":""}]}
CASE:
${sheet(b)}
Diagnosis: ${b.provisionalDiagnosis}. Differentials: ${b.differentials.join(', ')}. Management: ${b.managementPlan}`
  const { content } = await osceCall([{ role: 'user', content: prompt }], 1400, 0, 'fast', true)
  const j = parseJson(content)
  const qs: VivaItem[] = (j?.questions || []).filter((x: any) => x?.q && x?.ans).slice(0, TOTAL_VIVA).map((x: any) => ({ q: String(x.q), ans: String(x.ans), key: String(x.key || x.ans) }))
  if (qs.length < 3) throw new Error('Could not prepare the viva questions.')
  return qs
}

export async function vivaTurn(b: OsceBrief, plan: VivaItem[] | undefined, questionNumber: number, studentAnswer: string): Promise<{ message: string; plan: VivaItem[]; verdict?: string }> {
  const p = plan && plan.length ? plan : await vivaPlan(b)
  if (!studentAnswer.trim()) return { message: `Let us begin the viva. Question 1. ${p[0].q}`, plan: p }
  const cur = p[Math.min(questionNumber, p.length) - 1]
  const last = questionNumber >= p.length
  const next = last ? ' That completes the viva. Thank you.' : ` Question ${questionNumber + 1}. ${p[questionNumber].q}`

  if (looksLikeSkip(studentAnswer) && studentAnswer.trim().split(/\s+/).length <= 8) {
    return { message: `That is alright. The answer is: ${cur.ans}${next}`, plan: p, verdict: 'skipped' }
  }
  const prompt = `Question: ${cur.q}
Must-have points: ${cur.key}
Model answer: ${cur.ans}
Student's answer: "${studentAnswer}"
Judge the student fairly. Return ONLY JSON: {"verdict":"correct"|"partial"|"wrong","reaction":"one sentence under 25 words speaking to the student: say what was right and what was missing"}`
  let verdict = 'partial'; let reaction = 'Thank you.'
  try {
    const { content } = await osceCall([{ role: 'user', content: prompt }], 200, 0, 'fast', true)
    const j = parseJson(content)
    if (j?.verdict) verdict = String(j.verdict)
    if (j?.reaction) reaction = String(j.reaction)
  } catch {}
  return { message: `${reaction}${verdict === 'correct' ? '' : ` The answer is: ${cur.ans}`}${next}`, plan: p, verdict }
}
