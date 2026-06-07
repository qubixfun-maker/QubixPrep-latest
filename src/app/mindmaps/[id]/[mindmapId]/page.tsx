
"use client"

import { useMemo, use } from "react"
import { useDoc, useFirestore } from "@/firebase"
import { doc } from "firebase/firestore"
import { ArrowLeft, Loader2, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function MindmapViewerPage({ params }: { params: Promise<{ id: string, mindmapId: string }> }) {
  const { id, mindmapId } = use(params)
  const db = useFirestore()

  const mmRef = useMemo(() => (!db) ? null : doc(db, 'subjects', id, 'mindmaps', mindmapId), [db, id, mindmapId])
  const { data: mm, loading } = useDoc(mmRef)

  if (loading) return <div className="h-screen flex items-center justify-center bg-black"><Loader2 className="animate-spin text-primary" /></div>
  if (!mm) return <div className="h-screen flex items-center justify-center bg-black text-white">Mindmap not found.</div>

  const mmData = mm as any

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-black text-white select-none">
      <header className="h-14 glass-darker border-b border-white/5 flex items-center justify-between px-4 z-40">
        <div className="flex items-center gap-3">
          <Link href={`/mindmaps/${id}`}><Button variant="ghost" size="icon" className="rounded-xl hover:bg-white/5"><ArrowLeft className="h-5 w-5" /></Button></Link>
          <div>
            <h1 className="font-bold text-sm truncate max-w-[200px]">{mmData.title}</h1>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{mmData.unitName || 'General'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="px-3 py-1 rounded-full bg-accent/20 border border-accent/20 text-[10px] font-bold text-accent uppercase tracking-tighter">
            <Sparkles className="h-3 w-3 inline mr-1" /> High Yield
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-auto flex items-center justify-center p-4">
        <div className="relative max-w-5xl w-full">
          <img 
            src={mmData.imageUrl} 
            alt={mmData.title} 
            className="w-full h-auto rounded-xl shadow-2xl border border-white/10" 
            onContextMenu={e => e.preventDefault()}
          />
          {/* Subtle watermark to discourage screenshots */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.03] flex items-center justify-center rotate-45 select-none overflow-hidden">
             <div className="text-4xl font-bold whitespace-nowrap">QUBIX PREP • SECURED CONTENT • </div>
          </div>
        </div>
      </div>
    </div>
  )
}
