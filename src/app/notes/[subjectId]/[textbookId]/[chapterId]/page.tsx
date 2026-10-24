"use client"
import { useTopSearch } from "@/components/layout/top-search"

import { useMemo, use } from "react"
import { useDoc, useFirestore, useUser } from "@/firebase"
import { doc } from "firebase/firestore"
import { ChevronRight, ChevronLeft, Loader2, Lock } from "lucide-react"
import Link from "next/link"
import { useRequireAuth } from "@/hooks/use-require-auth"
import { usePlan } from "@/hooks/use-plan"
import { getSubjectColor } from "@/lib/subject-colors"
import { indexIdOf } from "@/lib/notes-index"

export default function NotesChapterPage({ params }: { params: Promise<{ subjectId: string; textbookId: string; chapterId: string }> }) {
  const { subjectId, textbookId, chapterId } = use(params)
  const db = useFirestore()
  const { user } = useUser()

  const subjectRef = useMemo(() => (!db ? null : doc(db, 'subjects', subjectId)), [db, subjectId])
  const { data: subject, loading: subjectLoading } = useDoc(subjectRef)

  // The light index (topic names only). The note text is fetched on the topic page, where the plan rule applies.
  const docKey = `${textbookId}__${chapterId}`
  const indexRef = useMemo(() => (!db ? null : doc(db, 'notesIndex', indexIdOf(subjectId, docKey))), [db, subjectId, docKey])
  const { data: entry, loading: entryLoading } = useDoc(indexRef)

  const { canAccessContent, loading: planLoading } = usePlan()
  const profileRef = useMemo(() => (!db || !user ? null : doc(db, 'users', user.uid)), [db, user])
  const { data: profile, loading: profileLoading } = useDoc(profileRef)
  const entitled = !!canAccessContent || (profile as any)?.role === 'admin'

  const { checkingAuth } = useRequireAuth()
  const [search] = useTopSearch("Search topics in this chapter…")
  const color = getSubjectColor(subject ? (subject as any).name : subjectId)

  if (checkingAuth || subjectLoading || entryLoading || planLoading || profileLoading) {
    return <div className="h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 text-primary animate-spin" /></div>
  }

  const topics = (((entry as any)?.topics || []) as { name: string; depth?: number }[]).map((t, i) => ({ ...t, i }))
  const locked = !entitled && !(entry as any)?.free
  const q = search.trim().toLowerCase()

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-12 space-y-8 animate-in slide-in-from-right-4 duration-700">
      <div>
        <Link href={`/notes/${subjectId}`} className={`text-xs font-bold uppercase tracking-widest ${color.text} flex items-center gap-1 mb-4 hover:underline w-fit`}>
          <ChevronLeft className="h-3 w-3" /> Back to Chapters
        </Link>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{(entry as any)?.chapterTitle || 'Chapter'}</h1>
        <p className="text-muted-foreground mt-2">{subject ? (subject as any).name : ''}</p>
      </div>

      {locked && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#f0d88a] bg-[#fff8e0] p-4 text-[#5a3a00]">
          <p className="text-sm font-semibold flex items-center gap-2"><Lock className="h-4 w-4" /> This chapter is for Scholar and Clinician members (₹999/year).</p>
          <Link href="/pricing" className="rounded-full bg-[#5a3a00] px-4 py-2 text-xs font-extrabold text-white">See plans</Link>
        </div>
      )}

      {topics.length > 0 ? (
        <div className="space-y-2">
          {topics.filter((t) => !q || t.name.toLowerCase().includes(q)).map((t) => (
            <Link
              key={t.i}
              href={locked ? '/pricing' : `/notes/${subjectId}/${textbookId}/${chapterId}/${t.i}`}
              style={{ marginLeft: Math.min(Number(t.depth) || 0, 3) * 16 }}
              className={`flex items-center justify-between gap-4 rounded-2xl glass border ${color.border} px-5 py-4 hover:bg-white/5 transition-colors`}
            >
              <span className="font-medium">{t.name}</span>
              {locked ? <Lock className="h-4 w-4 shrink-0 text-muted-foreground" /> : <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />}
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-muted-foreground rounded-2xl glass border-none">No topics found for this chapter.</div>
      )}
    </div>
  )
}
