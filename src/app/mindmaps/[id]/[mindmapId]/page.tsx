"use client"

import { useMemo, use } from "react"
import { useDoc, useFirestore } from "@/firebase"
import { doc } from "firebase/firestore"
import { ChevronLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import MindMapTree from "@/components/mindmap/MindMapTree"
import { useRequireAuth } from "@/hooks/use-require-auth"
import { getSubjectColor } from "@/lib/subject-colors"

export default function MindmapViewPage({ params }: { params: Promise<{ id: string; mindmapId: string }> }) {
  const { id: subjectId, mindmapId } = use(params)
  const db = useFirestore()

  const mmRef = useMemo(() => (!db ? null : doc(db, 'subjects', subjectId, 'mindmaps', mindmapId)), [db, subjectId, mindmapId])
  const { data: mindmap, loading } = useDoc(mmRef)

  const { checkingAuth } = useRequireAuth()
  const color = getSubjectColor(subjectId)

  if (checkingAuth || loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 text-primary animate-spin" /></div>

  if (!mindmap) {
    return (
      <div className="max-w-2xl mx-auto p-4 md:p-12 space-y-6">
        <Link href={`/mindmaps/${subjectId}`} className={`text-xs font-bold uppercase tracking-widest ${color.text} flex items-center gap-1 w-fit hover:underline`}>
          <ChevronLeft className="h-3 w-3" /> Back
        </Link>
        <div className="text-center py-16 text-muted-foreground rounded-2xl glass border-none">Mind map not found.</div>
      </div>
    )
  }

  const mm = mindmap as any

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <Link href={`/mindmaps/${subjectId}`} className={`text-xs font-bold uppercase tracking-widest ${color.text} flex items-center gap-1 hover:underline`}>
          <ChevronLeft className="h-3 w-3" /> Back
        </Link>
        <h1 className="text-lg font-bold text-center flex-1 truncate px-4">{mm.title}</h1>
        <div className="w-16" />
      </div>

      {mm.type === "radial" && mm.data ? (
        <div className="flex justify-center overflow-x-auto py-4">
          <MindMapTree root={{ name: mm.data.centralTopic, branches: mm.data.branches }} />
        </div>
      ) : mm.imageUrl ? (
        <div className="flex justify-center">
          <img src={mm.imageUrl} alt={mm.title} className="max-w-full rounded-2xl" />
        </div>
      ) : (
        <div className="text-center py-16 text-muted-foreground rounded-2xl glass border-none">This mind map has no content.</div>
      )}
    </div>
  )
}
