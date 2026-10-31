"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useUser, useCollection, useDoc, useFirestore } from "@/firebase"
import { doc, collection } from "firebase/firestore"
import { usePlan } from "@/hooks/use-plan"
import { useJelly } from "@/components/jelly/jelly-store"
import { JellyAvatar } from "@/components/jelly/JellyAvatar"
import { Button } from "@/components/ui/button"
import { dayKey, recordDailyCase } from "@/lib/study"
import { DAILY_GOAL_MIN, DAILY_GOAL_SEC, Usage, doneTodayUsage, getPendingSeconds, loadUsage, todaySeconds, usageStreak } from "@/lib/usage"
import { Loader2, CheckCircle2, ArrowRight, Sparkles, Lock } from "lucide-react"
import Link from "next/link"

type DailyQuestion = {
  id: number
  topic_title: string
  question_text: string
  option1: string
  option2: string | null
  option3: string | null
  option4: string | null
  correct_answer_index: number
  explanation: string
}

type Item = { name: string; href: string; emoji: string; tint: string; desc: string; lock?: "basic" | "pro" }
type Section = { key: string; label: string; items: Item[] }

const SECTIONS: Section[] = [
  {
    key: "home", label: "Home", items: [],
  },
  {
    key: "notes", label: "Notes", items: [
      { name: "Rapid Revision Notes", href: "/notes", emoji: "📚", tint: "#e6f0ff", desc: "Subject-wise notes, diagrams and exam pearls." },
      { name: "Top 100 Topics", href: "/top-100", emoji: "⭐", tint: "#eaf6cf", desc: "The must-know topics, with full notes.", lock: "basic" },
      { name: "University Exams", href: "/university-exams", emoji: "🎓", tint: "#ffe9d6", desc: "Long answers, plus spot and identify." },
      { name: "Flashcards", href: "/flashcards", emoji: "🃏", tint: "#dcf5ea", desc: "Quick active recall for every subject." },
      { name: "Mind Maps", href: "/mindmaps", emoji: "🗺️", tint: "#efe6ff", desc: "Visual pathways from concepts to details." },
    ],
  },
  {
    key: "qbank", label: "QBank", items: [
      { name: "QBank", href: "/qbank", emoji: "🎯", tint: "#ffe6da", desc: "Topic-wise MCQs with explanations." },
      { name: "Custom Quiz", href: "/test-series", emoji: "🧪", tint: "#f0e6ff", desc: "Build a quiz on exactly what you need.", lock: "basic" },
    ],
  },
  {
    key: "test", label: "Test", items: [
      { name: "Grand Test", href: "/grand-test", emoji: "⏱️", tint: "#fff1c9", desc: "Full 200-question papers, timed." },
      { name: "PYQ Series", href: "/pyq", emoji: "📄", tint: "#e4efda", desc: "NEET-PG, INI-CET and AIIMS past papers." },
    ],
  },
  {
    key: "bedside", label: "Bedside", items: [
      { name: "Ward Round", href: "/cases", emoji: "🩺", tint: "#d9f1f8", desc: "Think through live patient cases." },
      { name: "Case Presentation", href: "/case-presentation", emoji: "📋", tint: "#e8f0dc", desc: "Practise presenting like a clinician." },
      { name: "Virtual Patients", href: "/virtual-patient", emoji: "🗣️", tint: "#ffe3ee", desc: "History, examination and viva, by voice." },
      { name: "The Arena", href: "/arena", emoji: "⚔️", tint: "#f0e3ff", desc: "Duels, co-op and leaderboards.", lock: "pro" },
    ],
  },
]

const TAB_KEY = "qp_home_tab"

