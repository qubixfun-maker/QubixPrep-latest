"use client"

import { useMemo, use } from "react"
import { useDoc, useCollection, useFirestore, useUser } from "@/firebase"
import { doc, collection } from "firebase/firestore"
import { ChevronLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import { useRequireAuth } from "@/hooks/use-require-auth"
import { getSubjectColor } from "@/lib/subject-colors"
import { gradeFlashcard } from "@/lib/study"
import ImmersiveDeck from "@/components/flashcards/ImmersiveDeck"

export default function FlashcardChapterStudyPage({ params }: { params: Promise<{ subjectId: string; chapterName: string }> }) {
  const { subjectId, chapterName: chapterSlug } = use(params)
  const chapterName = decodeURIComponent(chapterSlug)
  const db = useFirestore()
  const { user } = useUser()

  const subjectRef = useMemo(() => (!db ? null : doc(db, 'subjects', subjectId)), [db, subjectId])
  const { data: subject, loading: subjectLoading } = useDoc(subjectRef)

  const decksQuery = useMemo(() => (!db ? null : collection(db, 'subjects', subjectId, 'flashcardDecks')), [db, subjectId])
  const { data: allDecks, loading: decksLoading } = useCollection(decksQuery)

  const matchingDecks = useMemo(
    () => (allDecks || []).filter((d: any) => ((d.chapterName || d.title || "Untitled").trim()) === chapterName),
    [allDecks, chapterName]
  )

  const unitName = matchingDecks[0]?.unitName as string | undefined

  const cards = useMemo(
    () => matchingDecks.flatMap((d: any) => (d.cards || [])),
    [matchingDecks]
  )

  const { checkingAuth } = useRequireAuth()
  const color = getSubjectColor(subject ? (subject as any).name : subjectId)

  if (checkingAuth || subjectLoading || decksLoading) return <div className="h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 text-primary animate-spin" /></div>

  if (cards.length === 0) {
    return (
      <div className="max-w-2xl mx-auto p-4 md:p-12 space-y-6">
        <Link href={`/flashcards/${subjectId}`} className={`text-xs font-bold uppercase tracking-widest ${color.text} flex items-center gap-1 w-fit hover:underline`}>
          <ChevronLeft className="h-3 w-3" /> Back
        </Link>
        <div className="text-center py-16 text-muted-foreground rounded-2xl glass border-none">This chapter has no cards.</div>
      </div>
    )
  }

  return (
    <ImmersiveDeck
      key={chapterName + cards.length}
      cards={cards.map((c: any) => ({ front: String(c.front ?? ""), back: String(c.back ?? "") }))}
      subject={subject ? (subject as any).name : subjectId}
      unit={unitName ? unitName + " · " + chapterName : chapterName}
      backHref={`/flashcards/${subjectId}`}
      onGrade={(c, ok) => { if (db && user) gradeFlashcard(db, user.uid, { subjectId, subjectName: subject ? (subject as any).name : undefined, chapter: chapterName, front: c.front, back: c.back }, ok).catch(() => {}) }}
    />
  )
}
