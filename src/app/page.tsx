"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useUser, useCollection, useFirestore } from "@/firebase"
import { doc, getDoc, collection } from "firebase/firestore"
import { usePlan } from "@/hooks/use-plan"
import { Button } from "@/components/ui/button"
import {
  ArrowRight, BrainCircuit, Loader2, Database, Network,
  Trophy, ChevronRight, Brain, HeartPulse, TestTube,
  Stethoscope, Microscope, BookOpen, Target, Flame,
  Lock, Sparkles, FileText, Video, Search, Star,
  CheckCircle2, Zap, Crown,
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
  const { plan, isFree, isBasic, isPro, loading: planLoading } = usePlan()
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

  const features = [
    {
      icon: Database,
      label: 'QBank',
      desc: `${totalQuestions.toLocaleString()} MCQs across ${subjects.length} subjects`,
      href: '/qbank',
      color: 'text-blue-400',
      bg: 'bg-blue-400/10',
      border: 'hover:border-blue-400/30',
      locked: false,
      badge: 'Free',
    },
    {
      icon: Network,
      label: 'Mindmaps',
      desc: `${totalMindmaps} visual mindmaps for quick revision`,
      href: '/mindmaps',
      color: 'text-accent',
      bg: 'bg-accent/10',
      border: 'hover:border-accent/30',
      locked: false,
      badge: 'Free',
    },
    {
      icon: Trophy,
      label: 'PYQ Series',
      desc: 'NEET PG · INICET · USMLE past papers',
      href: '/pyq',
      color: 'text-yellow-400',
      bg: 'bg-yellow-400/10',
      border: 'hover:border-yellow-400/30',
      locked: false,
      badge: 'Free',
    },
    {
      icon: FileText,
      label: 'PDF Notes',
      desc: 'High-yield topic notes for all subjects',
      href: '/notes',
      color: 'text-orange-400',
      bg: 'bg-orange-400/10',
      border: 'hover:border-orange-400/30',
      locked: isFree,
      badge: 'Scholar',
    },
    {
      icon: Video,
      label: 'Video Lectures',
      desc: 'Subject-wise video curriculum',
      href: '/videos',
      color: 'text-pink-400',
      bg: 'bg-pink-400/10',
      border: 'hover:border-pink-400/30',
      locked: isFree,
      badge: 'Scholar',
    },
    {
      icon: Target,
      label: 'Custom Quiz',
      desc: 'Build your own test by topic and difficulty',
      href: '/test-series',
      color: 'text-purple-400',
      bg: 'bg-purple-400/10',
      border: 'hover:border-purple-400/30',
      locked: isFree,
      badge: 'Scholar',
    },
    {
      icon: BrainCircuit,
      label: 'AI Tutor',
      desc: 'Clinical reasoning powered by AI',
      href: '/ai-tools',
      color: 'text-primary',
      bg: 'bg-primary/10',
      border: 'hover:border-primary/30',
      locked: !isPro,
      badge: 'Clinician',
    },
    {
      icon: Sparkles,
      label: 'AI Quiz Generator',
      desc: 'Auto-generate MCQs on any topic instantly',
      href: '/ai-tools/quiz',
      color: 'text-primary',
      bg: 'bg-primary/10',
      border: 'hover:border-primary/30',
      locked: !isPro,
      badge: 'Clinician',
    },
    {
      icon: Search,
      label: 'Smart Search',
      desc: 'Search across all subjects and questions',
      href: '/search',
      color: 'text-cyan-400',
      bg: 'bg-cyan-400/10',
      border: 'hover:border-cyan-400/30',
      locked: false,
      badge: 'Free',
    },
  ]

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6 animate-in fade-in duration-700">

      <div className="relative overflow-hidden rounded-3xl glass p-6 md:p-10">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 text-accent text-xs font-bold tracking-widest uppercase">
                <Flame className="h-3 w-3" /> Welcome Back, {firstName}
              </div>
              <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${planBg} ${planColor}`}>
                {isPro ? <Crown className="h-3 w-3" /> : isBasic ? <Star className="h-3 w-3" /> : <Zap className="h-3 w-3" />}
                {planLabel} Plan
              </div>
            </div>
            <h1 className="text-2xl md:text-4xl font-bold tracking-tight">
              Practice smarter, <span className="text-gradient italic">score higher</span>
            </h1>
            <p className="text-muted-foreground text-sm max-w-lg leading-relaxed">
              {totalQuestions > 0
                ? `${totalQuestions.toLocaleString()} questions · ${totalMindmaps} mindmaps · ${subjects.length} subjects ready.`
                : "Your complete NEET PG prep platform. Start practicing now."}
            </p>
          </div>
          {isFree && (
            <Link href="/pricing" className="shrink-0">
              <div className="glass border border-accent/20 rounded-2xl p-4 space-y-2 hover:border-accent/40 transition-all group max-w-xs">
                <p className="text-xs font-bold text-accent uppercase tracking-widest">Unlock More Features</p>
                <p className="text-xs text-muted-foreground">Upgrade to Scholar or Clinician to access PDF Notes, Custom Quiz, AI Tutor and more.</p>
                <div className="flex items-center gap-1 text-xs font-bold text-primary group-hover:gap-2 transition-all">
                  View Plans <ArrowRight className="h-3 w-3" />
                </div>
              </div>
            </Link>
          )}
        </div>
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-primary/10 to-transparent pointer-events-none" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Questions", value: subjectsLoading ? "..." : totalQuestions.toLocaleString(), icon: Database, color: "text-blue-400", bg: "bg-blue-400/10" },
          { label: "Mindmaps", value: subjectsLoading ? "..." : String(totalMindmaps), icon: Network, color: "text-accent", bg: "bg-accent/10" },
          { label: "Subjects", value: subjectsLoading ? "..." : String(subjects.length), icon: BookOpen, color: "text-purple-400", bg: "bg-purple-400/10" },
          { label: "Your Plan", value: planLabel, icon: isPro ? Crown : isBasic ? Star : Zap, color: planColor, bg: planBg },
        ].map((stat) => (
          <div key={stat.label} className="glass rounded-2xl p-4 flex items-center gap-3 hover:scale-[1.02] transition-transform">
            <div className={`p-2.5 rounded-xl ${stat.bg} ${stat.color} shrink-0`}>
              <stat.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{stat.label}</p>
              <p className="text-lg font-bold">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Everything in QubixPrep</h2>
          {isFree && (
            <Link href="/pricing" className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 transition-colors font-medium">
              Unlock all <ArrowRight className="h-3 w-3" />
            </Link>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {features.map((f) => (
            <Link key={f.label} href={f.locked ? '/pricing' : f.href}>
              <div className={`glass rounded-2xl p-4 border border-white/5 ${f.border} transition-all group h-full relative overflow-hidden ${f.locked ? 'opacity-70' : 'hover:bg-white/5'}`}>
                <div className="absolute top-3 right-3">
                  {f.locked ? (
                    <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-full px-2 py-0.5 text-[9px] font-bold text-muted-foreground uppercase">
                      <Lock className="h-2.5 w-2.5" /> {f.badge}
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 bg-green-500/10 border border-green-500/20 rounded-full px-2 py-0.5 text-[9px] font-bold text-green-400 uppercase">
                      <CheckCircle2 className="h-2.5 w-2.5" /> {f.badge}
                    </div>
                  )}
                </div>
                <div className="flex items-start gap-3 pr-16">
                  <div className={`p-2.5 rounded-xl ${f.bg} ${f.color} shrink-0 group-hover:scale-110 transition-transform`}>
                    <f.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm transition-colors">{f.label}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{f.desc}</p>
                  </div>
                </div>
                {f.locked && (
                  <div className="mt-3 ml-0.5">
                    <span className="text-[10px] text-primary font-semibold">Upgrade to {f.badge} →</span>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('qbank')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'qbank' ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'glass text-muted-foreground hover:text-white'}`}
          >
            <Database className="h-4 w-4" /> QBank
          </button>
          <button
            onClick={() => setActiveTab('mindmaps')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'mindmaps' ? 'bg-accent text-white shadow-lg shadow-accent/30' : 'glass text-muted-foreground hover:text-white'}`}
          >
            <Network className="h-4 w-4" /> Mindmaps
          </button>
          <Link href={activeTab === 'qbank' ? '/qbank' : '/mindmaps'} className="ml-auto text-xs text-muted-foreground hover:text-white flex items-center gap-1 transition-colors">
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {subjectsLoading ? (
          <div className="h-40 flex items-center justify-center">
            <Loader2 className="h-6 w-6 text-primary animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {(activeTab === 'qbank' ? topQBankSubjects : topMindmapSubjects).map((subject: any) => {
              const Icon = ICON_MAP[subject.name] || (activeTab === 'qbank' ? Database : Network)
              const count = activeTab === 'qbank' ? (subject.questionCount || 0) + ' Qs' : (subject.mindmapCount || 0) + ' maps'
              const href = activeTab === 'qbank' ? `/qbank/${subject.id}` : `/mindmaps/${subject.id}`
              const iconColor = activeTab === 'qbank' ? 'text-blue-400 bg-blue-400/10 group-hover:bg-blue-400/20' : 'text-accent bg-accent/10 group-hover:bg-accent/20'
              const borderHover = activeTab === 'qbank' ? 'hover:border-blue-400/20' : 'hover:border-accent/20'
              return (
                <Link key={subject.id} href={href}>
                  <div className={`glass rounded-2xl p-4 flex flex-col items-center text-center gap-3 border border-white/5 ${borderHover} transition-all group h-full cursor-pointer hover:bg-white/5`}>
                    <div className={`p-3 rounded-xl ${iconColor} transition-colors`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-xs leading-tight">{subject.name}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">{count}</p>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {isFree && (
        <div className="relative overflow-hidden rounded-3xl glass border border-primary/20 p-6 md:p-8">
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="font-bold text-lg">Ready to go deeper?</p>
              <p className="text-sm text-muted-foreground">Unlock PDF Notes, Custom Quiz, AI Tutor and unlimited access with Scholar or Clinician plan.</p>
            </div>
            <Link href="/pricing" className="shrink-0">
              <Button className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/30 gap-2 rounded-xl">
                <Crown className="h-4 w-4" /> View Plans
              </Button>
            </Link>
          </div>
          <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary/10 to-transparent pointer-events-none" />
        </div>
      )}

    </div>
  )
}
