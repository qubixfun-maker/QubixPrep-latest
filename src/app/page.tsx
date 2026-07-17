"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useUser, useCollection, useFirestore } from "@/firebase"
import { doc, getDoc, collection } from "firebase/firestore"
import { usePlan } from "@/hooks/use-plan"
import { Button } from "@/components/ui/button"
import {
  BrainCircuit, Loader2, Database, Network,
  Trophy, Search, Crown, Star, Zap, CheckCircle2,
  ShoppingBag, ArrowRight, Users,
} from "lucide-react"
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

export default function Dashboard() {
  const { user, loading } = useUser()
  const db = useFirestore()
  const router = useRouter()
  const { isFree, isBasic, isPro, canAccessContent, canAccessAI, loading: planLoading } = usePlan()
  const [checkingRole, setCheckingRole] = useState(true)
  const [subjects, setSubjects] = useState<any[]>([])

  const subjectsQuery = useMemo(() => db ? collection(db, 'subjects') : null, [db])
  const { data: rawSubjects, loading: subjectsLoading } = useCollection(subjectsQuery)

  useEffect(() => {
    if (rawSubjects) setSubjects(rawSubjects)
  }, [rawSubjects])

  useEffect(() => {
    let isMounted = true
    async function checkUserRole() {
      if (loading) return
      if (!user) { setCheckingRole(false); return }
      if (!db) return
      try {
        const userRef = doc(db, 'users', user.uid)
        const docSnap = await getDoc(userRef)
        if (isMounted) {
          if (docSnap.exists() && (docSnap.data() as any).role === 'admin') {
            router.push("/admin")
          } else {
            setCheckingRole(false)
          }
        }
      } catch (error) {
        console.error("Error fetching user role:", error)
        if (isMounted) setCheckingRole(false)
      }
    }
    checkUserRole()
    return () => { isMounted = false }
  }, [user, loading, router, db])

  const [clock, setClock] = useState("--:--:--")
  useEffect(() => {
    function tick() {
      setClock(new Date().toLocaleTimeString('en-IN', { hour12: false }))
    }
    tick()
    const t = setInterval(tick, 1000)
    return () => clearInterval(t)
  }, [])

  const [countdown, setCountdown] = useState("--:--:--")
  useEffect(() => {
    function tick() {
      const now = new Date()
      const midnight = new Date(now)
      midnight.setHours(24, 0, 0, 0)
      const diff = Math.floor((midnight.getTime() - now.getTime()) / 1000)
      const h = String(Math.floor(diff / 3600)).padStart(2, '0')
      const m = String(Math.floor((diff % 3600) / 60)).padStart(2, '0')
      const s = String(diff % 60).padStart(2, '0')
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
    let isMounted = true
    async function fetchDaily() {
      try {
        const res = await fetch('/api/daily-question')
        const data = await res.json()
        if (isMounted) setDq(data.question || null)
      } catch (e) {
        if (isMounted) setDq(null)
      } finally {
        if (isMounted) setDqLoading(false)
      }
    }
    fetchDaily()
    return () => { isMounted = false }
  }, [])

  if (loading || checkingRole || planLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
      </div>
    )
  }

  const firstName = user?.displayName?.split(' ')[0] || 'Doctor'
  const totalMindmaps = subjects.reduce((sum, s) => sum + (s.mindmapCount || 0), 0)

  const planLabel = isFree ? 'Explorer' : isBasic ? 'Scholar' : 'Clinician'
  const PlanIcon = isPro ? Crown : isBasic ? Star : Zap

  const tools = [
    {
      title: "QBank",
      desc: "Subject-wise case vignettes with instant explanations.",
      href: "/qbank",
      icon: Database,
      tone: "violet" as const,
      locked: false,
      badge: "Free",
    },
    {
      title: "PYQ Series",
      desc: "Real exam questions sorted by year and subject.",
      href: "/pyq",
      icon: Trophy,
      tone: "blue" as const,
      locked: false,
      badge: "Free",
    },
    {
      title: "Custom Quiz",
      desc: "Pick topics, set a timer, simulate real exam pressure.",
      href: "/test-series",
      icon: BrainCircuit,
      tone: "coral" as const,
      locked: !canAccessContent,
      badge: "Scholar",
    },
    {
      title: "AI Tutor",
      desc: "Ask about any case — concise, exam-focused answers.",
      href: "/ai-tools",
      icon: BrainCircuit,
      tone: "violet" as const,
      locked: !canAccessAI,
      badge: "Clinician",
    },
    {
      title: "Mindmaps",
      desc: subjectsLoading ? "Visual subject trees for quick revision." : `${totalMindmaps} visual mindmaps across all subjects.`,
      href: "/mindmaps",
      icon: Network,
      tone: "blue" as const,
      locked: false,
      badge: "Free",
    },
    {
      title: "Smart Search",
      desc: "Search across every subject, note, and mindmap.",
      href: "/search",
      icon: Search,
      tone: "coral" as const,
      locked: false,
      badge: "Free",
    },
    {
      title: "Affiliate Program",
      desc: "Refer friends and earn ₹29-59 for every subscription.",
      href: "/affiliate",
      icon: Users,
      tone: "gold" as const,
      locked: false,
      badge: "Free",
    },
  ]

  const toneClasses: Record<string, string> = {
    violet: "bg-primary/15 text-primary",
    blue: "bg-accent/15 text-accent",
    coral: "bg-orange-400/15 text-orange-400",
    gold: "bg-yellow-400/15 text-yellow-400",
  }

  const rawOptions = dq ? [
    { text: dq.option1, idx: 0 },
    { text: dq.option2, idx: 1 },
    { text: dq.option3, idx: 2 },
    { text: dq.option4, idx: 3 },
  ].filter(o => !!o.text) : []

  function selectOption(idx: number) {
    if (selectedIdx !== null) return
    setSelectedIdx(idx)
  }

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-6">

      <div className="flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-500">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight">Good to see you, {firstName}</h1>
          <p className="text-xs text-muted-foreground mt-1">Ready to pick up where the syllabus left off?</p>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-[11px] font-mono text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
          {clock}
        </div>
      </div>

      <div className="glass rounded-3xl p-5 md:p-6 border border-white/10 animate-in fade-in slide-in-from-top-2 duration-500 delay-100">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-orange-400">
            <span className="h-1.5 w-1.5 rounded-full bg-orange-400 animate-pulse" />
            Case of the day
          </div>
          <div className="text-[11px] font-mono text-muted-foreground">
            Next case in <span className="text-foreground font-semibold">{countdown}</span>
          </div>
        </div>

        {dqLoading ? (
          <div className="h-32 flex items-center justify-center">
            <Loader2 className="h-5 w-5 text-primary animate-spin" />
          </div>
        ) : !dq ? (
          <p className="text-sm text-muted-foreground py-6 text-center">No question available right now — check back once QBank has content for today.</p>
        ) : (
          <>
            <div className="inline-block text-[10px] uppercase tracking-wider font-bold text-accent bg-accent/10 px-2.5 py-1 rounded-md mb-3">
              {dq.topic_title}
            </div>
            <p className="text-sm md:text-[15px] leading-relaxed font-medium mb-4">{dq.question_text}</p>
            <div className="flex flex-col gap-2">
              {rawOptions.map((opt) => {
                const isSelected = selectedIdx !== null
                const isCorrect = opt.idx === dq.correct_answer_index
                const isChosenWrong = isSelected && selectedIdx === opt.idx && !isCorrect
                let stateClasses = "border-white/10 hover:border-white/20 hover:bg-white/5"
                if (isSelected && isCorrect) stateClasses = "border-green-400/60 bg-green-400/10"
                else if (isChosenWrong) stateClasses = "border-red-400/60 bg-red-400/10"
                else if (isSelected) stateClasses = "border-white/5 opacity-50"
                return (
                  <button
                    key={opt.idx}
                    onClick={() => selectOption(opt.idx)}
                    disabled={isSelected}
                    className={`flex items-center gap-3 text-left px-4 py-3 rounded-xl border text-[13px] transition-all ${stateClasses}`}
                  >
                    <span className={`h-6 w-6 rounded-lg flex items-center justify-center text-[11px] font-bold shrink-0 ${isSelected && isCorrect ? 'bg-green-400 text-green-950' : isChosenWrong ? 'bg-red-400 text-red-950' : 'bg-white/5 text-muted-foreground'}`}>
                      {String.fromCharCode(65 + opt.idx)}
                    </span>
                    {opt.text}
                  </button>
                )
              })}
            </div>
            {selectedIdx !== null && (
              <div className="mt-4 p-4 rounded-xl bg-primary/8 border border-primary/20 text-[12.5px] leading-relaxed text-muted-foreground animate-in fade-in slide-in-from-top-1 duration-300">
                {dq.explanation}
              </div>
            )}
          </>
        )}
      </div>

      <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-500 delay-200">
        <h2 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest px-1">Study tools</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {tools.map((t) => (
            <Link key={t.title} href={!user ? '/signup' : t.locked ? '/pricing' : t.href}>
              <div className={`group glass rounded-2xl p-4 border border-white/5 hover:border-white/15 hover:bg-white/5 transition-all h-full ${t.locked ? 'opacity-70' : ''}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2.5 rounded-xl ${toneClasses[t.tone]} transition-transform group-hover:scale-110`}>
                    <t.icon className="h-4 w-4" />
                  </div>
                  {t.locked ? (
                    <span className="text-[9px] font-bold text-muted-foreground bg-white/5 rounded-full px-2 py-0.5">{t.badge}</span>
                  ) : (
                    <span className="flex items-center gap-1 text-[9px] font-bold text-green-400 bg-green-400/10 rounded-full px-2 py-0.5">
                      <CheckCircle2 className="h-2.5 w-2.5" /> {t.badge}
                    </span>
                  )}
                </div>
                <p className="font-semibold text-sm">{t.title}</p>
                <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">{t.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {isFree && (
        <div className="relative overflow-hidden rounded-2xl glass border border-dashed border-primary/20 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2 duration-500 delay-300">
          <div>
            <p className="font-bold text-sm">Explorer plan</p>
            <p className="text-xs text-muted-foreground mt-0.5">Upgrade to Scholar or Clinician to unlock Custom Quiz and AI Tutor.</p>
          </div>
          <Link href="/pricing" className="shrink-0">
            <Button size="sm" className="bg-primary hover:bg-primary/90 rounded-xl gap-2 shadow-lg shadow-primary/20">
              <ArrowRight className="h-3.5 w-3.5" /> View plans
            </Button>
          </Link>
        </div>
      )}

    </div>
  )
}
