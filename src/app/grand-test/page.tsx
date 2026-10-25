"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { doc, collection, getDoc, setDoc } from "firebase/firestore"
import { AlertTriangle, ArrowLeft, ArrowRight, Check, Clock, Flag, Grid3x3, Loader2, Timer, Trophy, X } from "lucide-react"
import { useCollection, useFirestore, useUser } from "@/firebase"
import { useRequireAuth } from "@/hooks/use-require-auth"
import { recordBulk } from "@/lib/study"
import { estimateRank, sampleQuestions, scoreTest, type Attempt, type GQ, type SavedTest } from "@/lib/grand"

const KEY = "qp-grand-v1"
const SIZES = [{ n: 50, m: 60, l: "Quick", d: "50 questions, 60 min" }, { n: 100, m: 120, l: "Half paper", d: "100 questions, 2 hours" }, { n: 200, m: 210, l: "Full NEET PG", d: "200 questions, 3 h 30 min" }]
const fmt = (s: number) => { const x = Math.max(0, Math.floor(s)); const h = Math.floor(x / 3600), m = Math.floor((x % 3600) / 60), r = x % 60; return (h ? h + ":" : "") + String(m).padStart(h ? 2 : 1, "0") + ":" + String(r).padStart(2, "0") }
const rankText = (r: number) => (r < 100 ? String(r) : r < 1000 ? "~" + Math.round(r / 10) * 10 : r < 10000 ? "~" + (Math.round(r / 100) * 100).toLocaleString("en-IN") : "~" + (Math.round(r / 1000) * 1000).toLocaleString("en-IN"))

