"use client"

import { useMemo, use } from "react"
import { useDoc, useCollection, useFirestore } from "@/firebase"
import { doc, collection, query, orderBy, where } from "firebase/firestore"
import { ChevronRight, ChevronLeft, Loader2, PlayCircle, Video, Lock } from "lucide-react"
import Link from "next/link"
import { usePlan } from '@/hooks/use-plan'
import { UpgradeGate } from '@/components/upgrade-gate'
import { useRequireAuth } from '@/hooks/use-require-auth'

const FREE_LIMIT = 3

export default function SubjectVideoCurriculumPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: subjectId } = use(params)

  const db = useFirestore()
  const { canAccessContent } = usePlan()
  const { checkingAuth } = useRequireAuth()

  const subjectRef = useMemo(() => (!db ? null : doc(db, 'subjects', subjectId)), [db, subjectId])
  const { data: subject, loading: subjectLoading } = useDoc(subjectRef)

  const topicsRef = useMemo(() => (!db ? null : collection(db, 'subjects', subjectId, 'topics')), [db, subjectId])
  const videoQuery = useMemo(() => (!topicsRef ? null : query(topicsRef, where('contentType', '==', 'video'), orderBy('createdAt', 'desc'))), [topicsRef])
  const { data: videoTopics, loading: topicsLoading } = useCollection(videoQuery)

  if (checkingAuth || subjectLoading) return <div className="h-screen flex items-center justify-center"><Loader2 className="h-10 w-10 text-primary animate-spin" /></div>

  const hasLocked = !canAccessContent && videoTopics && videoTopics.length > FREE_LIMIT

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-12 space-y-8 animate-in slide-in-from-right-4 duration-700">
      <div>
        <Link href="/videos" className="text-xs font-bold uppercase tracking-widest text-secondary flex items-center gap-1 mb-4 hover:underline w-fit">
          <ChevronLeft className="h-3 w-3" /> Back to Lectures
        </Link>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight capitalize">{(subject as any)?.name} Video Curriculum</h1>
        <p className="text-muted-foreground mt-2">Tap a lecture to start watching.</p>
      </div>

      <div className="rounded-2xl glass border-none divide-y divide-white/5 overflow-hidden">
        {topicsLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-secondary" />
          </div>
        ) : videoTopics && videoTopics.length > 0 ? (
          videoTopics.map((topic: any, index: number) => {
            const isLocked = !canAccessContent && index >= FREE_LIMIT
            const content = (
              <div className={`flex items-center gap-4 px-6 py-4 transition-colors group ${isLocked ? 'opacity-50' : 'hover:bg-white/5'}`}>
                <div className={`p-2 rounded-lg shrink-0 ${isLocked ? 'bg-white/5 text-muted-foreground' : 'bg-secondary/10 text-secondary'}`}>
                  {isLocked ? <Lock className="h-4 w-4" /> : <PlayCircle className="h-4 w-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-medium text-sm transition-colors ${isLocked ? '' : 'group-hover:text-secondary'}`}>{topic.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {isLocked ? 'Upgrade to unlock' : (topic.unitName || 'General Curriculum')}
                  </p>
                </div>
                {!isLocked && <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-secondary transition-colors shrink-0" />}
              </div>
            )

            return isLocked ? (
              <div key={topic.id} className="cursor-not-allowed">{content}</div>
            ) : (
              <Link key={topic.id} href={`/notes/${subjectId}/${topic.id}`}>{content}</Link>
            )
          })
        ) : (
          <div className="text-center py-16 text-muted-foreground">
            <Video className="h-10 w-10 mx-auto mb-3 opacity-20" />
            No video lectures available for this subject yet.
          </div>
        )}
      </div>

      {hasLocked && <UpgradeGate type="content" />}
    </div>
  )
}
