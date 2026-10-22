"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { ChevronLeft, Check, X, Loader2, Timer, RotateCcw, BookOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { useRequireAuth } from "@/hooks/use-require-auth"
import { useUser, useFirestore } from "@/firebase"
import { recordBulk } from "@/lib/study"
import { useSpots } from "@/lib/spotters/remote"
import { buildQuestions, type SpotQ } from "@/lib/spotters/quiz"

const COUNTS = [10, 20, 30]
const SECONDS = 40

export default function SpotterTestPage() {
  const { checkingAuth } = useRequireAuth()
  const { spots: SPOTS, groups: GROUPS } = useSpots()
  const { user } = useUser()
  const db = useFirestore()

  const [group, setGroup] = useState<string>("All")
  const [subject, setSubject] = useState<string>("All")
  const [count, setCount] = useState(10)
  const [timed, setTimed] = useState(true)

  const [qs, setQs] = useState<SpotQ[] | null>(null)
  const [i, setI] = useState(0)
  const [picked, setPicked] = useState<number | null>(null) // -1 = time ran out
  const [answers, setAnswers] = useState<(number | null)[]>([])
  const [left, setLeft] = useState(SECONDS)
  const saved = useRef(false)

  const subjects = useMemo(() => {
    const set = new Set<string>()
    SPOTS.filter((s) => group === "All" || s.group === group).forEach((s) => set.add(s.subject))
    return ["All", ...Array.from(set).sort()]
  }, [group, SPOTS])
  const pool = useMemo(() => SPOTS.filter((s) => (group === "All" || s.group === group) && (subject === "All" || s.subject === subject)), [SPOTS, group, subject])

  const q = qs ? qs[i] : null
  const finished = !!qs && i >= qs.length

  const start = () => {
    setQs(buildQuestions(pool, count, SPOTS)); setI(0); setPicked(null); setAnswers([]); setLeft(SECONDS); saved.current = false
  }

  // countdown for photo questions
  useEffect(() => {
    if (!qs || !q || picked !== null || !timed || q.kind !== "image") return
    setLeft(SECONDS)
    const t = setInterval(() => setLeft((s) => s - 1), 1000)
    return () => clearInterval(t)
  }, [qs, i, q, picked, timed])
  useEffect(() => { if (qs && q && picked === null && timed && q.kind === "image" && left <= 0) choose(-1) }, [left]) // eslint-disable-line react-hooks/exhaustive-deps

  const choose = (k: number) => {
    if (picked !== null || !q) return
    setPicked(k)
    setAnswers((a) => { const n = [...a]; n[i] = k; return n })
  }
  const next = () => { setI((n) => n + 1); setPicked(null) }

  // save to My Progress once, when the test ends
  useEffect(() => {
    if (!finished || !qs || saved.current || !user || !db) return
    saved.current = true
    recordBulk(db, user.uid, qs.map((x, n) => ({
      subjectId: x.spot.subject, topic: `Spotters: ${x.spot.group}`, question: x.srsQuestion, options: x.options, correct: x.correct, explanation: x.why, picked: answers[n] === undefined ? null : answers[n],
    }))).catch(() => {})
  }, [finished, qs, answers, user, db])

  if (checkingAuth) return <div className="flex h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>

  /* ------------------------------ setup ------------------------------ */
  if (!qs) {
    return (
      <div className="mx-auto w-full max-w-xl space-y-5 px-3 py-4 md:py-8">
        <Link href="/spotters" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ChevronLeft className="h-4 w-4" /> Back</Link>
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold"><Timer className="h-6 w-6 text-primary" /> Spotter test</h1>
          <p className="mt-1 text-sm text-muted-foreground">A photo appears and you pick its name, like a practical exam. Photos that already carry a label are asked as written questions instead.</p>
        </div>

        <Section title="Topic">
          <Chips value={group} options={["All", ...GROUPS]} onChange={(v) => { setGroup(v); setSubject("All") }} />
          {subjects.length > 2 && <Chips value={subject} options={subjects} onChange={setSubject} small />}
        </Section>
        <Section title="Number of questions"><Chips value={String(count)} options={COUNTS.map(String)} onChange={(v) => setCount(Number(v))} /></Section>
        <label className="flex items-center justify-between rounded-xl border bg-card p-3 text-sm">
          <span>Timed ({SECONDS} seconds per photo)</span>
          <Switch checked={timed} onCheckedChange={setTimed} />
        </label>
        <p className="text-xs text-muted-foreground">{pool.length} photos in this selection. Your answers are saved to My Progress and wrong ones go to Daily Review.</p>
        <Button className="w-full" size="lg" disabled={pool.length < 4} onClick={start}>Start test</Button>
      </div>
    )
  }

  /* ------------------------------ result ------------------------------ */
  if (finished) {
    const score = qs.filter((x, n) => answers[n] === x.correct).length
    return (
      <div className="mx-auto w-full max-w-2xl space-y-5 px-3 py-4 md:py-8">
        <div className="rounded-2xl border bg-card p-6 text-center">
          <p className="text-4xl font-bold">{score} / {qs.length}</p>
          <p className="mt-1 text-sm text-muted-foreground">{score >= qs.length * 0.8 ? "Excellent spotting." : score >= qs.length * 0.5 ? "Good. Review the ones you missed." : "Keep practising. Open the notes for each miss."}</p>
          <div className="mt-4 flex justify-center gap-2">
            <Button onClick={start} className="gap-2"><RotateCcw className="h-4 w-4" /> New test</Button>
            <Button variant="outline" onClick={() => setQs(null)}>Change topic</Button>
          </div>
        </div>
        <div className="space-y-2">
          {qs.map((x, n) => {
            const ok = answers[n] === x.correct
            return (
              <Link key={n} href={`/spotters/${x.spot.id}`} className="flex items-center gap-3 rounded-xl border bg-card p-2.5 text-sm hover:bg-muted">
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-black">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={x.spot.imgs[0].f} alt="" className="h-full w-full object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 font-medium">{x.spot.name}</p>
                  <p className="line-clamp-1 text-xs text-muted-foreground">{x.kind === "text" ? x.prompt : "Photo identification"}</p>
                </div>
                {ok ? <Check className="h-5 w-5 shrink-0 text-emerald-600" /> : <X className="h-5 w-5 shrink-0 text-rose-600" />}
              </Link>
            )
          })}
        </div>
      </div>
    )
  }

  /* ------------------------------ question ------------------------------ */
  return (
    <div className="mx-auto w-full max-w-2xl space-y-4 px-3 py-4 md:py-8">
      <div className="flex items-center justify-between text-sm">
        <button onClick={() => setQs(null)} className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"><ChevronLeft className="h-4 w-4" /> Quit</button>
        <span className="text-muted-foreground">{i + 1} / {qs.length}</span>
        {timed && q!.kind === "image" ? <span className={`font-mono font-semibold ${left <= 10 && picked === null ? "text-rose-600" : ""}`}>{picked === null ? Math.max(0, left) : "–"}s</span> : <span className="w-8" />}
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full bg-primary transition-all" style={{ width: `${(i / qs.length) * 100}%` }} /></div>

      {q!.kind === "image" && (
        <div className="overflow-hidden rounded-2xl bg-black">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={q!.spot.imgs[0].f} alt="Identify this" className="mx-auto max-h-[45vh] w-full object-contain" />
        </div>
      )}
      <p className="font-semibold leading-snug">{q!.prompt}</p>

      <div className="space-y-2">
        {q!.options.map((o, k) => {
          const state = picked === null ? "hover:bg-muted" : k === q!.correct ? "border-emerald-500 bg-emerald-500/10" : k === picked ? "border-rose-500 bg-rose-500/10" : "opacity-60"
          return (
            <button key={k} onClick={() => choose(k)} disabled={picked !== null} className={`flex w-full items-start gap-2 rounded-xl border bg-card p-3 text-left text-sm transition ${state}`}>
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[11px]">{picked !== null && k === q!.correct ? <Check className="h-3 w-3 text-emerald-600" /> : picked === k ? <X className="h-3 w-3 text-rose-600" /> : String.fromCharCode(65 + k)}</span>
              <span>{o}</span>
            </button>
          )
        })}
      </div>

      {picked !== null && (
        <div className="space-y-3 rounded-xl bg-muted p-3 text-sm">
          {picked === -1 && <p className="font-medium text-rose-600">Time is up.</p>}
          <p>{q!.why}</p>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={next}>{i + 1 >= qs.length ? "See result" : "Next"}</Button>
            <Button size="sm" variant="outline" asChild><Link href={`/spotters/${q!.spot.id}`} target="_blank"><BookOpen className="mr-1 h-4 w-4" /> Open notes</Link></Button>
          </div>
        </div>
      )}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="space-y-2"><p className="text-sm font-semibold">{title}</p>{children}</div>
}
function Chips({ value, options, onChange, small }: { value: string; options: string[]; onChange: (v: string) => void; small?: boolean }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button key={o} onClick={() => onChange(o)} className={`rounded-full border font-medium transition ${small ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-sm"} ${value === o ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-muted"}`}>{o}</button>
      ))}
    </div>
  )
}
