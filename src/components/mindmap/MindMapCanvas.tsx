"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { FileText, ChevronsUpDown, ChevronsDownUp, Plus, Minus, Scan, Network } from "lucide-react"

export type MindmapNode = {
  name: string
  definition?: string
  mechanism?: string
  examples?: string
  branches?: MindmapNode[]
}

// Generated maps sometimes carry lists or objects where text is expected; flatten everything to plain text.
const str = (v: any, d = 0): string => v == null ? "" : d > 4 ? "" : Array.isArray(v) ? v.map((x) => str(x, d + 1)).filter(Boolean).join(" ") : typeof v === "object" ? Object.values(v).map((x) => str(x, d + 1)).filter(Boolean).join(" ") : String(v)
function sanitize(n: any, d = 0): MindmapNode {
  const o: MindmapNode = { name: str(n?.name).trim() || "Untitled" }
  const def = str(n?.definition).trim(), mech = str(n?.mechanism).trim(), ex = str(n?.examples).trim()
  if (def) o.definition = def
  if (mech) o.mechanism = mech
  if (ex) o.examples = ex
  const b = n?.branches
  const list: any[] = Array.isArray(b) ? b : b && typeof b === "object" ? Object.values(b) : []
  if (d < 8 && list.length) o.branches = list.filter((x) => x && typeof x === "object").map((x) => sanitize(x, d + 1))
  return o
}

type N = { id: string; node: MindmapNode; depth: number; color: string; kids: N[]; x: number; y: number; text: string; cardH: number }

const PALETTE = ["#60a5fa", "#8b7cf6", "#2dd4bf", "#f472b6", "#f59e0b", "#38bdf8", "#34d399", "#fb7185"]
const ROOT_COLOR = "#3b82f6"
const COL = 300, CARD_W = 230, LABEL_H = 26, GAP = 20

function describe(n: MindmapNode) {
  const parts: string[] = []
  if (n.definition) parts.push(n.definition.trim())
  if (n.mechanism) parts.push("Mechanism: " + n.mechanism.trim())
  if (n.examples) parts.push("Examples: " + n.examples.trim())
  return parts.join(" ")
}
function cardHeight(text: string) {
  if (!text) return 0
  const lines = Math.min(7, Math.ceil(text.length / 34))
  return lines * 16 + 22
}
function build(node: MindmapNode, id: string, depth: number, color: string): N {
  const text = describe(node)
  const n: N = { id, node, depth, color, kids: [], x: 0, y: 0, text, cardH: cardHeight(text) }
  n.kids = (node.branches || []).map((b, i) => build(b, id + "-" + i, depth + 1, depth === 0 ? PALETTE[i % PALETTE.length] : color))
  return n
}
function count(n: N): number { return 1 + n.kids.reduce((s, k) => s + count(k), 0) }

