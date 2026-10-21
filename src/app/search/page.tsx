"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { Search, FileText, Video, Network, Layers, Database, X, Loader2 } from "lucide-react"
import Link from "next/link"
import { useFirestore, useCollection } from "@/firebase"
import { collection, getDocs, limit, query as fsQuery } from "firebase/firestore"
import { useRequireAuth } from "@/hooks/use-require-auth"

type Type = "Note" | "Video" | "Mindmap" | "Flashcard" | "QBank"
type Item = { id: string; type: Type; title: string; body: string; category: string; meta?: string; href: string }

const FILTERS = ["All", "Note", "Video", "Mindmap", "Flashcard", "QBank"] as const
const STYLE: Record<Type, { icon: any; chip: string }> = {
  Note: { icon: FileText, chip: "bg-indigo-100 text-indigo-700" },
  Video: { icon: Video, chip: "bg-fuchsia-100 text-fuchsia-700" },
  Mindmap: { icon: Network, chip: "bg-emerald-100 text-emerald-700" },
  Flashcard: { icon: Layers, chip: "bg-violet-100 text-violet-700" },
  QBank: { icon: Database, chip: "bg-orange-100 text-orange-700" },
}

// Built once per visit and kept in memory, so typing never re-reads Firestore.
let CONTENT_INDEX: Item[] | null = null
let QBANK_INDEX: Item[] | null = null

const norm = (s: any) => String(s ?? "").toLowerCase()
function snippet(text: string, words: string[]) {
  const t = text.replace(/\s+/g, " ")
  const lower = t.toLowerCase()
  const at = Math.min(...words.map((w) => { const i = lower.indexOf(w); return i < 0 ? 1e9 : i }))
  if (at === 1e9) return t.slice(0, 140)
  const from = Math.max(0, at - 40)
  return (from > 0 ? "…" : "") + t.slice(from, from + 150) + (t.length > from + 150 ? "…" : "")
}
function Marked({ text, words }: { text: string; words: string[] }) {
  if (!words.length) return <>{text}</>
  const re = new RegExp("(" + words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|") + ")", "ig")
  return <>{text.split(re).map((p, i) => (i % 2 ? <mark key={i} className="rounded bg-amber-200/80 px-0.5 text-inherit">{p}</mark> : <span key={i}>{p}</span>))}</>
}

