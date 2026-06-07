
"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useUser, useFirestore } from "@/firebase"
import { doc, getDoc } from "firebase/firestore"
import { StudyHeatMap } from "@/components/dashboard/heat-map"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Play, 
  ArrowRight, 
  Trophy, 
  Flame, 
  Zap, 
  Clock, 
  BrainCircuit,
  Bookmark,
  History,
  Loader2
} from "lucide-react"
import Link from "next/link"

export default function Dashboard() {
  const { user, loading } = useUser()
  const db = useFirestore()
  const router = useRouter()
  const [checkingRole, setCheckingRole] = useState(true)

  useEffect(() => {
    async function checkUserRole() {
      if (!loading) {
        if (!user) {
          router.push("/signup")
        } else if (db) {
          const userRef = doc(db, 'users', user.uid)
          const docSnap = await getDoc(userRef)
          if (docSnap.exists() && (docSnap.data() as any).role === 'admin') {
            router.push("/admin")
          } else {
            setCheckingRole(false)
          }
        }
      }
    }
    checkUserRole()
  }, [user, loading, router, db])

  if (loading || checkingRole) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
      </div>
    )
  }

  if (!user) return null

  const stats = [
    { label: "Study Streak", value: "14 Days", icon: Flame, color: "text-orange-500" },
    { label: "XP Points", value: "1,240", icon: Zap, color: "text-yellow-500" },
    { label: "Hours Learned", value: "48.5h", icon: Clock, color: "text-blue-500" },
    { label: "Ranking", value: "#42", icon: Trophy, color: "text-purple-500" },
  ];

  const recentNotes = [
    { title: "Neuroanatomy - Cerebrum", subject: "Anatomy", progress: 65 },
    { title: "Cardiac Pharmacology", subject: "Pharmacology", progress: 30 },
    { title: "Endocrine Pathology", subject: "Pathology", progress: 85 },
  ];

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 lg:p-12 space-y-8 animate-in fade-in duration-700">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl glass p-8 md:p-12">
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 text-accent text-xs font-bold tracking-widest uppercase">
            <Zap className="h-3 w-3" /> Welcome Back, {user.displayName?.split(' ')[0] || 'Doctor'}
          </div>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight">
            Ready to master <span className="text-gradient underline decoration-accent/30 underline-offset-8 italic">Neuroanatomy</span> today?
          </h1>
          <p className="text-muted-foreground text-sm md:text-lg max-w-lg leading-relaxed">
            Your daily goal is 75% complete. Finish your quiz on Cranial Nerves to keep your streak alive.
          </p>
          <div className="flex flex-wrap gap-4 pt-4">
            <Button size="lg" className="w-full md:w-auto rounded-xl bg-primary hover:bg-primary/90 shadow-xl shadow-primary/30 gap-2">
              <Play className="h-4 w-4 fill-current" /> Continue Studying
            </Button>
            <Button variant="outline" size="lg" className="w-full md:w-auto rounded-xl glass border-white/10 hover:bg-white/5 gap-2">
              <BrainCircuit className="h-4 w-4" /> AI Recommendations
            </Button>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-primary/20 to-transparent pointer-events-none" />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="glass border-none shadow-none neumorph-inset hover:scale-[1.02] transition-transform cursor-default">
            <CardContent className="p-4 md:p-6 flex items-center gap-4">
              <div className={`p-2 md:p-3 rounded-2xl bg-white/5 ${stat.color}`}>
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

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card className="glass border-none">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <History className="h-5 w-5 text-primary" /> Learning Consistency
              </CardTitle>
              <Link href="/history" className="text-xs text-muted-foreground hover:text-accent flex items-center gap-1">
                Full Report <ArrowRight className="h-3 w-3" />
              </Link>
            </CardHeader>
            <CardContent className="pt-4 overflow-hidden">
              <StudyHeatMap />
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
            <Card className="glass border-none relative overflow-hidden group">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Play className="h-4 w-4 text-accent" /> Resume Lecture
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="aspect-video rounded-xl overflow-hidden relative">
                  <img 
                    src="https://picsum.photos/seed/med1/600/400" 
                    alt="Video Lecture" 
                    className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500"
                    data-ai-hint="medical lecture"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-accent text-background flex items-center justify-center shadow-2xl scale-0 group-hover:scale-100 transition-transform duration-300">
                      <Play className="h-6 w-6 fill-current ml-1" />
                    </div>
                  </div>
                </div>
                <div className="mt-3">
                  <p className="font-semibold truncate">Pharmacokinetics Masterclass</p>
                  <p className="text-xs text-muted-foreground">Unit 2: Absorption & Distribution</p>
                </div>
              </CardContent>
            </Card>

            <Card className="glass border-none">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BrainCircuit className="h-4 w-4 text-primary" /> Recommended Quiz
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-2">
                  <p className="font-semibold text-sm md:text-base">Cardiology Flashcards</p>
                  <p className="text-[10px] md:text-xs text-muted-foreground">Based on your recent study session on ECG interpretation.</p>
                  <Button size="sm" variant="secondary" className="w-full rounded-lg mt-2">Start Quiz</Button>
                </div>
                <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-2 opacity-50">
                  <p className="font-semibold text-sm md:text-base">Microbiology MCQ Set</p>
                  <p className="text-[10px] md:text-xs text-muted-foreground">Bacterial Cell Wall Synthesis inhibitors.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="space-y-8">
          <Card className="glass border-none h-full">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Bookmark className="h-5 w-5 text-accent" /> Recent Notes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {recentNotes.map((note) => (
                <div key={note.title} className="group cursor-pointer">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-semibold text-sm md:text-base group-hover:text-primary transition-colors">{note.title}</p>
                      <p className="text-[10px] md:text-xs text-muted-foreground">{note.subject}</p>
                    </div>
                    <span className="text-[10px] md:text-xs font-mono text-accent">{note.progress}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full transition-all duration-1000" 
                      style={{ width: `${note.progress}%` }} 
                    />
                  </div>
                </div>
              ))}
              <Button variant="outline" className="w-full glass border-white/10 mt-4 rounded-xl">
                Browse All Notes
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
