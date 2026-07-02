"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useUser, useCollection, useFirestore } from "@/firebase"
import { doc, getDoc, collection } from "firebase/firestore"
import { usePlan } from "@/hooks/use-plan"
import { Button } from "@/components/ui/button"
import {
  ArrowRight, BrainCircuit, Loader2, Database, Network,
  Trophy, Brain, HeartPulse, TestTube, Stethoscope,
  Microscope, BookOpen, Target, Flame, Lock, Sparkles,
  Search, Star, CheckCircle2, Zap, Crown,
} from "lucide-react"
import Link from "next/link"

const ICON_MAP: Record<string, any> = {
  "Anatomy": Brain,
  "Physiology": HeartPulse,
  "Biochemistry": TestTube,
  "Pathology": Stethoscope,
  "Microbiology": Microscope,
  "Pharmacology": BookOpen,
}

const SUBJECT_ORDER = [
  "Anatomy", "Physiology", "Biochemistry", "Pathology", "Pharmacology",
  "Microbiology", "Forensic Medicine", "Community Medicine", "Ophthalmology",
  "ENT", "Medicine", "Surgery", "Obstetrics & Gynaecology", "Paediatrics",
  "Psychiatry", "Orthopaedics", "Radiology", "Anaesthesia", "Dermatology", "Anesthesiology"
]

