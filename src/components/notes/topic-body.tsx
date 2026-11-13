"use client"
// Shows a topic's note: the new QubixPrep exam-notes version when one is published
// (admins also see drafts), otherwise the original note exactly as before.
import { useState } from "react"
import { NoteBody } from "@/components/notes/note-body"
import { RichNoteView } from "@/components/notes/rich-note-view"

export function TopicBody({ topic, topicNo, subjectName, borderClass, isAdmin, protectWith }: {
  topic: any; topicNo: number; subjectName?: string; borderClass?: string; isAdmin: boolean; protectWith?: string
}) {
  const [showOriginal, setShowOriginal] = useState(false)
  const rich = topic?.rich
  const visible = !!rich && (rich.status === "published" || isAdmin)
  if (!visible) return <NoteBody markdown={topic.markdown} borderClass={borderClass} protectWith={protectWith} />
  return (
    <div className="space-y-3">
      {isAdmin && (
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className={`rounded-full px-2.5 py-1 font-bold ${rich.status === "published" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
            {rich.status === "published" ? "New format: published" : "New format: draft (only admins see this)"}
          </span>
          <button onClick={() => setShowOriginal((v) => !v)} className="rounded-full border px-3 py-1 font-bold hover:bg-muted">{showOriginal ? "Show new format" : "Show original note"}</button>
        </div>
      )}
      {showOriginal && isAdmin
        ? <NoteBody markdown={topic.markdown} borderClass={borderClass} protectWith={protectWith} />
        : <RichNoteView note={rich} subjectName={subjectName} topicNo={topicNo} protectWith={protectWith} allowPrint={isAdmin} />}
    </div>
  )
}
