"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useUser, useCollection, useFirestore } from "@/firebase"
import { doc, getDoc, collection } from "firebase/firestore"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Stethoscope,
  Play, 
  ArrowRight, 
  Zap, 
  BrainCircuit,
  Bookmark,
  Loader2,
  BookOpen,
  Database,
  Video,
  Network,
  Trophy
} from "lucide-react"
import Link from "next/link"

export default function Dashboard() {
  const { user, loading } = useUser()
  const db = useFirestore()
  const router = useRouter()
  const [checkingRole, setCheckingRole] = useState(true)

  const subjectsQuery = useMemo(() => db ? collection(db, 'subjects') : null, [db])
  const videosQuery = useMemo(() => db ? collection(db, 'videos') : null, [db])
  const mindmapsQuery = useMemo(() => db ? collection(db, 'mindmaps') : null, [db])

  const { data: subjects, loading: subjectsLoading } = useCollection(subjectsQuery)
  const { data: videos } = useCollection(videosQuery)
  const { data: mindmaps } = useCollection(mindmapsQuery)

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
  const subjectCount = subjects?.length ?? 0
  const videoCount = videos?.length ?? 0
  const mindmapCount = mindmaps?.length ?? 0

  const stats = [
    { label: "Subjects", value: subjectsLoading ? "..." : String(subjectCount), icon: BookOpen, color: "text-blue-400" },
    // { label: "Video Lectures", value: String(videoCount), icon: Video, color: "text-purple-400" },
    { label: "Mindmaps", value: String(mindmapCount), icon: Network, color: "text-green-400" },
    { label: "AI Tools", value: "3", icon: BrainCircuit, color: "text-accent" },
  ]

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 lg:p-12 space-y-8 animate-in fade-in duration-700">

      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl glass p-8 md:p-12">
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 text-accent text-xs font-bold tracking-widest uppercase">
            <Zap className="h-3 w-3" /> Welcome Back, {firstName}
          </div>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight">
            Your medical prep <span className="text-gradient italic">command center</span>
          </h1>
          <p className="text-muted-foreground text-sm md:text-lg max-w-lg leading-relaxed">
            {subjectCount > 0
              ? subjectCount + " subject" + (subjectCount > 1 ? "s" : "") + " available. Pick up where you left off."
              : "Start exploring notes, QBanks, videos, and AI tools built for NEET-PG."}
          </p>
          <div className="flex flex-wrap gap-4 pt-4">
            <Button size="lg" asChild className="w-full md:w-auto rounded-xl bg-primary hover:bg-primary/90 shadow-xl shadow-primary/30 gap-2">
              <Link href="/qbank"><Play className="h-4 w-4 fill-current" /> QBank Practice</Link>
            </Button>
            <Button variant="outline" size="lg" asChild className="w-full md:w-auto rounded-xl glass border-white/10 hover:bg-white/5 gap-2">
              <Link href="/ai-tools"><BrainCircuit className="h-4 w-4" /> AI Tools</Link>
            </Button>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-primary/20 to-transparent pointer-events-none" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
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

      {/* Subjects + Quick Access */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="glass border-none lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" /> Subjects
            </CardTitle>
            <Link href="/qbank" className="text-xs text-muted-foreground hover:text-accent flex items-center gap-1">
              All Subjects <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent>
            {subjectsLoading ? (
              <div className="flex items-center justify-center h-24">
                <Loader2 className="h-6 w-6 text-primary animate-spin" />
              </div>
            ) : subjects && subjects.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {subjects.slice(0, 6).map((subject: any) => (
                  <Link key={subject.id} href={"/qbank/" + subject.id}>
                    <div className="p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-primary/20 transition-all group">
                      <p className="font-semibold text-sm group-hover:text-primary transition-colors">{subject.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">{subject.topicCount || 0} topics</p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-20" />
                <p className="text-sm">No subjects yet. Add them from the Admin Panel.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="glass border-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <Zap className="h-5 w-5 text-accent" /> Quick Access
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: "QBank", desc: "Practice MCQs", href: "/qbank", icon: Database, color: "text-blue-400" },
              { label: "PYQ Series", desc: "Previous year questions", href: "/pyq", icon: Trophy, color: "text-yellow-400" },
              { label: "Custom Quiz", desc: "AI-powered test", href: "/test-series", icon: BrainCircuit, color: "text-purple-400" },
              // { label: "Video Lectures", desc: videoCount + " videos available", href: "/videos", icon: Video, color: "text-green-400" },
              { label: "Mindmaps", desc: mindmapCount + " mindmaps", href: "/mindmaps", icon: Network, color: "text-accent" },
              { label: "Clinical Cases", desc: "Solve real patient scenarios", href: "/cases", icon: Stethoscope, color: "text-red-400" },
            ].map((item) => (
              <Link key={item.label} href={item.href}>
                <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-all group cursor-pointer">
                  <div className={"p-2 rounded-lg bg-white/5 " + item.color}>
                    <item.icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm group-hover:text-primary transition-colors">{item.label}</p>
                    <p className="text-xs text-muted-foreground truncate">{item.desc}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-accent transition-colors shrink-0" />
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* AI Banner */}
      <Card className="glass border-none overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-accent/5 to-transparent pointer-events-none" />
        <CardContent className="p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-accent text-xs font-bold uppercase tracking-widest">
              <BrainCircuit className="h-4 w-4" /> AI-Powered
            </div>
            <h3 className="text-xl md:text-2xl font-bold">Supercharge your prep with AI</h3>
            <p className="text-muted-foreground text-sm max-w-md">Summarize notes, generate mindmaps, and get personalised quiz analysis — all powered by Groq.</p>
          </div>
          <div className="flex flex-wrap gap-3 shrink-0">
            <Button asChild variant="outline" className="glass border-white/10 rounded-xl gap-2">
              <Link href="/ai-tools/summarizer"><Bookmark className="h-4 w-4" /> Summarizer</Link>
            </Button>
            <Button asChild className="bg-primary rounded-xl gap-2">
              <Link href="/ai-tools/quiz"><Play className="h-4 w-4 fill-current" /> AI Quiz</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

    </div>
  )
}
