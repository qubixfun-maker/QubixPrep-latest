"use client"

import { useMemo, use } from "react"
import { useDoc, useFirestore } from "@/firebase"
import { doc } from "firebase/firestore"
import { ChevronRight, ChevronLeft, Loader2, FileText, FileQuestion, List } from "lucide-react"
import Link from "next/link"
import { useRequireAuth } from "@/hooks/use-require-auth"
import { getSubjectColor } from "@/lib/subject-colors"

const SECTION_META: Record<string, { label: string; icon: any }> = {
  'long-essays': { label: 'Long Essays', icon: FileText },
  'short-essays': { label: 'Short Essays', icon: FileQuestion },
  'short-answers': { label: 'Short Answers', icon: List },
}

export default function LongAnswersSectionChoicePage({ params }: { params: Promise<{ subjectId: string; chapterId: string }> }) {
  const { subjectId, chapterId } = use(params)
  const db = useFirestore()

  const subjectRef = useMemo(() => (!db ? null : doc(db, 'subjects', subjectId)), [db, subjectId])
  const { data: subject, loading: subjectLoading } = useDoc(subjectRef)

  const chapterRef = useMemo(() => (!db ? null : doc(db, 'subjects', subjectId, 'essayChapters', chapterId)), [db, subjectId, chapterId])
  const { data: chapter, loading: chapterLoading } = useDoc(chapterRef)

  const { checkingAuth } = useRequireAuth()
  const color = getSubjectColor(subject ? (subject as any).name : subjectId)

  if (checkingAuth || subjectLoading || chapterLoading) return <div className="h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 text-primary animate-spin" /></div>

  const counts: Record<string, number> = (chapter as any)?.sectionCounts || {}
  const availableSections = (['long-essays', 'short-essays', 'short-answers'] as const).filter(key => (counts[key] || 0) > 0)

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-12 space-y-8 animate-in slide-in-from-right-4 duration-700">
      <div>
        <Link href={`/long-answers/${subjectId}`} className={`text-xs font-bold uppercase tracking-widest ${color.text} flex items-center gap-1 mb-4 hover:underline w-fit`}>
          <ChevronLeft className="h-3 w-3" /> Back to Chapters
        </Link>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{(chapter as any)?.title || 'Chapter'}</h1>
        <p className="text-muted-foreground mt-2">{subject ? (subject as any).name : ''}</p>
      </div>

      {availableSections.length > 0 ? (
        <div className="grid md:grid-cols-3 gap-4">
          {availableSections.map((key) => {
            const meta = SECTION_META[key]
            const Icon = meta.icon
            return (
              <Link key={key} href={`/long-answers/${subjectId}/${chapterId}/${key}`}>
                <div className={`p-8 rounded-2xl glass border ${color.border} hover:bg-white/5 transition-all duration-300 group h-full flex flex-col items-center text-center gap-3`}>
                  <div className={`p-4 rounded-2xl ${color.bgSolid} ${color.text}`}>
                    <Icon className="h-7 w-7" />
                  </div>
                  <p className="font-bold">{meta.label}</p>
                  <p className="text-xs text-muted-foreground">{counts[key]} question{counts[key] !== 1 ? 's' : ''}</p>
                  <ChevronRight className={`h-4 w-4 ${color.text} group-hover:translate-x-1 transition-transform mt-auto`} />
                </div>
              </Link>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-16 text-muted-foreground rounded-2xl glass border-none">
          No content uploaded for this chapter yet.
        </div>
      )}

      {availableSections.length > 0 && availableSections.length < 3 && (
        <p className="text-xs text-center text-muted-foreground">
          Only {availableSections.map(k => SECTION_META[k].label).join(' & ')} available for this chapter right now.
        </p>
      )}
    </div>
  )
}
