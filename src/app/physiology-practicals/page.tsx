"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Activity, Loader2, ScanSearch } from "lucide-react"
import { useRequireAuth } from "@/hooks/use-require-auth"
import { useTopSearch } from "@/components/layout/top-search"
import { GROUPS, PRACTICALS, loadBest, type Best } from "@/lib/physiology/practicals"

export default function PhysiologyPracticalsPage() {
  const { checkingAuth } = useRequireAuth()
  const [search] = useTopSearch("Search practicals…")
  const [best, setBest] = useState<Best>({})
  useEffect(() => setBest(loadBest()), [])

  const q = search.trim().toLowerCase()
  const shown = useMemo(
    () => PRACTICALS.filter((p) => !q || (p.title + " " + p.desc + " " + p.group).toLowerCase().includes(q)),
    [q],
  )
  const done = PRACTICALS.filter((p) => best[p.id]).length

  if (checkingAuth) return <div className="flex h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-3 py-4 md:px-6 md:py-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight md:text-3xl"><Activity className="h-6 w-6 text-primary" /> Physiology Practicals</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Do each practical on a virtual patient, step by step, with the procedure, why each step matters, and examiner tips. Every run ends with a marked result and viva questions. Each time you start a new subject, the patient is different.
        </p>
        <p className="mt-2 text-xs font-medium text-muted-foreground">{done} of {PRACTICALS.length} tried on this device</p>
      </div>

      {shown.length === 0 && (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed p-10 text-center text-muted-foreground">
          <ScanSearch className="h-8 w-8" /> Nothing matches your search.
        </div>
      )}

      {GROUPS.map((g) => {
        const items = shown.filter((p) => p.group === g)
        if (!items.length) return null
        return (
          <section key={g} className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">{g}</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((p) => {
                const b = best[p.id]
                return (
                  <Link key={p.id} href={`/physiology-practicals/${p.id}`} className="group flex gap-3 rounded-2xl border bg-card p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                    <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-[28px]" style={{ background: p.tint }}>{p.emoji}</div>
                    <div className="min-w-0 flex-1">
                      <p className="text-base font-bold leading-tight">{p.title}</p>
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{p.desc}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] font-semibold">
                        <span className="rounded-full bg-secondary px-2 py-0.5 text-primary">~{p.mins} min</span>
                        {b && <span className="rounded-full bg-primary px-2 py-0.5 text-primary-foreground">Best {b.tot}/{b.max}</span>}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </section>
        )
      })}
    </div>
  )
}
