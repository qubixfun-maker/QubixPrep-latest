"use client"

import { useMemo, use, useEffect, useState, useRef } from "react"
import { useDoc, useFirestore } from "@/firebase"
import { doc } from "firebase/firestore"
import { ArrowLeft, Loader2, ShieldCheck, ZoomIn, ZoomOut, RotateCcw, Maximize } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { TransformWrapper, TransformComponent, type ReactZoomPanPinchRef } from "react-zoom-pan-pinch"

export default function MindmapViewerPage({ params }: { params: Promise<{ id: string, mindmapId: string }> }) {
  const { id, mindmapId } = use(params)

  const db = useFirestore()
  const transformRef = useRef<ReactZoomPanPinchRef>(null)
  const [imageLoaded, setImageLoaded] = useState(false)

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

  const fitToScreen = () => {
    transformRef.current?.resetTransform()
  }

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
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/5 text-[9px] font-bold text-muted-foreground uppercase">
          <ShieldCheck className="h-3 w-3 text-accent" /> Secure Content
        </div>
      </header>

      <div className="flex-1 relative overflow-hidden bg-[#000]">
        <TransformWrapper
          ref={transformRef}
          initialScale={1}
          minScale={1}
          maxScale={6}
          centerOnInit
          limitToBounds={true}
          wheel={{ step: 0.15 }}
          pinch={{ step: 5 }}
          doubleClick={{ mode: "zoomIn", step: 0.7 }}
        >
          {({ zoomIn, zoomOut }) => (
            <>
              <TransformComponent
                wrapperStyle={{ width: "100%", height: "100%" }}
                contentStyle={{ width: "100%", height: "100%" }}
              >
                <div className="relative w-full h-full flex items-center justify-center p-4">
                  <img
                    src={mmData.imageUrl}
                    alt={mmData.title}
                    className="max-w-full max-h-full w-auto h-auto object-contain rounded-lg shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/5"
                    onContextMenu={e => e.preventDefault()}
                    onLoad={() => setImageLoaded(true)}
                    draggable={false}
                  />
                  <div className="absolute inset-0 pointer-events-none opacity-[0.02] flex items-center justify-center rotate-45 select-none overflow-hidden">
                    <div className="text-6xl font-black whitespace-nowrap">QUBIX PREP • SECURED CONTENT • QUBIX PREP • SECURED CONTENT • </div>
                  </div>
                </div>
              </TransformComponent>

              <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-30">
                <Button variant="secondary" size="icon" className="h-10 w-10 rounded-xl glass-darker border border-white/10" onClick={() => zoomIn()}>
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button variant="secondary" size="icon" className="h-10 w-10 rounded-xl glass-darker border border-white/10" onClick={() => zoomOut()}>
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <Button variant="secondary" size="icon" className="h-10 w-10 rounded-xl glass-darker border border-white/10" onClick={fitToScreen}>
                  <Maximize className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}
        </TransformWrapper>
      </div>

      <footer className="h-10 glass-darker border-t border-white/5 flex items-center justify-center px-4">
        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Tap to zoom in • Drag to pan • Tap fit-screen to reset • Protected for Medical Education</p>
      </footer>
    </div>
  )
}
