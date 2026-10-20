import type { CaseBrief } from '@/ai/osce-live-case'

export type VivaItem = { q: string; ans: string; key: string }
export type OsceBrief = CaseBrief & {
  caseId?: string
  proformaId?: string
  informant?: { relation: string; gender: 'Male' | 'Female' }
  viva?: VivaItem[]
}
export type Gender = 'male' | 'female'
export type Role = { kind: 'self' | 'informant'; relation: string; gender: Gender; label: string }

export const LANG_CODES: Record<string, string> = {
  English: 'en-IN', Hindi: 'hi-IN', Kannada: 'kn-IN', Tamil: 'ta-IN',
  Telugu: 'te-IN', Malayalam: 'ml-IN', Marathi: 'mr-IN', Bengali: 'bn-IN',
}
export const TOTAL_VIVA = 5

const hash = (s: string) => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return Math.abs(h) }

/** Who answers the questions: the patient, or an informant (child, unconscious, confused patient). */
export function roleOf(b: OsceBrief): Role {
  const age = Number(b.patient?.age) || 30
  const pg: Gender = /^f/i.test(b.patient?.gender || '') ? 'female' : 'male'
  if (b.informant) {
    const g: Gender = /^f/i.test(b.informant.gender) ? 'female' : 'male'
    return { kind: 'informant', relation: b.informant.relation, gender: g, label: `Patient's ${b.informant.relation.toLowerCase()} (informant)` }
  }
  const text = `${b.topic} ${b.chiefComplaint}`
  const unable = /unconscious|altered sensorium|drowsy|coma|stupor|delirium|dementia|aphasi|unresponsive|encephalopathy|neonat|newborn/i.test(text)
  if (age < 12 || unable) {
    let relation: string; let gender: Gender
    if (age < 12) {
      const mother = hash(b.patient?.name || '') % 10 < 7
      relation = mother ? 'Mother' : 'Father'; gender = mother ? 'female' : 'male'
    } else if (age >= 60) {
      const son = hash(b.patient?.name || '') % 2 === 0
      relation = son ? 'Son' : 'Daughter'; gender = son ? 'male' : 'female'
    } else {
      relation = pg === 'male' ? 'Wife' : 'Husband'; gender = pg === 'male' ? 'female' : 'male'
    }
    return { kind: 'informant', relation, gender, label: `Patient's ${relation.toLowerCase()} (informant)` }
  }
  return { kind: 'self', relation: 'Patient', gender: pg, label: 'Patient' }
}

const EXAM_RE = /(examin|inspect|palpat|percuss|auscult|vital|pulse|blood pressure|\bbp\b|temperature|pallor|icterus|jaundice|cyanosis|clubbing|oedema|edema|lymph node|gait|reflex|\btone\b|\bpower\b|sensation|cranial|fundus|otoscop|per abdomen|per vaginam|per rectal|mallampati|airway|palpate|look at|check (the )?(his|her|the))/i
const INV_RE = /(investigation|report|x-?ray|\becg\b|\bct\b|\bmri\b|\busg\b|ultrasound|\bcbc\b|haemogram|hemogram|blood (test|sugar|count|culture|group)|urine (routine|test|culture)|\blft\b|\brft\b|serum|biopsy|\becho\b|scan|lab )/i
export type Kind = 'exam' | 'invest' | 'history'
export const kindOf = (u: string): Kind => (INV_RE.test(u) ? 'invest' : EXAM_RE.test(u) ? 'exam' : 'history')

/** Instant (no AI, no network) answers for the standard examination requests. Findings are narrated in English. */
export function localAnswer(b: OsceBrief, utterance: string): string | null {
  const u = utterance.toLowerCase().trim()
  if (u.split(/\s+/).length > 7) return null
  const L = b.localExamination
  const na = (s?: string) => (s && s.trim() ? s.trim() : '')
  if (/general (physical )?exam|\bgpe\b|^vitals?$|vital signs/.test(u)) return na(b.generalPhysicalExam) || null
  if (/^(local )?inspection/.test(u)) return na(L?.inspection) || null
  if (/^palpation/.test(u)) return na(L?.palpation) || null
  if (/^percussion/.test(u)) return na(L?.percussion) || null
  if (/^auscultation/.test(u)) return na(L?.auscultation) || null
  if (/^(relevant )?investigations?$/.test(u)) return b.investigations?.length ? b.investigations.map((i) => `${i.name}: ${i.result}`).join('. ') + '.' : null
  return null
}

const STOP = new Set('do does did you your have has had any is are was were the a an of and or to ever sometimes please tell me about can could would will it its in on at for with so now then also what how when where why which who whom he she his her him my our their there here sir madam doctor say kindly'.split(' '))
export function normTokens(q: string): string[] {
  return q.toLowerCase().split(/[^\p{L}\p{N}\p{M}]+/u).filter((t) => t && !STOP.has(t))
}
export function jaccard(a: Set<string>, b: Set<string>): number {
  if (!a.size || !b.size) return 0
  let i = 0; a.forEach((x) => { if (b.has(x)) i++ })
  return i / (a.size + b.size - i)
}
/** Questions that depend on earlier turns ("what about that?") must not be cached. */
export const isContextual = (q: string) => /\b(it|that|this|those|these|they|them|same|again|before|earlier|you said)\b/i.test(q) || normTokens(q).length === 0

export function splitSentences(t: string): string[] {
  const raw = t.replace(/\s+/g, ' ').trim().split(/(?<=[.!?।॥])\s+/u)
  const out: string[] = []
  for (const s of raw) {
    if (!s) continue
    if (out.length && (out[out.length - 1].length < 28 || s.length < 14) && out[out.length - 1].length + s.length < 240) out[out.length - 1] += ' ' + s
    else out.push(s)
  }
  return out
}

const SKIP_LATIN = /\b(don'?t know|do not know|dont know|no idea|not sure|skip|pass|next question|can'?t (recall|remember)|give up)\b/i
const SKIP_INDIC = /(पता नहीं|मालूम नहीं|ಗೊತ್ತಿಲ್ಲ|தெரியாது|తెలియదు|അറിയില്ല|माहीत नाही|জানি না)/
export const looksLikeSkip = (t: string) => SKIP_LATIN.test(t) || SKIP_INDIC.test(t)
