"use client"

import { useMemo, use } from "react"
import { useDoc, useCollection, useFirestore } from "@/firebase"
import { doc, collection, query, orderBy } from "firebase/firestore"
import { ChevronRight, ChevronLeft, Loader2, Layers } from "lucide-react"
import Link from "next/link"
import { useRequireAuth } from "@/hooks/use-require-auth"
import { getSubjectColor } from "@/lib/subject-colors"
import { groupByUnit } from "@/lib/unit-sort"

export default function FlashcardDecksPage({ params }: { params: Promise<{ subjectId: string }> }) {
  const { subjectId } = use(params)
  const db = useFirestore()

  const subjectRef = useMemo(() => (!db ? null : doc(db, 'subjects', subjectId)), [db, subjectId])
  const { data: subject, loading: subjectLoading } = useDoc(subjectRef)

  const decksQuery = useMemo(() => (!db ? null : query(collection(db, 'subjects', subjectId, 'flashcardDecks'), orderBy('createdAt', 'desc'))), [db, subjectId])
  const { data: decks, loading: decksLoading } = useCollection(decksQuery)

  const grouped = useMemo(() => {
    const withUnitName = (decks || []).map((d: any) => ({ ...d, unitName: d.unitName || undefined }))
    return groupByUnit(withUnitName as any)
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
        <p className="text-muted-foreground mt-2">Pick a deck to start flipping through cards.</p>
      </div>

      {decksLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : decks && decks.length > 0 ? (
        <div className="space-y-6">
          {grouped.map((group) => (
            <div key={group.unitName} className="space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-1">{group.unitName}</h2>
              <div className="grid md:grid-cols-2 gap-4">
                {group.items.map((deck: any) => (
                  <Link key={deck.id} href={`/flashcards/${subjectId}/${deck.id}`}>
                    <div className={`p-6 rounded-2xl glass border ${color.border} hover:bg-white/5 transition-all duration-300 group flex items-center justify-between gap-4`}>
                      <div className="flex items-center gap-4 min-w-0">
                        <div className={`p-3 rounded-xl ${color.bgSolid} ${color.text} shrink-0`}>
                          <Layers className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold truncate">{deck.title || deck.chapterName}</p>
                          <p className="text-xs text-muted-foreground mt-1">{deck.cardCount} card{deck.cardCount !== 1 ? 's' : ''}</p>
                        </div>
                      </div>
                      <ChevronRight className={`h-4 w-4 ${color.text} group-hover:translate-x-1 transition-transform shrink-0`} />
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
