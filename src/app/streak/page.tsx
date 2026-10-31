"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Loader2, Lock } from "lucide-react"
import { useFirestore, useUser } from "@/firebase"
import { useRequireAuth } from "@/hooks/use-require-auth"
import {
  DAILY_GOAL_MIN, DAILY_GOAL_SEC, REWARDS, Usage, bestStreak, getPendingSeconds, lastDays, loadUsage, rewardState, todaySeconds, totalMinutes, usageStreak,
} from "@/lib/usage"

export default function StreakPage() {
  const db = useFirestore()
  const { user } = useUser()
  const { checkingAuth } = useRequireAuth()
  const [usage, setUsage] = useState<Usage | null>(null)
  const [, force] = useState(0)

  useEffect(() => {
    if (!db || !user) return
    loadUsage(db, user.uid).then(setUsage).catch(() => setUsage({}))
  }, [db, user])

  // keeps the ring moving while the student is on this page
  useEffect(() => {
    const t = setInterval(() => force((n) => n + 1), 5000)
    return () => clearInterval(t)
  }, [])

  const view = useMemo(() => {
    if (!usage) return null
    // seconds counted on this device that are not saved yet
    const live: Usage = { days: { ...(usage.days || {}) } }
    const k = lastDays(live, 1)[0].k
    live.days![k] = (live.days![k] || 0) + getPendingSeconds()
    return { live, streak: usageStreak(live), best: bestStreak(live), minutes: totalMinutes(live), today: todaySeconds(live), days: lastDays(live, 14) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usage, getPendingSeconds()])

  if (checkingAuth || !view) return <div className="flex h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>

  const { streak, best, minutes, today, days } = view
  const goalMet = today >= DAILY_GOAL_SEC
  const pct = Math.min(100, Math.round((today / DAILY_GOAL_SEC) * 100))
  const minsLeft = Math.max(0, Math.ceil((DAILY_GOAL_SEC - today) / 60))
  const { next, prev } = rewardState(streak)
  const toNext = next ? next.days - streak : 0
  const nextPct = next ? Math.round(((streak - (prev?.days || 0)) / (next.days - (prev?.days || 0))) * 100) : 100

  return (
    <div className="min-h-[calc(100vh-70px)] bg-gradient-to-b from-[#f1ecff] via-white to-white">
      <div className="mx-auto max-w-3xl space-y-5 px-4 py-6 md:px-8 md:py-8">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-bold text-muted-foreground hover:text-primary"><ArrowLeft className="h-4 w-4" /> Home</Link>

        {/* Today */}
        <section className="rounded-[28px] border border-[#e6defc] bg-white p-6 text-center shadow-sm md:p-8">
          <div className="text-[11px] font-black uppercase tracking-[0.14em] text-primary">Day streak</div>
          <div className="mt-1 text-5xl font-black tracking-tight">{streak} <span className="text-2xl">{streak === 1 ? "day" : "days"}</span> <span>🔥</span></div>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">Use QubixPrep for at least {DAILY_GOAL_MIN} minutes a day to keep your streak alive.</p>

          <div className="relative mx-auto mt-6 grid h-40 w-40 place-items-center rounded-full" style={{ background: `conic-gradient(#7552ee 0 ${pct}%, #efe9ff ${pct}%)` }}>
            <div className="absolute inset-[11px] rounded-full bg-white" />
            <div className="relative">
              <b className="block text-3xl font-black">{Math.min(Math.floor(today / 60), DAILY_GOAL_MIN)}<span className="text-base text-muted-foreground">/{DAILY_GOAL_MIN} min</span></b>
              <span className="text-[11px] font-extrabold text-muted-foreground">TODAY</span>
            </div>
          </div>
          <p className="mt-4 text-sm font-bold">
            {goalMet ? "Goal done for today. See you tomorrow! 🎉" : `${minsLeft} more minute${minsLeft === 1 ? "" : "s"} to keep your streak`}
          </p>
        </section>

        <section className="grid grid-cols-3 gap-3">
          {[{ l: "Current streak", v: streak, u: "days" }, { l: "Best streak", v: best, u: "days" }, { l: "Total time", v: minutes, u: "min" }].map((s) => (
            <div key={s.l} className="rounded-2xl border border-[#e6defc] bg-white p-3 text-center shadow-sm">
              <p className="text-2xl font-black">{s.v}<span className="ml-1 text-xs font-bold text-muted-foreground">{s.u}</span></p>
              <p className="text-[11px] font-bold text-muted-foreground">{s.l}</p>
            </div>
          ))}
        </section>

        {/* Last 14 days */}
        <section className="rounded-[24px] border border-[#e6defc] bg-white p-5 shadow-sm">
          <h2 className="font-black">Last 14 days</h2>
          <div className="mt-4 grid grid-cols-7 gap-2">
            {days.map((d) => {
              const isToday = d.k === days[days.length - 1].k
              return (
                <div key={d.k} className="text-center" title={`${d.min} min`}>
                  <div className={`mx-auto grid h-9 w-9 place-items-center rounded-full text-sm font-black ${d.met ? "bg-primary text-white" : isToday ? "border-2 border-dashed border-primary/50 text-primary" : "bg-[#f3f0fb] text-muted-foreground"}`}>
                    {d.met ? "✓" : d.min > 0 ? d.min : ""}
                  </div>
                  <span className="mt-1 block text-[10px] font-bold text-muted-foreground">{d.date.getDate()}</span>
                </div>
              )
            })}
          </div>
        </section>

        {/* Rewards */}
        <section className="rounded-[24px] border border-[#e6defc] bg-white p-5 shadow-sm">
          <div className="flex items-end justify-between gap-3">
            <h2 className="font-black">Rewards</h2>
            {next && <span className="text-xs font-bold text-muted-foreground">{toNext} more day{toNext === 1 ? "" : "s"} to {next.title}</span>}
          </div>
          {next && (
            <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-[#efe9ff]"><div className="h-full rounded-full bg-gradient-to-r from-[#9a7bff] to-[#7552ee]" style={{ width: Math.max(4, nextPct) + "%" }} /></div>
          )}
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {REWARDS.map((r) => {
              const got = streak >= r.days || best >= r.days
              return (
                <div key={r.days} className={`rounded-2xl border p-3 text-center ${got ? "border-[#d9ccff] bg-[#f6f2ff]" : "border-border bg-white"}`}>
                  <div className={`text-3xl ${got ? "" : "opacity-30 grayscale"}`}>{got ? r.emoji : <Lock className="mx-auto h-7 w-7 text-muted-foreground/50" />}</div>
                  <b className="mt-1 block text-[13px]">{r.title}</b>
                  <small className="block text-[11px] text-muted-foreground">{r.days} day{r.days === 1 ? "" : "s"}</small>
                  <small className="mt-0.5 block text-[10px] text-muted-foreground">{r.note}</small>
                </div>
              )
            })}
          </div>
        </section>

        <Link href="/my-progress" className="block rounded-2xl border border-[#e6defc] bg-white p-4 text-center text-sm font-extrabold text-primary shadow-sm">See my progress →</Link>
      </div>
    </div>
  )
}
