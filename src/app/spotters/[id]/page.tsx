"use client"

import { use, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { ChevronLeft, ChevronRight, Check, X, ZoomIn, ZoomOut, Loader2, Lightbulb, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useRequireAuth } from "@/hooks/use-require-auth"
import { useUser, useFirestore } from "@/firebase"
import { recordBulk } from "@/lib/study"
import { shuffled, type Spot } from "@/lib/spotters"
import { useSpots } from "@/lib/spotters/remote"
import type { SpotQ } from "@/lib/spotters/quiz"

type Tab = "identify" | "notes" | "viva" | "quiz"
const TABS: { id: Tab; label: string }[] = [
  { id: "identify", label: "Identify" },
  { id: "notes", label: "Notes" },
  { id: "viva", label: "Viva" },
  { id: "quiz", label: "Quiz" },
]

export default function SpotDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { checkingAuth } = useRequireAuth()
  const { spots: SPOTS, byId, ready } = useSpots()
  const spot = byId[id]
  const [tab, setTab] = useState<Tab>("identify")
  const [img, setImg] = useState(0)
  const [zoom, setZoom] = useState<number | null>(null)

  const siblings = useMemo(() => (spot ? SPOTS.filter((s) => s.group === spot.group) : []), [spot, SPOTS])
  const at = siblings.findIndex((s) => s.id === id)
  const prev = at > 0 ? siblings[at - 1] : null
  const next = at >= 0 && at < siblings.length - 1 ? siblings[at + 1] : null

  useEffect(() => { setTab("identify"); setImg(0); setZoom(null) }, [id])

  if (checkingAuth || (!spot && !ready)) return <div className="flex h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
  if (!spot) {
    return (
      <div className="mx-auto max-w-md space-y-3 p-8 text-center">
        <p className="text-lg font-semibold">This photo was not found.</p>
        <Button asChild><Link href="/spotters">Back to Spot &amp; Identify</Link></Button>
      </div>
    )
  }

  const cur = spot.imgs[Math.min(img, spot.imgs.length - 1)]

  return (
    <div className="mx-auto w-full max-w-6xl space-y-4 px-3 py-4 md:px-6 md:py-6">
      <div className="flex items-center justify-between gap-2">
        <Link href="/spotters" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ChevronLeft className="h-4 w-4" /> All photos</Link>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={!prev} asChild={!!prev}>{prev ? <Link href={`/spotters/${prev.id}`}><ChevronLeft className="h-4 w-4" /> Prev</Link> : <><ChevronLeft className="h-4 w-4" /> Prev</>}</Button>
          <Button variant="outline" size="sm" disabled={!next} asChild={!!next}>{next ? <Link href={`/spotters/${next.id}`}>Next <ChevronRight className="h-4 w-4" /></Link> : <>Next <ChevronRight className="h-4 w-4" /></>}</Button>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* ---------- image side ---------- */}
        <div className="space-y-2 lg:sticky lg:top-4 lg:self-start">
          <button onClick={() => setZoom(1)} className="group relative block w-full overflow-hidden rounded-2xl bg-black" aria-label="Zoom photo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={cur.f} alt={spot.labelled ? spot.name : "Spotter photo"} className="mx-auto max-h-[60vh] w-full object-contain" />
            <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-full bg-black/70 px-2.5 py-1 text-xs text-white"><ZoomIn className="h-3.5 w-3.5" /> Tap to zoom</span>
            {cur.cap && <span className="absolute left-2 top-2 rounded-full bg-black/70 px-2.5 py-1 text-xs text-white">{cur.cap}</span>}
          </button>
          {spot.imgs.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {spot.imgs.map((im, i) => (
                <button key={im.f} onClick={() => setImg(i)} className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 bg-black ${i === img ? "border-primary" : "border-transparent opacity-70"}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={im.f} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
          {spot.labelled && <p className="text-xs text-muted-foreground">The label written on this photo shows the answer. In the Spotter test it is asked as a question instead.</p>}
        </div>

        {/* ---------- text side ---------- */}
        <div className="min-w-0 space-y-4">
          <div>
            <div className="mb-1.5 flex flex-wrap gap-1.5">
              <Badge>{spot.subject}</Badge><Badge variant="secondary">{spot.group}</Badge><Badge variant="outline">{spot.topic}</Badge>
            </div>
            <h1 className="text-2xl font-bold leading-tight tracking-tight md:text-3xl">{spot.name}</h1>
            {spot.aka && <p className="text-sm text-muted-foreground">Also: {spot.aka}</p>}
          </div>

          <div className="flex gap-1 rounded-xl bg-muted p-1">
            {TABS.map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)} className={`flex-1 rounded-lg px-2 py-2 text-sm font-medium transition ${tab === t.id ? "bg-background shadow-sm" : "text-muted-foreground"}`}>{t.label}</button>
            ))}
          </div>

          {tab === "identify" && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Write these points in the spotter answer:</p>
              <ol className="space-y-2">
                {spot.identify.map((p, i) => (
                  <li key={i} className="flex gap-3 rounded-xl border bg-card p-3 text-sm">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">{i + 1}</span>
                    <span>{p}</span>
                  </li>
                ))}
              </ol>
              <p className="rounded-xl bg-muted p-3 text-sm leading-relaxed">{spot.about}</p>
            </div>
          )}

          {tab === "notes" && (
            <div className="space-y-3">
              <p className="rounded-xl bg-muted p-3 text-sm leading-relaxed">{spot.about}</p>
              <ul className="space-y-2">
                {spot.points.map((p, i) => (
                  <li key={i} className="flex gap-2 rounded-xl border bg-card p-3 text-sm leading-relaxed"><Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" /><span>{p}</span></li>
                ))}
              </ul>
            </div>
          )}

          {tab === "viva" && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Tap a question to reveal the answer.</p>
              {spot.viva.map((v, i) => {
                const [q, a] = v.split(" — ")
                return (
                  <details key={i} className="group rounded-xl border bg-card p-3 text-sm">
                    <summary className="cursor-pointer list-none font-medium">{q}</summary>
                    <p className="mt-2 rounded-lg bg-emerald-500/10 p-2 text-emerald-700 dark:text-emerald-300">{a || ""}</p>
                  </details>
                )
              })}
            </div>
          )}

          {tab === "quiz" && <MiniQuiz key={spot.id} spot={spot} />}
        </div>
      </div>

      {zoom !== null && (
        <div className="keep-dark fixed inset-0 z-[100] flex flex-col bg-black/95">
          <div className="flex items-center justify-between gap-2 p-3 text-white">
            <span className="line-clamp-1 text-sm">{spot.labelled ? spot.name : "Spotter photo"}</span>
            <div className="flex items-center gap-2">
              <Button size="icon" variant="secondary" onClick={() => setZoom((z) => Math.max(1, (z || 1) - 0.5))}><ZoomOut className="h-4 w-4" /></Button>
              <span className="w-10 text-center text-sm">{Math.round((zoom || 1) * 100)}%</span>
              <Button size="icon" variant="secondary" onClick={() => setZoom((z) => Math.min(5, (z || 1) + 0.5))}><ZoomIn className="h-4 w-4" /></Button>
              <Button size="icon" variant="secondary" onClick={() => setZoom(null)}><X className="h-4 w-4" /></Button>
            </div>
          </div>
          <div className="flex-1 overflow-auto">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={cur.f} alt="" style={{ width: `${(zoom || 1) * 100}%`, maxWidth: "none" }} className="mx-auto block h-auto" />
          </div>
        </div>
      )}
    </div>
  )
}

