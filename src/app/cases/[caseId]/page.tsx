"use client"

import { useEffect, useMemo, use, useState } from "react"
import { useDoc, useFirestore } from "@/firebase"
import { doc } from "firebase/firestore"
import { ChevronLeft, Loader2, Trophy, AlertTriangle, Lightbulb, RotateCcw, CheckCircle2, XCircle, AlertCircle, Star, BookOpen, Flame } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { usePlan } from "@/hooks/use-plan"
import { UpgradeGate } from "@/components/upgrade-gate"
import { Scene, SETTINGS, SCENE_CSS } from "@/components/cases/ward-scenes"
import { PatientGlyph, BodyMap, VitalsMonitor, StabilityBar, moodOf, liveVitals, ageLabel, type Vitals } from "@/components/cases/ward-ui"
import { EXTRA_CSS, LabReport, ScanViewer, AlertBanner, TimerRing, SequenceBoard, type Lab, type Scan } from "@/components/cases/ward-extras"
import { saveResult, rankFor } from "@/lib/ward-progress"
import { syncWardProgress } from "@/lib/ward-sync"
import { getAuth } from "firebase/auth"
import { arena } from "@/lib/arena-client"

type CaseOption = { id: string; label: string; outcome: string; points: number; feedback: string; finding?: string; labs?: Lab[]; scan?: Scan }
type CaseStage = { id: string; type: string; kind?: string; prompt: string; options: CaseOption[]; steps?: string[]; feedback?: string; finding?: string; timeLimit?: number; alert?: { title: string; text: string } }
type Step = { type: string; outcome: string; points: number }

const OUTCOME: Record<string, { icon: any; text: string; ring: string; bg: string; label: string }> = {
  optimal: { icon: CheckCircle2, text: "text-emerald-700", ring: "border-emerald-400", bg: "bg-emerald-50", label: "Excellent call" },
  acceptable: { icon: AlertCircle, text: "text-amber-700", ring: "border-amber-400", bg: "bg-amber-50", label: "Acceptable" },
  unsafe: { icon: AlertTriangle, text: "text-rose-700", ring: "border-rose-400", bg: "bg-rose-50", label: "Unsafe!" },
  wrong: { icon: XCircle, text: "text-slate-600", ring: "border-slate-300", bg: "bg-slate-50", label: "Not helpful" },
}
const STAGE: Record<string, { emoji: string; label: string; grad: string; head: string }> = {
  history: { emoji: "🗣️", label: "History", grad: "from-violet-500 to-fuchsia-500", head: "Patient says" },
  examination: { emoji: "🩺", label: "Examination", grad: "from-teal-500 to-cyan-500", head: "Examination findings" },
  investigation: { emoji: "🧪", label: "Investigations", grad: "from-amber-500 to-orange-500", head: "Lab / imaging report" },
  diagnosis: { emoji: "🧠", label: "Diagnosis", grad: "from-pink-500 to-rose-500", head: "Senior's reaction" },
  management: { emoji: "💊", label: "Management", grad: "from-emerald-500 to-green-500", head: "Patient response" },
  procedure: { emoji: "🧰", label: "Procedure", grad: "from-sky-500 to-blue-600", head: "Procedure outcome" },
  complication: { emoji: "🚨", label: "Complication", grad: "from-red-600 to-rose-500", head: "What happens next" },
  counselling: { emoji: "🤝", label: "Counselling & plan", grad: "from-indigo-500 to-violet-500", head: "Outcome" },
}
const TIMEOUT: CaseOption = { id: "timeout", label: "No decision (time ran out)", outcome: "unsafe", points: -5, feedback: "You ran out of time. In a real emergency hesitation costs lives: commit to the best next step quickly.", finding: "" }
const DELTA: Record<string, number> = { optimal: 6, acceptable: -4, wrong: -12, unsafe: -28 }
const DEFAULT_VITALS: Vitals = { hr: 96, bp: "118/76", rr: 18, temp: 37.2, spo2: 96 }

