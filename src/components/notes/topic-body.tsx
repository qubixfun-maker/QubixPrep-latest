"use client"
// Shows a topic's note: the new QubixPrep exam-notes version when one is published (admins also see drafts)
// as a clean PDF-style page, otherwise the original note exactly as before.
// Admins can open the original with ?original=1 on the address.
import { NoteBody } from "@/components/notes/note-body"
import { RichReader } from "@/components/notes/rich-reader"

export const hasVisibleRich = (topic: any, isAdmin: boolean) => !!topic?.rich && (topic.rich.status === "published" || isAdmin)

export function TopicBody({ topic, topicNo, subjectName, borderClass, isAdmin, protectWith }: {
  topic: any; topicNo: number; subjectName?: string; borderClass?: string; isAdmin: boolean; protectWith?: string
}) {
  if (!hasVisibleRich(topic, isAdmin)) return <NoteBody markdown={topic.markdown} borderClass={borderClass} protectWith={protectWith} />
  return <RichReader note={topic.rich} subjectName={subjectName} topicNo={topicNo} protectWith={protectWith} isAdmin={isAdmin} />
}
