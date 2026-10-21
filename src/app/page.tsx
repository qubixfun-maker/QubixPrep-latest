"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useUser, useCollection, useDoc, useFirestore } from "@/firebase"
import { doc, getDoc, getDocs, collection, query, where } from "firebase/firestore"
import { usePlan } from "@/hooks/use-plan"
import { useFeatureSettings } from "@/hooks/use-quickcards"
import { SORTED_FEATURES } from "@/lib/quickcards/cardFeatures"
import { getFeatureIcon } from "@/components/quickcards/icons"
import { useJelly } from "@/components/jelly/jelly-store"
import { JellyAvatar } from "@/components/jelly/JellyAvatar"
import { QuickDeckCard } from "@/components/quickcards/QuickDeckCard"
import { Button } from "@/components/ui/button"
import { Loader2, CheckCircle2, ArrowRight, Sparkles } from "lucide-react"
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

type Feature = {
  name: string; href: string; micro: string; title: string; tagline: string; emoji: string
  bg: string; fg: string; chip: string; chipKind: "free" | "pro"; body: string; foot: string
}

const FEATURES: Feature[] = [
  { name: "Smart Notes", href: "/notes", micro: "LEARN · HIGH YIELD", title: "Notes that\nmake sense", tagline: "Big concepts, made simpler.", emoji: "📚", bg: "#dcecff", fg: "#254e83", chip: "FREE START", chipKind: "free", body: "Subject-wise notes, diagrams and exam pearls.", foot: "5 free per subject" },
  { name: "100 Must-Know Topics", href: "/top-100", micro: "HIGH YIELD · FREE", title: "The 100 that\nmatter most", tagline: "Start with what is tested.", emoji: "⭐", bg: "#e7f6c9", fg: "#4a6a12", chip: "FREE FOR ALL", chipKind: "free", body: "Hand-picked must-know topics, with full notes.", foot: "Open the list" },
  { name: "Question Bank", href: "/qbank", micro: "PRACTISE · MCQS", title: "Train your\nexam brain", tagline: "One question at a time.", emoji: "🎯", bg: "#ffe2d3", fg: "#8b4429", chip: "FREE START", chipKind: "free", body: "Topic-wise MCQs with explanations and insights.", foot: "10 free per subject" },
  { name: "Flashcards", href: "/flashcards", micro: "REMEMBER · RECALL", title: "Make it\nstick!", tagline: "Little cards, mighty memory.", emoji: "🃏", bg: "#d8f4e9", fg: "#286c58", chip: "LEARN FREE", chipKind: "free", body: "Quick active recall decks for every subject.", foot: "Revise by subject" },
  { name: "Mind Maps", href: "/mindmaps", micro: "CONNECT · VISUALISE", title: "See the\nbig picture", tagline: "Ideas connect. It clicks.", emoji: "🗺️", bg: "#eee5ff", fg: "#6243b4", chip: "3 FREE / SUBJECT", chipKind: "free", body: "Visual pathways from core concepts to details.", foot: "Explore a topic" },
  { name: "QuickCards", href: "/quickcards", micro: "QUICK REVISION · PRO", title: "Rapid-fire\nrevision", tagline: "Exam-ready, at a glance.", emoji: "⚡", bg: "#fff0bf", fg: "#805716", chip: "🔒 SCHOLAR", chipKind: "pro", body: "Dense decks: ECG, drugs, fluids, OPD and more.", foot: "Reference sections" },
  { name: "Clinical Cases", href: "/cases", micro: "THINK · DIAGNOSE", title: "Think like\na clinician", tagline: "Clues, reasoning, decisions.", emoji: "🩺", bg: "#d9f1f8", fg: "#245f78", chip: "TRY A CASE", chipKind: "free", body: "Build clinical reasoning with patient scenarios.", foot: "Start a case" },
  { name: "OSCE Stations", href: "/osce-stations", micro: "SPEAK · PERFORM", title: "Practice the\nreal thing", tagline: "Meet your virtual patient.", emoji: "🗣️", bg: "#ffe0ec", fg: "#8d3c61", chip: "🔒 SCHOLAR", chipKind: "pro", body: "History, examination, viva and scored feedback.", foot: "100 ready cases" },
  { name: "PYQ Series", href: "/pyq", micro: "PAST PAPERS · PATTERNS", title: "Study what\nshows up", tagline: "Learn from past questions.", emoji: "📄", bg: "#e4efda", fg: "#41633a", chip: "EXPLORE", chipKind: "free", body: "Year-wise NEET-PG, INI-CET and USMLE practice.", foot: "Browse question sets" },
  { name: "Med Stories", href: "/stories", micro: "LIVE · MEDICAL NEWS", title: "Fresh from the\nmedical world", tagline: "Swipe through today's stories.", emoji: "📰", bg: "#fde4dc", fg: "#8a3a2a", chip: "LIVE · FREE", chipKind: "free", body: "New medical news as web stories, straight from trusted sources.", foot: "Open stories" },
  { name: "Jelly AI", href: "/jelly", micro: "YOUR AI STUDY BUDDY", title: "Ask away.\nJelly knows.", tagline: "Doubts, quizzes, plans, viva.", emoji: "👻", bg: "#e8e0ff", fg: "#5b43a0", chip: "SCHOLAR", chipKind: "pro", body: "Explain, quiz, practise viva or plan your week.", foot: "Chat with Jelly" },
]

