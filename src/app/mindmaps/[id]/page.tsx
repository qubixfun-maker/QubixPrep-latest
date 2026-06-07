
"use client"

import { useMemo, use } from "react"
import { useDoc, useCollection, useFirestore } from "@/firebase"
import { doc, collection, query, orderBy } from "firebase/firestore"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronRight, Network, Loader2, Image as ImageIcon } from "lucide-react"
import Link from "next/link"

export default function MindmapSubjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: subjectId } = use(params)
  const db = useFirestore()

  const subjectRef = useMemo(() => doc(db, 'subjects', subjectId), [db, subjectId])
  const { data: subject, loading: subjectLoading } = useDoc(subjectRef)

  const mmRef = useMemo(() => collection(db, 'subjects', subjectId, 'mindmaps'), [db, subjectId])
  const mmQuery = useMemo(() => query(mmRef, orderBy('createdAt', 'desc')), [mmRef])
  const { data: mindmaps, loading: mindmapsLoading } = useCollection(mmQuery)

  if (subjectLoading) return <div className="h-screen flex items-center justify-center"><Loader2 className="h-10 w-10 text-primary animate-spin" /></div>

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-12 space-y-12 animate-in slide-in-from-right-4 duration-700">
      <div className="glass rounded-3xl p-8 md:p-12 border-accent/20">
        <Link href="/mindmaps" className="text-xs font-bold uppercase tracking-widest text-accent flex items-center gap-1 mb-4 hover:underline">
          <ChevronRight className="h-3 w-3 rotate-180" /> Back to Mindmaps
        </Link>
        <h1 className="text-5xl font-bold tracking-tighter capitalize">{(subject as any).name} Mindmaps</h1>
        <p className="text-muted-foreground text-lg mt-4">Visual summaries and logical flows for better retention.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {mindmapsLoading ? <Loader2 className="animate-spin" /> : mindmaps?.map((mm: any) => (
          <Link key={mm.id} href={`/mindmaps/${subjectId}/${mm.id}`}>
            <Card className="glass border-none hover:bg-white/5 transition-all group overflow-hidden h-48">
              <CardContent className="p-0 h-full relative">
                <img src={mm.imageUrl} alt={mm.title} className="w-full h-full object-cover opacity-30 group-hover:opacity-50 transition-opacity" />
                <div className="absolute inset-0 p-6 flex flex-col justify-end bg-gradient-to-t from-black/80 to-transparent">
                  <h4 className="font-bold text-xl">{mm.title}</h4>
                  <span className="text-xs text-muted-foreground uppercase tracking-widest">{mm.unitName}</span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
