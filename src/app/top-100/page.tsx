"use client"
import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { BookOpen, ChevronRight, Loader2 } from "lucide-react"
import { useFirestore } from "@/firebase"
import { useTopSearch } from "@/components/layout/top-search"
import { loadTop100List, type Top100Page } from "@/lib/top100-pages"

export default function Top100Page() {
  const db = useFirestore()
  const [pages, setPages] = useState<Top100Page[] | null>(null)
  const [subject, setSubject] = useState<string>("")
  const [search] = useTopSearch("Search topics…")
  const q = search.trim().toLowerCase()

  useEffect(() => {
    if (!db) return
    loadTop100List(db).then((p) => { setPages(p); if (p.length) setSubject((s) => s || p[0].subjectKey) }).catch(() => setPages([]))
  }, [db])

  const subjects = useMemo(() => {
    const m = new Map<string, string>()
    ;(pages || []).forEach((p) => m.set(p.subjectKey, p.subject))
    return Array.from(m.entries())
  }, [pages])

  const shown = useMemo(() => (pages || []).filter((p) => (q ? p.title.toLowerCase().includes(q) : p.subjectKey === subject)), [pages, subject, q])

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-3xl font-bold tracking-tight">Top 100 <span className="text-accent">Topics</span></h1>
      <p className="mt-1 text-sm text-muted-foreground">The most important topics, each on one revision sheet. Tap a topic to open it.</p>

      {subjects.length > 1 && !q && (
        <div className="mt-5 flex flex-wrap gap-2">
          {subjects.map(([key, name]) => (
            <button key={key} onClick={() => setSubject(key)}
              className={`rounded-full border px-4 py-1.5 text-sm font-bold ${subject === key ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground"}`}>
              {name}
            </button>
          ))}
        </div>
      )}

      {pages === null && <div className="flex justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}
      {pages && pages.length === 0 && <p className="py-16 text-center text-sm text-muted-foreground">Topics are being added. Please check back soon.</p>}

      <div className="mt-5 space-y-3">
        {shown.map((p) => (
          <Link key={p.id} href={`/top-100/${p.id}`}
            className="flex items-center gap-4 rounded-3xl border border-border bg-card px-5 py-5 shadow-sm transition active:scale-[0.99] hover:border-primary/40">
            <BookOpen className="h-6 w-6 shrink-0 text-primary" />
            <span className="min-w-0 flex-1 text-lg font-medium leading-snug">{p.title}</span>
            <span className="shrink-0 text-xs font-bold text-muted-foreground">{String(p.order).padStart(2, "0")}</span>
            <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
          </Link>
        ))}
      </div>
    </div>
  )
}
