"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useUser, useCollection, useFirestore } from "@/firebase"
import { doc, getDoc, collection } from "firebase/firestore"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  ArrowRight, BrainCircuit, Loader2, Database, Network,
  Trophy, ChevronRight, Brain, HeartPulse, TestTube,
  Stethoscope, Microscope, BookOpen, Target, Flame,
} from "lucide-react"
import Link from "next/link"

const ICON_MAP: Record<string, any> = {
  "Anatomy": Brain, "Physiology": HeartPulse, "Biochemistry": TestTube,
  "Pathology": Stethoscope, "Microbiology": Microscope, "Pharmacology": BookOpen,
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
  const [checkingRole, setCheckingRole] = useState(true)
  const [subjects, setSubjects] = useState<any[]>([])
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

  if (loading || checkingRole) {
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

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 lg:p-12 space-y-8 animate-in fade-in duration-700">

      <div className="relative overflow-hidden rounded-3xl glass p-8 md:p-12">
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 text-accent text-xs font-bold tracking-widest uppercase">
            <Flame className="h-3 w-3" /> Welcome Back, {firstName}
          </div>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight">
            Practice smarter, <span className="text-gradient italic">score higher</span>
          </h1>
          <p className="text-muted-foreground text-sm md:text-lg max-w-lg leading-relaxed">
            {totalQuestions > 0
              ? `${totalQuestions.toLocaleString()} questions and ${totalMindmaps} mindmaps ready for your NEET PG prep.`
              : "Your QBank and mindmaps are ready. Start practicing now."}
          </p>
          <div className="flex flex-wrap gap-4 pt-4">
            <Button size="lg" asChild className="w-full md:w-auto rounded-xl bg-primary hover:bg-primary/90 shadow-xl shadow-primary/30 gap-2">
              <Link href="/qbank"><Database className="h-4 w-4" /> Go to QBank</Link>
            </Button>
            <Button variant="outline" size="lg" asChild className="w-full md:w-auto rounded-xl glass border-white/10 hover:bg-white/5 gap-2">
              <Link href="/mindmaps"><Network className="h-4 w-4" /> Browse Mindmaps</Link>
            </Button>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-primary/20 to-transparent pointer-events-none" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Questions", value: subjectsLoading ? "..." : totalQuestions.toLocaleString(), icon: Database, color: "text-blue-400" },
          { label: "Mindmaps", value: subjectsLoading ? "..." : String(totalMindmaps), icon: Network, color: "text-accent" },
          { label: "Subjects", value: subjectsLoading ? "..." : String(subjects.length), icon: BookOpen, color: "text-purple-400" },
          { label: "PYQ Series", value: "NEET PG", icon: Trophy, color: "text-yellow-400" },
        ].map((stat) => (
          <Card key={stat.label} className="glass border-none shadow-none neumorph-inset hover:scale-[1.02] transition-transform cursor-default">
            <CardContent className="p-4 md:p-6 flex items-center gap-4">
              <div className={"p-2 md:p-3 rounded-2xl bg-white/5 " + stat.color}>
                <stat.icon className="h-5 w-5 md:h-6 md:w-6" />
              </div>
              <div>
                <p className="text-[10px] md:text-xs text-muted-foreground uppercase tracking-widest">{stat.label}</p>
                <p className="text-lg md:text-2xl font-bold">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold">Question Bank</h2>
          </div>
          <Link href="/qbank" className="text-xs text-muted-foreground hover:text-accent flex items-center gap-1 transition-colors">
            All Subjects <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        {subjectsLoading ? (
          <div className="h-40 flex items-center justify-center">
            <Loader2 className="h-6 w-6 text-primary animate-spin" />
          </div>
        ) : topQBankSubjects.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {topQBankSubjects.map((subject: any) => {
              const Icon = ICON_MAP[subject.name] || Database
              return (
                <Link key={subject.id} href={`/qbank/${subject.id}`}>
                  <div className="glass rounded-2xl p-4 flex flex-col items-center text-center gap-3 hover:bg-white/10 hover:border-primary/20 border border-white/5 transition-all group h-full cursor-pointer">
                    <div className="p-3 rounded-xl bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="font-semibold text-xs group-hover:text-primary transition-colors leading-tight">{subject.name}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">{subject.questionCount || 0} Qs</p>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground glass rounded-2xl">
            <Database className="h-8 w-8 mx-auto mb-2 opacity-20" />
            <p className="text-sm">No QBanks yet. Add subjects in the Admin Panel.</p>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Network className="h-5 w-5 text-accent" />
            <h2 className="text-xl font-bold">Visual Mindmaps</h2>
          </div>
          <Link href="/mindmaps" className="text-xs text-muted-foreground hover:text-accent flex items-center gap-1 transition-colors">
            All Mindmaps <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        {subjectsLoading ? (
          <div className="h-40 flex items-center justify-center">
            <Loader2 className="h-6 w-6 text-primary animate-spin" />
          </div>
        ) : topMindmapSubjects.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {topMindmapSubjects.map((subject: any) => {
              const Icon = ICON_MAP[subject.name] || Network
              return (
                <Link key={subject.id} href={`/mindmaps/${subject.id}`}>
                  <div className="glass rounded-2xl p-4 flex flex-col items-center text-center gap-3 hover:bg-white/10 hover:border-accent/20 border border-white/5 transition-all group h-full cursor-pointer">
                    <div className="p-3 rounded-xl bg-accent/10 text-accent group-hover:bg-accent/20 transition-colors">
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="font-semibold text-xs group-hover:text-accent transition-colors leading-tight">{subject.name}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">{subject.mindmapCount || 0} maps</p>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground glass rounded-2xl">
            <Network className="h-8 w-8 mx-auto mb-2 opacity-20" />
            <p className="text-sm">No mindmaps yet. Add them in the Admin Panel.</p>
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Link href="/pyq">
          <Card className="glass border-none group cursor-pointer hover:bg-white/5 transition-all overflow-hidden relative h-full">
            <div className="absolute top-0 left-0 w-1 h-full bg-yellow-400" />
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-yellow-400/10 text-yellow-400"><Trophy className="h-6 w-6" /></div>
              <div className="flex-1"><p className="font-bold">PYQ Series</p><p className="text-xs text-muted-foreground">NEET PG · INICET · USMLE</p></div>
              <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </CardContent>
          </Card>
        </Link>
        <Link href="/test-series">
          <Card className="glass border-none group cursor-pointer hover:bg-white/5 transition-all overflow-hidden relative h-full">
            <div className="absolute top-0 left-0 w-1 h-full bg-purple-400" />
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-purple-400/10 text-purple-400"><Target className="h-6 w-6" /></div>
              <div className="flex-1"><p className="font-bold">Custom Test</p><p className="text-xs text-muted-foreground">AI-powered test series</p></div>
              <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </CardContent>
          </Card>
        </Link>
        <Link href="/ai-tools">
          <Card className="glass border-none group cursor-pointer hover:bg-white/5 transition-all overflow-hidden relative h-full">
            <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/10 text-primary"><BrainCircuit className="h-6 w-6" /></div>
              <div className="flex-1"><p className="font-bold">AI Tools</p><p className="text-xs text-muted-foreground">Quiz simulator · Summarizer</p></div>
              <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </CardContent>
          </Card>
        </Link>
      </div>

    </div>
  )
}
