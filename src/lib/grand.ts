// Grand Test: sampling, NEET-PG style scoring and an approximate rank estimate.
import { Firestore, collection, documentId, getDocs, limit, orderBy, query, where } from "firebase/firestore"

export type GQ = { key: string; subjectId: string; subjectName: string; topic: string; question: string; options: string[]; correct: number; explanation: string }
export type SavedTest = { qs: GQ[]; answers: Record<number, number>; marked: number[]; endAt: number; startedAt: number; minutes: number; negative: boolean; i: number }
export type Attempt = { at: number; n: number; score: number; max: number; correct: number; wrong: number; skipped: number; mins: number; rank: number; scaled: number; subjects: Record<string, { n: string; a: number; c: number }> }

const ID_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
const randId = () => Array.from({ length: 20 }, () => ID_CHARS[Math.floor(Math.random() * ID_CHARS.length)]).join("")
export function shuffle<T>(a: T[]) { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]] } return b }

function toQ(subjectId: string, subjectName: string, id: string, x: any): GQ | null {
  const options = [x.option1, x.option2, x.option3, x.option4].filter((o) => o !== undefined && o !== null && String(o).trim() !== "").map(String)
  const correct = Number(x.correct_answer_index)
  if (!x.question_text || options.length < 2 || !Number.isInteger(correct) || correct < 0 || correct >= options.length) return null
  return { key: subjectId + "/" + id, subjectId, subjectName, topic: x.topic_title || x.unit_title || "General", question: String(x.question_text), options, correct, explanation: String(x.explanation || "") }
}

/** Random-ish sample: each subject is read from a random document id, then topped up from the start. */
export async function sampleQuestions(db: Firestore, subjects: { id: string; name: string }[], total: number): Promise<GQ[]> {
  if (!subjects.length) return []
  const per = Math.max(3, Math.ceil((total * 1.3) / subjects.length))
  const seen = new Set<string>()
  const pool: GQ[] = []
  await Promise.all(subjects.map(async (s) => {
    const col = collection(db, "subjects", s.id, "qbankQuestions")
    const take = async (qq: any) => { const snap = await getDocs(qq).catch(() => null); (snap as any)?.forEach((d: any) => { const q = toQ(s.id, s.name, d.id, d.data()); if (q && !seen.has(q.key)) { seen.add(q.key); pool.push(q) } }) }
    await take(query(col, where(documentId(), ">=", randId()), limit(per)))
    const have = pool.filter((p) => p.subjectId === s.id).length
    if (have < per) await take(query(col, orderBy(documentId()), limit(per)))
  }))
  // Balance across subjects, then trim to the requested size.
  const bySubject = new Map<string, GQ[]>()
  shuffle(pool).forEach((q) => { const l = bySubject.get(q.subjectId) || []; l.push(q); bySubject.set(q.subjectId, l) })
  const out: GQ[] = []
  let progressed = true
  while (out.length < total && progressed) {
    progressed = false
    for (const l of bySubject.values()) { const q = l.pop(); if (q && out.length < total) { out.push(q); progressed = true } }
  }
  return shuffle(out)
}

export function scoreTest(qs: GQ[], answers: Record<number, number>, negative: boolean) {
  let correct = 0, wrong = 0
  const subjects: Attempt["subjects"] = {}
  qs.forEach((q, i) => {
    const s = (subjects[q.subjectId] ||= { n: q.subjectName, a: 0, c: 0 })
    s.a++
    const p = answers[i]
    if (p === undefined) return
    if (p === q.correct) { correct++; s.c++ } else wrong++
  })
  const score = correct * 4 - (negative ? wrong : 0)
  return { correct, wrong, skipped: qs.length - correct - wrong, score, max: qs.length * 4, subjects }
}

// NEET PG 2025 results (about 2.4 lakh candidates, 800 marks): marks -> all-India rank, published by Careers360.
const CURVE: [number, number][] = [[707, 1], [690, 11], [678, 28], [663, 113], [640, 510], [618, 1500], [584, 5000], [555, 10000], [499, 25000], [427, 50000], [363, 75000], [307, 100000], [215, 150000], [0, 230000]]

/** Scales the score to 800 marks and interpolates a rank on the NEET PG 2025 curve. Approximate by nature. */
export function estimateRank(score: number, max: number) {
  const scaled = Math.max(0, Math.min(800, Math.round((Math.max(0, score) / Math.max(1, max)) * 800)))
  if (scaled >= CURVE[0][0]) return { scaled, rank: 1 }
  for (let i = 0; i < CURVE.length - 1; i++) {
    const [m1, r1] = CURVE[i], [m2, r2] = CURVE[i + 1]
    if (scaled <= m1 && scaled >= m2) {
      const t = (m1 - scaled) / (m1 - m2)
      return { scaled, rank: Math.round(Math.exp(Math.log(r1) + t * (Math.log(r2) - Math.log(r1)))) }
    }
  }
  return { scaled, rank: 230000 }
}
