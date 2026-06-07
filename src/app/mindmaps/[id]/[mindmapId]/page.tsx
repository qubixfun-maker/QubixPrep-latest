
"use client"

import { useMemo, use, useEffect } from "react"
import { useDoc, useFirestore } from "@/firebase"
import { doc } from "firebase/firestore"
import { ArrowLeft, Loader2, Sparkles, ShieldCheck, Maximize2, Minimize2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useState } from "react"

export default function MindmapViewerPage({ params }: { params: Promise<{ id: string, mindmapId: string }> }) {
  const { id, mindmapId } = use(params)
  const db = useFirestore()
  const [isFullWidth, setIsFullWidth] = useState(false)

  // Content Protection: Prevent right-click and common shortcuts
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey && (e.key === 's' || e.key === 'p' || e.key === 'u')) || (e.metaKey && (e.key === 's' || e.key === 'p' || e.key === 'u'))) {
        e.preventDefault();
      }
    };
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const mmRef = useMemo(() => (!db) ? null : doc(db, 'subjects', id, 'mindmaps', mindmapId), [db, id, mindmapId])
  const { data: mm, loading } = useDoc(mmRef)

  if (loading) return <div className="h-screen flex items-center justify-center bg-black"><Loader2 className="animate-spin text-primary" /></div>
  if (!mm) return <div className="h-screen flex items-center justify-center bg-black text-white">Mindmap not found.</div>

  const mmData = mm as any

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#0a0a0c] text-white select-none">
      <header className="h-14 glass-darker border-b border-white/5 flex items-center justify-between px-4 z-40">
        <div className="flex items-center gap-3">
          <Link href={`/mindmaps/${id}`}><Button variant="ghost" size="icon" className="rounded-xl hover:bg-white/5"><ArrowLeft className="h-5 w-5" /></Button></Link>
          <div>
            <h1 className="font-bold text-sm truncate max-w-[200px]">{mmData.title}</h1>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{mmData.unitName || 'General'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-muted-foreground h-8 gap-2 hover:text-white"
            onClick={() => setIsFullWidth(!isFullWidth)}
          >
            {isFullWidth ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            <span className="hidden sm:inline text-[10px] font-bold uppercase tracking-tighter">
              {isFullWidth ? 'Fit Screen' : 'Full Width'}
            </span>
          </Button>
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/5 text-[9px] font-bold text-muted-foreground uppercase">
            <ShieldCheck className="h-3 w-3 text-accent" /> Secure Content
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-auto bg-[#000] scrollbar-hide">
        <div className={`mx-auto transition-all duration-500 flex justify-center py-8 px-4 ${isFullWidth ? 'w-full max-w-none' : 'max-w-6xl'}`}>
          <div className="relative inline-block">
            <img 
              src={mmData.imageUrl} 
              alt={mmData.title} 
              className="w-full h-auto rounded-lg shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/5" 
              onContextMenu={e => e.preventDefault()}
            />
            {/* Immersive security watermark */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.02] flex items-center justify-center rotate-45 select-none overflow-hidden">
               <div className="text-6xl font-black whitespace-nowrap">QUBIX PREP • SECURED CONTENT • QUBIX PREP • SECURED CONTENT • </div>
            </div>
          </div>
        </div>
      </div>
      
      <footer className="h-10 glass-darker border-t border-white/5 flex items-center justify-center px-4">
        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Visual Study Canvas • Protected for Medical Education</p>
      </footer>
    </div>
  )
}
