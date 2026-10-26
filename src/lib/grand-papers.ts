// Grand Test papers: loading one paper from the database and turning it into exam questions.
import { Firestore, doc, getDoc } from "firebase/firestore"
import { shuffle, type GCredit, type GQ } from "@/lib/grand"

export type PaperMeta = { id: string; n: number; title: string; count: number; durationMin: number; free: boolean; subjects?: { name: string; n: number }[]; hasImages?: boolean; updatedAt?: number }

const norm = (s: string) => s.toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, " ").trim()
const slug = (s: string) => norm(s).replace(/ /g, "-")

/** Matches a paper's subject name to one of the app's subjects so mistakes still reach Daily review. */
export function matchSubject(name: string, subjects: { id: string; name: string }[]): { id: string; name: string } {
  const n = norm(name)
  const exact = subjects.find((s) => norm(s.name) === n || norm(s.id) === n || s.id === slug(name))
  if (exact) return { id: exact.id, name }
  const loose = subjects.find((s) => { const m = norm(s.name); return m.length > 3 && n.length > 3 && (m.includes(n) || n.includes(m)) })
  if (loose) return { id: loose.id, name }
  return { id: slug(name) || "general", name }
}

export async function loadPaper(db: Firestore, meta: PaperMeta, subjects: { id: string; name: string }[]): Promise<{ qs: GQ[]; credits: GCredit[]; minutes: number }> {
  const snap = await getDoc(doc(db, "grandPaperQs", meta.id))
  if (!snap.exists()) throw new Error("This paper is not available yet.")
  const d = snap.data() as any
  const cache = new Map<string, { id: string; name: string }>()
  const qs: GQ[] = ((d.qs || []) as any[]).map((x) => {
    const s = cache.get(x.subj) || matchSubject(x.subj, subjects)
    cache.set(x.subj, s)
    return { key: `${meta.id}/${x.n}`, subjectId: s.id, subjectName: x.subj, topic: meta.title, question: x.q, options: x.o, correct: x.c, explanation: x.e || "", qimgs: x.qi || [], eimgs: x.ei || [] }
  })
  return { qs, credits: (d.credits || []) as GCredit[], minutes: meta.durationMin || Math.round((qs.length * 210) / 200) }
}

const paperCache = new Map<string, any>()
async function paperData(db: Firestore, id: string): Promise<any | null> {
  if (paperCache.has(id)) return paperCache.get(id)
  const snap = await getDoc(doc(db, "grandPaperQs", id))
  const d = snap.exists() ? snap.data() : null
  if (d) paperCache.set(id, d)
  return d
}

/** Builds a custom paper only from the Grand Test papers: optional subject names, optional image-only. */
export async function sampleFromPapers(
  db: Firestore,
  metas: PaperMeta[],
  subjects: { id: string; name: string }[],
  opts: { total: number; names?: string[]; imageOnly?: boolean },
): Promise<{ qs: GQ[]; credits: GCredit[] }> {
  const docs = await Promise.all(metas.map((m) => paperData(db, m.id).then((d) => ({ m, d })).catch(() => ({ m, d: null as any }))))
  const want = opts.names && opts.names.length ? new Set(opts.names.map(norm)) : null
  const pool: { q: GQ; pid: string; sn: number }[] = []
  const subjCache = new Map<string, { id: string; name: string }>()
  for (const { m, d } of docs) {
    if (!d) continue
    for (const x of (d.qs || []) as any[]) {
      if (want && !want.has(norm(String(x.subj || "")))) continue
      if (opts.imageOnly && !(x.qi && x.qi.length)) continue
      const s = subjCache.get(x.subj) || matchSubject(x.subj, subjects)
      subjCache.set(x.subj, s)
      pool.push({ pid: m.id, sn: x.n, q: { key: m.id + "/" + x.n, subjectId: s.id, subjectName: x.subj, topic: m.title, question: x.q, options: x.o, correct: x.c, explanation: x.e || "", qimgs: x.qi || [], eimgs: x.ei || [] } })
    }
  }
  // Balance across subjects, then trim to the requested size.
  const by = new Map<string, typeof pool>()
  shuffle(pool).forEach((p) => { const l = by.get(p.q.subjectName) || []; l.push(p); by.set(p.q.subjectName, l) })
  const picked: typeof pool = []
  let progressed = true
  while (picked.length < opts.total && progressed) {
    progressed = false
    for (const l of by.values()) { const p = l.pop(); if (p && picked.length < opts.total) { picked.push(p); progressed = true } }
  }
  const final = shuffle(picked)
  const credits: GCredit[] = []
  final.forEach((p, k) => { ((docs.find((x) => x.m.id === p.pid)?.d?.credits || []) as GCredit[]).filter((c) => c.n === p.sn).forEach((c) => credits.push({ ...c, n: k + 1 })) })
  return { qs: final.map((p) => p.q), credits }
}
