"use client"
// Shows a topic's note: the new QubixPrep exam-notes version when one is published
// (admins also see drafts) as a clean full-width reader, otherwise the original note exactly as before.
import type { ReactNode } from "react"
import { NoteBody } from "@/components/notes/note-body"
import { RichReader } from "@/components/notes/rich-reader"

export const hasVisibleRich = (topic: any, isAdmin: boolean) => !!topic?.rich && (topic.rich.status === "published" || isAdmin)

export function TopicBody({ topic, topicNo, subjectName, borderClass, isAdmin, protectWith, title, backHref, showOriginal, onToggleOriginal, adminExtras }: {
  topic: any; topicNo: number; subjectName?: string; borderClass?: string; isAdmin: boolean; protectWith?: string
  title: string; backHref: string; showOriginal: boolean; onToggleOriginal: () => void; adminExtras?: ReactNode
}) {
  const rich = topic?.rich
  if (!hasVisibleRich(topic, isAdmin)) return <NoteBody markdown={topic.markdown} borderClass={borderClass} protectWith={protectWith} />
  if (showOriginal && isAdmin) {
    return (
      <div className="space-y-3">
        <button onClick={onToggleOriginal} className="rounded-full border px-3 py-1 text-xs font-bold hover:bg-muted">Show new format</button>
        <NoteBody markdown={topic.markdown} borderClass={borderClass} protectWith={protectWith} />
      </div>
    )
  }
  return (
    <RichReader
      note={rich} title={title} backHref={backHref} subjectName={subjectName} topicNo={topicNo}
      protectWith={protectWith} isAdmin={isAdmin}
      adminExtras={<>
        <span className={`rounded-full px-2.5 py-1 font-bold ${rich.status === "published" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
          {rich.status === "published" ? "New format: published" : "New format: draft (only admins see this)"}
        </span>
        <button onClick={onToggleOriginal} className="rounded-full border bg-white px-3 py-1 font-bold">Show original note</button>
        {adminExtras}
      </>}
    />
  )
}
