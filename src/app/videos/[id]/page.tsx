"use client"

import { useMemo, use } from "react"
import { useDoc, useCollection, useFirestore } from "@/firebase"
import { doc, collection, query, where } from "firebase/firestore"
import { ChevronRight, ChevronLeft, Loader2, PlayCircle, Video, Lock, FileText } from "lucide-react"
import Link from "next/link"
import { usePlan } from "@/hooks/use-plan"
import { UpgradeGate } from "@/components/upgrade-gate"
import { useRequireAuth } from "@/hooks/use-require-auth"
import { Lecture, fmtDuration, sortLectures } from "@/lib/lectures"

export default function SubjectVideoCurriculumPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: subjectId } = use(params)
  const db = useFirestore()
  const { canAccessContent, isAdmin } = usePlan() as any
  const { checkingAuth } = useRequireAuth()

  const subjectRef = useMemo(() => (!db ? null : doc(db, "subjects", subjectId)), [db, subjectId])
  const { data: subject, loading: subjectLoading } = useDoc(subjectRef)

  const lecturesQ = useMemo(() => (!db ? null : query(collection(db, "lectures"), where("subjectId", "==", subjectId))), [db, subjectId])
  const { data: raw, loading } = useCollection(lecturesQ)
  const lectures = useMemo(() => sortLectures(((raw || []) as any[]).filter((x) => x.status === "published" || isAdmin)) as Lecture[], [raw, isAdmin])

  if (checkingAuth || subjectLoading) return <div className="h-screen flex items-center justify-center"><Loader2 className="h-10 w-10 text-primary animate-spin" /></div>
  const locked = (l: Lecture) => !canAccessContent && !l.free && !isAdmin
  const hasLocked = lectures.some(locked)

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-12 space-y-8">
      <div>
        <Link href="/videos" className="text-xs font-bold uppercase tracking-widest text-secondary flex items-center gap-1 mb-4 hover:underline w-fit">
          <ChevronLeft className="h-3 w-3" /> Back to Lectures
        </Link>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight capitalize">{(subject as any)?.name} Video Lectures</h1>
        <p className="text-muted-foreground mt-2">Tap a lecture to watch. Notes are optional and open beside the video.</p>
      </div>

      <div className="rounded-2xl border divide-y overflow-hidden bg-card">
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-secondary" /></div>
        ) : lectures.length > 0 ? (
          lectures.map((l) => {
            const isLocked = locked(l)
            const row = (
              <div className={`flex items-center gap-4 px-5 py-4 transition-colors group ${isLocked ? "opacity-60" : "hover:bg-muted/50"}`}>
                <div className={`grid h-10 w-10 place-items-center rounded-xl shrink-0 text-sm font-bold ${isLocked ? "bg-muted text-muted-foreground" : "bg-secondary/10 text-secondary"}`}>
                  {isLocked ? <Lock className="h-4 w-4" /> : (l.order || <PlayCircle className="h-4 w-4" />)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{l.title}{l.status === "draft" && <span className="ml-2 text-[10px] uppercase rounded bg-amber-100 text-amber-800 px-1.5 py-0.5">Draft</span>}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-2">
                    {fmtDuration(l.durationSec)}
                    {l.notesPath && <span className="flex items-center gap-1"><FileText className="h-3 w-3" /> Notes</span>}
                    {l.free && !canAccessContent && <span className="text-emerald-600 font-bold">Free preview</span>}
                    {isLocked && <span>Upgrade to unlock</span>}
                  </p>
                </div>
                {!isLocked && <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}
              </div>
            )
            return isLocked ? <div key={l.id} className="cursor-not-allowed">{row}</div> : <Link key={l.id} href={`/videos/${subjectId}/${l.id}`}>{row}</Link>
          })
        ) : (
          <div className="text-center py-16 text-muted-foreground">
            <Video className="h-10 w-10 mx-auto mb-3 opacity-20" />
            No video lectures for this subject yet.
          </div>
        )}
      </div>

      {hasLocked && <UpgradeGate type="content" title="Subscribe to unlock all lectures" description="Scholar (₹999/year) unlocks every video lecture with its notes." />}
    </div>
  )
}
