"use client"
// Clean full-width reader for a RichNote: a slim top bar (back, title, zoom) and the note as a white page.
// Zoom: − / + buttons and two-finger pinch (the app locks the browser's own pinch-zoom). Admin tools sit behind a small "Admin" button.
import { useEffect, useRef, useState, type ReactNode } from "react"
import Link from "next/link"
import { ArrowLeft, Minus, Plus, Printer, Settings2 } from "lucide-react"
import { RichNoteView } from "@/components/notes/rich-note-view"
import type { RichNote } from "@/lib/richnotes/schema"

const MIN = 0.7, MAX = 2.2
const clamp = (n: number) => Math.min(MAX, Math.max(MIN, n))

export function RichReader({ note, title, backHref, subjectName, topicNo, protectWith, isAdmin = false, adminExtras }: {
  note: RichNote; title: string; backHref: string; subjectName?: string; topicNo?: number; protectWith?: string; isAdmin?: boolean; adminExtras?: ReactNode
}) {
  const [zoom, setZoom] = useState(1)
  const [adminOpen, setAdminOpen] = useState(false)
  const areaRef = useRef<HTMLDivElement>(null)
  const zoomRef = useRef(1)
  zoomRef.current = zoom

  useEffect(() => { try { const v = parseFloat(localStorage.getItem("qp-note-zoom") || ""); if (v) setZoom(clamp(v)) } catch {} }, [])
  const apply = (v: number) => { const z = clamp(Math.round(v * 100) / 100); setZoom(z); try { localStorage.setItem("qp-note-zoom", String(z)) } catch {} }

  // two-finger pinch
  useEffect(() => {
    const el = areaRef.current
    if (!el) return
    let startDist = 0, startZoom = 1
    const dist = (t: TouchList) => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY)
    const onStart = (e: TouchEvent) => { if (e.touches.length === 2) { startDist = dist(e.touches); startZoom = zoomRef.current } }
    const onMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && startDist) { e.preventDefault(); setZoom(clamp(startZoom * (dist(e.touches) / startDist))) }
    }
    const onEnd = (e: TouchEvent) => { if (startDist && e.touches.length < 2) { startDist = 0; try { localStorage.setItem("qp-note-zoom", String(zoomRef.current)) } catch {} } }
    el.addEventListener("touchstart", onStart, { passive: true })
    el.addEventListener("touchmove", onMove, { passive: false })
    el.addEventListener("touchend", onEnd)
    return () => { el.removeEventListener("touchstart", onStart); el.removeEventListener("touchmove", onMove); el.removeEventListener("touchend", onEnd) }
  }, [])

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="qp-no-print sticky top-0 z-30 flex items-center gap-1 border-b bg-white/95 px-2 py-2 backdrop-blur">
        <Link href={backHref} aria-label="Back" className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-slate-700 hover:bg-slate-100"><ArrowLeft className="h-5 w-5" /></Link>
        <h1 className="min-w-0 flex-1 truncate text-base font-semibold text-slate-800">{title}</h1>
        <button onClick={() => apply(zoom - 0.1)} aria-label="Zoom out" className="grid h-9 w-9 place-items-center rounded-full text-slate-700 hover:bg-slate-100"><Minus className="h-4 w-4" /></button>
        <button onClick={() => apply(1)} aria-label="Reset zoom" className="w-11 text-center text-xs font-bold text-slate-600">{Math.round(zoom * 100)}%</button>
        <button onClick={() => apply(zoom + 0.1)} aria-label="Zoom in" className="grid h-9 w-9 place-items-center rounded-full text-slate-700 hover:bg-slate-100"><Plus className="h-4 w-4" /></button>
        {isAdmin && <button onClick={() => setAdminOpen((v) => !v)} aria-label="Admin tools" className="grid h-9 w-9 place-items-center rounded-full text-slate-500 hover:bg-slate-100"><Settings2 className="h-4 w-4" /></button>}
      </div>

      {isAdmin && adminOpen && (
        <div className="qp-no-print flex flex-wrap items-center gap-2 border-b bg-slate-50 px-3 py-2 text-xs">
          {adminExtras}
          <button onClick={() => window.print()} className="inline-flex h-8 items-center gap-1.5 rounded-lg border bg-white px-3 font-bold text-slate-700"><Printer className="h-3.5 w-3.5" /> Download PDF</button>
        </div>
      )}

      <div ref={areaRef} style={{ touchAction: "pan-x pan-y" }}>
        <div style={{ zoom } as React.CSSProperties}>
          <RichNoteView clean note={note} subjectName={subjectName} topicNo={topicNo} protectWith={protectWith} allowPrint={isAdmin} />
        </div>
      </div>
    </div>
  )
}
