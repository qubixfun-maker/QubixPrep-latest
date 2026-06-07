
"use client"

import { useMemo } from "react"
import { useDoc, useCollection, useFirestore } from "@/firebase"
import { doc, collection, query, orderBy } from "firebase/firestore"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { CheckCircle2, Circle, Clock, ChevronRight, Share2, Bookmark, LayoutList, Loader2, FileText } from "lucide-react"
import Link from "next/link"

export default function SubjectDetailPage({ params }: { params: { id: string } }) {
  const db = useFirestore()
  const subjectId = params.id

  const subjectRef = useMemo(() => doc(db, 'subjects', subjectId), [db, subjectId])
  const { data: subject, loading: subjectLoading } = useDoc(subjectRef)

  const topicsRef = useMemo(() => collection(db, 'subjects', subjectId, 'topics'), [db, subjectId])
  const topicsQuery = useMemo(() => query(topicsRef, orderBy('createdAt', 'desc')), [topicsRef])
  const { data: topics, loading: topicsLoading } = useCollection(topicsQuery)

  if (subjectLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
      </div>
    )
  }

  if (!subject) {
    return (
      <div className="h-screen flex flex-col items-center justify-center space-y-4">
        <h1 className="text-2xl font-bold">Subject Not Found</h1>
        <Link href="/notes">
          <Button variant="outline">Back to Library</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-12 space-y-12 animate-in slide-in-from-right-4 duration-700">
      <div className="relative overflow-hidden rounded-3xl glass p-8 md:p-12 border-primary/20">
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-4 max-w-xl">
            <Link href="/notes" className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-1 hover:text-accent transition-colors">
              <ChevronRight className="h-3 w-3 rotate-180" /> Back to Library
            </Link>
            <h1 className="text-5xl font-bold tracking-tighter capitalize">{(subject as any).name}</h1>
            <p className="text-muted-foreground text-lg leading-relaxed">
              {(subject as any).description || "Master the core concepts through high-quality illustrations and clinician-curated notes."}
            </p>
            <div className="flex items-center gap-6 pt-2">
              <div className="flex items-center gap-2">
                <LayoutList className="h-4 w-4 text-accent" />
                <span className="text-sm font-bold">{(subject as any).topicCount || 0} Topics</span>
              </div>
            </div>
          </div>
          <div className="w-full md:w-64 space-y-3 glass-darker p-6 rounded-2xl border-white/5">
            <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest text-muted-foreground">
              <span>Study Progress</span>
              <span className="text-accent">0%</span>
            </div>
            <Progress value={0} className="h-2 bg-white/5" />
            <p className="text-[10px] text-muted-foreground italic text-center">Start your first topic today!</p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-xl font-bold">Curriculum Topics</h2>
          <Button variant="ghost" size="sm" className="text-muted-foreground gap-2">
            <Share2 className="h-4 w-4" /> Share Subject
          </Button>
        </div>

        {topicsLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-3">
            {topics?.map((topic: any) => (
              <Link key={topic.id} href={`/notes/${subjectId}/${topic.id}`}>
                <div className="glass group p-6 rounded-2xl border-white/5 hover:border-primary/50 transition-all flex items-center justify-between cursor-pointer mb-3">
                  <div className="flex items-center gap-6">
                    <div className="p-3 rounded-full bg-primary/10 text-primary">
                      <FileText className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg group-hover:text-primary transition-colors">{topic.title}</h4>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                        <span className="flex items-center gap-1 uppercase tracking-tighter">{topic.unitName || 'General'}</span>
                        <span className={`px-2 py-0.5 rounded uppercase text-[10px] font-bold ${topic.importance === 'High' || topic.importance === 'Essential' ? 'bg-red-500/10 text-red-400' : 'bg-blue-500/10 text-blue-400'}`}>
                          {topic.importance}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-white/5 text-[10px] uppercase font-bold text-muted-foreground">
                          {topic.contentType}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="group-hover:translate-x-1 transition-transform">
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </div>
              </Link>
            ))}
            {(!topics || topics.length === 0) && (
              <div className="text-center py-20 text-muted-foreground border-2 border-dashed border-white/5 rounded-3xl">
                No topics uploaded for this subject yet.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
