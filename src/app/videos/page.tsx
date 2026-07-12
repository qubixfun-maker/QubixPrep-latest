
"use client"

import { useMemo } from "react"
import { useCollection, useFirestore } from "@/firebase"
import { collection } from "firebase/firestore"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Video, Brain, HeartPulse, TestTube, Stethoscope, Microscope, BookOpen, ChevronRight, Search, Loader2, PlayCircle } from "lucide-react"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { useRequireAuth } from "@/hooks/use-require-auth"

const ICON_MAP: Record<string, any> = {
  "Brain": Brain,
  "HeartPulse": HeartPulse,
  "TestTube": TestTube,
  "Stethoscope": Stethoscope,
  "Microscope": Microscope,
  "BookOpen": BookOpen,
  "Anatomy": Brain,
  "Physiology": HeartPulse,
  "Biochemistry": TestTube,
  "Pathology": Stethoscope,
  "Microbiology": Microscope,
  "Pharmacology": BookOpen
}

export default function VideoLibraryPage() {
  const db = useFirestore()
  
  const subjectsQuery = useMemo(() => {
    if (!db) return null
    return collection(db, 'subjects')
  }, [db])
  
  const { data: subjects, loading } = useCollection(subjectsQuery)

  const { checkingAuth } = useRequireAuth()
  if (checkingAuth) return <div className="h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 text-primary animate-spin" /></div>

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-12 space-y-8 animate-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">Video Curriculum</h1>
          <p className="text-muted-foreground text-lg">Master complex medical concepts through structured visual lectures.</p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search lectures..." 
            className="pl-10 rounded-xl glass border-white/10"
          />
        </div>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <Loader2 className="h-10 w-10 text-primary animate-spin" />
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subjects?.map((subject: any) => {
            const Icon = ICON_MAP[subject.iconName] || ICON_MAP[subject.name] || Brain
            return (
              <Link key={subject.id} href={`/videos/${subject.id}`}>
                <Card className="glass border-none group cursor-pointer hover:bg-white/5 transition-all duration-300 relative overflow-hidden h-64 flex flex-col">
                  <div className="absolute top-0 left-0 w-1 h-full bg-secondary" />
                  <CardHeader className="flex flex-row items-start justify-between space-y-0 p-8">
                    <div className="p-4 rounded-2xl bg-secondary/10 text-secondary">
                      <Icon className="h-8 w-8" />
                    </div>
                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-secondary group-hover:text-white transition-all">
                      <PlayCircle className="h-6 w-6" />
                    </div>
                  </CardHeader>
                  <CardContent className="px-8 pb-8 space-y-4 flex-1">
                    <div>
                      <CardTitle className="text-2xl font-bold mb-2">{subject.name}</CardTitle>
                      <CardDescription className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                        Curriculum-based video lectures for {subject.name}.
                      </CardDescription>
                    </div>
                    <div className="mt-auto">
                      <div className="px-3 py-1 w-fit rounded-lg bg-white/5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        Structured Lectures
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
          {!loading && (!subjects || subjects.length === 0) && (
            <div className="col-span-full py-20 text-center text-muted-foreground glass rounded-3xl">
              <Video className="h-12 w-12 mx-auto mb-4 opacity-10" />
              <p>No video content available. Add subjects in the Admin Panel.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
