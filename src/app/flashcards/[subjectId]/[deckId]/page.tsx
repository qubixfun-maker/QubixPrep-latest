"use client"

import { useMemo, use } from "react"
import { useDoc, useFirestore, useUser } from "@/firebase"
import { doc } from "firebase/firestore"
import { ChevronLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import { useRequireAuth } from "@/hooks/use-require-auth"
import { getSubjectColor } from "@/lib/subject-colors"
import { gradeFlashcard } from "@/lib/study"
import ImmersiveDeck from "@/components/flashcards/ImmersiveDeck"

export default function FlashcardStudyPage({ params }: { params: Promise<{ subjectId: string; deckId: string }> }) {
  const { subjectId, deckId } = use(params)
  const db = useFirestore()
  const { user } = useUser()

  const subjectRef = useMemo(() => (!db ? null : doc(db, 'subjects', subjectId)), [db, subjectId])
  const { data: subject, loading: subjectLoading } = useDoc(subjectRef)

  const deckRef = useMemo(() => (!db ? null : doc(db, 'subjects', subjectId, 'flashcardDecks', deckId)), [db, subjectId, deckId])
  const { data: deck, loading: deckLoading } = useDoc(deckRef)

  const cards = (deck as any)?.cards || []

  const { checkingAuth } = useRequireAuth()
  const color = getSubjectColor(subject ? (subject as any).name : subjectId)

  if (checkingAuth || subjectLoading || deckLoading) return <div className="h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 text-primary animate-spin" /></div>

  if (cards.length === 0) {
    return (
      <div className="max-w-2xl mx-auto p-4 md:p-12 space-y-6">
        <Link href={`/flashcards/${subjectId}`} className={`text-xs font-bold uppercase tracking-widest ${color.text} flex items-center gap-1 w-fit hover:underline`}>
          <ChevronLeft className="h-3 w-3" /> Back
        </Link>
        <div className="text-center py-16 text-muted-foreground rounded-2xl glass border-none">This deck has no cards.</div>
      </div>
    )
  }

  const d = deck as any
  return (
    <ImmersiveDeck
      key={deckId + cards.length}
      cards={cards.map((c: any) => ({ front: String(c.front ?? ""), back: String(c.back ?? "") }))}
      subject={subject ? (subject as any).name : subjectId}
      unit={d?.chapterName || d?.title || undefined}
      backHref={`/flashcards/${subjectId}`}
      onGrade={(c, ok) => { if (db && user) gradeFlashcard(db, user.uid, { subjectId, subjectName: subject ? (subject as any).name : undefined, chapter: d?.chapterName || d?.title || undefined, front: c.front, back: c.back }, ok).catch(() => {}) }}
    />
  )
}
