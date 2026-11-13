"use client"
// Shared clean reading shell: slim top bar (back, title, zoom - / + and two-finger pinch) and a full-width page below.
// The app locks the browser's own pinch-zoom, so zoom is done here with CSS zoom; text reflows, no sideways scroll.
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react"
import Link from "next/link"
import { ArrowLeft, Minus, Plus } from "lucide-react"

const MIN = 0.7, MAX = 2.2
const clamp = (n: number) => Math.min(MAX, Math.max(MIN, n))

export function ZoomReader({ title, backHref, barExtra, belowBar, children }: {
  title: string; backHref: string; barExtra?: ReactNode; belowBar?: ReactNode; children: ReactNode
}) {
  const [zoom, setZoom] = useState(1)
  const areaRef = useRef<HTMLDivElement>(null)
  const zoomRef = useRef(1)
  zoomRef.current = zoom

  useEffect(() => { try { const v = parseFloat(localStorage.getItem("qp-note-zoom") || ""); if (v) setZoom(clamp(v)) } catch {} }, [])
  const save = (z: number) => { try { localStorage.setItem("qp-note-zoom", String(z)) } catch {} }
  const apply = (v: number) => { const z = clamp(Math.round(v * 100) / 100); setZoom(z); save(z) }

  useEffect(() => {
    const el = areaRef.current
    if (!el) return
    let startDist = 0, startZoom = 1
    const dist = (t: TouchList) => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY)
    const onStart = (e: TouchEvent) => { if (e.touches.length === 2) { startDist = dist(e.touches); startZoom = zoomRef.current } }
    const onMove = (e: TouchEvent) => { if (e.touches.length === 2 && startDist) { e.preventDefault(); setZoom(clamp(startZoom * (dist(e.touches) / startDist))) } }
    const onEnd = (e: TouchEvent) => { if (startDist && e.touches.length < 2) { startDist = 0; save(zoomRef.current) } }
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
        {barExtra}
      </div>
      {belowBar}
      <div ref={areaRef} style={{ touchAction: "pan-x pan-y" }}>
        <div style={{ zoom } as CSSProperties}>{children}</div>
      </div>
    </div>
  )
}