const SUBJECT_STYLES: { match: RegExp; emoji: string; bg: string; label: string }[] = [
  { match: /anat/i, emoji: "🦴", bg: "#fff0e6", label: "STRUCTURE & FORM" },
  { match: /physio/i, emoji: "❤️", bg: "#e4f5f0", label: "HOW THE BODY WORKS" },
  { match: /bio.?chem/i, emoji: "🧬", bg: "#eae6ff", label: "MOLECULES & METABOLISM" },
  { match: /patho/i, emoji: "🔬", bg: "#ffe6ed", label: "DISEASE MECHANISMS" },
  { match: /pharm/i, emoji: "💊", bg: "#fff2cb", label: "DRUGS & ACTIONS" },
  { match: /micro/i, emoji: "🦠", bg: "#dff0ff", label: "MICROBES & IMMUNITY" },
  { match: /forensic/i, emoji: "⚖️", bg: "#efe9e0", label: "MEDICINE & LAW" },
  { match: /surg/i, emoji: "🔪", bg: "#ffe4e1", label: "OPERATIVE CARE" },
  { match: /med/i, emoji: "🩺", bg: "#d9f1f8", label: "CLINICAL PRACTICE" },
  { match: /pead|paed/i, emoji: "🧸", bg: "#fff0bf", label: "CHILD HEALTH" },
  { match: /obs|gyn/i, emoji: "🤰", bg: "#ffe0ec", label: "WOMEN'S HEALTH" },
]
const FALLBACK_BG = ["#fff0e6", "#e4f5f0", "#eae6ff", "#ffe6ed", "#fff2cb", "#dff0ff"]
const QC_TINTS = ["#e8e0ff", "#d9f1f8", "#ffe4d6", "#ffe0ec", "#e4f5f0", "#fff0bf", "#eae6ff", "#dff0ff"]

function subjectStyle(name: string, i: number) {
  const hit = SUBJECT_STYLES.find((s) => s.match.test(name))
  return hit || { emoji: "📘", bg: FALLBACK_BG[i % FALLBACK_BG.length], label: "SUBJECT" }
}

