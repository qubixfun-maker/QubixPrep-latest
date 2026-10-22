"use client"
import { useTopSearch } from "@/components/layout/top-search"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Loader2, Microscope, ScanSearch, Timer } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useRequireAuth } from "@/hooks/use-require-auth"
import { useSpots } from "@/lib/spotters/remote"

export default function SpottersPage() {
  const { checkingAuth } = useRequireAuth()
  const { spots: SPOTS, groups: GROUPS } = useSpots()
  const [search] = useTopSearch("Search spotters…")
  const [group, setGroup] = useState<string>("All")
  const [subject, setSubject] = useState<string>("All")

  const groupCounts = useMemo(() => {
    const m: Record<string, number> = { All: SPOTS.length }
    SPOTS.forEach((s) => { m[s.group] = (m[s.group] || 0) + 1 })
    return m
  }, [SPOTS])

  const subjects = useMemo(() => {
    const set = new Set<string>()
    SPOTS.filter((s) => group === "All" || s.group === group).forEach((s) => set.add(s.subject))
    return ["All", ...Array.from(set).sort()]
  }, [group, SPOTS])

  const list = useMemo(() => {
    const q = search.trim().toLowerCase()
    return SPOTS.filter((s) =>
      (group === "All" || s.group === group) &&
      (subject === "All" || s.subject === subject) &&
      (!q || (s.name + " " + (s.aka || "") + " " + s.topic + " " + s.subject).toLowerCase().includes(q)),
    )
  }, [SPOTS, group, subject, search])

  if (checkingAuth) return <div className="flex h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5 px-3 py-4 md:px-6 md:py-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight md:text-3xl"><Microscope className="h-6 w-6 text-primary" /> Spot &amp; Identify</h1>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            Real practical-exam photos: instruments, gross specimens, pathology and histology slides. Open any photo for identification points, notes, viva questions and MCQs.
          </p>
        </div>
        <Button asChild className="gap-2"><Link href="/spotters/test"><Timer className="h-4 w-4" /> Spotter test</Link></Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {["All", ...GROUPS].map((g) => (
          <button key={g} onClick={() => { setGroup(g); setSubject("All") }}
            className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${group === g ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-muted"}`}>
            {g} <span className="opacity-70">({groupCounts[g] || 0})</span>
          </button>
        ))}
      </div>

      {subjects.length > 2 && (
        <div className="flex flex-wrap gap-2">
          {subjects.map((s) => (
            <button key={s} onClick={() => setSubject(s)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${subject === s ? "bg-foreground text-background" : "bg-muted text-muted-foreground hover:bg-muted/70"}`}>
              {s === "All" ? "All subjects" : s}
            </button>
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
                  <Badge variant="secondary" className="text-[10px]">{s.subject === "Obstetrics & Gynaecology" ? "OBG" : s.subject}</Badge>
                  <Badge variant="outline" className="text-[10px]">{s.topic}</Badge>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
