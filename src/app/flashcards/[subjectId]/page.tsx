"use client"

import { useMemo, useState, use } from "react"
import { useDoc, useCollection, useFirestore } from "@/firebase"
import { doc, collection, query, orderBy } from "firebase/firestore"
import { ChevronRight, ChevronLeft, Loader2, Layers, Search, Sparkles } from "lucide-react"
import Link from "next/link"
import { useRequireAuth } from "@/hooks/use-require-auth"
import { getSubjectColor } from "@/lib/subject-colors"
import { groupByUnit } from "@/lib/unit-sort"
import { hueOf } from "@/components/flashcards/ImmersiveDeck"

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
  const [q, setQ] = useState("")

  const subjectRef = useMemo(() => (!db ? null : doc(db, 'subjects', subjectId)), [db, subjectId])
  const { data: subject, loading: subjectLoading } = useDoc(subjectRef)

  // Ascending so the first-generated deck for each chapter is encountered
  // first in groupDecksByChapter, putting the earliest chapters on top.
  const decksQuery = useMemo(() => (!db ? null : query(collection(db, 'subjects', subjectId, 'flashcardDecks'), orderBy('createdAt', 'asc'))), [db, subjectId])
  const { data: decks, loading: decksLoading } = useCollection(decksQuery)

  const chapters = useMemo(() => groupDecksByChapter(decks || []), [decks])
  const totalCards = useMemo(() => chapters.reduce((s, c) => s + c.cardCount, 0), [chapters])
  const grouped = useMemo(() => {
    const needle = q.trim().toLowerCase()
    const list = needle ? chapters.filter((c) => c.chapterName.toLowerCase().includes(needle)) : chapters
    return groupByUnit(list as any)
  }, [chapters, q])

  const { checkingAuth } = useRequireAuth()
  const subjectName = subject ? (subject as any).name : subjectId
  const color = getSubjectColor(subjectName)
  const hue = hueOf(subjectName)
  const h2 = (hue + 60) % 360

  if (checkingAuth || subjectLoading) return <div className="h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 text-primary animate-spin" /></div>

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-10 space-y-7 animate-in slide-in-from-right-4 duration-700">
      <style>{`
        @keyframes fcl-float{0%,100%{transform:translateY(0) rotate(0)}50%{transform:translateY(-10px) rotate(4deg)}}
        @keyframes fcl-sheen{0%{transform:translateX(-130%) skewX(-18deg)}60%,100%{transform:translateX(260%) skewX(-18deg)}}
        .fcl-tile{position:relative;overflow:hidden;transition:transform .35s cubic-bezier(.2,.8,.2,1),box-shadow .35s}
        .fcl-tile:hover{transform:translateY(-4px)}
        .fcl-tile::after{content:"";position:absolute;inset:0 auto 0 0;width:35%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.14),transparent);transform:translateX(-130%) skewX(-18deg);pointer-events:none}
        .fcl-tile:hover::after{animation:fcl-sheen 1s ease-out}
      `}</style>

      <Link href="/flashcards" className={`text-xs font-bold uppercase tracking-widest ${color.text} flex items-center gap-1 w-fit hover:underline`}>
        <ChevronLeft className="h-3 w-3" /> Back to Subjects
      </Link>

      {/* hero */}
      <div className="relative overflow-hidden rounded-[2rem] p-6 text-white shadow-2xl md:p-10" style={{ background: `radial-gradient(120% 140% at 0% 0%, hsl(${hue} 80% 48%) 0%, hsl(${hue} 60% 22%) 45%, #0a0a14 100%)`, boxShadow: `0 30px 80px hsl(${hue} 80% 40% / .35)` }}>
        <div aria-hidden className="pointer-events-none absolute -right-16 -top-20 h-72 w-72 rounded-full opacity-50 blur-3xl" style={{ background: `hsl(${h2} 90% 60%)` }} />
        <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.12]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.8) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.8) 1px,transparent 1px)", backgroundSize: "44px 44px", maskImage: "linear-gradient(90deg,transparent,#000 70%)", WebkitMaskImage: "linear-gradient(90deg,transparent,#000 70%)" }} />
        <svg aria-hidden className="pointer-events-none absolute -bottom-6 right-4 hidden h-52 w-52 opacity-25 md:block" style={{ animation: "fcl-float 7s ease-in-out infinite" }} viewBox="0 0 100 100" fill="none" stroke="white" strokeWidth=".8">
          <polygon points="50,6 88,28 88,72 50,94 12,72 12,28" /><polygon points="50,22 74,36 74,64 50,78 26,64 26,36" /><circle cx="50" cy="50" r="9" />
          <line x1="50" y1="6" x2="50" y2="22" /><line x1="88" y1="28" x2="74" y2="36" /><line x1="88" y1="72" x2="74" y2="64" /><line x1="50" y1="94" x2="50" y2="78" /><line x1="12" y1="72" x2="26" y2="64" /><line x1="12" y1="28" x2="26" y2="36" />
        </svg>
        <div className="relative z-10 space-y-4">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.2em] backdrop-blur"><Sparkles className="h-3 w-3" /> Flashcards</span>
          <h1 className="text-4xl font-black tracking-tight md:text-6xl">{subjectName}</h1>
          <p className="max-w-md text-sm font-medium text-white/80 md:text-base">Pick a chapter to start flipping through cards. Study mode goes full screen, with Got it / Review again tracking.</p>
          <div className="flex flex-wrap gap-2 pt-1">
            <span className="rounded-2xl border border-white/20 bg-black/25 px-4 py-2 text-sm font-bold backdrop-blur"><b className="text-lg font-black">{chapters.length}</b> chapters</span>
            <span className="rounded-2xl border border-white/20 bg-black/25 px-4 py-2 text-sm font-bold backdrop-blur"><b className="text-lg font-black">{totalCards}</b> cards</span>
          </div>
        </div>
      </div>

      {/* search */}
      {chapters.length > 6 && (
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Search ${chapters.length} chapters…`} className="h-12 w-full rounded-2xl border border-black/10 bg-white pl-11 pr-4 text-sm font-medium shadow-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/15" />
        </div>
      )}

      {decksLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : decks && decks.length > 0 ? (
        grouped.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-black/15 py-12 text-center text-muted-foreground">No chapter matches “{q}”.</div>
        ) : (
          <div className="space-y-8">
            {grouped.map((group) => (
              <div key={group.unitName} className="space-y-3">
                <h2 className="flex items-center gap-2 px-1 text-xs font-black uppercase tracking-[0.2em] text-muted-foreground"><span className="h-px w-6" style={{ background: `hsl(${hue} 80% 55%)` }} />{group.unitName}</h2>
                <div className="grid gap-3.5 md:grid-cols-2">
                  {group.items.map((chapter: any, i: number) => (
                    <Link key={chapter.chapterName} href={`/flashcards/${subjectId}/chapter/${encodeURIComponent(chapter.chapterName)}`}>
                      <div className="fcl-tile group flex items-center justify-between gap-4 rounded-2xl border border-white/10 p-4 md:p-5"
                        style={{ background: `linear-gradient(155deg, hsl(${hue} 70% 55% / .22) 0%, transparent 42%), linear-gradient(145deg, #232340 0%, #15162a 60%, #0c0c18 100%)`, boxShadow: `inset 0 1px 1px rgba(255,255,255,.1), 0 10px 26px rgba(0,0,0,.35)` }}>
                        <span aria-hidden className="absolute inset-y-0 left-0 w-1.5" style={{ background: `linear-gradient(180deg, hsl(${hue} 90% 65%), hsl(${h2} 90% 60%))` }} />
                        <div className="relative z-10 flex min-w-0 items-center gap-4 pl-2">
                          <div className="relative grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-white/15" style={{ background: `linear-gradient(145deg, hsl(${hue} 75% 55%), hsl(${hue} 65% 30%))`, boxShadow: "inset 0 1px 1px rgba(255,255,255,.35), 0 4px 14px rgba(0,0,0,.4)" }}>
                            <Layers className="h-6 w-6 text-white/90" />
                            <span className="absolute -right-1.5 -top-1.5 grid h-6 min-w-6 place-items-center rounded-full bg-white px-1 text-[10px] font-black text-slate-900 shadow">{i + 1}</span>
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-extrabold text-white">{chapter.chapterName}</p>
                            <div className="mt-1.5 flex items-center gap-2">
                              <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-bold text-white/80">{chapter.cardCount} card{chapter.cardCount !== 1 ? 's' : ''}</span>
                              <span className="hidden text-[11px] font-semibold text-white/45 sm:inline">≈ {Math.max(1, Math.round(chapter.cardCount * 0.4))} min</span>
                            </div>
                          </div>
                        </div>
                        <span className="relative z-10 grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/15 bg-white/10 text-white transition group-hover:translate-x-1 group-hover:bg-white group-hover:text-slate-900"><ChevronRight className="h-4 w-4" /></span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        <div className="text-center py-16 text-muted-foreground rounded-2xl glass border-none">
          No flashcard decks for this subject yet.
        </div>
      )}
    </div>
  )
}
