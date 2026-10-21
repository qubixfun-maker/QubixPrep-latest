"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Loader2, ArrowRight } from "lucide-react"
import { useUser } from "@/firebase"

type R = { subject: string; title: string; sub: string; href: string }

/** Searches inside a feature (topics, chapters or questions), not just the subject cards. */
export function DeepResults({ kind, query, noun }: { kind: "notes" | "essays" | "qbank"; query: string; noun: string }) {
  const { user } = useUser()
  const [st, setSt] = useState<{ results: R[]; total: number; loading: boolean }>({ results: [], total: 0, loading: false })
  const q = query.trim()
  useEffect(() => {
    if (q.length < 2 || !user) { setSt({ results: [], total: 0, loading: false }); return }
    let dead = false
    setSt((s) => ({ ...s, loading: true }))
    const t = setTimeout(async () => {
      try {
        const idToken = await user.getIdToken()
        const res = await fetch("/api/feature-search", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ idToken, kind, q }) })
        const d = await res.json()
        if (!dead) setSt({ results: d.results || [], total: d.total || 0, loading: false })
      } catch { if (!dead) setSt({ results: [], total: 0, loading: false }) }
    }, 350)
    return () => { dead = true; clearTimeout(t) }
  }, [kind, q, user])

  if (q.length < 2) return null
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground">
        {st.loading ? "Searching…" : `${st.total} ${noun} found for "${q}"`}
      </h2>
      {st.loading && st.results.length === 0 ? (
        <div className="flex justify-center py-6"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : (
        <div className="grid gap-2.5 md:grid-cols-2">
          {st.results.map((r, i) => (
            <Link key={i} href={r.href} className="group flex items-center gap-3 rounded-2xl border border-border bg-card p-3.5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
              <span className="min-w-0 flex-1">
                <strong className="block text-[14px] leading-snug">{r.title}</strong>
                <small className="mt-0.5 block truncate text-muted-foreground">{r.sub}</small>
                <span className="mt-1.5 inline-block rounded-full bg-secondary px-2 py-0.5 text-[10px] font-extrabold text-primary">{r.subject}</span>
              </span>
              <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1" />
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}