/** The item's own MCQs, one at a time, with shuffled options. Answers are saved to My Progress. */
function MiniQuiz({ spot }: { spot: Spot }) {
  const { user } = useUser()
  const db = useFirestore()
  const [round, setRound] = useState(0)
  const qs: SpotQ[] = useMemo(() => shuffled(spot.mcq).map((m) => {
    const options = shuffled([m[1], m[2], m[3], m[4]])
    return { spot, kind: "text" as const, prompt: m[0], options, correct: options.indexOf(m[1]), why: m[5], srsQuestion: m[0] }
  }), [spot, round]) // eslint-disable-line react-hooks/exhaustive-deps
  const [i, setI] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const saved = useRef<Set<number>>(new Set())
  const done = i >= qs.length
  const q = qs[i]

  const answer = (k: number) => {
    if (picked !== null || !q) return
    setPicked(k)
    if (k === q.correct) setScore((s) => s + 1)
    if (user && db && !saved.current.has(i)) {
      saved.current.add(i)
      recordBulk(db, user.uid, [{ subjectId: spot.subject, topic: `Spotters: ${spot.group}`, question: q.srsQuestion, options: q.options, correct: q.correct, explanation: q.why, picked: k }]).catch(() => {})
    }
  }
  const again = () => { saved.current = new Set(); setI(0); setPicked(null); setScore(0); setRound((r) => r + 1) }

  if (done) {
    return (
      <div className="space-y-3 rounded-xl border bg-card p-5 text-center">
        <p className="text-3xl font-bold">{score} / {qs.length}</p>
        <p className="text-sm text-muted-foreground">{score === qs.length ? "Perfect. You can spot this one." : "Read the notes once more and try again."}</p>
        <Button onClick={again} variant="outline" className="gap-2"><RotateCcw className="h-4 w-4" /> Try again</Button>
      </div>
    )
  }
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">Question {i + 1} of {qs.length}</p>
      <p className="font-medium leading-snug">{q.prompt}</p>
      <div className="space-y-2">
        {q.options.map((o, k) => {
          const state = picked === null ? "" : k === q.correct ? "border-emerald-500 bg-emerald-500/10" : k === picked ? "border-rose-500 bg-rose-500/10" : "opacity-60"
          return (
            <button key={k} onClick={() => answer(k)} disabled={picked !== null} className={`flex w-full items-start gap-2 rounded-xl border bg-card p-3 text-left text-sm transition ${state || "hover:bg-muted"}`}>
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[11px]">{picked !== null && k === q.correct ? <Check className="h-3 w-3 text-emerald-600" /> : picked === k ? <X className="h-3 w-3 text-rose-600" /> : String.fromCharCode(65 + k)}</span>
              <span>{o}</span>
            </button>
          )
        })}
      </div>
      {picked !== null && (
        <div className="space-y-2 rounded-xl bg-muted p-3 text-sm">
          <p>{q.why}</p>
          <Button size="sm" onClick={() => { setI((n) => n + 1); setPicked(null) }}>{i + 1 >= qs.length ? "See score" : "Next question"}</Button>
        </div>
      )}
    </div>
  )
}
