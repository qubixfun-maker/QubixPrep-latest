"use client"

import { useMemo, use } from "react"
import { useDoc, useCollection, useFirestore } from "@/firebase"
import { doc, collection, query, orderBy } from "firebase/firestore"
import { ChevronRight, ChevronLeft, Loader2, Network } from "lucide-react"
import Link from "next/link"

export default function MindmapSubjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: subjectId } = use(params)

  const db = useFirestore()

  const subjectRef = useMemo(() => (!db ? null : doc(db, 'subjects', subjectId)), [db, subjectId])
  const { data: subject, loading: subjectLoading } = useDoc(subjectRef)

  const mmRef = useMemo(() => (!db ? null : collection(db, 'subjects', subjectId, 'mindmaps')), [db, subjectId])
  const mmQuery = useMemo(() => (!mmRef ? null : query(mmRef, orderBy('createdAt', 'desc'))), [mmRef])
  const { data: mindmaps, loading: mindmapsLoading } = useCollection(mmQuery)

  if (subjectLoading) return <div className="h-screen flex items-center justify-center"><Loader2 className="h-10 w-10 text-primary animate-spin" /></div>

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-12 space-y-8 animate-in slide-in-from-right-4 duration-700">
      <div>
        <Link href="/mindmaps" className="text-xs font-bold uppercase tracking-widest text-accent flex items-center gap-1 mb-4 hover:underline w-fit">
          <ChevronLeft className="h-3 w-3" /> Back to Mindmaps
        </Link>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight capitalize">{subject ? (subject as any).name : 'Subject'} Mindmaps</h1>
        <p className="text-muted-foreground mt-2">Tap a topic to view its mindmap.</p>
      </div>

      <div className="rounded-2xl glass border-none divide-y divide-white/5 overflow-hidden">
        {mindmapsLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : mindmaps && mindmaps.length > 0 ? (
          mindmaps.map((mm: any) => (
            <Link key={mm.id} href={`/mindmaps/${subjectId}/${mm.id}`}>
              <div className="flex items-center gap-4 px-6 py-4 hover:bg-white/5 transition-colors group">
                <div className="p-2 rounded-lg bg-accent/10 text-accent shrink-0">
                  <Network className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm group-hover:text-accent transition-colors">{mm.title}</p>
                  {mm.unitName && (
                    <p className="text-xs text-muted-foreground">{mm.unitName}</p>
                  )}
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-accent transition-colors shrink-0" />
              </div>
            </Link>
          ))
        ) : (
          <div className="text-center py-16 text-muted-foreground">
            No mindmaps uploaded for this subject yet.
          </div>
        )}
      </div>
    </div>
  )
}