function Confetti() {
  const cols = ["#7c6fd6", "#ff6b9d", "#ffb347", "#35c48a", "#4ea0f0", "#ffd95a"]
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 h-0 overflow-visible">
      {Array.from({ length: 40 }).map((_, i) => (
        <span key={i} className="absolute block h-3 w-2 rounded-sm" style={{ left: `${(i * 37) % 100}%`, background: cols[i % cols.length], animation: `wr-confetti ${2.4 + (i % 5) * 0.4}s ${(i % 8) * 0.15}s ease-in forwards` }} />
      ))}
    </div>
  )
}

export default function WardRoundPlayer({ params }: { params: Promise<{ caseId: string }> }) {
  const { caseId } = use(params)
  const db = useFirestore()
  const caseRef = useMemo(() => (!db ? null : doc(db, "cases", caseId)), [db, caseId])
  const { data: caseData, loading } = useDoc(caseRef)
  const { canAccessContent, loading: planLoading } = usePlan()

  const [stageIndex, setStageIndex] = useState(0)
  const [picked, setPicked] = useState<CaseOption | null>(null)
  const [score, setScore] = useState(0)
  const [maxScore, setMaxScore] = useState(0)
  const [stability, setStability] = useState(100)
  const [steps, setSteps] = useState<Step[]>([])
  const [finished, setFinished] = useState(false)
  const [flipped, setFlipped] = useState<Record<number, boolean>>({})
  const [shake, setShake] = useState(0)
  const [gain, setGain] = useState<number | null>(null)
  const [rankInfo, setRankInfo] = useState<ReturnType<typeof rankFor> | null>(null)

  const c = (caseData || {}) as any
  // Fisher-Yates shuffle once per case load, so the best answer is not always option A.
  const shuffleOptions = <T,>(arr: T[]): T[] => { const x = [...arr]; for (let i = x.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [x[i], x[j]] = [x[j], x[i]] } return x }
  const stages: CaseStage[] = useMemo(
    () => ((c.stages || []) as CaseStage[]).map((st) => (st.kind === "sequence" || !Array.isArray(st.options) ? st : { ...st, options: shuffleOptions(st.options) })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [caseData],
  )
  const stage = stages[stageIndex]
  const arrested = stability <= 0
  const percent = maxScore > 0 ? Math.max(0, Math.round((score / maxScore) * 100)) : 0
  const stars = arrested ? 0 : percent >= 85 ? 3 : percent >= 60 ? 2 : percent >= 35 ? 1 : 0
  const lastOptimal = steps.length === stages.length && steps[steps.length - 1]?.outcome === "optimal"

  useEffect(() => {
    if (!finished || !caseData) return
    const xp = Math.round((Math.max(0, score) + stars * 15) * (c.difficulty === "expert" ? 1.5 : 1))
    const r = saveResult(caseId, stars, percent, arrested ? Math.floor(xp / 2) : xp)
    setGain(r.gain)
    try { const u = getAuth().currentUser; if (db && u) syncWardProgress(db, u.uid).catch(() => {}) } catch {}
    setRankInfo(rankFor(r.progress.xp))
    const au = getAuth().currentUser
    if (au && !arrested) arena(au, "xp", { caseId, percent, stars }).catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finished])

  if (loading || planLoading) return <div className="h-screen flex items-center justify-center"><Loader2 className="h-10 w-10 text-primary animate-spin" /></div>
  if (!caseData) return <div className="h-screen flex items-center justify-center text-muted-foreground">Case not found.</div>
  if (c.tier === "paid" && !canAccessContent || (!c.tier && !canAccessContent)) {
    return <div className="max-w-2xl mx-auto p-4 md:p-12"><UpgradeGate type="content" /></div>
  }

  const setting = SETTINGS[c.setting] ? c.setting : "ward"
  const pt = c.patient || {}
  const base: Vitals = { ...DEFAULT_VITALS, ...(c.vitals || {}) }
  const vit = liveVitals(base, stability, lastOptimal)
  const mood = moodOf(c.appearance, stability)
  const best = stage?.options?.find((o) => o.outcome === "optimal")

  function pick(o: CaseOption) {
    if (picked) return
    setPicked(o)
    setScore((s) => s + o.points)
    setMaxScore((m) => m + (stage.kind === "sequence" ? 10 : Math.max(...stage.options.map((x) => x.points))))
    setStability((s) => Math.max(0, Math.min(100, s + (DELTA[o.outcome] ?? 0))))
    setSteps((p) => [...p, { type: stage.type, outcome: o.outcome, points: o.points }])
    if (o.outcome === "unsafe" || o.outcome === "wrong") setShake((k) => k + 1)
  }
  function next() {
    setPicked(null)
    if (arrested || stageIndex + 1 >= stages.length) setFinished(true)
    else {
      if (stages[stageIndex + 1]?.alert) { setStability((s) => Math.max(8, s - 12)); setShake((k) => k + 1) }
      setStageIndex(stageIndex + 1)
    }
  }
  function submitSequence(correct: number, total: number) {
    const frac = total ? correct / total : 0
    const outcome = frac === 1 ? "optimal" : frac >= 0.6 ? "acceptable" : frac >= 0.34 ? "wrong" : "unsafe"
    const points = outcome === "unsafe" ? -5 : Math.round(10 * frac)
    const summary = frac === 1 ? "Perfect order, every step in the right place." : `${correct} of ${total} steps were in the right place.`
    pick({ id: "seq", label: "Procedure", outcome, points, feedback: `${summary} ${stage.feedback || ""}`.trim(), finding: stage.finding || "" })
  }
  function restart() {
    setStageIndex(0); setPicked(null); setScore(0); setMaxScore(0); setStability(100); setSteps([]); setFinished(false); setFlipped({}); setGain(null); setRankInfo(null)
  }

  return (
    <div className="mx-auto max-w-5xl space-y-5 p-3 md:p-8">
      <style>{SCENE_CSS + EXTRA_CSS}</style>
      <Link href="/cases" className="flex w-fit items-center gap-1 text-xs font-bold uppercase tracking-widest text-primary hover:underline">
        <ChevronLeft className="h-3 w-3" /> Back to Ward Round
      </Link>

      {/* --- scene + monitor ------------------------------------------------ */}
      <div className="grid gap-4 lg:grid-cols-[1fr_330px]">
        <div key={shake} className={`relative h-[240px] overflow-hidden rounded-3xl border border-black/5 shadow-xl md:h-[310px] ${shake ? "wr-shake" : ""}`}>
          <Scene setting={setting}>
            <PatientGlyph scale={1.3} x={430} y={178} name={pt.name} age={pt.age} ageUnit={pt.ageUnit} sex={pt.sex} mood={mood} rr={vit.rr} />
          </Scene>
          <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
            <span className="rounded-full bg-white/90 px-3 py-1 text-[11px] font-extrabold text-slate-800 shadow">{SETTINGS[setting].emoji} {SETTINGS[setting].label}</span>
            {c.specialty && <span className="rounded-full bg-primary px-3 py-1 text-[11px] font-extrabold text-white shadow">{c.specialty}</span>}
            {c.difficulty === "expert" && <span className="flex items-center gap-1 rounded-full bg-gradient-to-r from-rose-600 to-orange-500 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-white shadow"><Flame className="h-3 w-3" /> Expert</span>}
          </div>
          <div className="absolute right-3 top-3 h-28 w-16 rounded-2xl bg-white/80 p-1 shadow backdrop-blur md:h-32 md:w-[72px]"><BodyMap region={c.region} /></div>
          {pt.name && (
            <div className="absolute bottom-3 left-3 rounded-2xl bg-white/92 px-3 py-2 shadow-lg">
              <p className="text-sm font-black leading-tight text-slate-900">{pt.name}</p>
              <p className="text-[11px] font-semibold text-slate-600">{ageLabel(pt)} · {pt.sex === "F" ? "Female" : "Male"}{pt.occupation ? " · " + pt.occupation : ""}{pt.place ? " · " + pt.place : ""}</p>
            </div>
          )}
          {arrested && <div className="absolute inset-0 grid place-items-center bg-black/55 text-center"><p className="text-3xl font-black tracking-widest text-white" style={{ animation: "wr-blink 1s infinite" }}>CODE BLUE</p></div>}
        </div>
        <div className="space-y-3">
          <VitalsMonitor vitals={vit} rhythm={c.rhythm} stability={stability} name={pt.name} />
          <div className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm"><StabilityBar value={stability} /></div>
        </div>
      </div>

      {!finished ? (
        <>
          {/* --- stage rail --------------------------------------------------- */}
          <div className="flex items-center justify-between gap-0.5 rounded-2xl border border-black/5 bg-white p-2 shadow-sm sm:gap-1 sm:p-3">
            {stages.map((s, i) => {
              const st = STAGE[s.type] || STAGE.history
              const done = steps[i]
              const cur = i === stageIndex
              const dot = done ? (done.outcome === "optimal" ? "bg-emerald-500" : done.outcome === "acceptable" ? "bg-amber-400" : done.outcome === "unsafe" ? "bg-rose-500" : "bg-slate-400") : cur ? "bg-primary" : "bg-slate-200"
              return (
                <div key={s.id} className="flex flex-1 flex-col items-center gap-1">
                  <div className={`grid h-9 w-9 place-items-center rounded-full text-base text-white shadow sm:h-10 sm:w-10 sm:text-lg ${dot} ${cur && !picked ? "ring-4 ring-primary/25" : ""}`}>{st.emoji}</div>
                  <span className={`hidden text-[10px] font-extrabold uppercase tracking-wider sm:block ${cur ? "text-primary" : "text-muted-foreground"}`}>{st.label}</span>
                </div>
              )
            })}
          </div>

          {stageIndex === 0 && (
            <div className="wr-rise flex items-start gap-3">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-sky-100 text-2xl shadow">👩‍⚕️</div>
              <div className="rounded-2xl rounded-tl-sm border border-black/5 bg-white p-4 shadow-sm">
                <p className="mb-1 text-[10px] font-extrabold uppercase tracking-widest text-sky-600">Triage nurse</p>
                <p className="text-sm leading-relaxed text-slate-800">{c.stem}</p>
              </div>
            </div>
          )}

          {stage?.alert && !picked && <AlertBanner alert={stage.alert} />}

          {stage && (
            <div key={stage.id} className="wr-rise overflow-hidden rounded-3xl border border-black/5 bg-white shadow-lg">
              <div className={`flex items-center justify-between bg-gradient-to-r px-5 py-3 text-white ${(STAGE[stage.type] || STAGE.history).grad}`}>
                <span className="text-xs font-black uppercase tracking-widest">{(STAGE[stage.type] || STAGE.history).emoji} {(STAGE[stage.type] || STAGE.history).label}</span>
                <span className="flex items-center gap-3 text-xs font-bold opacity-90">
                  {stage.timeLimit ? <TimerRing seconds={stage.timeLimit} runKey={stage.id} active={!picked && !finished} onExpire={() => pick(TIMEOUT)} /> : null}
                  Step {stageIndex + 1} of {stages.length}
                </span>
              </div>
              <div className="space-y-4 p-5">
                <p className="text-base font-bold leading-snug text-slate-900">{stage.prompt}</p>
                {stage.kind === "sequence" && stage.steps ? (
                  <SequenceBoard stageId={stage.id} prompt={stage.prompt} steps={stage.steps} done={!!picked} onSubmit={submitSequence} />
                ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {stage.options.map((o, i) => {
                    const sel = picked?.id === o.id
                    const st = OUTCOME[o.outcome] || OUTCOME.wrong
                    const isBest = picked && !sel && o.outcome === "optimal"
                    return (
                      <button key={o.id} onClick={() => pick(o)} disabled={!!picked}
                        className={`relative flex items-start gap-3 rounded-2xl border-2 p-4 text-left transition-all ${sel ? `${st.ring} ${st.bg}` : isBest ? "border-emerald-300 bg-emerald-50/60" : picked ? "border-black/5 opacity-50" : "border-black/10 bg-white hover:-translate-y-0.5 hover:border-primary hover:shadow-md"}`}>
                        <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl text-sm font-black ${sel ? "bg-white " + st.text : "bg-primary/10 text-primary"}`}>{String.fromCharCode(65 + i)}</span>
                        <span className="pt-1 text-sm font-semibold leading-snug text-slate-800">{o.label}</span>
                        {sel && <span key={shake + o.id} className={`pointer-events-none absolute right-3 top-2 text-lg font-black ${st.text}`} style={{ animation: "wr-pop 1.4s ease-out forwards" }}>{o.points > 0 ? "+" : ""}{o.points}</span>}
                      </button>
                    )
                  })}
                </div>
                )}

                {picked && (() => {
                  const st = OUTCOME[picked.outcome] || OUTCOME.wrong
                  const Icon = st.icon
                  const meta = STAGE[stage.type] || STAGE.history
                  return (
                    <div className="wr-rise space-y-3">
                      {picked.scan && <ScanViewer scan={picked.scan} />}
                      {picked.labs && picked.labs.length > 0 && <LabReport labs={picked.labs} />}
                      {picked.finding && (
                        <div className={`rounded-2xl border p-4 ${stage.type === "investigation" ? "border-dashed border-amber-400 bg-amber-50 font-mono text-[13px]" : stage.type === "examination" ? "border-teal-200 bg-teal-50" : "border-violet-200 bg-violet-50"}`}>
                          <p className="mb-1.5 text-[10px] font-extrabold uppercase tracking-widest text-slate-500">{meta.emoji} {meta.head}</p>
                          <p className={`text-sm leading-relaxed text-slate-800 ${stage.type === "history" ? "italic" : ""}`}>{stage.type === "history" ? "“" + picked.finding + "”" : picked.finding}</p>
                        </div>
                      )}
                      <div className={`flex items-start gap-3 rounded-2xl border p-4 ${st.ring} ${st.bg}`}>
                        <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${st.text}`} />
                        <div><p className={`text-sm font-black ${st.text}`}>{st.label} <span className="font-semibold">({picked.points > 0 ? "+" : ""}{picked.points} pts)</span></p><p className="mt-0.5 text-sm text-slate-700">{picked.feedback}</p></div>
                      </div>
                      {best && picked.outcome !== "optimal" && (
                        <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-4">
                          <p className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-700">💡 The best move was</p>
                          <p className="mt-1 text-sm font-bold text-slate-800">{best.label}</p>
                          <p className="mt-0.5 text-sm text-slate-600">{best.feedback}</p>
                        </div>
                      )}
                      <Button onClick={next} className="h-12 w-full rounded-2xl text-base font-bold">
                        {arrested ? "The patient has arrested… continue" : stageIndex + 1 < stages.length ? "Next step →" : "Finish the round"}
                      </Button>
                    </div>
                  )
                })()}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="relative space-y-5">
          {stars >= 2 && <Confetti />}
          <div className={`overflow-hidden rounded-3xl p-6 text-center text-white shadow-xl md:p-8 ${arrested ? "bg-gradient-to-br from-slate-800 to-rose-900" : "bg-gradient-to-br from-violet-600 via-fuchsia-500 to-orange-400"}`}>
            <p className="text-xs font-black uppercase tracking-[0.25em] opacity-80">{arrested ? "Code blue — patient lost" : "Round complete"}</p>
            <p className="mt-2 text-6xl font-black">{percent}%</p>
            <div className="mt-2 flex justify-center gap-1.5">
              {[0, 1, 2].map((i) => <Star key={i} className={`h-8 w-8 ${i < stars ? "fill-yellow-300 text-yellow-300" : "text-white/30"}`} />)}
            </div>
            <p className="mt-3 text-sm opacity-90">Final diagnosis: <span className="font-extrabold">{c.finalDiagnosis}</span></p>
            {gain !== null && (
              <div className="mx-auto mt-4 max-w-sm rounded-2xl bg-white/15 p-3 backdrop-blur">
                <p className="text-sm font-bold">+{gain} XP {rankInfo && <>· {rankInfo.cur.emoji} {rankInfo.cur.name}</>}</p>
                {rankInfo?.next && (<><div className="mt-2 h-2 overflow-hidden rounded-full bg-white/25"><div className="h-full rounded-full bg-white" style={{ width: rankInfo.pct + "%" }} /></div><p className="mt-1 text-[11px] opacity-80">{rankInfo.toNext} XP to {rankInfo.next.name}</p></>)}
              </div>
            )}
          </div>

          <div className="flex items-start gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={stars >= 2 ? "/jelly/cheering.webp" : "/jelly/explaining.webp"} alt="Jelly" className="h-24 w-24 shrink-0 object-contain" />
            <div className="rounded-2xl rounded-tl-sm border border-black/5 bg-white p-4 shadow-sm">
              <p className="mb-1 text-[10px] font-extrabold uppercase tracking-widest text-primary">Consultant debrief · Jelly</p>
              <p className="text-sm leading-relaxed text-slate-800">{c.consultantNote || (stars >= 2 ? "Well managed. Review the key points below to lock this in." : "Good effort. Read the pitfalls below and try the round again.")}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
            <p className="mb-3 text-xs font-extrabold uppercase tracking-widest text-muted-foreground">Your decisions</p>
            <div className="flex flex-wrap gap-2">
              {steps.map((s, i) => {
                const st = OUTCOME[s.outcome] || OUTCOME.wrong
                return <span key={i} className={`rounded-full border px-3 py-1 text-xs font-bold ${st.ring} ${st.bg} ${st.text}`}>{(STAGE[s.type] || STAGE.history).emoji} {(STAGE[s.type] || STAGE.history).label}: {s.points > 0 ? "+" : ""}{s.points}</span>
              })}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
              <h3 className="mb-2 flex items-center gap-2 text-sm font-black"><Lightbulb className="h-4 w-4 text-primary" /> Key learnings</h3>
              <ul className="list-disc space-y-1.5 pl-5 text-sm text-slate-700">{(c.keyLearnings || []).map((k: string, i: number) => <li key={i}>{k}</li>)}</ul>
            </div>
            <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
              <h3 className="mb-2 flex items-center gap-2 text-sm font-black"><AlertTriangle className="h-4 w-4 text-rose-500" /> Common pitfalls</h3>
              <ul className="list-disc space-y-1.5 pl-5 text-sm text-slate-700">{(c.pitfalls || []).map((p: string, i: number) => <li key={i}>{p}</li>)}</ul>
            </div>
          </div>

          {(c.flashcards || []).length > 0 && (
            <div className="space-y-3">
              <h3 className="px-1 text-sm font-black">Review flashcards · tap to flip</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {c.flashcards.map((fc: any, i: number) => (
                  <button key={i} onClick={() => setFlipped((f) => ({ ...f, [i]: !f[i] }))}
                    className={`flex min-h-[90px] items-center rounded-2xl border-2 p-5 text-left text-sm font-semibold transition-all ${flipped[i] ? "border-emerald-300 bg-emerald-50 text-emerald-900" : "border-violet-200 bg-violet-50 text-violet-900"}`}>
                    {flipped[i] ? fc.back : fc.front}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button variant="outline" className="h-12 flex-1 gap-2 rounded-2xl" onClick={restart}><RotateCcw className="h-4 w-4" /> Retry this case</Button>
            <Link href={`/search?q=${encodeURIComponent(c.finalDiagnosis || c.title || "")}`} className="flex-1"><Button variant="outline" className="h-12 w-full gap-2 rounded-2xl"><BookOpen className="h-4 w-4" /> Revise this topic</Button></Link>
            <Link href="/cases" className="flex-1"><Button className="h-12 w-full gap-2 rounded-2xl"><Trophy className="h-4 w-4" /> More cases</Button></Link>
          </div>
        </div>
      )}
    </div>
  )
}
