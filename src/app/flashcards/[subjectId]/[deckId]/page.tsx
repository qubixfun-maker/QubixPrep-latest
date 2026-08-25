"use client"

import { useMemo, useState, use } from "react"
import { useDoc, useFirestore } from "@/firebase"
import { doc } from "firebase/firestore"
import { ChevronLeft, ChevronRight, Loader2, Shuffle, RotateCw } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useRequireAuth } from "@/hooks/use-require-auth"
import { getSubjectColor } from "@/lib/subject-colors"

export default function FlashcardStudyPage({ params }: { params: Promise<{ subjectId: string; deckId: string }> }) {
  const { subjectId, deckId } = use(params)
  const db = useFirestore()

  const subjectRef = useMemo(() => (!db ? null : doc(db, 'subjects', subjectId)), [db, subjectId])
  const { data: subject, loading: subjectLoading } = useDoc(subjectRef)

  const deckRef = useMemo(() => (!db ? null : doc(db, 'subjects', subjectId, 'flashcardDecks', deckId)), [db, subjectId, deckId])
  const { data: deck, loading: deckLoading } = useDoc(deckRef)

  const [order, setOrder] = useState<number[] | null>(null)
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)

  const cards = (deck as any)?.cards || []
  const activeOrder = order || cards.map((_: any, i: number) => i)

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

  const currentCardIndex = activeOrder[index]
  const currentCard = cards[currentCardIndex]

  function goNext() {
    setFlipped(false)
    setIndex((i) => Math.min(i + 1, activeOrder.length - 1))
  }
  function goPrev() {
    setFlipped(false)
    setIndex((i) => Math.max(i - 1, 0))
  }
  function shuffleDeck() {
    const shuffled = [...cards.map((_: any, i: number) => i)]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    setOrder(shuffled)
    setIndex(0)
    setFlipped(false)
  }
  function resetOrder() {
    setOrder(null)
    setIndex(0)
    setFlipped(false)
  }

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-12 space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <Link href={`/flashcards/${subjectId}`} className={`text-xs font-bold uppercase tracking-widest ${color.text} flex items-center gap-1 hover:underline`}>
          <ChevronLeft className="h-3 w-3" /> Back
        </Link>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={order ? resetOrder : shuffleDeck} title={order ? "Reset order" : "Shuffle"}>
            {order ? <RotateCw className="h-4 w-4" /> : <Shuffle className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <div className="text-center">
        <h1 className="text-2xl font-bold">{(deck as any)?.title || (deck as any)?.chapterName}</h1>
        <p className="text-sm text-muted-foreground mt-1">Card {index + 1} of {activeOrder.length}</p>
      </div>

      <div className="w-full h-3 rounded-full bg-white/5 overflow-hidden">
        <div className={`h-full ${color.bgSolid.replace('/25', '')} transition-all duration-300`} style={{ width: `${((index + 1) / activeOrder.length) * 100}%` }} />
      </div>

      <div
        onClick={() => setFlipped(!flipped)}
        className={`relative min-h-[300px] rounded-3xl glass border ${color.border} p-8 flex items-center justify-center text-center cursor-pointer select-none transition-transform duration-300`}
        style={{ transform: flipped ? 'scale(1.01)' : 'scale(1)' }}
      >
        <div className="space-y-4">
          <p className={`text-[10px] font-bold uppercase tracking-widest ${color.text}`}>{flipped ? "Answer" : "Question"}</p>
          <p className="text-lg font-medium leading-relaxed">{flipped ? currentCard.back : currentCard.front}</p>
          <p className="text-xs text-muted-foreground pt-4">Tap card to {flipped ? "see question" : "reveal answer"}</p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4">
        <Button variant="secondary" onClick={goPrev} disabled={index === 0} className="gap-2 flex-1">
          <ChevronLeft className="h-4 w-4" /> Prev
        </Button>
        <Button onClick={goNext} disabled={index === activeOrder.length - 1} className="gap-2 flex-1">
          Next <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
