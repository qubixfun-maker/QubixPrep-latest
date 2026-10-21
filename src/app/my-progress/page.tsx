"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Loader2, Target, TrendingUp, TrendingDown, Flame, RotateCcw } from "lucide-react"
import { useFirestore, useUser } from "@/firebase"
import { useRequireAuth } from "@/hooks/use-require-auth"
import { countDue, dayKey, loadStats } from "@/lib/study"

type Stats = Awaited<ReturnType<typeof loadStats>>
const cap = (s: string) => (s || "").replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())

function streakOf(days: Stats["days"]) {
  let n = 0
  const d = new Date()
  const active = (k: string) => { const x = (days || {})[k]; return !!x && ((x.q || 0) + (x.f || 0)) > 0 }
  if (!active(dayKey(d))) d.setDate(d.getDate() - 1) // today not done yet: streak still alive
  while (active(dayKey(d))) { n++; d.setDate(d.getDate() - 1) }
  return n
}

export default function MyProgress() {
  const db = useFirestore()
  const { user } = useUser()
  const { checkingAuth } = useRequireAuth()
  const [stats, setStats] = useState<Stats | null>(null)
  const [due, setDue] = useState(0)

  useEffect(() => {
    if (!db || !user) return
    loadStats(db, user.uid).then(setStats).catch(() => setStats({}))
    countDue(db, user.uid).then(setDue)
  }, [db, user])

  const view = useMemo(() => {
    if (!stats) return null
    const total = stats.total || { a: 0, c: 0 }
    const days = Array.from({ length: 14 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - (13 - i)); const k = dayKey(d); const v = (stats.days || {})[k] || {}; return { k, label: d.getDate(), q: v.q || 0, c: v.c || 0, f: v.f || 0 } })
    const max = Math.max(5, ...days.map((d) => d.q + d.f))
    const topics = Object.values(stats.topics || {}).filter((t) => t.a >= 3).map((t) => ({ ...t, pct: Math.round((t.c / t.a) * 100) }))
    return { total, days, max, weak: [...topics].sort((a, b) => a.pct - b.pct).slice(0, 6), strong: [...topics].sort((a, b) => b.pct - a.pct).slice(0, 4), streak: streakOf(stats.days), week: days.slice(7).reduce((s, d) => s + d.q + d.f, 0) }
  }, [stats])

  if (checkingAuth || !view) return <div className="flex h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  const acc = view.total.a ? Math.round((view.total.c / view.total.a) * 100) : 0

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 md:p-10">
      <div className="relative overflow-hidden rounded-[2rem] p-7 text-white shadow-xl md:p-10" style={{ background: "linear-gradient(120deg,#0f766e 0%,#0891b2 55%,#2563eb 100%)" }}>
        <div className="relative space-y-2">
          <h1 className="text-3xl font-black tracking-tight md:text-5xl">My progress</h1>
          <p className="max-w-lg text-sm font-medium text-white/90 md:text-base">See where you are strong, where marks are leaking, and how consistent you have been.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { l: "Questions answered", v: view.total.a, i: Target },
          { l: "Accuracy", v: acc + "%", i: TrendingUp },
          { l: "Day streak", v: view.streak, i: Flame },
          { l: "Done this week", v: view.week, i: RotateCcw },
        ].map((s) => (
          <div key={s.l} className="rounded-3xl border border-border bg-card p-4 shadow-sm"><s.i className="h-5 w-5 text-primary" /><p className="mt-2 text-2xl font-black">{s.v}</p><p className="text-xs font-bold text-muted-foreground">{s.l}</p></div>
        ))}
      </div>

      {due > 0 && <Link href="/review" className="flex items-center justify-between rounded-3xl bg-violet-600 p-5 text-white shadow-lg"><span className="font-extrabold">{due} item{due === 1 ? "" : "s"} due for review today</span><span className="rounded-full bg-white/20 px-4 py-1.5 text-sm font-black">Start</span></Link>}

      <section className="rounded-3xl border border-border bg-card p-5 shadow-sm">
        <h2 className="font-black">Last 14 days</h2>
        <div className="mt-4 flex h-36 items-end gap-1.5">
          {view.days.map((d) => (
            <div key={d.k} className="flex flex-1 flex-col items-center gap-1">
              <div className="flex w-full flex-1 flex-col justify-end overflow-hidden rounded-md bg-secondary/60" title={`${d.q} questions, ${d.f} cards`}>
                <div className="w-full bg-sky-400" style={{ height: (d.f / view.max) * 100 + "%" }} />
                <div className="w-full bg-primary" style={{ height: (d.q / view.max) * 100 + "%" }} />
              </div>
              <span className="text-[10px] font-bold text-muted-foreground">{d.label}</span>
            </div>
          ))}
        </div>
        <p className="mt-3 flex gap-4 text-xs font-bold text-muted-foreground"><span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-primary" />Questions</span><span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-sky-400" />Flashcards</span></p>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-3xl border border-border bg-card p-5 shadow-sm">
          <h2 className="flex items-center gap-2 font-black"><TrendingDown className="h-4 w-4 text-rose-500" /> Weakest topics</h2>
          {view.weak.length === 0 ? <p className="mt-3 text-sm text-muted-foreground">Answer at least 3 questions in a topic and it shows up here.</p> : (
            <ul className="mt-3 space-y-3">{view.weak.map((t) => (
              <li key={t.s + t.n}>
                <Link href={`/qbank/${t.s}`} className="block">
                  <div className="flex justify-between text-sm"><span className="font-bold">{t.n}<span className="ml-2 text-xs font-semibold text-muted-foreground">{cap(t.s)}</span></span><span className="font-black text-rose-600">{t.pct}%</span></div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-secondary"><div className="h-full rounded-full bg-rose-500" style={{ width: t.pct + "%" }} /></div>
                </Link>
              </li>
            ))}</ul>
          )}
        </section>
        <section className="rounded-3xl border border-border bg-card p-5 shadow-sm">
          <h2 className="flex items-center gap-2 font-black"><TrendingUp className="h-4 w-4 text-emerald-500" /> Strongest topics</h2>
          {view.strong.length === 0 ? <p className="mt-3 text-sm text-muted-foreground">Nothing yet. Keep practising.</p> : (
            <ul className="mt-3 space-y-3">{view.strong.map((t) => (
              <li key={t.s + t.n}>
                <div className="flex justify-between text-sm"><span className="font-bold">{t.n}<span className="ml-2 text-xs font-semibold text-muted-foreground">{cap(t.s)}</span></span><span className="font-black text-emerald-600">{t.pct}%</span></div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-secondary"><div className="h-full rounded-full bg-emerald-500" style={{ width: t.pct + "%" }} /></div>
              </li>
            ))}</ul>
          )}
        </section>
      </div>
      <p className="text-center text-xs text-muted-foreground">Stats count from the day this feature was added. Older practice is not included.</p>
    </div>
  )
}
