"use client"

import { useEffect, useMemo, useState, use } from "react"
import { useDoc, useCollection, useFirestore } from "@/firebase"
import { doc, collection, query, orderBy } from "firebase/firestore"
import { ChevronLeft, Loader2, Network, Search, Sparkles, Bookmark, Flag } from "lucide-react"
import Link from "next/link"
import { useRequireAuth } from "@/hooks/use-require-auth"
import { usePlan } from "@/hooks/use-plan"
import { UpgradeGate } from "@/components/upgrade-gate"
import { getSubjectColor } from "@/lib/subject-colors"
import { groupByUnit } from "@/lib/unit-sort"
import { hueOf } from "@/components/flashcards/ImmersiveDeck"
import ChapterTile from "@/components/lists/ChapterTile"

const FREE_LIMIT = 3

function readList(key: string): string[] {
  try { const v = JSON.parse(localStorage.getItem(key) || "[]"); return Array.isArray(v) ? v : [] } catch { return [] }
}
function countNodes(branches: any, depth = 0): number {
  if (!Array.isArray(branches) || depth > 8) return 0
  return branches.reduce((s: number, b: any) => s + 1 + countNodes(b?.branches, depth + 1), 0)
}

export default function MindmapsSubjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: subjectId } = use(params)
  const db = useFirestore()
  const { canAccessContent } = usePlan()
  const [q, setQ] = useState("")
  const [filter, setFilter] = useState<"all" | "saved" | "revise">("all")
  const [saved, setSaved] = useState<string[]>([])
  const [revise, setRevise] = useState<string[]>([])
  useEffect(() => { setSaved(readList("mm-saved")); setRevise(readList("mm-revise")) }, [])

  const subjectRef = useMemo(() => (!db ? null : doc(db, 'subjects', subjectId)), [db, subjectId])
  const { data: subject, loading: subjectLoading } = useDoc(subjectRef)

  const mindmapsQuery = useMemo(
    () => (!db ? null : query(collection(db, 'subjects', subjectId, 'mindmaps'), orderBy('order', 'asc'))),
    [db, subjectId]
  )
  const { data: mindmaps, loading: mindmapsLoading } = useCollection(mindmapsQuery)

  const all = (mindmaps || []) as any[]
  const lockedIds = useMemo(() => new Set(canAccessContent ? [] : all.slice(FREE_LIMIT).map((m) => m.id)), [all, canAccessContent])
  const grouped = useMemo(() => {
    const needle = q.trim().toLowerCase()
    const list = all.filter((m) => (!needle || String(m.title || "").toLowerCase().includes(needle)) && (filter === "all" || (filter === "saved" ? saved.includes(m.id) : revise.includes(m.id))))
    return groupByUnit(list as any)
  }, [all, q, filter, saved, revise])

  const { checkingAuth } = useRequireAuth()
  const subjectName = subject ? (subject as any).name : subjectId
  const color = getSubjectColor(subjectName)
  const hue = hueOf(subjectName)
  const h2 = (hue + 35) % 360

  if (checkingAuth || subjectLoading) return <div className="h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 text-primary animate-spin" /></div>

  const chips: { id: "all" | "saved" | "revise"; label: string; n: number }[] = [
    { id: "all", label: "All", n: all.length },
    { id: "saved", label: "Saved", n: all.filter((m) => saved.includes(m.id)).length },
    { id: "revise", label: "To revise", n: all.filter((m) => revise.includes(m.id)).length },
  ]

  return (
    <div className="mx-auto w-full max-w-5xl space-y-7 overflow-x-hidden p-4 md:p-10">
      <Link href="/mindmaps" className={`text-xs font-bold uppercase tracking-widest ${color.text} flex w-fit items-center gap-1 hover:underline`}>
        <ChevronLeft className="h-3 w-3" /> Back to Subjects
      </Link>

      <div className="keep-dark relative overflow-hidden rounded-[2rem] p-6 text-white shadow-2xl md:p-10" style={{ background: `linear-gradient(130deg, hsl(${hue} 85% 52%) 0%, hsl(${h2} 80% 48%) 100%)`, boxShadow: `0 24px 60px hsl(${hue} 80% 45% / .30)` }}>
        <div aria-hidden className="pointer-events-none absolute -right-16 -top-20 h-72 w-72 rounded-full opacity-50 blur-3xl" style={{ background: `hsl(${h2} 90% 60%)` }} />
        <svg aria-hidden className="pointer-events-none absolute -bottom-4 right-4 hidden h-48 w-48 opacity-25 md:block" viewBox="0 0 100 100" fill="none" stroke="white" strokeWidth=".9">
          <circle cx="50" cy="50" r="9" /><circle cx="14" cy="22" r="6" /><circle cx="86" cy="22" r="6" /><circle cx="14" cy="78" r="6" /><circle cx="86" cy="78" r="6" /><circle cx="50" cy="8" r="5" /><circle cx="50" cy="92" r="5" />
          <path d="M42 44 L19 26 M58 44 L81 26 M42 56 L19 74 M58 56 L81 74 M50 41 L50 13 M50 59 L50 87" />
        </svg>
        <div className="relative z-10 space-y-4">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.2em] backdrop-blur"><Sparkles className="h-3 w-3" /> Mind maps</span>
          <h1 className="break-words text-4xl font-black tracking-tight md:text-6xl">{subjectName}</h1>
          <p className="max-w-md text-sm font-medium text-white/80 md:text-base">Pick a chapter to open its map. Bookmark the ones you love and flag the ones to revise.</p>
          <div className="flex flex-wrap gap-2 pt-1">
            <span className="rounded-2xl border border-white/20 bg-black/25 px-4 py-2 text-sm font-bold backdrop-blur"><b className="text-lg font-black">{all.length}</b> maps</span>
            <span className="rounded-2xl border border-white/20 bg-black/25 px-4 py-2 text-sm font-bold backdrop-blur"><b className="text-lg font-black">{saved.filter((id) => all.some((m) => m.id === id)).length}</b> saved</span>
          </div>
        </div>
      </div>

      {all.length > 0 && (
        <div className="space-y-3">
          {all.length > 6 && (
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Search ${all.length} mind maps…`} className="h-12 w-full rounded-2xl border border-black/10 bg-white pl-11 pr-4 text-sm font-medium shadow-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/15" />
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            {chips.map((c) => (
              <button key={c.id} onClick={() => setFilter(c.id)} className={`rounded-full border px-4 py-1.5 text-sm font-bold transition ${filter === c.id ? "border-transparent text-white shadow" : "border-black/10 bg-white text-slate-700 hover:border-black/25"}`} style={filter === c.id ? { background: `hsl(${hue} 70% 42%)` } : undefined}>
                {c.label} <span className="opacity-70">{c.n}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {mindmapsLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : all.length === 0 ? (
        <div className="glass rounded-2xl border-none py-16 text-center text-muted-foreground">No mind maps for this subject yet.</div>
      ) : grouped.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-black/15 py-12 text-center text-muted-foreground">{filter === "all" ? <>No mind map matches “{q}”.</> : "Nothing here yet. Open a mind map and tap the bookmark or flag."}</div>
      ) : (
        <div className="space-y-8">
          {grouped.map((group) => (
            <div key={group.unitName} className="space-y-3">
              <h2 className="flex items-center gap-2 px-1 text-xs font-black uppercase tracking-[0.2em] text-muted-foreground"><span className="h-px w-6 shrink-0" style={{ background: `hsl(${hue} 80% 55%)` }} /><span className="min-w-0 break-words">{group.unitName}</span></h2>
              <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
                {group.items.map((mm: any, i: number) => {
                  const isLocked = lockedIds.has(mm.id)
                  const nodes = countNodes(mm.data?.branches)
                  return (
                    <ChapterTile key={mm.id} href={`/mindmaps/${subjectId}/${mm.id}`} locked={isLocked} index={i + 1} title={mm.title} hue={hue}
                      badge={nodes ? `${nodes} nodes` : "Tap to view"} icon={<Network className="h-5 w-5 md:h-6 md:w-6" />}
                      extra={<>{saved.includes(mm.id) && <Bookmark className="h-3.5 w-3.5 fill-slate-700 text-slate-700" aria-label="Saved" />}{revise.includes(mm.id) && <Flag className="h-3.5 w-3.5 fill-amber-500 text-amber-500" aria-label="To revise" />}</>} />
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {!canAccessContent && all.length > FREE_LIMIT && <UpgradeGate type="content" />}
    </div>
  )
}
