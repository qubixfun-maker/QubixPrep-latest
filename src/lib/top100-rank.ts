// Ranks Rapid Revision Notes topics by how much the exams ask about them.
// Used by the admin "Build Top 100" tool, with two kinds of questions: the exam question bank files
// (every question comes with the number of times it was repeated in past exams) or the long answers stored in the app.
import { tokens, similarity, type NotesLink } from "@/lib/top100-link"

export type ExamQ = { text: string; w: number; chapter?: string }
export type NoteTopicIn = { name: string; chapterTitle: string; link: NotesLink; depth?: number }
export type Ranked = { key: string; name: string; chapterTitle: string; link: NotesLink; score: number; questions: number; asked: number; samples: string[] }
export type Gap = { label: string; score: number; asked: number; samples: string[] }

const flat = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "")

// Words that open an exam question or head a section of a note, and so say nothing about WHICH topic it is.
// They are stemmed the same way as the text they are compared with.
const stemSet = (words: string[]) => new Set(words.flatMap((w) => tokens(w)))
export const FILLER = stemSet(["describe", "discuss", "explain", "write", "note", "notes", "short", "briefly", "enumerate", "classify", "define", "mention", "list", "outline", "give", "what", "how", "why", "mcq", "marks", "etc", "example", "examples", "diagram", "draw", "labeled", "labelled", "neat", "add", "its", "their", "name", "following", "short answer", "essay", "question", "questions", "write short note"])
// section headings that repeat under every disease: "Clinical features", "Blood supply", "Management" ...
const GENERIC = stemSet(["clinical", "features", "feature", "diagnosis", "diagnostic", "criteria", "management", "treatment", "complications", "complication", "etiology", "etiopathogenesis", "pathogenesis", "pathophysiology", "pathology", "investigations", "investigation", "indications", "indication", "contraindications", "causes", "cause", "symptoms", "symptom", "signs", "sign", "classification", "definition", "introduction", "prevention", "control", "principles", "principle", "anatomy", "applied", "supply", "blood", "nerve", "lymphatic", "drainage", "relations", "relation", "structure", "function", "functions", "types", "type", "overview", "assessment", "approach", "role", "importance", "significance", "differential", "staging", "grading", "prognosis", "epidemiology", "incidence", "risk", "factors", "factor", "measures", "common", "important", "management and prevention", "surgical", "medical", "conservative", "operative", "procedure", "techniques", "technique", "mechanism", "action", "uses", "adverse", "effects", "effect"])
// chapter titles that name a whole area, not one topic
const BROAD = stemSet(["diseases", "disease", "disorders", "disorder", "injuries", "injury", "tumours", "tumors", "tumor", "tumour", "infections", "infection", "general", "miscellaneous", "systems", "system", "examination", "procedures", "operations", "emergencies", "overview", "basics", "fundamentals", "concept", "concepts", "introduction", "principles"])

/** Question type -> weight: a long essay says more about a topic's importance than a one-line short answer. */
export const TYPE_WEIGHT: Record<string, number> = { l: 3, e: 2, s: 1 }

type Cand = NoteTopicIn & { tk: string[]; kind: "topic" | "chapter" }

const keep = (w: string) => !FILLER.has(w) && !GENERIC.has(w)
const distinctive = (name: string) => tokens(name).filter(keep)
const worthy = (tk: string[]) => tk.length >= 2 || (tk.length === 1 && tk[0].length >= 5)

/**
 * What a question can be matched to: a specific topic of a note, or a whole chapter that is about one thing
 * ("Acute Rhinosinusitis"). Section headings that repeat under every disease are left out, since a question about
 * "management" belongs to a disease, not to a heading.
 */
export function usableTopics(rows: NoteTopicIn[]): Cand[] {
  const out: Cand[] = []
  const seen = new Map<string, Set<string>>()
  const chapters = new Map<string, NoteTopicIn>()
  rows.forEach((t) => {
    const tk = distinctive(t.name)
    if (worthy(tk)) {
      out.push({ ...t, tk, kind: "topic" })
      const k = tk.join(" "); (seen.get(k) || seen.set(k, new Set()).get(k)!).add(t.link.chapterId)
    }
    if (!chapters.has(t.link.chapterId)) chapters.set(t.link.chapterId, t)
  })
  chapters.forEach((t) => {
    const all = tokens(t.chapterTitle)
    if (all.some((w) => BROAD.has(w))) return
    const tk = all.filter(keep)
    if (!worthy(tk)) return
    out.push({ name: t.chapterTitle, chapterTitle: t.chapterTitle, link: { ...t.link, topicIndex: 0 }, tk, kind: "chapter" })
  })
  // a name that recurs in many chapters is a heading, not a topic
  return out.filter((t) => t.kind === "chapter" || (seen.get(t.tk.join(" "))?.size || 0) < 3)
}

