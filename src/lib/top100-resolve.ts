// Finds the Rapid Revision Notes topic for Top 100 titles that an admin has not linked by hand.
import { collection, getDocs, query, where, type Firestore } from "firebase/firestore"
import { candidatesFor, similarity, type NoteTopicRef, type NotesLink } from "@/lib/top100-link"

const flat = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "")

export async function resolveTop100Links(
  db: Firestore,
  subjectKey: string,
  subjectName: string,
  rows: { id: string; title: string }[],
): Promise<Record<string, NotesLink>> {
  const subs = await getDocs(collection(db, "subjects"))
  const list = subs.docs.map((d) => ({ id: d.id, name: String((d.data() as any).name || "") }))
  const k = flat(subjectKey), n = flat(subjectName)
  const hit =
    list.find((s) => flat(s.id) === k || flat(s.name) === k || flat(s.name) === n) ||
    list.find((s) => flat(s.name).includes(n) || n.includes(flat(s.name)) || flat(s.name).includes(k))
  if (!hit) return {}
  const sn = await getDocs(query(collection(db, "notesIndex"), where("subjectId", "==", hit.id)))
  const pool: NoteTopicRef[] = []
  const chapters: NoteTopicRef[] = []
  sn.docs.forEach((d) => {
    const x = d.data() as any
    const base = { subjectId: String(x.subjectId), textbookId: String(x.textbookId), chapterId: String(x.chapterId) }
    chapters.push({ ...base, topicIndex: 0, name: String(x.chapterTitle || ""), chapterTitle: String(x.chapterTitle || "") })
    ;(Array.isArray(x.topics) ? x.topics : []).forEach((t: any, i: number) => {
      if (t?.name) pool.push({ ...base, topicIndex: i, name: String(t.name), chapterTitle: String(x.chapterTitle || "") })
    })
  })
  const out: Record<string, NotesLink> = {}
  rows.forEach((r) => {
    const best = candidatesFor(r.title, pool)[0]
    if (best && best.score >= 0.5) { out[r.id] = { subjectId: best.subjectId, textbookId: best.textbookId, chapterId: best.chapterId, topicIndex: best.topicIndex }; return }
    // no topic is close: open the chapter that best fits instead of a picture
    let top: NoteTopicRef | null = null, ts = 0
    chapters.forEach((c) => { const sc = similarity(r.title, c.name); if (sc > ts) { ts = sc; top = c } })
    if (top && ts >= 0.4) { const t = top as NoteTopicRef; out[r.id] = { subjectId: t.subjectId, textbookId: t.textbookId, chapterId: t.chapterId, topicIndex: 0 } }
  })
  return out
}
