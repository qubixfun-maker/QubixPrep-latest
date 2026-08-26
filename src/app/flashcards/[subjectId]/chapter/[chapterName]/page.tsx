"use client"

import { useMemo, useState, use } from "react"
import { useDoc, useCollection, useFirestore } from "@/firebase"
import { doc, collection } from "firebase/firestore"
import { ChevronLeft, ChevronRight, Loader2, Shuffle } from "lucide-react"
import Link from "next/link"
import { useRequireAuth } from "@/hooks/use-require-auth"
import { getSubjectColor } from "@/lib/subject-colors"

export default function FlashcardChapterStudyPage({ params }: { params: Promise<{ subjectId: string; chapterName: string }> }) {
  const { subjectId, chapterName: chapterSlug } = use(params)
  const chapterName = decodeURIComponent(chapterSlug)
  const db = useFirestore()

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

  const [order, setOrder] = useState<number[] | null>(null)
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)

  const activeOrder = order || cards.map((_: any, i: number) => i)

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

  const currentCardIndex = activeOrder[index]
  const currentCard = cards[currentCardIndex]
  const progressPct = ((index + 1) / activeOrder.length) * 100

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

  return (
    <div className="max-w-md mx-auto p-4 md:p-8 space-y-5 animate-in fade-in duration-500">
      <div
        className="rounded-[26px] p-6 border border-white/10 relative overflow-hidden"
        style={{ background: 'linear-gradient(145deg, #1c1c28, #0e0e16)', boxShadow: '0 20px 60px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)' }}
      >
        <div className="flex items-center justify-between mb-5 relative z-10">
          <Link href={`/flashcards/${subjectId}`} className="flex items-center gap-1 text-xs font-semibold text-violet-300 hover:text-violet-200">
            <ChevronLeft className="h-4 w-4" /> Back
          </Link>
          <button
            onClick={shuffleDeck}
            aria-label="Shuffle"
            className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 border border-white/10"
            style={{ background: 'linear-gradient(145deg, #26263a, #16161f)', boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.1), 0 2px 6px rgba(0,0,0,0.4)' }}
          >
            <Shuffle className="h-4 w-4" />
          </button>
        </div>

        <div className="flex gap-2 flex-wrap mb-4 relative z-10">
          <span
            className="text-[11px] font-semibold px-3 py-1 rounded-full border border-white/10"
            style={{ background: 'linear-gradient(145deg, #7c5ce0, #4c31a3)', color: '#ece6ff', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.15), 0 2px 8px rgba(0,0,0,0.25)' }}
          >
            {subject ? (subject as any).name : subjectId}
          </span>
          {unitName && (
            <span
              className="text-[11px] font-semibold px-3 py-1 rounded-full border border-white/10"
              style={{ background: 'linear-gradient(145deg, #2f5fd6, #1c3a8f)', color: '#dbe6ff', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.15), 0 2px 8px rgba(0,0,0,0.25)' }}
            >
              {unitName}
            </span>
          )}
        </div>

        <p className="text-center text-xs text-gray-500 font-mono mb-2 relative z-10">CARD {String(index + 1).padStart(2, '0')} / {activeOrder.length}</p>

        <div className="flex gap-1 mb-6 relative z-10">
          {activeOrder.map((_: any, i: number) => (
            <div
              key={i}
              className="flex-1 h-1 rounded-full"
              style={i <= index
                ? { background: 'linear-gradient(90deg, #a78bfa, #7c5ce0)', boxShadow: '0 0 8px rgba(167,139,250,0.5)' }
                : { background: 'rgba(255,255,255,0.08)' }
              }
            />
          ))}
        </div>

        <div className="relative mb-6 z-10" style={{ perspective: '1400px' }}>
          <div
            onClick={() => setFlipped(!flipped)}
            className="relative min-h-[240px] cursor-pointer"
            style={{ transformStyle: 'preserve-3d', transition: 'transform 0.6s cubic-bezier(0.4, 0.2, 0.2, 1)', transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
          >
            <div
              className="absolute inset-0 rounded-[20px] p-7 flex flex-col items-center justify-center text-center gap-3 border border-white/10"
              style={{
                backfaceVisibility: 'hidden',
                background: 'linear-gradient(155deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.02) 35%, transparent 55%), linear-gradient(145deg, #3a3f6b 0%, #23264a 50%, #14162e 100%)',
                boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.25), inset 0 -20px 40px rgba(0,0,0,0.3), 0 12px 30px rgba(0,0,0,0.5)',
              }}
            >
              <p className="text-[11px] font-bold tracking-widest uppercase" style={{ color: '#b8c2ff' }}>Question</p>
              <p className="text-lg font-semibold leading-relaxed" style={{ color: '#f1f2fb' }}>{currentCard.front}</p>
              <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>Tap to reveal answer</p>
            </div>

            <div
              className="absolute inset-0 rounded-[20px] p-7 flex flex-col items-center justify-center text-center gap-3 border border-white/10"
              style={{
                backfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)',
                background: 'linear-gradient(155deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.02) 35%, transparent 55%), linear-gradient(145deg, #6b4a12 0%, #4a3208 50%, #241804 100%)',
                boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.25), inset 0 -20px 40px rgba(0,0,0,0.3), 0 12px 30px rgba(0,0,0,0.5)',
              }}
            >
              <p className="text-[11px] font-bold tracking-widest uppercase" style={{ color: '#ffe3a3' }}>Answer</p>
              <p className="text-base leading-relaxed" style={{ color: '#fff3dc' }}>{currentCard.back}</p>
            </div>
          </div>
        </div>

        <div className="flex gap-2.5 relative z-10">
          <button
            onClick={goPrev}
            disabled={index === 0}
            className="flex-1 h-12 rounded-2xl text-sm font-semibold flex items-center justify-center gap-1.5 text-gray-300 border border-white/10 disabled:opacity-40"
            style={{ background: 'linear-gradient(145deg, #26263a, #16161f)', boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.08), 0 2px 8px rgba(0,0,0,0.3)' }}
          >
            <ChevronLeft className="h-4 w-4" /> Prev
          </button>
          <button
            onClick={goNext}
            disabled={index === activeOrder.length - 1}
            className="flex-1 h-12 rounded-2xl text-sm font-semibold flex items-center justify-center gap-1.5 disabled:opacity-40"
            style={{ background: 'linear-gradient(145deg, #a78bfa, #7c5ce0 50%, #5b3fc4)', color: '#1a0f3d', boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.4), 0 6px 20px rgba(124,92,224,0.45)' }}
          >
            Next <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
