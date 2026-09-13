"use client"

import { useMemo, use } from "react"
import { useDoc, useFirestore } from "@/firebase"
import { doc } from "firebase/firestore"
import { ChevronLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { useRequireAuth } from "@/hooks/use-require-auth"
import { getSubjectColor } from "@/lib/subject-colors"

export default function NotesTopicDetailPage({ params }: { params: Promise<{ subjectId: string; textbookId: string; chapterId: string; topicIndex: string }> }) {
  const { subjectId, textbookId, chapterId, topicIndex } = use(params)
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

  const topics = ((notes as any)?.topics || []) as { name: string; markdown: string }[]
  const topic = topics[parseInt(topicIndex, 10)]

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-12 space-y-8 animate-in slide-in-from-right-4 duration-700">
      <div>
        <Link href={`/notes/${subjectId}/${textbookId}/${chapterId}`} className={`text-xs font-bold uppercase tracking-widest ${color.text} flex items-center gap-1 mb-4 hover:underline w-fit`}>
          <ChevronLeft className="h-3 w-3" /> Back to Topics
        </Link>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{topic?.name || 'Topic'}</h1>
        <p className="text-muted-foreground mt-2">{(notes as any)?.chapterTitle || ''} &middot; {subject ? (subject as any).name : ''}</p>
      </div>

      {topic ? (
        <div className={`rounded-2xl glass border ${color.border} p-6 md:p-8 prose prose-invert max-w-none prose-headings:font-bold prose-table:border prose-th:border prose-th:p-2 prose-td:border prose-td:p-2`}>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{topic.markdown}</ReactMarkdown>
        </div>
      ) : (
        <div className="text-center py-16 text-muted-foreground rounded-2xl glass border-none">
          Topic not found.
        </div>
      )}
    </div>
  )
}
