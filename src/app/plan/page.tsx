"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Loader2, CalendarDays, Check, Bell } from "lucide-react"
import { doc, getDoc, setDoc } from "firebase/firestore"
import { useFirestore, useUser } from "@/firebase"
import { useRequireAuth } from "@/hooks/use-require-auth"
import { countDue, dayKey, loadStats } from "@/lib/study"

type Plan = { examName: string; examDate: string; dailyQ: number; dailyCards: number }
const EMPTY: Plan = { examName: "", examDate: "", dailyQ: 30, dailyCards: 20 }

export default function StudyPlan() {
  const db = useFirestore()
  const { user } = useUser()
  const { checkingAuth } = useRequireAuth()
  const [plan, setPlan] = useState<Plan | null>(null)
  const [draft, setDraft] = useState<Plan>(EMPTY)
  const [editing, setEditing] = useState(false)
  const [today, setToday] = useState({ q: 0, f: 0 })
  const [due, setDue] = useState(0)
  const [ready, setReady] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!db || !user) return
    Promise.all([
      getDoc(doc(db, "users", user.uid, "progress", "plan")).then((s) => { if (s.exists()) { const p = { ...EMPTY, ...(s.data() as any) }; setPlan(p); setDraft(p) } else setEditing(true) }).catch(() => setEditing(true)),
      loadStats(db, user.uid).then((st) => { const v = (st.days || {})[dayKey()] || {}; setToday({ q: v.q || 0, f: v.f || 0 }) }).catch(() => {}),
      countDue(db, user.uid).then(setDue).catch(() => {}),
    ]).finally(() => setReady(true))
  }, [db, user])

  async function save() {
    if (!db || !user) return
    const p: Plan = { ...draft, dailyQ: Math.max(0, Math.min(500, Number(draft.dailyQ) || 0)), dailyCards: Math.max(0, Math.min(500, Number(draft.dailyCards) || 0)) }
    await setDoc(doc(db, "users", user.uid, "progress", "plan"), p)
    setPlan(p); setEditing(false); setSaved(true); setTimeout(() => setSaved(false), 2000)
  }

  if (checkingAuth || !ready) return <div className="flex h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>

  const daysLeft = plan?.examDate ? Math.ceil((new Date(plan.examDate + "T00:00:00").getTime() - Date.now()) / 86400000) : null
  const qLeft = plan ? Math.max(0, plan.dailyQ - today.q) : 0
  const fLeft = plan ? Math.max(0, plan.dailyCards - today.f) : 0
  const allDone = !!plan && qLeft === 0 && fLeft === 0 && due === 0

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 md:p-10">
      <div className="relative overflow-hidden rounded-[2rem] p-7 text-white shadow-xl md:p-10" style={{ background: "linear-gradient(120deg,#b45309 0%,#ea580c 55%,#e11d48 100%)" }}>
        <div className="relative space-y-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-[11px] font-black uppercase tracking-[0.2em]"><CalendarDays className="h-3 w-3" /> Study plan</span>
          <h1 className="text-3xl font-black tracking-tight md:text-5xl">{plan && daysLeft !== null ? (daysLeft > 0 ? `${daysLeft} days to ${plan.examName || "your exam"}` : daysLeft === 0 ? "Exam day. All the best!" : "Exam date has passed") : "Plan your exam"}</h1>
          <p className="max-w-lg text-sm font-medium text-white/90 md:text-base">Set your exam date and a daily target. Your progress is counted automatically from QBank and flashcards.</p>
        </div>
      </div>

      {plan && !editing && (
        <>
          {allDone ? (
            <div className="flex items-center gap-3 rounded-3xl border border-emerald-300 bg-emerald-50 p-5 text-emerald-800"><Check className="h-6 w-6" /><p className="font-extrabold">Today's target is done. Rest well.</p></div>
          ) : (
            <div className="flex items-start gap-3 rounded-3xl border border-amber-300 bg-amber-50 p-5 text-amber-900"><Bell className="mt-0.5 h-5 w-5 shrink-0" /><div className="text-sm"><p className="font-extrabold">Still to do today</p><p>{qLeft > 0 && <>{qLeft} questions. </>}{fLeft > 0 && <>{fLeft} flashcards. </>}{due > 0 && <>{due} review items are due.</>}</p></div></div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            {[{ l: "Questions today", d: today.q, t: plan.dailyQ, href: "/qbank" }, { l: "Flashcards today", d: today.f, t: plan.dailyCards, href: "/flashcards" }].map((r) => (
              <Link key={r.l} href={r.href} className="rounded-3xl border border-border bg-card p-5 shadow-sm transition hover:border-primary/50">
                <p className="text-xs font-bold text-muted-foreground">{r.l}</p>
                <p className="mt-1 text-3xl font-black">{r.d} <span className="text-base font-bold text-muted-foreground">/ {r.t}</span></p>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-secondary"><div className="h-full rounded-full bg-primary" style={{ width: Math.min(100, r.t ? (r.d / r.t) * 100 : 100) + "%" }} /></div>
              </Link>
            ))}
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/review" className="rounded-full bg-violet-600 px-5 py-2.5 text-sm font-extrabold text-white">Daily review ({due})</Link>
            <Link href="/my-progress" className="rounded-full border border-border px-5 py-2.5 text-sm font-bold">My progress</Link>
            <button onClick={() => setEditing(true)} className="rounded-full border border-border px-5 py-2.5 text-sm font-bold">Edit plan</button>
            {saved && <span className="self-center text-sm font-bold text-emerald-600">Saved</span>}
          </div>
          <p className="text-xs text-muted-foreground">Reminders show here and on My Progress when you open the app. Phone notifications are not available yet.</p>
        </>
      )}

      {editing && (
        <div className="space-y-4 rounded-3xl border border-border bg-card p-5 shadow-sm">
          <label className="block text-sm font-bold">Exam name<input value={draft.examName} onChange={(e) => setDraft({ ...draft, examName: e.target.value })} placeholder="e.g. Final MBBS, NEET-PG" className="mt-1 w-full rounded-xl border border-border bg-background p-3 font-medium" /></label>
          <label className="block text-sm font-bold">Exam date<input type="date" value={draft.examDate} onChange={(e) => setDraft({ ...draft, examDate: e.target.value })} className="mt-1 w-full rounded-xl border border-border bg-background p-3 font-medium" /></label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm font-bold">Questions per day<input type="number" min={0} max={500} value={draft.dailyQ} onChange={(e) => setDraft({ ...draft, dailyQ: Number(e.target.value) })} className="mt-1 w-full rounded-xl border border-border bg-background p-3 font-medium" /></label>
            <label className="block text-sm font-bold">Flashcards per day<input type="number" min={0} max={500} value={draft.dailyCards} onChange={(e) => setDraft({ ...draft, dailyCards: Number(e.target.value) })} className="mt-1 w-full rounded-xl border border-border bg-background p-3 font-medium" /></label>
          </div>
          <div className="flex gap-2">
            <button onClick={save} disabled={!draft.examDate} className="rounded-full bg-primary px-6 py-2.5 text-sm font-extrabold text-white disabled:opacity-50">Save plan</button>
            {plan && <button onClick={() => { setDraft(plan); setEditing(false) }} className="rounded-full border border-border px-6 py-2.5 text-sm font-bold">Cancel</button>}
          </div>
        </div>
      )}
    </div>
  )
}