export default function MindMapCanvas({ root }: { root: MindmapNode }) {
  const tree = useMemo(() => build(sanitize(root), "r", 0, ROOT_COLOR), [root])
  const total = useMemo(() => count(tree), [tree])

  const [collapsed, setCollapsed] = useState<Set<string>>(() => {
    const s = new Set<string>()
    if (total > 70) { const walk = (n: N) => { if (n.depth >= 2 && n.kids.length) s.add(n.id); n.kids.forEach(walk) }; walk(tree) }
    return s
  })
  const [showText, setShowText] = useState(true)
  const [view, setView] = useState({ x: 40, y: 80, k: 1 })
  const wrap = useRef<HTMLDivElement>(null)
  const viewRef = useRef(view); viewRef.current = view
  const pointers = useRef(new Map<number, { x: number; y: number }>())
  const last = useRef<{ x: number; y: number; d: number } | null>(null)
  const moved = useRef(false)
  const didFit = useRef(false)
  const travel = useRef(0)

  // layout --------------------------------------------------------------
  const layout = useMemo(() => {
    let cursor = 0
    let maxX = 0
    const nodeH = (n: N) => LABEL_H + (showText && n.cardH ? n.cardH + 6 : 0) + GAP
    const visibleKids = (n: N) => (collapsed.has(n.id) ? [] : n.kids)
    const place = (n: N) => {
      n.x = n.depth * COL
      maxX = Math.max(maxX, n.x)
      const kids = visibleKids(n)
      const start = cursor
      if (!kids.length) { n.y = cursor + LABEL_H / 2; cursor += nodeH(n); return }
      kids.forEach(place)
      const mid = (kids[0].y + kids[kids.length - 1].y) / 2
      n.y = Math.max(mid, start + LABEL_H / 2)
      cursor = Math.max(cursor, n.y + LABEL_H / 2 + (showText && n.cardH ? n.cardH + 6 : 0) + GAP)
    }
    place(tree)
    const nodes: N[] = []
    const links: { a: N; b: N }[] = []
    const walk = (n: N) => { nodes.push(n); visibleKids(n).forEach((k) => { links.push({ a: n, b: k }); walk(k) }) }
    walk(tree)
    return { nodes, links, width: maxX + CARD_W + 120, height: Math.max(cursor, 200), maxX }
  }, [tree, collapsed, showText])

  // view helpers --------------------------------------------------------
  const fit = useCallback((animate = true) => {
    const el = wrap.current; if (!el) return
    const cw = el.clientWidth, ch = el.clientHeight
    const top = 104, bottom = 96
    const left = -(CARD_W + 24), right = layout.maxX + CARD_W + 28
    const W = right - left, H = layout.height
    const k0 = Math.min((cw - 24) / W, (ch - top - bottom) / H, 1.15)
    const k = Math.max(0.4, k0)
    const x = k0 >= 0.4 ? (cw - W * k) / 2 - left * k : 12 - left * k
    const y = k0 >= 0.4 ? top + (ch - top - bottom - H * k) / 2 : Math.max(top, ch / 2 - (tree.y || H / 2) * k)
    setView({ x, y, k })
    if (!animate) didFit.current = true
  }, [layout, tree])
  useEffect(() => { if (!didFit.current) { fit(false); didFit.current = true } }, [fit])

  const zoomAt = useCallback((cx: number, cy: number, factor: number) => {
    setView((v) => { const k = Math.min(2.5, Math.max(0.15, v.k * factor)); const r = k / v.k; return { k, x: cx - (cx - v.x) * r, y: cy - (cy - v.y) * r } })
  }, [])
  const zoomCenter = (f: number) => { const el = wrap.current; if (el) zoomAt(el.clientWidth / 2, el.clientHeight / 2, f) }

  useEffect(() => {
    const el = wrap.current; if (!el) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const r = el.getBoundingClientRect()
      zoomAt(e.clientX - r.left, e.clientY - r.top, Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0016)))
    }
    el.addEventListener("wheel", onWheel, { passive: false })
    return () => el.removeEventListener("wheel", onWheel)
  }, [zoomAt])

  const onDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest("[data-ui]")) return
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    moved.current = false
    travel.current = 0
    last.current = null
  }
  const onMove = (e: React.PointerEvent) => {
    const p = pointers.current.get(e.pointerId); if (!p) return
    const prev = { ...p }
    p.x = e.clientX; p.y = e.clientY
    const pts = [...pointers.current.values()]
    if (pts.length === 1) {
      const dx = e.clientX - prev.x, dy = e.clientY - prev.y
      travel.current += Math.abs(dx) + Math.abs(dy)
      if (travel.current > 6 && !moved.current) { moved.current = true; try { (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId) } catch {} }
      setView((v) => ({ ...v, x: v.x + dx, y: v.y + dy }))
    } else if (pts.length >= 2) {
      const [a, b] = pts
      const d = Math.hypot(a.x - b.x, a.y - b.y), cx = (a.x + b.x) / 2, cy = (a.y + b.y) / 2
      const r = wrap.current!.getBoundingClientRect()
      if (last.current) { const lx = last.current.x, ly = last.current.y, ld = last.current.d || d; zoomAt(cx - r.left, cy - r.top, d / ld); setView((v) => ({ ...v, x: v.x + (cx - lx), y: v.y + (cy - ly) })) }
      last.current = { x: cx, y: cy, d }
      moved.current = true
    }
  }
  const onUp = (e: React.PointerEvent) => { pointers.current.delete(e.pointerId); last.current = null; setTimeout(() => { moved.current = false }, 0) }

  const toggle = (n: N) => {
    if (moved.current || !n.kids.length) return
    setCollapsed((s) => { const c = new Set(s); c.has(n.id) ? c.delete(n.id) : c.add(n.id); return c })
  }
  const expandAll = () => setCollapsed(new Set())
  const collapseAll = () => { const s = new Set<string>(); const walk = (n: N) => { if (n.depth >= 1 && n.kids.length) s.add(n.id); n.kids.forEach(walk) }; walk(tree); setCollapsed(s) }

  let gridPx = 30 * view.k
  while (gridPx < 18) gridPx *= 2
  const btn = "grid h-14 w-14 place-items-center text-sky-600 transition active:bg-slate-100 hover:bg-slate-50"

  return (
    <div ref={wrap} className="relative h-full w-full touch-none select-none overflow-hidden bg-[#f3f4f8]" onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}
      style={{ backgroundImage: "radial-gradient(circle, #cdd2dc 1.4px, transparent 1.6px)", backgroundSize: `${gridPx}px ${gridPx}px`, backgroundPosition: `${view.x}px ${view.y}px`, cursor: "grab" }}>
      <div className="absolute left-0 top-0 origin-top-left will-change-transform" style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.k})`, width: layout.width, height: layout.height }}>
        <svg className="pointer-events-none absolute overflow-visible" style={{ left: 0, top: 0 }} width={layout.width} height={layout.height}>
          {layout.links.map(({ a, b }) => (
            <path key={b.id} d={`M ${a.x} ${a.y} C ${a.x + COL * 0.45} ${a.y}, ${b.x - COL * 0.45} ${b.y}, ${b.x} ${b.y}`} fill="none" stroke={b.color} strokeOpacity={0.55} strokeWidth={1.8} strokeLinecap="round" />
          ))}
        </svg>

        {layout.nodes.map((n) => {
          const parent = n.kids.length > 0
          const isCollapsed = collapsed.has(n.id)
          const isRoot = n.depth === 0
          const side = parent ? "right" : "left"
          return (
            <div key={n.id}>
              {/* label + card */}
              <div style={{ position: "absolute", top: n.y - LABEL_H / 2, width: CARD_W, left: side === "right" ? n.x - 16 - CARD_W : n.x + 16, textAlign: side === "right" ? "right" : "left" }}>
                <div onClick={() => toggle(n)} className={`flex h-[26px] items-center ${side === "right" ? "justify-end" : ""} ${parent ? "cursor-pointer" : ""}`}>
                  <span className={`whitespace-nowrap font-semibold text-slate-800 ${isRoot ? "text-[15px] font-extrabold" : "text-[13px]"}`}>{n.node.name}</span>
                </div>
                {showText && n.text && (
                  <div className="mt-1.5 rounded-lg bg-white px-3 py-2 text-left text-[11.5px] leading-[16px] text-slate-600 shadow-[0_2px_10px_rgba(30,41,59,.08)] ring-1 ring-slate-200/70" style={{ width: CARD_W, display: "-webkit-box", WebkitLineClamp: 7, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{n.text}</div>
                )}
              </div>

              {/* dot */}
              <button data-node onClick={() => toggle(n)} aria-label={n.node.name}
                className="absolute grid place-items-center rounded-full border-2 bg-white transition-transform hover:scale-125"
                style={{ left: n.x - 9, top: n.y - 9, width: 18, height: 18, borderColor: isRoot ? ROOT_COLOR : n.color, background: isRoot || isCollapsed ? (isRoot ? ROOT_COLOR : n.color) : "#fff", boxShadow: isRoot ? "0 0 0 5px rgba(59,130,246,.2)" : "none" }}>
                {parent && !isRoot && <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border border-white bg-amber-400" />}
              </button>
            </div>
          )
        })}
      </div>

      {/* right controls */}
      <div data-ui className="absolute bottom-24 right-3 z-10 flex flex-col gap-3 sm:bottom-6">
        <div className="overflow-hidden rounded-3xl bg-white shadow-[0_8px_30px_rgba(30,41,59,.14)] ring-1 ring-slate-200/70">
          <button data-ui aria-label="Toggle descriptions" onClick={() => setShowText((v) => !v)} className={`grid h-14 w-14 place-items-center transition ${showText ? "bg-emerald-50 text-emerald-600" : "text-slate-400 hover:bg-slate-50"}`}><FileText className="h-6 w-6" /></button>
          <div className="h-px bg-slate-100" />
          <button data-ui aria-label="Expand all" onClick={expandAll} className={btn}><ChevronsUpDown className="h-6 w-6" /></button>
          <div className="h-px bg-slate-100" />
          <button data-ui aria-label="Collapse all" onClick={collapseAll} className={btn}><ChevronsDownUp className="h-6 w-6" /></button>
        </div>
        <div className="overflow-hidden rounded-3xl bg-white shadow-[0_8px_30px_rgba(30,41,59,.14)] ring-1 ring-slate-200/70">
          <button data-ui aria-label="Zoom in" onClick={() => zoomCenter(1.25)} className={btn + " !text-slate-700"}><Plus className="h-6 w-6" /></button>
          <div className="h-px bg-slate-100" />
          <button data-ui aria-label="Zoom out" onClick={() => zoomCenter(0.8)} className={btn + " !text-slate-700"}><Minus className="h-6 w-6" /></button>
          <div className="h-px bg-slate-100" />
          <button data-ui aria-label="Fit to screen" onClick={() => fit(true)} className={btn + " !text-slate-700"}><Scan className="h-6 w-6" /></button>
        </div>
      </div>

      {/* node count */}
      <div data-ui className="absolute bottom-4 left-4 z-10 flex items-center gap-3 rounded-2xl bg-white px-5 py-3 shadow-[0_8px_30px_rgba(30,41,59,.14)] ring-1 ring-slate-200/70">
        <Network className="h-6 w-6 text-sky-500" />
        <span className="text-lg font-bold text-slate-700">{total} nodes</span>
      </div>
    </div>
  )
}