export default function Dashboard() {
  const { user, loading } = useUser()
  const db = useFirestore()
  const router = useRouter()
  const jelly = useJelly()
  const { isFree, isBasic, isPro, canAccessContent, loading: planLoading } = usePlan()
  const { settings: qcSettings } = useFeatureSettings()
  const [checkingRole, setCheckingRole] = useState(true)

  const profileRef = useMemo(() => (db && user ? doc(db, "users", user.uid) : null), [db, user])
  const { data: profile } = useDoc(profileRef)
  const streak = (profile as any)?.streakCount || 0
  const isAdminUser = (profile as any)?.role === "admin"

  const [completed, setCompleted] = useState<number | null>(null)
  useEffect(() => {
    let on = true
    async function load() {
      if (!db || !user) return
      try {
        const snap = await getDocs(query(collection(db, "users", user.uid, "progress"), where("completed", "==", true)))
        if (on) setCompleted(snap.size)
      } catch { if (on) setCompleted(0) }
    }
    load()
    return () => { on = false }
  }, [db, user])

  const subjectsQuery = useMemo(() => (db ? collection(db, "subjects") : null), [db])
  const { data: rawSubjects } = useCollection(subjectsQuery)
  const subjects = useMemo(() => {
    const list = ((rawSubjects as any[]) || []).filter((s) => s?.name)
    return list.sort((a, b) => String(a.name).localeCompare(String(b.name)))
  }, [rawSubjects])

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

  useEffect(() => {
    let on = true
    async function checkUserRole() {
      if (loading) return
      if (!user) { setCheckingRole(false); return }
      if (!db) return
      try {
        const snap = await getDoc(doc(db, "users", user.uid))
        if (on) {
          setCheckingRole(false)
        }
      } catch (e) {
        console.error("Error fetching user role:", e)
        if (on) setCheckingRole(false)
      }
    }
    checkUserRole()
    return () => { on = false }
  }, [user, loading, router, db])

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
    function tick() {
      const now = new Date()
      const midnight = new Date(now)
      midnight.setHours(24, 0, 0, 0)
      const diff = Math.floor((midnight.getTime() - now.getTime()) / 1000)
      const h = String(Math.floor(diff / 3600)).padStart(2, "0")
      const m = String(Math.floor((diff % 3600) / 60)).padStart(2, "0")
      const s = String(diff % 60).padStart(2, "0")
      setCountdown(`${h}:${m}:${s}`)
    }
    tick()
    const t = setInterval(tick, 1000)
    return () => clearInterval(t)
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

  if (loading || checkingRole || planLoading) {
    return (
      <div className="h-[70vh] flex items-center justify-center">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
      </div>
    )
  }

  const firstName = user?.displayName?.split(" ")[0] || "future doctor"
  const planLabel = isPro ? "Clinician" : isBasic ? "Scholar" : "Explorer"
  const weekDays = Math.min(streak, 7)
  const ringPct = Math.round((weekDays / 7) * 100)
  const visibleQc = SORTED_FEATURES.filter((f) => qcSettings[f.slug]?.visible !== false)

  const rawOptions = dq
    ? [dq.option1, dq.option2, dq.option3, dq.option4].map((text, idx) => ({ text, idx })).filter((o) => !!o.text)
    : []

  const askJelly = () => { if (jelly.active) jelly.setOpen(true); else router.push("/jelly") }
  const goTo = (href: string) => router.push(!user ? "/signup" : href)

  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 py-6 md:px-8 md:py-8 space-y-7">

      {/* Heading */}
      <div className="flex items-end justify-between gap-4">
        <div className="min-w-0">
          <div className="text-[11px] font-black uppercase tracking-[0.14em] text-primary">Your medical prep command center</div>
          <h1 className="mt-1 mb-1.5 text-[clamp(26px,3vw,38px)] font-black leading-[1.08] tracking-tight">{greeting}, {firstName}! <span>👋</span></h1>
          <p className="text-sm text-muted-foreground">A little progress every day adds up. Ready for today&apos;s round?</p>
        </div>
        {isAdminUser && <Link href="/admin" className="shrink-0 whitespace-nowrap rounded-xl bg-[#29233c] px-3.5 py-2.5 text-[13px] font-extrabold text-white shadow-md">⚙️ Admin dashboard</Link>}
        {dateText && <div className="hidden sm:block whitespace-nowrap rounded-xl border border-border bg-card px-3 py-2.5 text-[13px] font-bold text-muted-foreground">📅 {dateText}</div>}
      </div>

      {/* Hero */}
      <section className="grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(250px,.8fr)]">
        <div className="relative flex min-h-[210px] items-center justify-between gap-4 overflow-hidden rounded-[25px] bg-[#e8e0ff] p-6">
          <div className="relative z-10 min-w-0">
            <div className="text-[11px] font-black uppercase tracking-[0.14em] text-primary">Today&apos;s mission ✨</div>
            <h2 className="my-2 text-[23px] font-black leading-tight tracking-tight">Small steps. Big doctor energy.</h2>
            <p className="mb-4 max-w-[320px] text-sm text-[#635985]">
              {streak > 0 ? `You're on a ${streak}-day streak. Answer today's case to keep it going!` : "Answer today's case to start your streak."}
            </p>
            <button
              onClick={() => document.getElementById("case-of-the-day")?.scrollIntoView({ behavior: "smooth" })}
              className="rounded-[13px] bg-primary px-4 py-3 text-sm font-extrabold text-white shadow-lg shadow-primary/30"
            >
              Take today&apos;s case →
            </button>
          </div>
          <div className="relative z-10 grid h-[110px] w-[110px] shrink-0 place-items-center rounded-full sm:h-[124px] sm:w-[124px]" style={{ background: `conic-gradient(#7552ee 0 ${ringPct}%, #ffffffa8 ${ringPct}%)` }}>
            <div className="absolute inset-[10px] rounded-full bg-[#e8e0ff]" />
            <div className="relative text-center">
              <b className="block text-2xl font-black">{weekDays}/7</b>
              <span className="text-[10px] font-extrabold text-[#665b8e]">DAY STREAK</span>
            </div>
          </div>
          <span className="qp-twinkle absolute right-[34%] top-5 text-[22px] text-primary">✦</span>
        </div>

        <div className="relative flex items-center gap-2 overflow-hidden rounded-[25px] border border-border bg-card p-5">
          <div className="relative z-10 min-w-0 flex-1">
            <span className="rounded-full bg-[#fff0d9] px-2 py-1 text-[10px] font-black text-[#a15e19]">JELLY SAYS HI!</span>
            <h3 className="mb-1 mt-3 text-lg font-bold leading-tight">Let&apos;s crack one more topic 💜</h3>
            <p className="mb-3 text-xs text-muted-foreground">Stuck on something? Ask for an explanation or a quick quiz.</p>
            <button onClick={askJelly} className="text-sm font-extrabold text-primary">Ask Jelly →</button>
          </div>
          <div className="relative z-10 shrink-0">
            <JellyAvatar mood="idle" size={104} />
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { bg: "#fff0dc", icon: "🔥", value: `${streak} ${streak === 1 ? "day" : "days"}`, label: "Study streak" },
          { bg: "#e7f8e9", icon: "✅", value: completed === null ? "…" : String(completed), label: "Items completed" },
          { bg: "#e8e0ff", icon: "📚", value: String(subjects.length), label: "Subjects to explore" },
          { bg: "#ffe4ef", icon: "🎓", value: planLabel, label: "Your plan" },
        ].map((s) => (
          <div key={s.label} className="flex min-w-0 items-center gap-3 rounded-[18px] border border-border bg-card p-3.5">
            <div className="grid h-[43px] w-[43px] shrink-0 place-items-center rounded-[14px] text-[22px]" style={{ background: s.bg }}>{s.icon}</div>
            <div className="min-w-0">
              <b className="block truncate text-[21px] leading-tight tracking-tight">{s.value}</b>
              <small className="text-[11px] text-muted-foreground">{s.label}</small>
            </div>
          </div>
        ))}
      </section>

      {/* Banners (managed from the admin panel) */}
      {activeBanners.length > 0 && (() => {
        const banner = activeBanners[bannerIdx % activeBanners.length]
        const headlineStart = (banner.headline || "").replace(banner.headlineHighlight || "", "").trim()
        return (
          <div key={banner.id} className="space-y-2">
            <Link href={banner.buttonLink || "/products"} className="block">
              <div className="group relative overflow-hidden rounded-[25px] border border-primary/25 bg-gradient-to-br from-primary/15 via-secondary to-card p-6 md:p-8 transition-all hover:border-primary/50">
                <div className="relative flex flex-col justify-between gap-6 md:flex-row md:items-center">
                  <div className="max-w-xl space-y-3">
                    {banner.badgeText && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-primary">
                        <Sparkles className="h-3 w-3" /> {banner.badgeText}
                      </span>
                    )}
                    <h3 className="text-xl font-bold leading-tight md:text-2xl">
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
                  <Button className="shrink-0 gap-2 rounded-xl font-bold shadow-lg shadow-primary/30">
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

      {/* Case of the day */}
      <section id="case-of-the-day" className="scroll-mt-24 rounded-[25px] border border-border bg-card p-5 md:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.14em] text-accent">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
            Case of the day
          </div>
          <div className="font-mono text-[11px] text-muted-foreground">
            Next case in <span className="font-semibold text-foreground">{countdown}</span>
          </div>
        </div>
        {dqLoading ? (
          <div className="flex h-32 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
        ) : !dq ? (
          <p className="py-6 text-center text-sm text-muted-foreground">No question available right now — check back once QBank has content for today.</p>
        ) : (
          <>
            <div className="mb-3 inline-block rounded-md bg-secondary px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">{dq.topic_title}</div>
            <p className="mb-4 text-sm font-medium leading-relaxed md:text-[15px]">{dq.question_text}</p>
            <div className="flex flex-col gap-2">
              {rawOptions.map((opt) => {
                const answered = selectedIdx !== null
                const isCorrect = opt.idx === dq.correct_answer_index
                const wrong = answered && selectedIdx === opt.idx && !isCorrect
                let cls = "border-border bg-card hover:border-primary/40 hover:bg-secondary"
                if (answered && isCorrect) cls = "border-green-500/60 bg-green-500/10"
                else if (wrong) cls = "border-red-500/60 bg-red-500/10"
                else if (answered) cls = "border-border opacity-50"
                return (
                  <button key={opt.idx} onClick={() => { if (!answered) setSelectedIdx(opt.idx) }} disabled={answered}
                    className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left text-[13px] transition-all ${cls}`}>
                    <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold ${answered && isCorrect ? "bg-green-500 text-white" : wrong ? "bg-red-500 text-white" : "bg-muted text-muted-foreground"}`}>
                      {String.fromCharCode(65 + opt.idx)}
                    </span>
                    {opt.text}
                  </button>
                )
              })}
            </div>
            {selectedIdx !== null && (
              <div className="mt-4 rounded-xl border border-primary/20 bg-secondary p-4 text-[12.5px] leading-relaxed text-muted-foreground">{dq.explanation}</div>
            )}
          </>
        )}
      </section>

      {/* Feature cards */}
      <section>
        <div className="mb-3.5 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-[21px] font-black tracking-tight">Pick your next adventure 🚀</h2>
            <p className="mt-1 text-xs text-muted-foreground">Big goals begin with one tap. Choose how you want to learn.</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2.5 md:gap-4 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <article key={f.name} role="link" tabIndex={0} onClick={() => goTo(f.href)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); goTo(f.href) } }}
              className="group cursor-pointer overflow-hidden rounded-[22px] border border-border bg-card transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">
              <div className="relative flex h-[120px] items-center justify-between overflow-hidden p-3 md:h-[150px] md:px-5 md:py-[18px]" style={{ background: f.bg, color: f.fg }}>
                <div className="relative z-10 max-w-[70%] md:max-w-[65%]">
                  <div className="text-[9px] font-black uppercase tracking-[0.12em] opacity-80 md:text-[10px]">{f.micro}</div>
                  <h3 className="my-1.5 whitespace-pre-line text-[20px] font-black leading-[1.03] tracking-tight md:my-[7px] md:text-[25px]">{f.title}</h3>
                  <p className="hidden text-[11px] opacity-80 sm:block">{f.tagline}</p>
                </div>
                <div className="qp-float relative z-10 text-[53px] leading-none drop-shadow-md md:text-[73px]" style={{ animationDelay: `${-(i % 3) * 1.1}s` }}>{f.emoji}</div>
                <span className="qp-twinkle absolute right-[43%] top-4 text-[20px]">✦</span>
              </div>
              <div className="p-3 md:px-4 md:pb-4 md:pt-3.5">
                <div className="flex items-center justify-between gap-2">
                  <span className={`whitespace-nowrap rounded-full px-2 py-1 text-[9px] font-black md:text-[10px] ${f.chipKind === "pro" ? "bg-[#fff0c7] text-[#96600b]" : "bg-[#e6f6ed] text-[#28744d]"}`}>
                    {f.name === "QuickCards" && canAccessContent ? "UNLOCKED" : f.chip}
                  </span>
                  <span className="text-muted-foreground">↗</span>
                </div>
                <h4 className="mb-1 mt-2.5 text-[13px] font-bold md:text-[15px]">{f.name}</h4>
                <p className="min-h-[34px] text-[11px] text-muted-foreground md:text-xs">{f.body}</p>
                <div className="mt-3 flex items-center justify-between text-[11px] font-bold text-muted-foreground"><span>{f.foot}</span><span>→</span></div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* QuickCards */}
      {visibleQc.length > 0 && (
        <section>
          <div className="mb-3.5 flex items-end justify-between gap-3">
            <div>
              <h2 className="text-[21px] font-black tracking-tight">QuickCards · rapid revision ⚡</h2>
              <p className="mt-1 text-xs text-muted-foreground">Exam-ready reference decks, designed for fast recall.</p>
            </div>
            {!canAccessContent && <span className="rounded-full bg-[#fff0c7] px-2 py-1 text-[10px] font-black text-[#96600b]">🔒 SCHOLAR</span>}
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {visibleQc.map((f, i) => (
              <QuickDeckCard key={f.slug} slug={f.slug} name={f.name} description={f.description} tags={f.tags} index={i} />
            ))}
          </div>
        </section>
      )}

      {/* Upgrade */}
      {isFree && (
        <section className="relative flex flex-col items-start gap-4 overflow-hidden rounded-3xl bg-[#29233c] p-5 text-white sm:flex-row sm:items-center md:px-6">
          <div className="text-[43px] leading-none">👑</div>
          <div>
            <h3 className="mb-1 text-xl font-bold">Ready to unlock your full potential?</h3>
            <p className="text-xs text-[#d1c9e7]">Full notes, every mind map, unlimited QBank, OSCE and your Jelly AI companion.</p>
          </div>
          <Link href="/pricing" className="shrink-0 rounded-[13px] bg-[#ffb17e] px-4 py-3 text-sm font-black text-[#4d2c21] sm:ml-auto">
            Explore Scholar · ₹999/year →
          </Link>
        </section>
      )}
    </div>
  )
}
