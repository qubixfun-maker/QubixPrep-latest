"use client"

import { useMemo, use } from "react"
import { useDoc, useCollection, useFirestore } from "@/firebase"
import { doc, collection, query, orderBy } from "firebase/firestore"
import { ChevronRight, ChevronLeft, Loader2, Layers } from "lucide-react"
import Link from "next/link"
import { useRequireAuth } from "@/hooks/use-require-auth"
import { getSubjectColor } from "@/lib/subject-colors"
import { groupByUnit } from "@/lib/unit-sort"

function groupDecksByChapter(decks: any[]) {
  // decks arrives sorted oldest-created-first (see decksQuery below), so the
  // order a chapter is first encountered here IS the order its first deck
  // was generated in - exactly what determines display order.
  const groups: Record<string, any[]> = {}
  const firstSeenOrder: Record<string, number> = {}
  decks.forEach((d) => {
    const key = (d.chapterName || d.title || "Untitled").trim()
    if (!groups[key]) {
      groups[key] = []
      firstSeenOrder[key] = Object.keys(firstSeenOrder).length
    }
    groups[key].push(d)
  })
  return Object.entries(groups).map(([chapterName, chapterDecks]) => ({
    chapterName,
    cardCount: chapterDecks.reduce((sum, d) => sum + (d.cardCount ?? (d.cards?.length ?? 0)), 0),
    unitName: chapterDecks[0]?.unitName || undefined,
    order: firstSeenOrder[chapterName],
  }))
}

export default function FlashcardDecksPage({ params }: { params: Promise<{ subjectId: string }> }) {
  const { subjectId } = use(params)
  const db = useFirestore()

  const subjectRef = useMemo(() => (!db ? null : doc(db, 'subjects', subjectId)), [db, subjectId])
  const { data: subject, loading: subjectLoading } = useDoc(subjectRef)

  // Ascending so the first-generated deck for each chapter is encountered
  // first in groupDecksByChapter, putting the earliest chapters on top.
  const decksQuery = useMemo(() => (!db ? null : query(collection(db, 'subjects', subjectId, 'flashcardDecks'), orderBy('createdAt', 'asc'))), [db, subjectId])
  const { data: decks, loading: decksLoading } = useCollection(decksQuery)

  const grouped = useMemo(() => {
    const chapters = groupDecksByChapter(decks || [])
    return groupByUnit(chapters as any)
  }, [decks])

  const { checkingAuth } = useRequireAuth()
  const color = getSubjectColor(subject ? (subject as any).name : subjectId)

  if (checkingAuth || subjectLoading) return <div className="h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 text-primary animate-spin" /></div>

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-12 space-y-8 animate-in slide-in-from-right-4 duration-700">
      <div>
        <Link href="/flashcards" className={`text-xs font-bold uppercase tracking-widest ${color.text} flex items-center gap-1 mb-4 hover:underline w-fit`}>
          <ChevronLeft className="h-3 w-3" /> Back to Subjects
        </Link>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{subject ? (subject as any).name : 'Subject'}</h1>
        <p className="text-muted-foreground mt-2">Pick a chapter to start flipping through cards.</p>
      </div>

      {decksLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : decks && decks.length > 0 ? (
        <div className="space-y-6">
          {grouped.map((group) => (
            <div key={group.unitName} className="space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-1">{group.unitName}</h2>
              <div className="grid md:grid-cols-2 gap-4">
                {group.items.map((chapter: any) => (
                  <Link key={chapter.chapterName} href={`/flashcards/${subjectId}/chapter/${encodeURIComponent(chapter.chapterName)}`}>
                    <div
                      className="p-5 rounded-2xl border border-white/10 hover:border-white/20 transition-all duration-300 group flex items-center justify-between gap-4 relative overflow-hidden"
                      style={{
                        background: 'linear-gradient(155deg, rgba(255,255,255,0.06) 0%, transparent 40%), linear-gradient(145deg, #26263f 0%, #17182b 60%, #0e0e1a 100%)',
                        boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.08), 0 8px 20px rgba(0,0,0,0.35)',
                      }}
                    >
                      <div className="flex items-center gap-4 min-w-0 relative z-10">
                        <div
                          className="p-3 rounded-xl shrink-0 border border-white/10"
                          style={{ background: 'linear-gradient(145deg, #7c5ce0, #4c31a3)', boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.25), 0 2px 8px rgba(0,0,0,0.3)' }}
                        >
                          <Layers className="h-5 w-5" style={{ color: '#ece6ff' }} />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold truncate text-white">{chapter.chapterName}</p>
                          <p className="text-xs text-gray-400 mt-1">{chapter.cardCount} card{chapter.cardCount !== 1 ? 's' : ''}</p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-violet-300 group-hover:translate-x-1 transition-transform shrink-0 relative z-10" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-muted-foreground rounded-2xl glass border-none">
          No flashcard decks for this subject yet.
        </div>
      )}
    </div>
  )
}
