// Account-synced study data: spaced repetition (SRS), wrong-answer notebook and activity stats.
// Everything lives under users/{uid}/ so it follows the student across devices.
import {
  Firestore, collection, deleteDoc, doc, getCountFromServer, getDoc, getDocs, increment, limit, orderBy, query, setDoc, where,
} from "firebase/firestore"

export type Card = { front: string; back: string }
export type SrsItem = {
  id: string
  kind: "flashcard" | "qbank"
  subjectId: string
  subjectName?: string
  chapter?: string
  front?: string
  back?: string
  q?: { question: string; options: string[]; correct: number; explanation?: string; topic?: string }
  due: number
  interval: number
  ease: number
  reps: number
  lapses: number
  updated: number
}

const DAY = 86400000

export function hashId(s: string) {
  let h = 5381
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0
  return (h >>> 0).toString(36)
}
export function dayKey(d = new Date()) {
  const m = String(d.getMonth() + 1).padStart(2, "0"), dd = String(d.getDate()).padStart(2, "0")
  return `${d.getFullYear()}-${m}-${dd}`
}
const safeKey = (s: string) => (s || "General").replace(/[^A-Za-z0-9]+/g, "_").slice(0, 60)

// Simplified SM-2: a miss brings the card back in 10 minutes, a hit pushes it 1, 3, then ease-scaled days.
export function nextState(prev: Partial<SrsItem> | null, ok: boolean) {
  const now = Date.now()
  let ease = prev?.ease ?? 2.5, reps = prev?.reps ?? 0, interval = prev?.interval ?? 0, lapses = prev?.lapses ?? 0
  let due: number
  if (!ok) { lapses += 1; reps = 0; interval = 0; ease = Math.max(1.3, ease - 0.2); due = now + 10 * 60000 }
  else { reps += 1; interval = reps === 1 ? 1 : reps === 2 ? 3 : Math.round(Math.max(1, interval) * ease); ease = Math.min(3, ease + 0.05); due = now + interval * DAY }
  return { ease, reps, interval, lapses, due, updated: now }
}

const srsCol = (db: Firestore, uid: string) => collection(db, "users", uid, "srs")
const statsRef = (db: Firestore, uid: string) => doc(db, "users", uid, "progress", "stats")

async function upsert(db: Firestore, uid: string, id: string, base: Omit<SrsItem, "due" | "interval" | "ease" | "reps" | "lapses" | "updated" | "id">, ok: boolean) {
  const ref = doc(srsCol(db, uid), id)
  const snap = await getDoc(ref)
  const prev = snap.exists() ? (snap.data() as SrsItem) : null
  await setDoc(ref, { ...base, ...nextState(prev, ok) }, { merge: true })
}

function bumpStats(db: Firestore, uid: string, patch: { topic?: { subjectId: string; name: string }; ok?: boolean; kind: "q" | "f" }) {
  const day = dayKey()
  const d: any = { days: { [day]: patch.kind === "q" ? { q: increment(1), c: increment(patch.ok ? 1 : 0) } : { f: increment(1) } } }
  if (patch.kind === "q") {
    d.total = { a: increment(1), c: increment(patch.ok ? 1 : 0) }
    if (patch.topic) d.topics = { [safeKey(patch.topic.subjectId) + "__" + safeKey(patch.topic.name)]: { n: patch.topic.name, s: patch.topic.subjectId, a: increment(1), c: increment(patch.ok ? 1 : 0) } }
  }
  return setDoc(statsRef(db, uid), d, { merge: true })
}

/** Called when a flashcard is graded in study mode. */
export async function gradeFlashcard(db: Firestore, uid: string, c: { subjectId: string; subjectName?: string; chapter?: string; front: string; back: string }, ok: boolean) {
  const id = "f_" + hashId(c.subjectId + "|" + c.front)
  await Promise.all([
    upsert(db, uid, id, { kind: "flashcard", subjectId: c.subjectId, subjectName: c.subjectName || "", chapter: c.chapter || "", front: c.front, back: c.back }, ok),
    bumpStats(db, uid, { kind: "f" }),
  ])
}

