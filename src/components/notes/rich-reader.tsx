"use client"
// Clean PDF-style reader for a RichNote (shell: ZoomReader). No buttons; admins just see a small "draft" label.
import { RichNoteView } from "@/components/notes/rich-note-view"
import { ZoomReader } from "@/components/notes/zoom-reader"
import type { RichNote } from "@/lib/richnotes/schema"

export function RichReader({ note, subjectName, topicNo, protectWith, isAdmin = false }: {
  note: RichNote; subjectName?: string; topicNo?: number; protectWith?: string; isAdmin?: boolean
}) {
  const draft = isAdmin && (note as any).status !== "published"
  return (
    <ZoomReader badge={draft ? <span className="rounded-full bg-amber-100 px-3 py-1 text-[11px] font-bold text-amber-800">Draft: only admins see this</span> : null}>
      <RichNoteView clean note={note} subjectName={subjectName} topicNo={topicNo} protectWith={protectWith} allowPrint={false} />
    </ZoomReader>
  )
}