export default function GrandTest() {
  const db = useFirestore()
  const { user } = useUser()
  const { checkingAuth } = useRequireAuth()
  const subjectsQuery = useMemo(() => (db ? collection(db, "subjects") : null), [db])
  const { data: subjectDocs } = useCollection(subjectsQuery)
  const subjects = useMemo(() => ((subjectDocs as any[]) || []).map((s) => ({ id: s.id as string, name: (s.name || s.id) as string })).sort((a, b) => a.name.localeCompare(b.name)), [subjectDocs])

  const [phase, setPhase] = useState<"setup" | "loading" | "exam" | "result">("setup")
  const [size, setSize] = useState(1)
  const [picked, setPicked] = useState<Record<string, boolean>>({})
  const [negative, setNegative] = useState(true)
  const [err, setErr] = useState("")
  const [history, setHistory] = useState<Attempt[]>([])

  const [qs, setQs] = useState<GQ[]>([])
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [marked, setMarked] = useState<number[]>([])
  const [i, setI] = useState(0)
  const [endAt, setEndAt] = useState(0)
  const [startedAt, setStartedAt] = useState(0)
  const [minutes, setMinutes] = useState(0)
  const [left, setLeft] = useState(0)
  const [palette, setPalette] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const [reviewFilter, setReviewFilter] = useState<"wrong" | "skipped" | "all">("wrong")
  const [finishedAt, setFinishedAt] = useState(0)
  const saved = useRef(false)

  // Resume an unfinished paper after a refresh or a dropped connection.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY)
      if (!raw) return
      const t = JSON.parse(raw) as SavedTest
      if (t && t.qs?.length && t.endAt) { setQs(t.qs); setAnswers(t.answers || {}); setMarked(t.marked || []); setEndAt(t.endAt); setStartedAt(t.startedAt); setMinutes(t.minutes); setNegative(t.negative); setI(t.i || 0); setPhase("exam") }
    } catch {}
  }, [])

  useEffect(() => {
    if (!db || !user) return
    getDoc(doc(db, "users", user.uid, "progress", "grand")).then((s) => { if (s.exists()) setHistory(((s.data() as any).attempts || []) as Attempt[]) }).catch(() => {})
  }, [db, user])

  useEffect(() => {
    if (phase !== "exam") return
    try { localStorage.setItem(KEY, JSON.stringify({ qs, answers, marked, endAt, startedAt, minutes, negative, i } satisfies SavedTest)) } catch {}
  }, [phase, qs, answers, marked, endAt, startedAt, minutes, negative, i])

  const finish = useCallback(() => {
    setConfirm(false); setFinishedAt(Date.now()); setPhase("result")
    try { localStorage.removeItem(KEY) } catch {}
  }, [])

  useEffect(() => {
    if (phase !== "exam") return
    const tick = () => { const s = Math.round((endAt - Date.now()) / 1000); setLeft(s); if (s <= 0) finish() }
    tick()
    const t = setInterval(tick, 1000)
    return () => clearInterval(t)
  }, [phase, endAt, finish])

  const chosen = subjects.filter((s) => picked[s.id])
  const useSubjects = chosen.length ? chosen : subjects

  async function start() {
    if (!db || !subjects.length) return
    setErr(""); setPhase("loading")
    const cfg = SIZES[size]
    const list = await sampleQuestions(db, useSubjects, cfg.n)
    if (list.length < 10) { setErr("Not enough questions found for this selection. Pick more subjects."); setPhase("setup"); return }
    const mins = list.length < cfg.n ? Math.max(10, Math.round((cfg.m * list.length) / cfg.n)) : cfg.m
    const now = Date.now()
    saved.current = false
    setQs(list); setAnswers({}); setMarked([]); setI(0); setStartedAt(now); setEndAt(now + mins * 60000); setMinutes(mins); setPalette(false); setPhase("exam")
  }

  const result = useMemo(() => {
    if (phase !== "result") return null
    const r = scoreTest(qs, answers, negative)
    return { ...r, ...estimateRank(r.score, r.max) }
  }, [phase, qs, answers, negative])

  // Save the attempt once, and feed every mistake into the review queue.
  useEffect(() => {
    if (phase !== "result" || !result || saved.current || !db || !user) return
    saved.current = true
    const mins = Math.max(1, Math.round((finishedAt - startedAt) / 60000))
    const att: Attempt = { at: Date.now(), n: qs.length, score: result.score, max: result.max, correct: result.correct, wrong: result.wrong, skipped: result.skipped, mins, rank: result.rank, scaled: result.scaled, subjects: result.subjects }
    const next = [att, ...history].slice(0, 20)
    setHistory(next)
    setDoc(doc(db, "users", user.uid, "progress", "grand"), { attempts: next }).catch(() => {})
    recordBulk(db, user.uid, qs.map((q, n) => ({ subjectId: q.subjectId, topic: q.topic, question: q.question, options: q.options, correct: q.correct, explanation: q.explanation, picked: answers[n] ?? null }))).catch(() => {})
  }, [phase, result, db, user, qs, answers, finishedAt, startedAt, history])

  if (checkingAuth) return <div className="flex h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>

  /* ---------- SETUP ---------- */
  if (phase === "setup" || phase === "loading") {
    const loading = phase === "loading"
    return (
      <div className="mx-auto max-w-3xl space-y-6 p-4 md:p-10">
        <div className="keep-dark relative overflow-hidden rounded-[2rem] p-7 text-white shadow-xl md:p-10" style={{ background: "linear-gradient(120deg,#1e293b 0%,#4338ca 55%,#9333ea 100%)" }}>
          <div className="relative space-y-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-[11px] font-black uppercase tracking-[0.2em]"><Timer className="h-3 w-3" /> Exam mode</span>
            <h1 className="text-3xl font-black tracking-tight md:text-5xl">Grand test</h1>
            <p className="max-w-lg text-sm font-medium text-white/90 md:text-base">A timed mixed-subject paper with NEET PG style marking (+4, −1) and an estimated all-India rank.</p>
          </div>
        </div>

        <section className="space-y-3">
          <h2 className="font-black">1. Paper size</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {SIZES.map((s, n) => (
              <button key={s.n} onClick={() => setSize(n)} className={`rounded-3xl border-2 p-4 text-left transition ${size === n ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/40"}`}>
                <p className="text-lg font-black">{s.l}</p><p className="text-xs font-semibold text-muted-foreground">{s.d}</p>
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between"><h2 className="font-black">2. Subjects</h2>
            <div className="flex gap-3 text-xs font-bold"><button onClick={() => setPicked(Object.fromEntries(subjects.map((s) => [s.id, true])))} className="text-primary">Select all</button><button onClick={() => setPicked({})} className="text-muted-foreground">Clear</button></div></div>
          <div className="flex flex-wrap gap-2">
            {subjects.map((s) => <button key={s.id} onClick={() => setPicked({ ...picked, [s.id]: !picked[s.id] })} className={`rounded-full border px-3.5 py-1.5 text-sm font-bold transition ${picked[s.id] ? "border-primary bg-primary text-white" : "border-border bg-card hover:border-primary/50"}`}>{s.name}</button>)}
          </div>
          <p className="text-xs text-muted-foreground">{chosen.length ? `${chosen.length} selected` : "None selected means all subjects"}.</p>
        </section>

        <label className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 text-sm font-bold"><input type="checkbox" checked={negative} onChange={(e) => setNegative(e.target.checked)} className="h-4 w-4" /> Negative marking (−1 for each wrong answer)</label>

        {err && <p className="flex items-center gap-2 rounded-2xl bg-rose-50 p-3 text-sm font-bold text-rose-700"><AlertTriangle className="h-4 w-4" /> {err}</p>}
        <button onClick={start} disabled={loading || !subjects.length} className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-lg font-extrabold text-white shadow-lg disabled:opacity-60">{loading ? <><Loader2 className="h-5 w-5 animate-spin" /> Building your paper…</> : "Start the test"}</button>

        {history.length > 0 && (
          <section className="space-y-3">
            <h2 className="font-black">Your previous tests</h2>
            <div className="space-y-2">{history.slice(0, 6).map((h) => (
              <div key={h.at} className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4 text-sm">
                <div><p className="font-black">{h.score} / {h.max} <span className="font-semibold text-muted-foreground">· {h.n} questions</span></p><p className="text-xs text-muted-foreground">{new Date(h.at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} · {h.mins} min</p></div>
                <span className="rounded-full bg-secondary px-3 py-1 text-xs font-black">Est. rank {rankText(h.rank)}</span>
              </div>))}</div>
          </section>
        )}
      </div>
    )
  }

  /* ---------- EXAM ---------- */
  if (phase === "exam") {
    const q = qs[i]
    const answered = Object.keys(answers).length
    const low = left < 300
    const Palette = (
      <div className="grid grid-cols-8 gap-1.5 sm:grid-cols-10 lg:grid-cols-5">
        {qs.map((_, n) => {
          const a = answers[n] !== undefined, m = marked.includes(n)
          return <button key={n} onClick={() => { setI(n); setPalette(false) }} className={`aspect-square rounded-lg text-xs font-black ${n === i ? "ring-2 ring-primary ring-offset-1" : ""} ${m ? "bg-amber-400 text-white" : a ? "bg-emerald-500 text-white" : "bg-secondary text-muted-foreground"}`}>{n + 1}</button>
        })}
      </div>
    )
    return (
      <div className="mx-auto max-w-6xl p-3 md:p-6">
        <div className="sticky top-[66px] z-20 -mx-3 mb-4 flex items-center justify-between gap-3 border-b border-border bg-background/95 px-3 py-3 backdrop-blur md:mx-0 md:rounded-2xl md:border md:px-5">
          <p className="text-sm font-black">Q {i + 1} <span className="font-semibold text-muted-foreground">/ {qs.length}</span></p>
          <p className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-mono text-sm font-black ${low ? "bg-rose-100 text-rose-700" : "bg-secondary"}`}><Clock className="h-4 w-4" /> {fmt(left)}</p>
          <div className="flex gap-2">
            <button onClick={() => setPalette(true)} className="rounded-full border border-border p-2 lg:hidden" aria-label="Question palette"><Grid3x3 className="h-4 w-4" /></button>
            <button onClick={() => setConfirm(true)} className="rounded-full bg-primary px-4 py-2 text-xs font-extrabold text-white">Submit</button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_260px]">
          <div className="space-y-5">
            <span className="inline-block rounded-full bg-secondary px-3 py-1 text-[11px] font-black uppercase tracking-wider text-primary">{q.subjectName}</span>
            <h1 className="text-lg font-extrabold leading-snug md:text-xl">{q.question}</h1>
            <div className="space-y-2.5">
              {q.options.map((o, n) => (
                <button key={n} onClick={() => setAnswers((a) => (a[i] === n ? Object.fromEntries(Object.entries(a).filter(([k]) => Number(k) !== i)) : { ...a, [i]: n }))} className={`flex w-full items-start gap-3 rounded-2xl border-2 p-4 text-left font-semibold transition ${answers[i] === n ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/40"}`}>
                  <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-black ${answers[i] === n ? "bg-primary text-white" : "bg-secondary"}`}>{String.fromCharCode(65 + n)}</span><span>{o}</span>
                </button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button onClick={() => setI(Math.max(0, i - 1))} disabled={i === 0} className="inline-flex items-center gap-1 rounded-full border border-border px-4 py-2.5 text-sm font-bold disabled:opacity-40"><ArrowLeft className="h-4 w-4" /> Previous</button>
              <button onClick={() => setMarked((m) => (m.includes(i) ? m.filter((x) => x !== i) : [...m, i]))} className={`inline-flex items-center gap-1 rounded-full border px-4 py-2.5 text-sm font-bold ${marked.includes(i) ? "border-amber-400 bg-amber-50 text-amber-700" : "border-border"}`}><Flag className="h-4 w-4" /> {marked.includes(i) ? "Marked" : "Mark for review"}</button>
              <button onClick={() => setI(Math.min(qs.length - 1, i + 1))} disabled={i === qs.length - 1} className="ml-auto inline-flex items-center gap-1 rounded-full bg-primary px-5 py-2.5 text-sm font-extrabold text-white disabled:opacity-40">Next <ArrowRight className="h-4 w-4" /></button>
            </div>
          </div>
          <aside className="hidden space-y-3 self-start lg:sticky lg:top-20 lg:block">
            <div className="max-h-[70vh] overflow-y-auto rounded-3xl border border-border bg-card p-4"><p className="mb-3 text-sm font-black">Question palette</p>{Palette}
              <p className="mt-3 flex flex-wrap gap-3 text-[11px] font-bold text-muted-foreground"><span><i className="mr-1 inline-block h-2 w-2 rounded-sm bg-emerald-500" />Answered</span><span><i className="mr-1 inline-block h-2 w-2 rounded-sm bg-amber-400" />Marked</span><span><i className="mr-1 inline-block h-2 w-2 rounded-sm bg-secondary" />Left</span></p></div>
            <p className="text-center text-xs font-bold text-muted-foreground">{answered} of {qs.length} answered</p>
          </aside>
        </div>

        {palette && (
          <div className="fixed inset-0 z-40 flex items-end bg-black/50 lg:hidden" onClick={() => setPalette(false)}>
            <div className="max-h-[75vh] w-full overflow-y-auto rounded-t-3xl bg-background p-5" onClick={(e) => e.stopPropagation()}>
              <div className="mb-3 flex items-center justify-between"><p className="font-black">Question palette · {answered}/{qs.length} answered</p><button onClick={() => setPalette(false)}><X className="h-5 w-5" /></button></div>{Palette}
            </div>
          </div>
        )}
        {confirm && (
          <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
            <div className="w-full max-w-sm space-y-4 rounded-3xl bg-background p-6">
              <h2 className="text-xl font-black">Submit the test?</h2>
              <p className="text-sm text-muted-foreground">{answered} answered, {qs.length - answered} left blank{marked.length ? `, ${marked.length} marked for review` : ""}. You cannot change answers after this.</p>
              <div className="flex gap-2"><button onClick={finish} className="flex-1 rounded-full bg-primary py-3 font-extrabold text-white">Submit</button><button onClick={() => setConfirm(false)} className="flex-1 rounded-full border border-border py-3 font-bold">Keep going</button></div>
            </div>
          </div>
        )}
      </div>
    )
  }

  /* ---------- RESULT ---------- */
  const r = result!
  const pct = Math.round((r.correct / Math.max(1, qs.length)) * 100)
  const rows = qs.map((q, n) => ({ q, n, p: answers[n] })).filter(({ q, p }) => reviewFilter === "all" ? true : reviewFilter === "skipped" ? p === undefined : p !== undefined && p !== q.correct)
  const subj = Object.entries(r.subjects).map(([id, s]) => ({ id, ...s, pct: s.a ? Math.round((s.c / s.a) * 100) : 0 })).sort((a, b) => a.pct - b.pct)
  const prev = history[1]
  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 md:p-10">
      <div className="keep-dark relative overflow-hidden rounded-[2rem] p-7 text-white shadow-xl md:p-10" style={{ background: "linear-gradient(120deg,#0f766e 0%,#2563eb 55%,#7c3aed 100%)" }}>
        <div className="relative space-y-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-[11px] font-black uppercase tracking-[0.2em]"><Trophy className="h-3 w-3" /> Result</span>
          <p className="text-5xl font-black md:text-6xl">{r.score} <span className="text-2xl font-bold text-white/70">/ {r.max}</span></p>
          <p className="text-sm font-semibold text-white/90">{r.correct} correct, {r.wrong} wrong, {r.skipped} skipped · {pct}% accuracy{prev ? ` · last test ${prev.score}/${prev.max}` : ""}</p>
        </div>
      </div>

      <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
        <p className="text-xs font-black uppercase tracking-wider text-muted-foreground">Estimated all-India rank</p>
        <p className="mt-1 text-4xl font-black">{rankText(r.rank)}</p>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">Your score is scaled to 800 marks ({r.scaled}/800) and placed on the real NEET PG 2025 marks-to-rank curve (about 2.4 lakh candidates). This is a rough guide only: our paper is not the real exam, difficulty differs, and real ranks move every year.</p>
      </div>

      <section className="space-y-3 rounded-3xl border border-border bg-card p-5 shadow-sm">
        <h2 className="font-black">Subject-wise (weakest first)</h2>
        {subj.map((s) => <div key={s.id}><div className="flex justify-between text-sm"><span className="font-bold">{s.n}</span><span className="font-black">{s.c}/{s.a} · {s.pct}%</span></div><div className="mt-1 h-2 overflow-hidden rounded-full bg-secondary"><div className={`h-full rounded-full ${s.pct < 40 ? "bg-rose-500" : s.pct < 70 ? "bg-amber-500" : "bg-emerald-500"}`} style={{ width: s.pct + "%" }} /></div></div>)}
      </section>

      <p className="rounded-2xl bg-violet-50 p-4 text-sm font-semibold text-violet-800">Your wrong answers were added to <Link href="/review" className="font-black underline">Daily review</Link> so they come back before you forget them.</p>

      <section className="space-y-3">
        <div className="flex items-center justify-between"><h2 className="font-black">Review answers</h2>
          <div className="flex gap-1.5">{(["wrong", "skipped", "all"] as const).map((f) => <button key={f} onClick={() => setReviewFilter(f)} className={`rounded-full border px-3 py-1 text-xs font-bold capitalize ${reviewFilter === f ? "border-primary bg-primary text-white" : "border-border"}`}>{f}</button>)}</div></div>
        {rows.length === 0 && <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">Nothing in this list.</p>}
        {rows.map(({ q, n, p }) => (
          <div key={n} className="space-y-3 rounded-2xl border border-border bg-card p-4 text-sm">
            <p className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">Q{n + 1} · {q.subjectName}{q.topic ? " · " + q.topic : ""}</p>
            <p className="font-bold">{q.question}</p>
            <ul className="space-y-1.5">{q.options.map((o, k) => <li key={k} className={`flex items-start gap-2 rounded-xl px-3 py-2 ${k === q.correct ? "bg-emerald-50 font-bold text-emerald-800" : k === p ? "bg-rose-50 text-rose-800" : "bg-secondary/60"}`}>{k === q.correct ? <Check className="mt-0.5 h-4 w-4 shrink-0" /> : k === p ? <X className="mt-0.5 h-4 w-4 shrink-0" /> : <span className="w-4" />}<span>{o}</span></li>)}</ul>
            {q.explanation && <p className="rounded-xl bg-secondary p-3 text-muted-foreground">{q.explanation}</p>}
          </div>
        ))}
      </section>

      <div className="flex flex-wrap gap-3">
        <button onClick={() => { setPhase("setup"); saved.current = false }} className="rounded-full bg-primary px-6 py-3 font-extrabold text-white">Take another test</button>
        <Link href="/my-progress" className="rounded-full border border-border px-6 py-3 font-bold">My progress</Link>
      </div>
    </div>
  )
}