/** Called for every QBank answer. Wrong answers go into the notebook and the review queue. */
export async function recordQbankAnswer(db: Firestore, uid: string, q: { id?: string; subjectId: string; topic: string; question: string; options: string[]; correct: number; explanation?: string }, picked: number) {
  const ok = picked === q.correct
  const jobs: Promise<any>[] = [bumpStats(db, uid, { kind: "q", ok, topic: { subjectId: q.subjectId, name: q.topic || "General" } })]
  if (!ok) {
    const id = "q_" + hashId(q.subjectId + "|" + q.question)
    jobs.push(upsert(db, uid, id, { kind: "qbank", subjectId: q.subjectId, q: { question: q.question, options: q.options.filter(Boolean), correct: q.correct, explanation: q.explanation || "", topic: q.topic } }, false))
  }
  await Promise.all(jobs)
}

export async function gradeSrs(db: Firestore, uid: string, item: SrsItem, ok: boolean) {
  await setDoc(doc(srsCol(db, uid), item.id), nextState(item, ok), { merge: true })
  await bumpStats(db, uid, item.kind === "flashcard" ? { kind: "f" } : { kind: "q", ok, topic: { subjectId: item.subjectId, name: item.q?.topic || "General" } })
}

export async function removeSrs(db: Firestore, uid: string, id: string) { await deleteDoc(doc(srsCol(db, uid), id)) }

export async function loadDue(db: Firestore, uid: string, max = 200): Promise<SrsItem[]> {
  const snap = await getDocs(query(srsCol(db, uid), where("due", "<=", Date.now()), orderBy("due"), limit(max)))
  return snap.docs.map((d) => ({ ...(d.data() as any), id: d.id }))
}
export async function loadNotebook(db: Firestore, uid: string): Promise<SrsItem[]> {
  const snap = await getDocs(query(srsCol(db, uid), where("kind", "==", "qbank"), limit(400)))
  return snap.docs.map((d) => ({ ...(d.data() as any), id: d.id })).sort((a, b) => b.updated - a.updated)
}
export async function countDue(db: Firestore, uid: string) {
  try { return (await getCountFromServer(query(srsCol(db, uid), where("due", "<=", Date.now())))).data().count } catch { return 0 }
}
export async function loadStats(db: Firestore, uid: string) {
  const s = await getDoc(statsRef(db, uid))
  return (s.exists() ? s.data() : {}) as { total?: { a: number; c: number }; topics?: Record<string, { n: string; s: string; a: number; c: number }>; days?: Record<string, { q?: number; c?: number; f?: number }> }
}

/** The Case of the Day on the home page: counts as today's activity, so it keeps the streak alive. */
export async function recordDailyCase(db: Firestore, uid: string, ok: boolean) { await bumpStats(db, uid, { kind: "q", ok }) }

/** Grand Test: one stats write for the whole paper; wrong answers (up to 60) go into the notebook and review queue. */
export async function recordBulk(db: Firestore, uid: string, items: { subjectId: string; topic: string; question: string; options: string[]; correct: number; explanation?: string; picked: number | null }[]) {
  const answered = items.filter((x) => x.picked !== null)
  if (!answered.length) return
  const ok = answered.filter((x) => x.picked === x.correct).length
  const topics: any = {}
  answered.forEach((x) => {
    const k = safeKey(x.subjectId) + "__" + safeKey(x.topic || "General")
    const t = (topics[k] ||= { n: x.topic || "General", s: x.subjectId, a: 0, c: 0 })
    t.a++; if (x.picked === x.correct) t.c++
  })
  const tp: any = {}
  Object.keys(topics).forEach((k) => { tp[k] = { n: topics[k].n, s: topics[k].s, a: increment(topics[k].a), c: increment(topics[k].c) } })
  await setDoc(statsRef(db, uid), { total: { a: increment(answered.length), c: increment(ok) }, topics: tp, days: { [dayKey()]: { q: increment(answered.length), c: increment(ok) } } }, { merge: true })
  const wrong = answered.filter((x) => x.picked !== x.correct).slice(0, 60)
  for (let i = 0; i < wrong.length; i += 10) {
    await Promise.all(wrong.slice(i, i + 10).map((q) => upsert(db, uid, "q_" + hashId(q.subjectId + "|" + q.question), { kind: "qbank", subjectId: q.subjectId, q: { question: q.question, options: q.options, correct: q.correct, explanation: q.explanation || "", topic: q.topic } }, false)))
  }
}
