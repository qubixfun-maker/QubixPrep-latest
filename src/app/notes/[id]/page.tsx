"use client"

import { useMemo, use, useState, useEffect } from "react"
import { useDoc, useCollection, useFirestore, useUser } from "@/firebase"
import { doc, collection, query, orderBy, getDocs } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { ChevronRight, ChevronLeft, LayoutList, Loader2, FileText, CheckCircle2, Lock } from "lucide-react"
import Link from "next/link"
import { usePlan } from '@/hooks/use-plan'
import { UpgradeGate } from '@/components/upgrade-gate'

const FREE_LIMIT = 3

export default function SubjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: subjectId } = use(params)

  const { user } = useUser()
  const db = useFirestore()
  const { canAccessContent } = usePlan()

  const [completedTopics, setCompletedTopics] = useState<Set<string>>(new Set())

  const subjectRef = useMemo(() => (!db ? null : doc(db, 'subjects', subjectId)), [db, subjectId])
  const { data: subject, loading: subjectLoading } = useDoc(subjectRef)

  const topicsRef = useMemo(() => (!db ? null : collection(db, 'subjects', subjectId, 'topics')), [db, subjectId])
  const topicsQuery = useMemo(() => (!topicsRef ? null : query(topicsRef, orderBy('createdAt', 'desc'))), [topicsRef])
  const { data: topics, loading: topicsLoading } = useCollection(topicsQuery)

  const pdfTopics = useMemo(() => {
    return topics?.filter((t: any) => t.contentType === 'pdf') || []
  }, [topics])

  useEffect(() => {
    async function fetchProgress() {
      if (!db || !user) return
      try {
        const snap = await getDocs(collection(db, 'users', user.uid, 'progress'))
        const completedIds = new Set<string>()
        snap.forEach(d => {
          if (d.data().completed) completedIds.add(d.id)
        })
        setCompletedTopics(completedIds)
      } catch (e) {
        console.error(e)
      }
    }
    fetchProgress()
  }, [db, user, topics])

  const completionPercentage = useMemo(() => {
    if (pdfTopics.length === 0) return 0
    const completedInSubject = pdfTopics.filter(t => completedTopics.has(t.id)).length
    return Math.round((completedInSubject / pdfTopics.length) * 100)
  }, [pdfTopics, completedTopics])

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

  const hasLocked = !canAccessContent && pdfTopics.length > FREE_LIMIT

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-12 space-y-8 animate-in slide-in-from-right-4 duration-700">
      <div>
        <Link href="/notes" className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-1 mb-4 hover:underline w-fit">
          <ChevronLeft className="h-3 w-3" /> Back to Library
        </Link>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight capitalize">{(subject as any).name} Notes</h1>
        <p className="text-muted-foreground mt-2">
          {(subject as any).description || "Tap a topic to start reading."}
        </p>
        <div className="flex items-center gap-4 mt-4">
          <div className="flex items-center gap-2 text-sm">
            <LayoutList className="h-4 w-4 text-accent" />
            <span className="font-medium">{pdfTopics.length} notes</span>
          </div>
          <div className="flex-1 flex items-center gap-2">
            <Progress value={completionPercentage} className="h-1.5 bg-white/5" />
            <span className="text-xs text-muted-foreground shrink-0">{completionPercentage}%</span>
          </div>
        </div>
      </div>

      <div className="rounded-2xl glass border-none divide-y divide-white/5 overflow-hidden">
        {topicsLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : pdfTopics.length > 0 ? (
          pdfTopics.map((topic: any, index: number) => {
            const isLocked = !canAccessContent && index >= FREE_LIMIT
            const isDone = completedTopics.has(topic.id)

            const content = (
              <div className={`flex items-center gap-4 px-6 py-4 transition-colors group ${isLocked ? 'opacity-50' : 'hover:bg-white/5'}`}>
                <div className={`p-2 rounded-lg shrink-0 ${
                  isLocked ? 'bg-white/5 text-muted-foreground' :
                  isDone ? 'bg-green-500/10 text-green-400' : 'bg-primary/10 text-primary'
                }`}>
                  {isLocked ? <Lock className="h-4 w-4" /> : isDone ? <CheckCircle2 className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-medium text-sm transition-colors ${isLocked ? '' : 'group-hover:text-primary'}`}>{topic.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {isLocked ? 'Upgrade to unlock' : (topic.unitName || 'General')}
                  </p>
                </div>
                {!isLocked && <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />}
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
            No notes uploaded for this subject yet.
          </div>
        )}
      </div>

      {hasLocked && <UpgradeGate type="content" />}
    </div>
  )
}
