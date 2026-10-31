// Links a Top 100 topic to its own page in Rapid Revision Notes.
// A link points at one topic inside one chapter: top100Pages/{id}.notesLink = { subjectId, textbookId, chapterId, topicIndex }.
// topicIndex is the position in the chapter's topic list, the same number the notes pages use in their web address.

export type NotesLink = { subjectId: string; textbookId: string; chapterId: string; topicIndex: number }

/** Where a Top 100 topic opens: its notes page, with a flag so the Back button returns to Top 100. */
export const notesHref = (l: NotesLink) => `/notes/${l.subjectId}/${l.textbookId}/${l.chapterId}/${l.topicIndex}?from=top-100`

export function readNotesLink(x: any): NotesLink | undefined {
  const l = x?.notesLink
  if (!l || !l.subjectId || !l.textbookId || !l.chapterId) return undefined
  const topicIndex = Number(l.topicIndex)
  if (!Number.isInteger(topicIndex) || topicIndex < 0) return undefined
  return { subjectId: String(l.subjectId), textbookId: String(l.textbookId), chapterId: String(l.chapterId), topicIndex }
}

/* ---------------- matching a Top 100 title to a note topic (used by the admin linking tool) ---------------- */

const STOP = new Set(["of", "the", "and", "in", "to", "a", "an", "with", "for", "on", "its", "by", "at", "as", "or", "from", "vs", "versus", "is", "are"])

function stem(w: string) {
  if (w.length > 4 && w.endsWith("ies")) return w.slice(0, -3) + "y"
  if (w.length > 4 && w.endsWith("s") && !/(ss|us|is)$/.test(w)) return w.slice(0, -1)
  return w
}

export function tokens(s: string): string[] {
  return (s || "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .split(" ")
    .filter((w) => w && !STOP.has(w))
    .map(stem)
}

const norm = (s: string) => tokens(s).join(" ")

/** 0 to 1: how closely two topic names agree. */
export function similarity(a: string, b: string): number {
  const A = tokens(a), B = tokens(b)
  if (!A.length || !B.length) return 0
  const na = A.join(" "), nb = B.join(" ")
  if (na === nb) return 1
  const sa = new Set(A), sb = new Set(B)
  let inter = 0
  sa.forEach((w) => { if (sb.has(w)) inter++ })
  const union = sa.size + sb.size - inter
  const jaccard = inter / union
  const contain = inter / Math.min(sa.size, sb.size)
  let score = 0.55 * jaccard + 0.45 * contain
  // one name sitting whole inside the other ("Cardiac cycle" in "Cardiac cycle and heart sounds") is a strong sign
  if (na.includes(nb) || nb.includes(na)) score = Math.max(score, 0.82)
  return Math.min(0.99, score)
}

export type NoteTopicRef = NotesLink & { name: string; chapterTitle: string }
export type Candidate = NoteTopicRef & { score: number }

/** The best few note topics for a Top 100 title, best first. */
export function candidatesFor(title: string, pool: NoteTopicRef[], max = 6): Candidate[] {
  return pool
    .map((t) => ({ ...t, score: similarity(title, t.name) }))
    .filter((c) => c.score > 0.2)
    .sort((a, b) => b.score - a.score)
    .slice(0, max)
}

/** A match is trusted without a second look only when it is clearly the best and clearly close. */
export const CONFIDENT = 0.7
export function isConfident(c: Candidate[]): boolean {
  if (!c.length || c[0].score < CONFIDENT) return false
  return c.length === 1 || c[0].score - c[1].score >= 0.08 || c[0].score >= 0.95
}

export { norm as normalizeTitle }
