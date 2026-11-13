// Shared helpers for the Video Lectures feature (collection: lectures).
export type Lecture = {
  id: string
  subjectId: string
  subjectName: string
  title: string
  order: number
  durationSec: number
  videoPath: string
  notesPath?: string
  free?: boolean
  status: 'published' | 'draft'
  sizeBytes?: number
  /** Optional link to a topic note (subjects/{subjectId}/textNotes/{docKey}, topics[topicIndex]) shown beside the video. */
  noteRef?: { docKey: string; topicIndex: number; label: string }
  createdAt?: number
}

export function fmtDuration(sec?: number) {
  if (!sec || sec <= 0) return ''
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = Math.floor(sec % 60)
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` : `${m}:${String(s).padStart(2, '0')}`
}

export function sortLectures<T extends { order?: number; title?: string }>(list: T[]): T[] {
  return [...list].sort((a, b) => (a.order ?? 9999) - (b.order ?? 9999) || String(a.title).localeCompare(String(b.title)))
}
