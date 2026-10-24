// The light "notesIndex": chapter titles and topic names only (no note text), plus the free-sample flag.
// Lists and chapter pages read this, so they load fast; the heavy note text stays locked behind the plan rule.

export const DEFAULT_FREE_PER_SUBJECT = 2

export type IndexEntry = {
  subjectId: string
  textbookId: string
  chapterId: string
  chapterTitle: string
  topics: { name: string; depth: number }[]
  topicCount: number
  free: boolean
  updatedAt: number
}

/** The index document for a chapter has the same id as its note, with the subject in front. */
export const indexIdOf = (subjectId: string, noteDocId: string) => `${subjectId}__${noteDocId}`

/** Note documents are named "<textbook>__<chapter>". */
export function splitDocId(docId: string): { textbookId: string; chapterId: string } | null {
  const i = docId.indexOf("__")
  if (i < 0) return null
  return { textbookId: docId.slice(0, i), chapterId: docId.slice(i + 2) }
}

export function buildEntry(subjectId: string, docId: string, data: any, free: boolean, now = Date.now()): IndexEntry | null {
  const ids = splitDocId(docId)
  const textbookId = String(data?.textbookId || ids?.textbookId || "")
  const chapterId = String(data?.chapterId || ids?.chapterId || "")
  if (!textbookId || !chapterId) return null
  const topics = (Array.isArray(data?.topics) ? data.topics : []).map((t: any) => ({ name: String(t?.name || ""), depth: Number(t?.depth) || 0 }))
  return { subjectId, textbookId, chapterId, chapterTitle: String(data?.chapterTitle || chapterId), topics, topicCount: topics.length, free, updatedAt: now }
}

/**
 * Decides the free flag for every chapter of one subject.
 * Chapters that already have a flag keep it (so rebuilding never undoes your choices).
 * A subject seen for the first time gets its first few chapters (A to Z) as free samples; chapters added later start locked.
 */
export function decideFree(chapters: { id: string; title: string }[], existing: Record<string, boolean | undefined>, perSubject = DEFAULT_FREE_PER_SUBJECT): Record<string, boolean> {
  const brandNewSubject = chapters.every((c) => existing[c.id] === undefined)
  const sorted = [...chapters].sort((a, b) => a.title.localeCompare(b.title))
  const out: Record<string, boolean> = {}
  sorted.forEach((c, rank) => {
    const prior = existing[c.id]
    out[c.id] = prior !== undefined ? prior : brandNewSubject && rank < perSubject
  })
  return out
}
