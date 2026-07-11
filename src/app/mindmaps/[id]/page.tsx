"use client"

import { useMemo, use } from "react"
import { useDoc, useCollection, useFirestore } from "@/firebase"
import { doc, collection } from "firebase/firestore"
import { ChevronRight, ChevronLeft, Loader2, Network, Lock } from "lucide-react"
import Link from "next/link"
import { usePlan } from '@/hooks/use-plan'
import { UpgradeGate } from '@/components/upgrade-gate'
import { groupByUnit } from "@/lib/unit-sort"

const FREE_LIMIT = 2

export default function MindmapSubjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: subjectId } = use(params)

  const db = useFirestore()
  const { canAccessContent, loading: planLoading } = usePlan()

  const subjectRef = useMemo(() => (!db ? null : doc(db, 'subjects', subjectId)), [db, subjectId])
  const { data: subject, loading: subjectLoading } = useDoc(subjectRef)

  const mmRef = useMemo(() => (!db ? null : collection(db, 'subjects', subjectId, 'mindmaps')), [db, subjectId])
  const { data: mindmaps, loading: mindmapsLoading } = useCollection(mmRef)

  const groupedMindmaps = useMemo(() => groupByUnit((mindmaps as any[]) || []), [mindmaps])
  const flatOrdered = useMemo(() => groupedMindmaps.flatMap(g => g.items), [groupedMindmaps])

  if (subjectLoading || planLoading) return <div className="h-screen flex items-center justify-center"><Loader2 className="h-10 w-10 text-primary animate-spin" /></div>

  const hasLocked = !canAccessContent && flatOrdered.length > FREE_LIMIT

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-12 space-y-8 animate-in slide-in-from-right-4 duration-700">
      <div>
        <Link href="/mindmaps" className="text-xs font-bold uppercase tracking-widest text-accent flex items-center gap-1 mb-4 hover:underline w-fit">
          <ChevronLeft className="h-3 w-3" /> Back to Mindmaps
        </Link>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight capitalize">{subject ? (subject as any).name : 'Subject'} Mindmaps</h1>
        <p className="text-muted-foreground mt-2">Tap a topic to view its mindmap.</p>
      </div>

      {mindmapsLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : flatOrdered.length > 0 ? (
        <div className="space-y-6">
          {groupedMindmaps.map((group) => (
            <div key={group.unitName} className="space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-1">{group.unitName}</h2>
              <div className="rounded-2xl glass border-none divide-y divide-white/5 overflow-hidden">
                {group.items.map((mm: any) => {
                  const globalIndex = flatOrdered.findIndex(m => m.id === mm.id)
                  const isLocked = !canAccessContent && globalIndex >= FREE_LIMIT
                  const content = (
                    <div className={`flex items-center gap-4 px-6 py-4 transition-colors group ${isLocked ? 'opacity-50' : 'hover:bg-white/5'}`}>
                      <div className={`p-2 rounded-lg shrink-0 ${isLocked ? 'bg-white/5 text-muted-foreground' : 'bg-accent/10 text-accent'}`}>
                        {isLocked ? <Lock className="h-4 w-4" /> : <Network className="h-4 w-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium text-sm transition-colors ${isLocked ? '' : 'group-hover:text-accent'}`}>{mm.title}</p>
                      </div>
                      {!isLocked && <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-accent transition-colors shrink-0" />}
                    </div>
                  )
                  return isLocked ? (
                    <div key={mm.id} className="cursor-not-allowed">{content}</div>
                  ) : (
                    <Link key={mm.id} href={`/mindmaps/${subjectId}/${mm.id}`}>{content}</Link>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-muted-foreground rounded-2xl glass border-none">
          No mindmaps uploaded for this subject yet.
        </div>
      )}

      {hasLocked && (
        <UpgradeGate type="content" />
      )}
    </div>
  )
}
