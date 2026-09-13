"use client"

import { useMemo, use } from "react"
import { useDoc, useFirestore } from "@/firebase"
import { doc } from "firebase/firestore"
import { ChevronLeft, ChevronRight, Loader2, BookOpen } from "lucide-react"
import Link from "next/link"
import { useRequireAuth } from "@/hooks/use-require-auth"
import { getSubjectColor } from "@/lib/subject-colors"

export default function NotesTopicListPage({ params }: { params: Promise<{ subjectId: string; textbookId: string; chapterId: string }> }) {
  const { subjectId, textbookId, chapterId } = use(params)
  const db = useFirestore()

  const subjectRef = useMemo(() => (!db ? null : doc(db, 'subjects', subjectId)), [db, subjectId])
  const { data: subject, loading: subjectLoading } = useDoc(subjectRef)

  const docKey = `${textbookId}__${chapterId}`
  const notesRef = useMemo(() => (!db ? null : doc(db, 'subjects', subjectId, 'textNotes', docKey)), [db, subjectId, docKey])
  const { data: notes, loading: notesLoading } = useDoc(notesRef)

  const { checkingAuth } = useRequireAuth()
  const color = getSubjectColor(subject ? (subject as any).name : subjectId)

  if (checkingAuth || subjectLoading || notesLoading) {
    return <div className="h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 text-primary animate-spin" /></div>
  }

  const topics = ((notes as any)?.topics || []) as { name: string; markdown: string; depth?: number }[]
  const topLevelCount = topics.filter((t) => !t.depth).length

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-12 space-y-8 animate-in slide-in-from-right-4 duration-700">
      <div>
        <Link href={`/dashboard`} className={`text-xs font-bold uppercase tracking-widest ${color.text} flex items-center gap-1 mb-4 hover:underline w-fit`}>
          <ChevronLeft className="h-3 w-3" /> Back
        </Link>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{(notes as any)?.chapterTitle || 'Notes'}</h1>
        <p className="text-muted-foreground mt-2">{subject ? (subject as any).name : ''} &middot; {topLevelCount} topic{topLevelCount === 1 ? '' : 's'}</p>
      </div>

      {topics.length > 0 ? (
        <div className="space-y-2">
          {topics.map((topic, i) => {
            const depth = topic.depth || 0
            return (
              <Link
                key={i}
                href={`/notes/${subjectId}/${textbookId}/${chapterId}/${i}`}
                style={{ marginLeft: `${depth * 1.5}rem` }}
                className={`flex items-center justify-between gap-4 rounded-2xl glass border ${color.border} p-5 hover:bg-white/5 transition-colors ${depth > 0 ? 'opacity-90' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <BookOpen className={`h-5 w-5 shrink-0 ${color.text}`} />
                  <span className={depth > 0 ? 'text-sm' : 'font-medium'}>{topic.name}</span>
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
              </Link>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-16 text-muted-foreground rounded-2xl glass border-none">
          No notes found for this chapter yet.
        </div>
      )}
    </div>
  )
}