export function rankTopics(questions: ExamQ[], rows: NoteTopicIn[], fillTo = 0): { ranked: Ranked[]; gaps: Gap[] } {
  const usable = usableTopics(rows)
  const score = new Map<string, Ranked>()
  const gapMap = new Map<string, Gap>()

  questions.forEach((q) => {
    const qs = new Set(tokens(q.text))
    const qcore = Array.from(new Set(tokens(q.text).filter(keep)))
    // a candidate must be in the question AND make up most of what the question is about
    const hits = usable.filter((t) => t.tk.filter((w) => qs.has(w)).length / t.tk.length >= 0.85 && qcore.length > 0 && t.tk.length / qcore.length >= 0.5)
    if (!hits.length) {
      // asked about, but nothing in the notes covers it. Short, topic-like questions only ("MacEwen's triangle").
      const core = tokens(q.text).filter(keep)
      if (core.length >= 1 && core.length <= 5) {
        const key = [...core].sort().join(" ")
        const g = gapMap.get(key) || { label: q.text.replace(/\.$/, ""), score: 0, asked: 0, samples: [] }
        g.score += q.w; g.asked++
        if (g.samples.length < 3 && !g.samples.includes(q.text)) g.samples.push(q.text)
        gapMap.set(key, g)
      }
      return
    }
    // the most specific match wins; a topic beats the chapter it sits in
    const best = Math.max(...hits.map((h) => h.tk.length))
    let picked = hits.filter((h) => h.tk.length === best)
    picked.sort((a, b) => similarity(q.text, b.name) - similarity(q.text, a.name) || (q.chapter ? similarity(q.chapter, b.chapterTitle) - similarity(q.chapter, a.chapterTitle) : 0))
    picked = picked.slice(0, 1)
    picked.forEach((t) => {
      const key = `${t.link.chapterId}|${t.link.topicIndex}|${t.kind}`
      const r = score.get(key) || { key, name: t.name, chapterTitle: t.chapterTitle, link: t.link, score: 0, questions: 0, asked: 0, samples: [] }
      // a topic from a chapter that matches the question's chapter is a better fit
      const fit = q.chapter && similarity(q.chapter, t.chapterTitle) >= 0.5 ? 1.25 : 1
      r.score += q.w * fit; r.questions++
      if (r.samples.length < 4) r.samples.push(q.text)
      score.set(key, r)
    })
  })
  // one entry per name, and at most two per chapter so one disease cannot fill the list
  const byName = new Map<string, Ranked>()
  Array.from(score.values()).forEach((r) => { const k = flat(r.name); const o = byName.get(k); if (!o || r.score > o.score) byName.set(k, r) })
  const sorted = Array.from(byName.values()).sort((a, b) => b.score - a.score || b.questions - a.questions)
  const perChapter = new Map<string, number>()
  const ranked = sorted.filter((r) => { const n = (perChapter.get(r.link.chapterId) || 0) + 1; perChapter.set(r.link.chapterId, n); return n <= 2 })
  if (fillTo > ranked.length) fillRanked(ranked, questions, rows, usable, fillTo)
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

/**
 * Tops the list up to `n` when strict matching finds fewer topics than wanted: questions that matched nothing are
 * linked to their closest note topic (looser match), then whole chapters are added by how much the exams ask from them.
 */
function fillRanked(ranked: Ranked[], questions: ExamQ[], rows: NoteTopicIn[], usable: Cand[], n: number) {
  const have = new Set(ranked.map((r) => flat(r.name)))
  const add = (r: Ranked) => { const k = flat(r.name); if (have.has(k)) return; have.add(k); ranked.push(r) }
  const loose = new Map<string, Ranked>()
  const chapterW = new Map<string, number>()
  const chapterRow = new Map<string, NoteTopicIn>()
  rows.forEach((t) => { if (!chapterRow.has(t.link.chapterId)) chapterRow.set(t.link.chapterId, t) })
  const pool = rows.filter((t) => t.name && tokens(t.name).filter(keep).length >= 1)
  questions.forEach((q) => {
    let best: NoteTopicIn | null = null, bs = 0
    for (const t of pool) { const sc = similarity(q.text, t.name) + (q.chapter ? 0.15 * similarity(q.chapter, t.chapterTitle) : 0); if (sc > bs) { bs = sc; best = t } }
    if (best && bs >= 0.45) {
      const key = `${best.link.chapterId}|${best.link.topicIndex}`
      const r = loose.get(key) || { key, name: best.name, chapterTitle: best.chapterTitle, link: best.link, score: 0, questions: 0, asked: 0, samples: [] }
      r.score += q.w; r.questions++; if (r.samples.length < 4) r.samples.push(q.text); loose.set(key, r)
    }
    if (q.chapter) {
      let bc: NoteTopicIn | null = null, cs = 0
      chapterRow.forEach((t) => { const sc = similarity(q.chapter!, t.chapterTitle); if (sc > cs) { cs = sc; bc = t } })
      if (bc && cs >= 0.5) chapterW.set((bc as NoteTopicIn).link.chapterId, (chapterW.get((bc as NoteTopicIn).link.chapterId) || 0) + q.w)
    }
  })
  const perChapter = new Map<string, number>()
  ranked.forEach((r) => perChapter.set(r.link.chapterId, (perChapter.get(r.link.chapterId) || 0) + 1))
  Array.from(loose.values()).sort((a, b) => b.score - a.score).forEach((r) => {
    if (ranked.length >= n) return
    const c = perChapter.get(r.link.chapterId) || 0
    if (c >= 4) return
    perChapter.set(r.link.chapterId, c + 1); add(r)
  })
  // still short: whole chapters, most-asked first
  Array.from(chapterRow.values()).sort((a, b) => (chapterW.get(b.link.chapterId) || 0) - (chapterW.get(a.link.chapterId) || 0)).forEach((t) => {
    if (ranked.length >= n) return
    add({ key: `ch|${t.link.chapterId}`, name: t.chapterTitle, chapterTitle: t.chapterTitle, link: { ...t.link, topicIndex: 0 }, score: chapterW.get(t.link.chapterId) || 0, questions: 0, asked: 0, samples: [] })
  })
  // last resort for small subjects: remaining topics of the most-asked chapters
  pool.slice().sort((a, b) => (chapterW.get(b.link.chapterId) || 0) - (chapterW.get(a.link.chapterId) || 0)).forEach((t) => {
    if (ranked.length >= n) return
    add({ key: `t|${t.link.chapterId}|${t.link.topicIndex}`, name: t.name, chapterTitle: t.chapterTitle, link: t.link, score: 0, questions: 0, asked: 0, samples: [] })
  })
}
