
"use client"

import { useMemo, use } from "react"
import { useDoc, useFirestore } from "@/firebase"
import { doc } from "firebase/firestore"
import { ArrowLeft, Loader2, Maximize2, Sparkles, Network } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function MindmapViewerPage({ params }: { params: Promise<{ id: string, mindmapId: string }> }) {
  const { id, mindmapId } = use(params)
  const db = useFirestore()

  const mmRef = useMemo(() => (!db) ? null : doc(db, 'subjects', id, 'mindmaps', mindmapId), [db, id, mindmapId])
  const { data: mm, loading } = useDoc(mmRef)

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>
  if (!mm) return <div className="text-center p-20">Mindmap not found.</div>

  const mmData = mm as any

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-black text-white select-none">
      <header className="h-14 glass-darker border-b border-white/5 flex items-center justify-between px-4 z-40">
        <div className="flex items-center gap-3">
          <Link href={`/mindmaps/${id}`}><Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button></Link>
          <div>
            <h1 className="font-bold text-sm">{mmData.title}</h1>
            <p className="text-[10px] text-muted-foreground uppercase">{mmData.unitName}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" className="rounded-full bg-accent text-background font-bold gap-2">
            <Sparkles className="h-3.5 w-3.5" /> High Yield
          </Button>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-4 flex items-center justify-center">
        <img 
          src={mmData.imageUrl} 
          alt={mmData.title} 
          className="max-w-full max-h-full rounded-xl shadow-2xl border border-white/10" 
          onContextMenu={e => e.preventDefault()}
        />
      </div>
    </div>
  )
}
