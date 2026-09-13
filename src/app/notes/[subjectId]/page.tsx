"use client"

import { useMemo, use } from "react"
import { useDoc, useCollection, useFirestore } from "@/firebase"
import { doc, collection, query, orderBy } from "firebase/firestore"
import { ChevronRight, ChevronLeft, Loader2, BookOpen } from "lucide-react"
import Link from "next/link"
import { useRequireAuth } from "@/hooks/use-require-auth"
import { getSubjectColor } from "@/lib/subject-colors"

export default function NotesSubjectPage({ params }: { params: Promise<{ subjectId: string }> }) {
  const { subjectId } = use(params)
  const db = useFirestore()

  const subjectRef = useMemo(() => (!db ? null : doc(db, 'subjects', subjectId)), [db, subjectId])
  const { data: subject, loading: subjectLoading } = useDoc(subjectRef)

  const notesQuery = useMemo(
    () => (!db ? null : query(collection(db, 'subjects', subjectId, 'textNotes'), orderBy('chapterTitle', 'asc'))),
    [db, subjectId]
  )
  const { data: notesList, loading: notesLoading } = useCollection(notesQuery)

  const { checkingAuth } = useRequireAuth()
  const color = getSubjectColor(subject ? (subject as any).name : subjectId)

  if (checkingAuth || subjectLoading) return <div className="h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 text-primary animate-spin" /></div>

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-12 space-y-8 animate-in slide-in-from-right-4 duration-700">
      <div>
        <Link href="/notes" className={`text-xs font-bold uppercase tracking-widest ${color.text} flex items-center gap-1 mb-4 hover:underline w-fit`}>
          <ChevronLeft className="h-3 w-3" /> Back to Subjects
        </Link>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{subject ? (subject as any).name : 'Subject'}</h1>
        <p className="text-muted-foreground mt-2">Pick a chapter to browse its notes by topic.</p>
      </div>

      {notesLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : notesList && notesList.length > 0 ? (
        <div className="grid md:grid-cols-2 gap-4">
          {notesList.map((note: any) => (
            <Link
              key={note.id}
              href={`/notes/${subjectId}/${note.textbookId}/${note.chapterId}`}
              className={`flex items-center justify-between gap-4 rounded-2xl glass border ${color.border} p-5 hover:bg-white/5 transition-colors`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <BookOpen className={`h-5 w-5 shrink-0 ${color.text}`} />
                <span className="font-medium truncate">{note.chapterTitle}</span>
              </div>
              <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-muted-foreground rounded-2xl glass border-none">
          No notes have been generated for this subject yet.
        </div>
      )}
    </div>
  )
}
