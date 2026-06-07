
"use client"

import { useMemo, use } from "react"
import { useDoc, useCollection, useFirestore } from "@/firebase"
import { doc, collection, query, orderBy, where } from "firebase/firestore"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronRight, PlayCircle, Loader2, Video, Clock } from "lucide-react"
import Link from "next/link"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

export default function SubjectVideoCurriculumPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: subjectId } = use(params)
  
  const db = useFirestore()

  const subjectRef = useMemo(() => (!db ? null : doc(db, 'subjects', subjectId)), [db, subjectId])
  const { data: subject, loading: subjectLoading } = useDoc(subjectRef)

  const topicsRef = useMemo(() => (!db ? null : collection(db, 'subjects', subjectId, 'topics')), [db, subjectId])
  const videoQuery = useMemo(() => (!topicsRef ? null : query(topicsRef, where('contentType', '==', 'video'), orderBy('createdAt', 'desc'))), [topicsRef])
  const { data: videoTopics, loading: topicsLoading } = useCollection(videoQuery)

  const groupedVideos = useMemo(() => {
    const groups: Record<string, any[]> = {}
    videoTopics?.forEach(topic => {
      const unit = topic.unitName || "General Curriculum"
      if (!groups[unit]) groups[unit] = []
      groups[unit].push(topic)
    })
    return Object.entries(groups)
  }, [videoTopics])

  if (subjectLoading) return <div className="h-screen flex items-center justify-center"><Loader2 className="h-10 w-10 text-primary animate-spin" /></div>

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-12 space-y-12 animate-in slide-in-from-right-4 duration-700">
      <div className="glass rounded-3xl p-8 md:p-12 border-secondary/20 bg-gradient-to-br from-secondary/5 to-transparent">
        <Link href="/videos" className="text-xs font-bold uppercase tracking-widest text-secondary flex items-center gap-1 mb-4 hover:underline">
          <ChevronRight className="h-3 w-3 rotate-180" /> Back to Lectures
        </Link>
        <h1 className="text-5xl font-bold tracking-tighter capitalize">{(subject as any)?.name} Video Curriculum</h1>
        <p className="text-muted-foreground text-lg mt-4 max-w-2xl">
          Visual learning path designed specifically for MBBS students and board preparation.
        </p>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-xl font-bold">Units & Lectures</h2>
          <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase">
             <Clock className="h-4 w-4" /> Curriculum Session
          </div>
        </div>

        {topicsLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-secondary" />
          </div>
        ) : (
          <div className="space-y-4">
            {groupedVideos.length > 0 ? (
              <Accordion type="multiple" defaultValue={groupedVideos.map(([u]) => u)}>
                {groupedVideos.map(([unitName, topics]) => (
                  <AccordionItem key={unitName} value={unitName} className="border-none glass rounded-3xl px-6 mb-4 overflow-hidden">
                    <AccordionTrigger className="hover:no-underline py-6">
                      <div className="flex flex-col items-start text-left">
                        <span className="text-[10px] text-secondary font-bold uppercase tracking-widest mb-1">Unit Focus</span>
                        <span className="text-2xl font-bold">{unitName}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-6 pt-2 space-y-3">
                      {topics.map((topic: any) => (
                        <Link key={topic.id} href={`/notes/${subjectId}/${topic.id}`}>
                          <div className="group flex items-center justify-between p-5 rounded-2xl bg-white/5 border border-white/5 hover:border-secondary/50 hover:bg-secondary/5 transition-all cursor-pointer">
                            <div className="flex items-center gap-6">
                              <div className="p-3 rounded-xl bg-secondary/10 text-secondary group-hover:bg-secondary group-hover:text-white transition-colors">
                                <PlayCircle className="h-6 w-6" />
                              </div>
                              <div>
                                <h4 className="font-bold text-lg group-hover:text-secondary transition-colors">{topic.title}</h4>
                                <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                                  <span className={`px-2 py-0.5 rounded uppercase text-[10px] font-bold ${topic.importance === 'High' || topic.importance === 'Essential' ? 'bg-red-500/10 text-red-400' : 'bg-blue-500/10 text-blue-400'}`}>
                                    {topic.importance} Yield
                                  </span>
                                  <span className="text-[9px] uppercase tracking-tighter">HD Educational Content</span>
                                </div>
                              </div>
                            </div>
                            <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-all" />
                          </div>
                        </Link>
                      ))}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            ) : (
              <div className="text-center py-20 text-muted-foreground border-2 border-dashed border-white/5 rounded-3xl">
                <Video className="h-12 w-12 mx-auto mb-4 opacity-10" />
                <p>No video lectures available for this subject yet.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