export default function SearchPage() {
  const db = useFirestore()
  const { checkingAuth } = useRequireAuth()
  const [q, setQ] = useState("")
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All")
  const [loading, setLoading] = useState(false)
  const [index, setIndex] = useState<Item[]>(CONTENT_INDEX || [])
  const [qbank, setQbank] = useState<Item[]>(QBANK_INDEX || [])
  const [qLoading, setQLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { try { const s = new URLSearchParams(window.location.search).get("q"); if (s) setQ(s) } catch {} }, [])

  const subjectsQuery = useMemo(() => (db ? collection(db, "subjects") : null), [db])
  const { data: subjects } = useCollection(subjectsQuery)

  // One-time index of titles, mind maps and flashcard text (flashcard decks are read whole, so card text is free to search).
  useEffect(() => {
    if (CONTENT_INDEX || !db || !subjects) return
    let dead = false
    setLoading(true)
    ;(async () => {
      const out: Item[] = []
      await Promise.all((subjects as any[]).map(async (s) => {
        const name = s.name || s.id
        const [topics, maps, decks] = await Promise.all([
          getDocs(collection(db, "subjects", s.id, "topics")).catch(() => null),
          getDocs(collection(db, "subjects", s.id, "mindmaps")).catch(() => null),
          getDocs(collection(db, "subjects", s.id, "flashcardDecks")).catch(() => null),
        ])
        topics?.forEach((d) => { const x = d.data() as any; out.push({ id: d.id, type: x.contentType === "video" ? "Video" : "Note", title: x.title || "", body: "", category: name, meta: x.unitName, href: `/notes/${s.id}/${d.id}` }) })
        maps?.forEach((d) => { const x = d.data() as any; out.push({ id: d.id, type: "Mindmap", title: x.title || "", body: "", category: name, meta: x.unitName, href: `/mindmaps/${s.id}/${d.id}` }) })
        decks?.forEach((d) => {
          const x = d.data() as any
          const cards = (x.cards || []) as any[]
          out.push({ id: d.id, type: "Flashcard", title: x.chapterName || x.title || "Flashcards", body: cards.map((c) => (c.front || "") + " — " + (c.back || "")).join(" | "), category: name, meta: `${cards.length} cards`, href: `/flashcards/${s.id}/${d.id}` })
        })
      }))
      if (dead) return
      CONTENT_INDEX = out
      setIndex(out); setLoading(false)
    })().catch(() => setLoading(false))
    return () => { dead = true }
  }, [db, subjects])

  // QBank question text is large, so it is only loaded when the student asks for it.
  async function loadQuestions() {
    if (!db || !subjects || qLoading) return
    setQLoading(true)
    const out: Item[] = []
    try {
      await Promise.all((subjects as any[]).map(async (s) => {
        const snap = await getDocs(fsQuery(collection(db, "subjects", s.id, "qbankQuestions"), limit(800))).catch(() => null)
        snap?.forEach((d) => {
          const x = d.data() as any
          if (!x.question_text) return
          out.push({ id: d.id, type: "QBank", title: x.question_text, body: [x.option1, x.option2, x.option3, x.option4, x.explanation].filter(Boolean).join(" | "), category: s.name || s.id, meta: x.topic_title || x.unit_title, href: `/qbank/${s.id}` })
        })
      }))
      QBANK_INDEX = out; setQbank(out)
    } finally { setQLoading(false) }
  }

  const words = useMemo(() => norm(q).split(/\s+/).filter((w) => w.length >= 2), [q])
  const results = useMemo(() => {
    if (!words.length) return []
    const scored: { it: Item; score: number }[] = []
    for (const it of [...index, ...qbank]) {
      const t = norm(it.title), b = norm(it.body), m = norm(it.meta)
      let score = 0, ok = true
      for (const w of words) {
        if (t.includes(w)) score += t.startsWith(w) ? 6 : 4
        else if (m.includes(w)) score += 2
        else if (b.includes(w)) score += 1
        else { ok = false; break }
      }
      if (ok) scored.push({ it, score })
    }
    return scored.sort((a, b) => b.score - a.score).slice(0, 80).map((s) => s.it)
  }, [words, index, qbank])

  const counts = useMemo(() => { const c: Record<string, number> = { All: results.length }; results.forEach((r) => { c[r.type] = (c[r.type] || 0) + 1 }); return c }, [results])
  const shown = results.filter((r) => filter === "All" || r.type === filter)

  if (checkingAuth) return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 md:p-10">
      <div className="relative">
        <Search className="pointer-events-none absolute left-5 top-1/2 h-6 w-6 -translate-y-1/2 text-muted-foreground" />
        <input ref={inputRef} autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search notes, flashcards, mind maps, questions…" className="h-16 w-full rounded-3xl border border-border bg-card pl-14 pr-14 text-lg font-semibold shadow-lg outline-none focus:border-primary md:h-20 md:text-2xl" />
        {q && <button onClick={() => { setQ(""); inputRef.current?.focus() }} aria-label="Clear" className="absolute right-5 top-1/2 -translate-y-1/2 rounded-full p-1.5 hover:bg-secondary"><X className="h-5 w-5" /></button>}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`rounded-full border px-4 py-1.5 text-sm font-bold transition ${filter === f ? "border-primary bg-primary text-white" : "border-border bg-card hover:border-primary/50"}`}>
            {f}{words.length && counts[f] ? <span className="ml-1.5 opacity-70">{counts[f]}</span> : null}
          </button>
        ))}
        {loading && <span className="ml-2 inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Preparing search…</span>}
      </div>

      {!qbank.length && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-dashed border-border bg-card p-4 text-sm">
          <span className="text-muted-foreground">Questions are not searched by default because there are thousands of them.</span>
          <button onClick={loadQuestions} disabled={qLoading || !subjects} className="inline-flex items-center gap-2 rounded-full bg-orange-500 px-4 py-2 text-xs font-extrabold text-white disabled:opacity-60">{qLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}{qLoading ? "Loading questions…" : "Also search question text"}</button>
        </div>
      )}

      {words.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground"><Search className="mx-auto mb-4 h-14 w-14 opacity-20" /><p>Type two or more letters. Several words narrow the search, for example <b>nephritic complement</b>.</p></div>
      ) : shown.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground"><p className="text-lg font-bold">Nothing found for “{q}”</p>{!qbank.length && <p className="mt-1 text-sm">Try “Also search question text” above.</p>}</div>
      ) : (
        <ul className="space-y-3">
          {shown.map((r) => {
            const S = STYLE[r.type]
            const sub = r.body ? snippet(r.body, words) : ""
            return (
              <li key={r.type + r.id}>
                <Link href={r.href} className="flex items-start gap-4 rounded-3xl border border-border bg-card p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md md:p-5">
                  <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${S.chip}`}><S.icon className="h-5 w-5" /></span>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground"><span>{r.category}</span><span className={`rounded-full px-2 py-0.5 ${S.chip}`}>{r.type}</span>{r.meta && <span className="normal-case tracking-normal">· {r.meta}</span>}</div>
                    <h3 className="line-clamp-2 text-base font-extrabold md:text-lg"><Marked text={r.title} words={words} /></h3>
                    {sub && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground"><Marked text={sub} words={words} /></p>}
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