export default function Dashboard() {
  const { user, loading } = useUser()
  const db = useFirestore()
  const router = useRouter()
  const jelly = useJelly()
  const { isFree, isBasic, isPro, loading: planLoading } = usePlan()
  const [tab, setTabState] = useState("home")
  const setTab = (k: string) => { setTabState(k); try { sessionStorage.setItem(TAB_KEY, k) } catch {} }
  useEffect(() => {
    try { const k = sessionStorage.getItem(TAB_KEY); if (k && SECTIONS.some((s) => s.key === k)) setTabState(k) } catch {}
  }, [])

  const profileRef = useMemo(() => (db && user ? doc(db, "users", user.uid) : null), [db, user])
  const { data: profile } = useDoc(profileRef)
  const isAdminUser = (profile as any)?.role === "admin"

  // streak: counts days with at least DAILY_GOAL_MIN minutes in the app
  const [usage, setUsage] = useState<Usage | null>(null)
  const [, tick] = useState(0)
  useEffect(() => {
    if (!db || !user) return
    let on = true
    loadUsage(db, user.uid).then((u) => { if (on) setUsage(u) }).catch(() => { if (on) setUsage({}) })
    return () => { on = false }
  }, [db, user])
  useEffect(() => { const t = setInterval(() => tick((n) => n + 1), 5000); return () => clearInterval(t) }, [])
  const liveUsage: Usage = (() => {
    const days = { ...(usage?.days || {}) }
    const k = dayKey()
    days[k] = (days[k] || 0) + getPendingSeconds()
    return { days }
  })()
  const streak = usageStreak(liveUsage)
  const todaySec = todaySeconds(liveUsage)
  const goalDone = doneTodayUsage(liveUsage)
  const todayMin = Math.min(Math.floor(todaySec / 60), DAILY_GOAL_MIN)
  const ringPct = Math.min(100, Math.round((todaySec / DAILY_GOAL_SEC) * 100))

  const bannersQuery = useMemo(() => (db ? collection(db, "dashboardBanners") : null), [db])
  const { data: rawBanners } = useCollection(bannersQuery)
  const activeBanners = useMemo(() => {
    const list = ((rawBanners as any[]) || []).filter((b) => b.enabled !== false)
    return list.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  }, [rawBanners])
  const [bannerIdx, setBannerIdx] = useState(0)
  useEffect(() => {
    if (activeBanners.length <= 1) return
    const t = setInterval(() => setBannerIdx((i) => (i + 1) % activeBanners.length), 7000)
    return () => clearInterval(t)
  }, [activeBanners.length])

  const [greeting, setGreeting] = useState("Hello")
  const [dateText, setDateText] = useState("")
  useEffect(() => {
    const now = new Date()
    const h = now.getHours()
    setGreeting(h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening")
    setDateText(now.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short" }))
  }, [])

  const [countdown, setCountdown] = useState("--:--:--")
  useEffect(() => {
    function t() {
      const now = new Date()
      const midnight = new Date(now)
      midnight.setHours(24, 0, 0, 0)
      const diff = Math.floor((midnight.getTime() - now.getTime()) / 1000)
      const h = String(Math.floor(diff / 3600)).padStart(2, "0")
      const m = String(Math.floor((diff % 3600) / 60)).padStart(2, "0")
      const s = String(diff % 60).padStart(2, "0")
      setCountdown(`${h}:${m}:${s}`)
    }
    t()
    const i = setInterval(t, 1000)
    return () => clearInterval(i)
  }, [])

  const [dq, setDq] = useState<DailyQuestion | null>(null)
  const [dqLoading, setDqLoading] = useState(true)
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null)
  useEffect(() => {
    let on = true
    async function fetchDaily() {
      try {
        const res = await fetch("/api/daily-question")
        const data = await res.json()
        if (on) setDq(data.question || null)
      } catch { if (on) setDq(null) }
      finally { if (on) setDqLoading(false) }
    }
    fetchDaily()
    return () => { on = false }
  }, [])

  if (loading || planLoading) {
    return (
      <div className="h-[70vh] flex items-center justify-center">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
      </div>
    )
  }

  const firstName = user?.displayName?.split(" ")[0] || "future doctor"
  const rawOptions = dq
    ? [dq.option1, dq.option2, dq.option3, dq.option4].map((text, idx) => ({ text, idx })).filter((o) => !!o.text)
    : []

  const recordDaily = (ok: boolean) => {
    if (!db || !user) return
    const k = `qp_daily_${user.uid}_${dayKey()}`
    try { if (localStorage.getItem(k)) return; localStorage.setItem(k, "1") } catch {}
    recordDailyCase(db, user.uid, ok).catch(() => {})
  }
  const askJelly = () => { if (jelly.active) jelly.setOpen(true); else router.push("/jelly") }
  const hrefFor = (href: string) => (user ? href : "/signup")
  const locked = (l?: "basic" | "pro") => (l === "pro" ? !isPro : l === "basic" ? !isBasic : false)
  const section = SECTIONS.find((s) => s.key === tab) || SECTIONS[0]

  const card = "rounded-[22px] border border-[#e9e2fb] bg-white shadow-[0_1px_2px_rgba(80,55,160,.04)]"

  return (
    <div className="min-h-[calc(100vh-70px)] bg-gradient-to-b from-[#f1ecff] via-white to-white">
      <div className="mx-auto w-full max-w-[1100px] space-y-6 px-4 py-6 md:px-8 md:py-8">

        {/* Greeting */}
        <div className="flex items-end justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-[clamp(24px,3vw,34px)] font-black leading-[1.1] tracking-tight">{greeting}, {firstName}! <span>👋</span></h1>
            <p className="mt-1 text-sm text-muted-foreground">A little progress every day adds up.</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {isAdminUser && <Link href="/admin" className="whitespace-nowrap rounded-xl bg-[#29233c] px-3.5 py-2.5 text-[13px] font-extrabold text-white shadow-md">⚙️ Admin</Link>}
            {dateText && <div className="hidden whitespace-nowrap rounded-xl border border-[#e9e2fb] bg-white px-3 py-2.5 text-[13px] font-bold text-muted-foreground sm:block">📅 {dateText}</div>}
          </div>
        </div>

        {/* Section switcher */}
        <nav className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1" aria-label="Sections">
          {SECTIONS.map((s) => {
            const on = s.key === tab
            return (
              <button key={s.key} onClick={() => setTab(s.key)} aria-pressed={on}
                className={`whitespace-nowrap rounded-full px-4 py-2 text-[13px] font-extrabold transition-all ${on ? "bg-primary text-white shadow-md shadow-primary/25" : "border border-[#e9e2fb] bg-white text-muted-foreground hover:border-primary/40 hover:text-primary"}`}>
                {s.label}
              </button>
            )
          })}
        </nav>

        {/* HOME */}
        {tab === "home" && (
          <div className="space-y-4">
            <section className="grid gap-4 md:grid-cols-2">
              <div className={`${card} p-5`}>
                <div className="text-[11px] font-black uppercase tracking-[0.14em] text-primary">Today&apos;s mission ✨</div>
                <h2 className="mt-2 text-xl font-black leading-tight tracking-tight">Small steps. Big doctor energy.</h2>
                <p className="mb-4 mt-1.5 text-sm text-muted-foreground">
                  {goalDone ? "Today's goal is done. Nice work!" : "Answer today's case to warm up."}
                </p>
                <button onClick={() => document.getElementById("case-of-the-day")?.scrollIntoView({ behavior: "smooth" })}
                  className="rounded-[13px] bg-primary px-4 py-2.5 text-sm font-extrabold text-white shadow-lg shadow-primary/25">
                  Take today&apos;s case →
                </button>
              </div>

              <Link href={hrefFor("/streak")} className={`${card} flex items-center justify-between gap-4 p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/10`}>
                <div className="min-w-0">
                  <div className="text-[11px] font-black uppercase tracking-[0.14em] text-primary">Day streak 🔥</div>
                  <div className="mt-1.5 text-3xl font-black tracking-tight">{streak} <span className="text-base text-muted-foreground">{streak === 1 ? "day" : "days"}</span></div>
                  <p className="mt-1 text-xs text-muted-foreground">{goalDone ? "Goal done today" : `${DAILY_GOAL_MIN} min a day keeps it alive`}</p>
                  <span className="mt-3 inline-block text-sm font-extrabold text-primary">See rewards →</span>
                </div>
                <div className="relative grid h-[96px] w-[96px] shrink-0 place-items-center rounded-full" style={{ background: `conic-gradient(#7552ee 0 ${ringPct}%, #efe9ff ${ringPct}%)` }}>
                  <div className="absolute inset-[9px] rounded-full bg-white" />
                  <div className="relative text-center leading-none">
                    <b className="block text-xl font-black">{todayMin}<span className="text-xs text-muted-foreground">/{DAILY_GOAL_MIN}</span></b>
                    <span className="text-[9px] font-extrabold text-muted-foreground">MIN TODAY</span>
                  </div>
                </div>
              </Link>
            </section>

            <section className="grid gap-4 md:grid-cols-2">
              <div className={`${card} relative flex items-center gap-2 p-5`}>
                <div className="relative z-10 min-w-0 flex-1">
                  <span className="rounded-full bg-[#f0eaff] px-2 py-1 text-[10px] font-black text-primary">JELLY</span>
                  <h3 className="mb-3 mt-3 text-xl font-black leading-tight tracking-tight">Ask away.<br />Jelly knows.</h3>
                  <button onClick={askJelly} className="text-sm font-extrabold text-primary">Ask Jelly →</button>
                </div>
                <div className="relative z-10 shrink-0">
                  <JellyAvatar mood="idle" size={112} touchy />
                </div>
              </div>

              <Link href={hrefFor("/my-progress")} className={`${card} flex items-center gap-4 p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/10`}>
                <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-[#e8f8ec] text-[28px]">📈</div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-lg font-black tracking-tight">My progress</h3>
                  <p className="text-xs text-muted-foreground">Daily review, study plan, weak and strong topics.</p>
                </div>
                <ArrowRight className="h-5 w-5 shrink-0 text-primary" />
              </Link>
            </section>

            {/* Case of the day */}
            <section id="case-of-the-day" className={`${card} scroll-mt-24 p-5 md:p-6`}>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.14em] text-primary">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
                  Case of the day
                </div>
                <div className="font-mono text-[11px] text-muted-foreground">
                  Next case in <span className="font-semibold text-foreground">{countdown}</span>
                </div>
              </div>
              {dqLoading ? (
                <div className="flex h-32 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
              ) : !dq ? (
                <p className="py-6 text-center text-sm text-muted-foreground">No question available right now. Check back once QBank has content for today.</p>
              ) : (
                <>
                  <div className="mb-3 inline-block rounded-md bg-[#f0eaff] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">{dq.topic_title}</div>
                  <p className="mb-4 text-sm font-medium leading-relaxed md:text-[15px]">{dq.question_text}</p>
                  <div className="flex flex-col gap-2">
                    {rawOptions.map((opt) => {
                      const answered = selectedIdx !== null
                      const isCorrect = opt.idx === dq.correct_answer_index
                      const wrong = answered && selectedIdx === opt.idx && !isCorrect
                      let cls = "border-[#e9e2fb] bg-white hover:border-primary/40 hover:bg-[#f7f4ff]"
                      if (answered && isCorrect) cls = "border-green-500/60 bg-green-500/10"
                      else if (wrong) cls = "border-red-500/60 bg-red-500/10"
                      else if (answered) cls = "border-[#e9e2fb] opacity-50"
                      return (
                        <button key={opt.idx} onClick={() => { if (answered) return; setSelectedIdx(opt.idx); recordDaily(opt.idx === dq.correct_answer_index) }} disabled={answered}
                          className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left text-[13px] transition-all ${cls}`}>
                          <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold ${answered && isCorrect ? "bg-green-500 text-white" : wrong ? "bg-red-500 text-white" : "bg-[#f0eaff] text-primary"}`}>
                            {String.fromCharCode(65 + opt.idx)}
                          </span>
                          {opt.text}
                        </button>
                      )
                    })}
                  </div>
                  {selectedIdx !== null && (
                    <div className="mt-4 rounded-xl border border-[#e9e2fb] bg-[#f7f4ff] p-4 text-[12.5px] leading-relaxed text-muted-foreground">{dq.explanation}</div>
                  )}
                </>
              )}
            </section>

            {/* Banners (managed from the admin panel) */}
            {activeBanners.length > 0 && (() => {
              const banner = activeBanners[bannerIdx % activeBanners.length]
              const headlineStart = (banner.headline || "").replace(banner.headlineHighlight || "", "").trim()
              return (
                <div key={banner.id} className="space-y-2">
                  <Link href={banner.buttonLink || "/products"} className="block">
                    <div className={`${card} group relative overflow-hidden p-5 transition-all hover:border-primary/40 md:p-6`}>
                      <div className="relative flex flex-col justify-between gap-5 md:flex-row md:items-center">
                        <div className="max-w-xl space-y-2.5">
                          {banner.badgeText && (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f0eaff] px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-primary">
                              <Sparkles className="h-3 w-3" /> {banner.badgeText}
                            </span>
                          )}
                          <h3 className="text-lg font-bold leading-tight md:text-xl">
                            {headlineStart} <span className="text-primary">{banner.headlineHighlight}</span>
                          </h3>
                          <div className="flex flex-wrap gap-x-5 gap-y-1.5">
                            {(banner.bullets || []).map((b: string, i: number) => (
                              <span key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground md:text-sm">
                                <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" /> {b}
                              </span>
                            ))}
                          </div>
                        </div>
                        <Button className="shrink-0 gap-2 rounded-xl font-bold shadow-lg shadow-primary/25">
                          {banner.buttonText || "Learn More"} <ArrowRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Link>
                  {activeBanners.length > 1 && (
                    <div className="flex justify-center gap-1.5">
                      {activeBanners.map((_: any, i: number) => (
                        <button key={i} aria-label={`Banner ${i + 1}`} onClick={() => setBannerIdx(i)}
                          className={`h-1.5 rounded-full transition-all ${i === bannerIdx % activeBanners.length ? "w-6 bg-primary" : "w-1.5 bg-primary/25"}`} />
                      ))}
                    </div>
                  )}
                </div>
              )
            })()}
          </div>
        )}

        {/* NOTES / QBANK / TEST / BEDSIDE */}
        {tab !== "home" && (
          <section className={`grid gap-3 ${section.items.length > 2 ? "sm:grid-cols-2 lg:grid-cols-3" : "sm:grid-cols-2"}`}>
            {section.items.map((it) => (
              <Link key={it.name} href={hrefFor(it.href)}
                className={`${card} group flex items-center gap-4 p-4 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10`}>
                <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-[28px]" style={{ background: it.tint }}>{it.emoji}</div>
                <div className="min-w-0 flex-1">
                  <h3 className="flex items-center gap-1.5 text-[15px] font-black tracking-tight">
                    <span className="truncate">{it.name}</span>
                    {locked(it.lock) && <Lock className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />}
                  </h3>
                  <p className="mt-0.5 text-xs leading-snug text-muted-foreground">{it.desc}</p>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
              </Link>
            ))}
          </section>
        )}

        {/* Upgrade */}
        {isFree && (
          <section className="relative flex flex-col items-start gap-4 overflow-hidden rounded-3xl bg-[#29233c] p-5 text-white sm:flex-row sm:items-center md:px-6">
            <div className="text-[43px] leading-none">👑</div>
            <div>
              <h3 className="mb-1 text-xl font-bold">Ready to unlock your full potential?</h3>
              <p className="text-xs text-[#d1c9e7]">Full notes, every mind map, unlimited QBank, Virtual Patient and your Jelly AI companion.</p>
            </div>
            <Link href="/pricing" className="shrink-0 rounded-[13px] bg-[#ffb17e] px-4 py-3 text-sm font-black text-[#4d2c21] sm:ml-auto">
              Explore Scholar · ₹999/year →
            </Link>
          </section>
        )}
      </div>
    </div>
  )
}
