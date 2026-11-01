// Ranks Rapid Revision Notes topics by how much the exams ask about them.
// Used by the admin "Build Top 100" tool, with two kinds of questions: the exam question bank files
// (every question comes with the number of times it was repeated in past exams) or the long answers stored in the app.
import { tokens, similarity, type NotesLink } from "@/lib/top100-link"

export type ExamQ = { text: string; w: number; chapter?: string }
export type NoteTopicIn = { name: string; chapterTitle: string; link: NotesLink; depth?: number }
export type Ranked = { key: string; name: string; chapterTitle: string; link: NotesLink; score: number; questions: number; asked: number; samples: string[] }
export type Gap = { label: string; score: number; asked: number; samples: string[] }

const flat = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "")

// words that open an exam question but say nothing about the topic
export const FILLER = new Set(["describe", "discuss", "explain", "write", "note", "notes", "short", "briefly", "enumerate", "classify", "define", "mention", "list", "outline", "give", "what", "how", "why", "mcq", "marks", "etc", "example", "examples", "management", "treatment", "causes", "features", "clinical", "diagnosis", "diagram", "draw", "labeled", "labelled", "neat", "add", "its", "their", "significance", "importance", "applied", "anatomy", "name", "types", "type", "following", "relations", "relation", "supply"])

/** Question type -> weight: a long essay says more about a topic's importance than a one-line short answer. */
export const TYPE_WEIGHT: Record<string, number> = { l: 3, e: 2, s: 1 }

type Usable = NoteTopicIn & { tk: string[] }

/** Topics worth ranking: not a heading that recurs in many chapters ("Classification") and not a single vague word. */
export function usableTopics(rows: NoteTopicIn[]): Usable[] {
  const all: Usable[] = []
  rows.forEach((t) => {
    const tk = tokens(t.name).filter((w) => !FILLER.has(w))
    if (tk.length) all.push({ ...t, tk })
  })
  const seen = new Map<string, Set<string>>()
  all.forEach((t) => { const k = t.tk.join(" "); (seen.get(k) || seen.set(k, new Set()).get(k)!).add(t.link.chapterId) })
  return all.filter((t) => (seen.get(t.tk.join(" "))?.size || 0) < 3 && (t.tk.length >= 2 || t.tk[0].length >= 6))
}

export function rankTopics(questions: ExamQ[], rows: NoteTopicIn[]): { ranked: Ranked[]; gaps: Gap[] } {
  const usable = usableTopics(rows)
  const score = new Map<string, Ranked>()
  const gapMap = new Map<string, Gap>()

  questions.forEach((q) => {
    const qs = new Set(tokens(q.text))
    const hits = usable.filter((t) => t.tk.filter((w) => qs.has(w)).length / t.tk.length >= 0.85)
    if (!hits.length) {
      // asked about, but nothing in the notes covers it. Short, topic-like questions only ("MacEwen's triangle").
      const core = tokens(q.text).filter((w) => !FILLER.has(w))
      if (core.length >= 1 && core.length <= 5) {
        const key = [...core].sort().join(" ")
        const g = gapMap.get(key) || { label: q.text.replace(/\.$/, ""), score: 0, asked: 0, samples: [] }
        g.score += q.w; g.asked++
        if (g.samples.length < 3 && !g.samples.includes(q.text)) g.samples.push(q.text)
        gapMap.set(key, g)
      }
      return
    }
    // the most specific topic wins ("bioavailability and bioequivalence" beats "bioavailability")
    const best = Math.max(...hits.map((h) => h.tk.length))
    let picked = hits.filter((h) => h.tk.length === best)
    // when the question's own chapter is known, prefer the topic that sits in a similar chapter
    if (picked.length > 1 && q.chapter) picked = [...picked].sort((a, b) => similarity(q.chapter!, b.chapterTitle) - similarity(q.chapter!, a.chapterTitle))
    picked = picked.slice(0, 2)
    picked.forEach((t) => {
      const key = `${t.link.chapterId}|${t.link.topicIndex}`
      const r = score.get(key) || { key, name: t.name, chapterTitle: t.chapterTitle, link: t.link, score: 0, questions: 0, asked: 0, samples: [] }
      // a topic from a chapter that matches the question's chapter is a better fit
      const fit = q.chapter && similarity(q.chapter, t.chapterTitle) >= 0.5 ? 1.25 : 1
      r.score += q.w * fit; r.questions++
      if (r.samples.length < 4) r.samples.push(q.text)
      score.set(key, r)
    })
  })
  // one entry per topic name (a topic can sit in two chapters); keep the better scoring one
  const byName = new Map<string, Ranked>()
  Array.from(score.values()).forEach((r) => { const k = flat(r.name); const o = byName.get(k); if (!o || r.score > o.score) byName.set(k, r) })
  const ranked = Array.from(byName.values()).sort((a, b) => b.score - a.score || b.questions - a.questions)
  const gaps = Array.from(gapMap.values()).sort((a, b) => b.score - a.score).slice(0, 25)
  return { ranked, gaps }
}

export type BankRow = { c: string; t: "l" | "e" | "s"; q: string; r: number }
/** Exam bank rows -> questions. A question that came up 4 times counts four times as much. */
export const fromBank = (rows: BankRow[]): ExamQ[] => rows.map((x) => ({ text: x.q, w: (TYPE_WEIGHT[x.t] || 1) * Math.max(1, x.r), chapter: x.c }))

/** Which exam question bank file belongs to a subject name, if any. */
export function bankKeyFor(name: string): string | null {
  const n = flat(name)
  if (n.includes("community")) return "community-medicine"
  if (n.includes("forensic")) return "forensic-medicine"
  if (n.includes("anatomy")) return "anatomy"
  if (n.includes("physiology")) return "physiology"
  if (n === "ent" || n.includes("otorhino") || n.startsWith("entear") || n.startsWith("earnose")) return "ent"
  if (n.includes("ophthal")) return "ophthalmology"
  if (n.includes("orthop")) return "orthopaedics"
  if (n.includes("paediatric") || n.includes("pediatric")) return "paediatrics"
  if (n.includes("obstet") || n.includes("gynae") || n.includes("gynec") || n.includes("obg")) return "obstetrics-gynaecology"
  if (n.includes("surgery")) return "surgery"
  if (n.includes("medicine")) return "medicine"
  return null
}

export const BANK_LOADERS: Record<string, () => Promise<{ default: BankRow[] }>> = {
  "anatomy": () => import("@/data/question-bank/anatomy.json") as any,
  "physiology": () => import("@/data/question-bank/physiology.json") as any,
  "forensic-medicine": () => import("@/data/question-bank/forensic-medicine.json") as any,
  "ent": () => import("@/data/question-bank/ent.json") as any,
  "surgery": () => import("@/data/question-bank/surgery.json") as any,
  "community-medicine": () => import("@/data/question-bank/community-medicine.json") as any,
  "ophthalmology": () => import("@/data/question-bank/ophthalmology.json") as any,
  "orthopaedics": () => import("@/data/question-bank/orthopaedics.json") as any,
  "paediatrics": () => import("@/data/question-bank/paediatrics.json") as any,
  "obstetrics-gynaecology": () => import("@/data/question-bank/obstetrics-gynaecology.json") as any,
  "medicine": () => import("@/data/question-bank/medicine.json") as any,
}
