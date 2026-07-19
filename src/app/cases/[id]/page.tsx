"use client"

import { useMemo, use } from "react"
import { useDoc, useCollection, useFirestore } from "@/firebase"
import { doc, collection } from "firebase/firestore"
import { ChevronRight, ChevronLeft, Loader2, Stethoscope, Lock } from "lucide-react"
import Link from "next/link"
import { usePlan } from '@/hooks/use-plan'

const DIFFICULTY_COLOR: Record<string, string> = {
  easy: "text-green-400",
  medium: "text-yellow-400",
  hard: "text-red-400"
}

export default function CasesSubjectListPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: subjectId } = use(params)

  const db = useFirestore()
  const { canAccessContent, loading: planLoading } = usePlan()

  const subjectRef = useMemo(() => (!db ? null : doc(db, 'subjects', subjectId)), [db, subjectId])
  const { data: subject, loading: subjectLoading } = useDoc(subjectRef)

  const casesRef = useMemo(() => (!db ? null : collection(db, 'subjects', subjectId, 'cases')), [db, subjectId])
  const { data: cases, loading: casesLoading } = useCollection(casesRef)

  const sortedCases = useMemo(() => ((cases as any[]) || []).sort((a, b) => (a.order ?? 0) - (b.order ?? 0)), [cases])

  if (subjectLoading || planLoading) return <div className="h-screen flex items-center justify-center"><Loader2 className="h-10 w-10 text-primary animate-spin" /></div>

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-12 space-y-8 animate-in slide-in-from-right-4 duration-700">
      <div>
        <Link href="/cases" className="text-xs font-bold uppercase tracking-widest text-accent flex items-center gap-1 mb-4 hover:underline w-fit">
          <ChevronLeft className="h-3 w-3" /> Back to Cases
        </Link>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight capitalize">{subject ? (subject as any).name : 'Subject'} Cases</h1>
        <p className="text-muted-foreground mt-2">Pick a case to begin. Work through each decision - you'll get feedback as you go.</p>
      </div>

      {casesLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : sortedCases.length > 0 ? (
        <div className="rounded-2xl glass border-none divide-y divide-white/5 overflow-hidden">
          {sortedCases.map((c: any) => {
            const isLocked = !canAccessContent && c.tier === 'paid'
            const content = (
              <div className={`flex items-center gap-4 px-6 py-4 transition-colors group ${isLocked ? 'opacity-50' : 'hover:bg-white/5'}`}>
                <div className={`p-2 rounded-lg shrink-0 ${isLocked ? 'bg-white/5 text-muted-foreground' : 'bg-accent/10 text-accent'}`}>
                  {isLocked ? <Lock className="h-4 w-4" /> : <Stethoscope className="h-4 w-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-medium text-sm transition-colors ${isLocked ? '' : 'group-hover:text-accent'}`}>{c.title}</p>
                  <p className={`text-[10px] uppercase font-bold tracking-widest ${DIFFICULTY_COLOR[c.difficulty] || 'text-muted-foreground'}`}>{c.difficulty}</p>
                </div>
                {!isLocked && <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-accent transition-colors shrink-0" />}
              </div>
            )
            return isLocked ? (
              <div key={c.id} className="cursor-not-allowed">{content}</div>
            ) : (
              <Link key={c.id} href={`/cases/${subjectId}/${c.id}`}>{content}</Link>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-16 text-muted-foreground rounded-2xl glass border-none">
          No cases uploaded for this subject yet.
        </div>
      )}
    </div>
  )
}
