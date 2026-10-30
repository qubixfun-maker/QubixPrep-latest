"use client"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { ArrowLeft, ChevronLeft, ChevronRight, Loader2, Minus, Plus, RotateCcw } from "lucide-react"
import { useFirestore, useUser } from "@/firebase"
import { loadTop100List, loadTop100Image, type Top100Page } from "@/lib/top100-pages"

export default function Top100Viewer() {
  const { id } = useParams<{ id: string }>()
  const db = useFirestore()
  const { user } = useUser()
  const [pages, setPages] = useState<Top100Page[] | null>(null)
  const [src, setSrc] = useState("")
  const [err, setErr] = useState("")
  // ---- zoom: pinch with two fingers, drag to move, double-tap to zoom, or use the + / - buttons ----
  const [view, setView] = useState({ s: 1, x: 0, y: 0 })
  const box = useRef<HTMLDivElement>(null)
  const inner = useRef<HTMLDivElement>(null)
  const pts = useRef(new Map<number, { x: number; y: number }>())
  const pinch = useRef<{ d: number; s: number } | null>(null)
  const lastTap = useRef(0)
  const moved = useRef(false)
  const MAX = 5

  const clamp = useCallback((v: { s: number; x: number; y: number }) => {
    const b = box.current, c = inner.current
    if (!b || !c) return v
    const s = Math.min(MAX, Math.max(1, v.s))
    const w = b.clientWidth, h = b.clientHeight
    const cw = c.offsetWidth * s, ch = c.offsetHeight * s
    const x = cw <= w ? 0 : Math.min(0, Math.max(w - cw, v.x))
    const y = ch <= h ? 0 : Math.min(0, Math.max(h - ch, v.y))
    return { s, x, y }
  }, [])

  // zoom to scale ns keeping the point (px, py) of the box where it is
  const zoomAt = useCallback((ns: number, px: number, py: number) => {
    setView((v) => {
      const s = Math.min(MAX, Math.max(1, ns))
      const k = s / v.s
      return clamp({ s, x: px - (px - v.x) * k, y: py - (py - v.y) * k })
    })
  }, [clamp])
  const zoomCenter = (f: number) => { const b = box.current; if (b) zoomAt(view.s * f, b.clientWidth / 2, b.clientHeight / 2) }

  const onDown = (e: React.PointerEvent) => {
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    pts.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    moved.current = false
    if (pts.current.size === 2) { const [a, b] = Array.from(pts.current.values()); pinch.current = { d: Math.hypot(a.x - b.x, a.y - b.y), s: view.s } }
  }
  const onMove = (e: React.PointerEvent) => {
    const prev = pts.current.get(e.pointerId)
    if (!prev) return
    const cur = { x: e.clientX, y: e.clientY }
    pts.current.set(e.pointerId, cur)
    const r = box.current!.getBoundingClientRect()
    if (pts.current.size === 2 && pinch.current) {
      const [a, b] = Array.from(pts.current.values())
      const d = Math.hypot(a.x - b.x, a.y - b.y)
      zoomAt(pinch.current.s * (d / pinch.current.d), (a.x + b.x) / 2 - r.left, (a.y + b.y) / 2 - r.top)
      moved.current = true
    } else if (pts.current.size === 1 && view.s > 1) {
      const dx = cur.x - prev.x, dy = cur.y - prev.y
      if (Math.abs(dx) + Math.abs(dy) > 1) moved.current = true
      setView((v) => clamp({ ...v, x: v.x + dx, y: v.y + dy }))
    }
  }
  const onUp = (e: React.PointerEvent) => {
    const wasOne = pts.current.size === 1
    pts.current.delete(e.pointerId)
    if (pts.current.size < 2) pinch.current = null
    if (wasOne && !moved.current) { // a tap; two quick taps = zoom in / back out
      const now = Date.now()
      if (now - lastTap.current < 300) {
        const r = box.current!.getBoundingClientRect()
        if (view.s > 1) setView({ s: 1, x: 0, y: 0 }); else zoomAt(2.5, e.clientX - r.left, e.clientY - r.top)
        lastTap.current = 0
      } else lastTap.current = now
    }
  }
  // ctrl + mouse wheel (or laptop pinch) zooms on a computer
  useEffect(() => {
    const b = box.current
    if (!b) return
    const h = (e: WheelEvent) => {
      if (!e.ctrlKey) return
      e.preventDefault()
      const r = b.getBoundingClientRect()
      zoomAt(view.s * (e.deltaY < 0 ? 1.15 : 1 / 1.15), e.clientX - r.left, e.clientY - r.top)
    }
    b.addEventListener("wheel", h, { passive: false })
    return () => b.removeEventListener("wheel", h)
  }, [view.s, zoomAt, src])

  useEffect(() => { if (db) loadTop100List(db).then(setPages).catch(() => setPages([])) }, [db])

  const { page, prev, next } = useMemo(() => {
    const list = pages || []
    const cur = list.find((p) => p.id === id)
    const same = cur ? list.filter((p) => p.subjectKey === cur.subjectKey) : []
    const i = same.findIndex((p) => p.id === id)
    return { page: cur, prev: i > 0 ? same[i - 1] : undefined, next: i >= 0 && i < same.length - 1 ? same[i + 1] : undefined }
  }, [pages, id])

  useEffect(() => {
    if (!db || !pages) return
    setSrc(""); setErr(""); setView({ s: 1, x: 0, y: 0 })
    let live = true
    loadTop100Image(db, id, page?.updatedAt || 0)
      .then((s) => { if (live) setSrc(s) })
      .catch((e) => { if (live) setErr(e?.message === "not-found" ? "This topic is not available yet." : "Could not open this topic. Check your plan and internet connection, then try again.") })
    if (next) loadTop100Image(db, next.id, next.updatedAt || 0).catch(() => {}) // get the next topic ready
    return () => { live = false }
  }, [db, id, pages, page?.updatedAt, next?.id])

  // faint diagonal name on the sheet, so shared screenshots can be traced
  const mark = useMemo(() => {
    const t = (user?.email || user?.displayName || "QubixPrep").replace(/[<>&"']/g, "")
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="360" height="240"><text x="20" y="150" transform="rotate(-25 180 120)" font-family="sans-serif" font-size="20" font-weight="700" fill="rgba(0,0,0,0.08)">${t}</text></svg>`
    return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`
  }, [user])

  return (
    <div className="mx-auto max-w-3xl px-3 py-4 md:px-6">
      <div className="mb-3 flex items-center gap-2">
        <Link href="/top-100" aria-label="Back" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-border bg-card"><ArrowLeft className="h-5 w-5" /></Link>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-bold leading-tight">{page?.title || "Top 100"}</h1>
          {page && <p className="text-xs text-muted-foreground">{page.subject} · Topic {page.order}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button onClick={() => zoomCenter(1 / 1.4)} disabled={view.s <= 1} aria-label="Zoom out" className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-card disabled:opacity-40"><Minus className="h-5 w-5" /></button>
          <button onClick={() => setView({ s: 1, x: 0, y: 0 })} aria-label="Reset zoom" className="grid h-10 min-w-[3.25rem] place-items-center rounded-xl border border-border bg-card px-2 text-xs font-bold">
            {view.s > 1 ? `${Math.round(view.s * 100)}%` : <RotateCcw className="h-4 w-4" />}
          </button>
          <button onClick={() => zoomCenter(1.4)} disabled={view.s >= MAX} aria-label="Zoom in" className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-card disabled:opacity-40"><Plus className="h-5 w-5" /></button>
        </div>
      </div>

      {!src && !err && <div className="flex justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}
      {err && <p className="rounded-2xl bg-secondary px-4 py-6 text-center text-sm">{err}</p>}

      {src && (
        <>
          <div ref={box} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}
            onContextMenu={(e) => e.preventDefault()}
            className="relative overflow-hidden rounded-2xl border border-border bg-white"
            style={{ touchAction: view.s > 1 ? "none" : "pan-y", WebkitTouchCallout: "none", userSelect: "none", height: view.s > 1 ? "78vh" : undefined } as React.CSSProperties}>
            <div ref={inner} className="relative origin-top-left" style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.s})`, willChange: "transform" }}>
              <img src={src} alt={page?.title || "Topic"} draggable={false} className="block w-full select-none" />
              <div className="pointer-events-none absolute inset-0" style={{ backgroundImage: mark }} />
            </div>
          </div>
          <p className="mt-2 text-center text-xs text-muted-foreground">Pinch or double-tap to zoom · drag to move</p>
        </>
      )}

      <div className="mt-4 flex gap-3">
        {prev ? <Link href={`/top-100/${prev.id}`} className="flex flex-1 items-center gap-1 rounded-xl border border-border bg-card px-3 py-3 text-sm font-semibold"><ChevronLeft className="h-4 w-4 shrink-0" /><span className="truncate">{prev.title}</span></Link> : <span className="flex-1" />}
        {next ? <Link href={`/top-100/${next.id}`} className="flex flex-1 items-center justify-end gap-1 rounded-xl border border-border bg-card px-3 py-3 text-sm font-semibold"><span className="truncate">{next.title}</span><ChevronRight className="h-4 w-4 shrink-0" /></Link> : <span className="flex-1" />}
      </div>
    </div>
  )
}
