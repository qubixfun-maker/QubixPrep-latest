// Grand Test papers: loading one paper from the database and turning it into exam questions.
import { Firestore, doc, getDoc } from "firebase/firestore"
import type { GCredit, GQ } from "@/lib/grand"

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