export default function Dashboard() {
  const { user, loading } = useUser()
  const db = useFirestore()
  const router = useRouter()
  const { isFree, isBasic, isPro, loading: planLoading } = usePlan()
  const [checkingRole, setCheckingRole] = useState(true)
  const [subjects, setSubjects] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<'qbank' | 'mindmaps'>('qbank')

  const subjectsQuery = useMemo(() => db ? collection(db, 'subjects') : null, [db])
  const { data: rawSubjects, loading: subjectsLoading } = useCollection(subjectsQuery)

  useEffect(() => {
    if (rawSubjects) {
      const sorted = [...rawSubjects].sort((a, b) => {
        const ai = SUBJECT_ORDER.indexOf(a.name)
        const bi = SUBJECT_ORDER.indexOf(b.name)
        if (ai === -1 && bi === -1) return a.name.localeCompare(b.name)
        if (ai === -1) return 1
        if (bi === -1) return -1
        return ai - bi
      })
      setSubjects(sorted)
    }
  }, [rawSubjects])

  useEffect(() => {
    let isMounted = true
    async function checkUserRole() {
      if (loading) return
      if (!user) { router.push("/signup"); return }
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

  if (loading || checkingRole || planLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
      </div>
    )
  }

  if (!user) return null

  const firstName = user.displayName?.split(' ')[0] || 'Doctor'
  const totalQuestions = subjects.reduce((sum, s) => sum + (s.questionCount || 0), 0)
  const totalMindmaps = subjects.reduce((sum, s) => sum + (s.mindmapCount || 0), 0)
  const topQBankSubjects = [...subjects].sort((a, b) => (b.questionCount || 0) - (a.questionCount || 0)).slice(0, 6)
  const topMindmapSubjects = [...subjects].sort((a, b) => (b.mindmapCount || 0) - (a.mindmapCount || 0)).slice(0, 6)

  const planLabel = isFree ? 'Explorer' : isBasic ? 'Scholar' : 'Clinician'
  const planColor = isFree ? 'text-muted-foreground' : isBasic ? 'text-accent' : 'text-yellow-400'
  const planBg = isFree ? 'bg-white/5' : isBasic ? 'bg-accent/10' : 'bg-yellow-400/10'
  const PlanIcon = isPro ? Crown : isBasic ? Star : Zap

  const features = [
    {
      icon: Database,
      label: 'Question Bank',
      desc: `${totalQuestions.toLocaleString()} MCQs · ${subjects.length} subjects`,
      href: '/qbank',
      color: 'text-blue-400',
      bg: 'bg-blue-400/10',
      locked: false,
      badge: 'Free',
    },
    {
      icon: Network,
      label: 'Mindmaps',
      desc: `${totalMindmaps} visual mindmaps for revision`,
      href: '/mindmaps',
      color: 'text-accent',
      bg: 'bg-accent/10',
      locked: false,
      badge: 'Free',
    },
    {
      icon: Trophy,
      label: 'PYQ Series',
      desc: 'NEET PG · INICET · USMLE',
      href: '/pyq',
      color: 'text-yellow-400',
      bg: 'bg-yellow-400/10',
      locked: false,
      badge: 'Free',
    },
    {
      icon: Target,
      label: 'Custom Quiz',
      desc: 'Build tests by topic and difficulty',
      href: '/test-series',
      color: 'text-purple-400',
      bg: 'bg-purple-400/10',
      locked: isFree,
      badge: 'Scholar',
    },
    {
      icon: Search,
      label: 'Smart Search',
      desc: 'Search across all subjects',
      href: '/search',
      color: 'text-cyan-400',
      bg: 'bg-cyan-400/10',
      locked: false,
      badge: 'Free',
    },
    {
      icon: BrainCircuit,
      label: 'AI Tutor',
      desc: 'Clinical reasoning powered by AI',
      href: '/ai-tools',
      color: 'text-primary',
      bg: 'bg-primary/10',
      locked: !isPro,
      badge: 'Clinician',
    },
    {
      icon: Sparkles,
      label: 'AI Quiz Generator',
      desc: 'Generate MCQs on any topic instantly',
      href: '/ai-tools/quiz',
      color: 'text-primary',
      bg: 'bg-primary/10',
      locked: !isPro,
      badge: 'Clinician',
    },
  ]

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-8 animate-in fade-in duration-700">

      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl glass p-7 md:p-10">
        <div className="relative z-10 space-y-4 max-w-xl">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 text-accent text-xs font-bold tracking-widest uppercase">
              <Flame className="h-3 w-3" /> Welcome back, {firstName}
            </div>
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${planBg} ${planColor}`}>
              <PlanIcon className="h-3 w-3" /> {planLabel} Plan
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            Practice smarter,{" "}
            <span className="text-gradient italic">score higher</span>
          </h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            {totalQuestions > 0
              ? `${totalQuestions.toLocaleString()} questions and ${totalMindmaps} mindmaps ready for your NEET PG prep.`
              : "Your complete NEET PG prep platform."}
          </p>
          <div className="flex gap-3 pt-1">
            <Button asChild size="sm" className="rounded-xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/30 gap-2">
              <Link href="/qbank"><Database className="h-3.5 w-3.5" /> Open QBank</Link>
            </Button>
            <Button asChild size="sm" variant="outline" className="rounded-xl glass border-white/10 hover:bg-white/5 gap-2">
              <Link href="/mindmaps"><Network className="h-3.5 w-3.5" /> Mindmaps</Link>
            </Button>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-2/5 h-full bg-gradient-to-l from-primary/10 to-transparent pointer-events-none" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Questions", value: subjectsLoading ? "—" : totalQuestions.toLocaleString(), icon: Database, color: "text-blue-400", bg: "bg-blue-400/10" },
          { label: "Mindmaps", value: subjectsLoading ? "—" : String(totalMindmaps), icon: Network, color: "text-accent", bg: "bg-accent/10" },
          { label: "Subjects", value: subjectsLoading ? "—" : String(subjects.length), icon: BookOpen, color: "text-purple-400", bg: "bg-purple-400/10" },
          { label: "Plan", value: planLabel, icon: PlanIcon, color: planColor, bg: planBg },
        ].map((s) => (
          <div key={s.label} className="glass rounded-2xl p-4 flex items-center gap-3">
            <div className={`p-2 rounded-xl ${s.bg} ${s.color} shrink-0`}>
              <s.icon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{s.label}</p>
              <p className="text-base font-bold">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Features */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Features</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {features.map((f) => (
            <Link key={f.label} href={f.locked ? '/pricing' : f.href}>
              <div className={`group glass rounded-2xl p-4 border border-white/5 hover:border-white/10 hover:bg-white/5 transition-all h-full relative ${f.locked ? 'opacity-60' : ''}`}>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${f.bg} ${f.color} shrink-0`}>
                    <f.icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{f.label}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{f.desc}</p>
                  </div>
                  <div className="shrink-0">
                    {f.locked ? (
                      <div className="flex items-center gap-1 bg-white/5 rounded-full px-2 py-0.5 text-[9px] font-bold text-muted-foreground">
                        <Lock className="h-2.5 w-2.5" /> {f.badge}
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 bg-green-500/10 rounded-full px-2 py-0.5 text-[9px] font-bold text-green-400">
                        <CheckCircle2 className="h-2.5 w-2.5" /> {f.badge}
                      </div>
                    )}
                  </div>
                </div>
                {f.locked && (
                  <p className="text-[10px] text-primary font-medium mt-3 ml-11">Upgrade to {f.badge} to unlock →</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Tabbed subjects */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('qbank')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'qbank' ? 'bg-primary text-white' : 'glass text-muted-foreground hover:text-white'}`}
          >
            QBank
          </button>
          <button
            onClick={() => setActiveTab('mindmaps')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'mindmaps' ? 'bg-accent text-white' : 'glass text-muted-foreground hover:text-white'}`}
          >
            Mindmaps
          </button>
          <Link href={activeTab === 'qbank' ? '/qbank' : '/mindmaps'} className="ml-auto text-xs text-muted-foreground hover:text-white flex items-center gap-1 transition-colors">
            All <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {subjectsLoading ? (
          <div className="h-32 flex items-center justify-center">
            <Loader2 className="h-5 w-5 text-primary animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
            {(activeTab === 'qbank' ? topQBankSubjects : topMindmapSubjects).map((subject: any) => {
              const Icon = ICON_MAP[subject.name] || (activeTab === 'qbank' ? Database : Network)
              const count = activeTab === 'qbank'
                ? `${subject.questionCount || 0} Qs`
                : `${subject.mindmapCount || 0} maps`
              const href = activeTab === 'qbank' ? `/qbank/${subject.id}` : `/mindmaps/${subject.id}`
              return (
                <Link key={subject.id} href={href}>
                  <div className="glass rounded-2xl p-3 flex flex-col items-center text-center gap-2 border border-white/5 hover:border-white/15 hover:bg-white/5 transition-all group cursor-pointer">
                    <div className={`p-2 rounded-xl ${activeTab === 'qbank' ? 'bg-blue-400/10 text-blue-400' : 'bg-accent/10 text-accent'}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold leading-tight">{subject.name}</p>
                      <p className="text-[9px] text-muted-foreground mt-0.5">{count}</p>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {/* Upgrade banner — free users only */}
      {isFree && (
        <div className="relative overflow-hidden rounded-2xl glass border border-primary/15 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="font-bold text-sm">Unlock the full platform</p>
            <p className="text-xs text-muted-foreground mt-0.5">Custom Quiz, AI Tutor, and more with Scholar or Clinician plan.</p>
          </div>
          <Link href="/pricing" className="shrink-0">
            <Button size="sm" className="bg-primary hover:bg-primary/90 rounded-xl gap-2 shadow-lg shadow-primary/20">
              <Crown className="h-3.5 w-3.5" /> View Plans
            </Button>
          </Link>
          <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-primary/8 to-transparent pointer-events-none" />
        </div>
      )}

    </div>
  )
}
