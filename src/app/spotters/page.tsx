"use client"
import { useTopSearch } from "@/components/layout/top-search"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Loader2, Microscope, ScanSearch, Timer } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useRequireAuth } from "@/hooks/use-require-auth"
import { useSpots } from "@/lib/spotters/remote"
import { SUBJECT_ORDER, groupsWithCounts, subjectLabel, subjectsWithCounts } from "@/lib/spotters/subjects"

export default function SpottersPage() {
  const { checkingAuth } = useRequireAuth()
  const { spots: SPOTS } = useSpots()
  const [search] = useTopSearch("Search spotters…")
  const [subject, setSubjectState] = useState<string>("All")
  const [group, setGroup] = useState<string>("All")

  // remember the subject when coming back from a photo
  useEffect(() => { try { const v = sessionStorage.getItem("spot-subject"); if (v) setSubjectState(v) } catch {} }, [])
  const setSubject = (v: string) => { setSubjectState(v); setGroup("All"); try { sessionStorage.setItem("spot-subject", v) } catch {} }

  const subjects = useMemo(() => subjectsWithCounts(SPOTS), [SPOTS])
  // every subject always gets a card, in the usual order; ones without photos yet say "Coming soon"
  const tiles = useMemo(() => {
    const have = new Map(subjects.map((x) => [x.subject, x.count]))
    const base = SUBJECT_ORDER.map((sb) => ({ subject: sb, count: have.get(sb) || 0 }))
    const extra = subjects.filter((x) => !SUBJECT_ORDER.includes(x.subject))
    return [...base, ...extra]
  }, [subjects])
  const groups = useMemo(() => groupsWithCounts(SPOTS, subject), [SPOTS, subject])
  const activeSubject = subject === "All" || subjects.some((x) => x.subject === subject) ? subject : "All"

  const list = useMemo(() => {
    const q = search.trim().toLowerCase()
    return SPOTS.filter((s) =>
      (activeSubject === "All" || s.subject === activeSubject) &&
      (group === "All" || s.group === group) &&
      (!q || (s.name + " " + (s.aka || "") + " " + s.topic + " " + s.subject + " " + s.group).toLowerCase().includes(q)),
    )
  }, [SPOTS, activeSubject, group, search])

  if (checkingAuth) return <div className="flex h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>

  const chip = (on: boolean) => `rounded-full border px-3 py-1.5 text-sm font-medium transition ${on ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-muted"}`
  return (
    <div className="mx-auto w-full max-w-6xl space-y-5 px-3 py-4 md:px-6 md:py-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight md:text-3xl"><Microscope className="h-6 w-6 text-primary" /> Spot &amp; Identify</h1>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            Practical-exam photos, subject by subject. Pick a subject, then a type (instruments, specimens, slides, X-rays, drugs and more). Open any photo for identification points, notes, viva questions and MCQs.
          </p>
        </div>
        <Button asChild className="gap-2"><Link href="/spotters/test"><Timer className="h-4 w-4" /> Spotter test</Link></Button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <button onClick={() => setSubject("All")} className={`rounded-2xl border p-4 text-left transition ${activeSubject === "All" ? "border-primary bg-primary text-primary-foreground shadow" : "bg-card hover:bg-muted"}`}>
          <p className="text-base font-bold">All subjects</p><p className="mt-0.5 text-xs opacity-75">{SPOTS.length} photos</p>
        </button>
        {tiles.map(({ subject: sb, count }) => count > 0 ? (
          <button key={sb} onClick={() => setSubject(sb)} className={`rounded-2xl border p-4 text-left transition ${activeSubject === sb ? "border-primary bg-primary text-primary-foreground shadow" : "bg-card hover:bg-muted"}`}>
            <p className="text-base font-bold leading-tight">{subjectLabel(sb)}</p><p className="mt-0.5 text-xs opacity-75">{count} photos</p>
          </button>
        ) : (
          <div key={sb} className="rounded-2xl border border-dashed bg-muted/30 p-4 text-left text-muted-foreground">
            <p className="text-base font-bold leading-tight">{subjectLabel(sb)}</p><p className="mt-0.5 text-xs">Coming soon</p>
          </div>
        ))}
      </div>

      {groups.length > 1 && (
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setGroup("All")} className={chip(group === "All")}>All types</button>
          {groups.map(({ group: g, count }) => (
            <button key={g} onClick={() => setGroup(g)} className={chip(group === g)}>{g} <span className="opacity-70">({count})</span></button>
          ))}
        </div>
      )}

      {list.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed p-10 text-center text-muted-foreground">
          <ScanSearch className="h-8 w-8" /> Nothing matches your search.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {list.map((s) => (
            <Link key={s.id} href={`/spotters/${s.id}`} className="group overflow-hidden rounded-xl border bg-card shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <div className="relative aspect-square overflow-hidden bg-black">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.imgs[0].f} alt={s.labelled ? s.name : "Spotter photo"} loading="lazy" className="h-full w-full object-cover transition group-hover:scale-105" />
                {s.imgs.length > 1 && <span className="absolute right-1.5 top-1.5 rounded-full bg-black/70 px-2 py-0.5 text-[11px] font-medium text-white">{s.imgs.length} photos</span>}
              </div>
              <div className="space-y-1 p-2.5">
                <p className="line-clamp-2 text-sm font-semibold leading-snug">{s.name}</p>
                <div className="flex flex-wrap gap-1">
                  <Badge variant="secondary" className="text-[10px]">{subjectLabel(s.subject)}</Badge>
                  <Badge variant="outline" className="text-[10px]">{s.group === "Instruments" ? s.topic : s.group + " · " + s.topic}</Badge>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
