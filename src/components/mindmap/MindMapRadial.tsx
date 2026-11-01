"use client"

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { Check, ChevronDown, FileText } from "lucide-react"
import { sanitize, type MindmapNode } from "@/components/mindmap/MindMapCanvas"

// Branch colours: dark enough for white text.
const COLORS = ["#1d4ed8", "#6d28d9", "#0f766e", "#be185d", "#b45309", "#0369a1", "#15803d", "#b91c1c", "#4338ca", "#a21caf"]
const tint = (hex: string) => hex + "1f"

const describe = (n: MindmapNode) => {
  const p: string[] = []
  if (n.definition) p.push(n.definition.trim())
  if (n.mechanism) p.push("Mechanism: " + n.mechanism.trim())
  if (n.examples) p.push("Examples: " + n.examples.trim())
  return p.join(" ")
}
const countAll = (n: MindmapNode): number => 1 + (n.branches || []).reduce((s, b) => s + countAll(b), 0)

function Point({ node, color, notes, depth }: { node: MindmapNode; color: string; notes: boolean; depth: number }) {
  const kids = node.branches || []
  const [open, setOpen] = useState(depth < 1)
  const text = describe(node)
  const head = (
    <span className="flex min-w-0 flex-1 items-start gap-3">
      <span className="mt-[5px] h-3.5 w-3.5 shrink-0 rounded-full border-[3px] bg-white" style={{ borderColor: color }} />
      <span className="min-w-0 flex-1 text-left text-[14.5px] font-bold leading-snug text-slate-900">{node.name}</span>
      {kids.length > 0 && (
        <span className="flex shrink-0 items-center gap-1 text-xs font-bold text-slate-500">
          {kids.length}<ChevronDown className={`h-4 w-4 transition ${open ? "rotate-180" : ""}`} />
        </span>
      )}
    </span>
  )
  return (
    <div className="py-1.5">
      {kids.length > 0 ? (
        <button onClick={() => setOpen((v) => !v)} aria-expanded={open} className="flex min-h-[28px] w-full items-start">{head}</button>
      ) : (
        <div className="flex min-h-[28px] w-full items-start">{head}</div>
      )}
      {notes && text && <div className="ml-[26px] mt-1.5 rounded-xl px-3 py-2 text-[13px] leading-relaxed text-slate-700" style={{ background: tint(color) }}>{text}</div>}
      {open && kids.length > 0 && (
        <div className="relative ml-[7px] mt-1 border-l-2 pl-4" style={{ borderColor: color + "55" }}>
          {kids.map((k, i) => <Point key={i} node={k} color={color} notes={notes} depth={depth + 1} />)}
        </div>
      )}
    </div>
  )
}

export default function MindMapRadial({ root, storageKey }: { root: MindmapNode; storageKey: string }) {
  const tree = useMemo(() => sanitize(root), [root])
  const branches = tree.branches || []
  const n = branches.length
  const mapRef = useRef<HTMLDivElement>(null)
  const [box, setBox] = useState({ w: 360, h: 380 })
  const [sel, setSel] = useState(0)
  const [notes, setNotes] = useState(true)
  const [tall, setTall] = useState(false)
  const [done, setDone] = useState<Record<number, boolean>>({})

  useEffect(() => {
    try { setDone(JSON.parse(localStorage.getItem("mm-done-" + storageKey) || "{}")) } catch {}
  }, [storageKey])
  const flip = (i: number) => setDone((d) => {
    const m = { ...d, [i]: !d[i] }
    try { localStorage.setItem("mm-done-" + storageKey, JSON.stringify(m)) } catch {}
    return m
  })

  useLayoutEffect(() => {
    const el = mapRef.current; if (!el) return
    const read = () => setBox({ w: el.clientWidth, h: el.clientHeight })
    read()
    const ro = new ResizeObserver(read); ro.observe(el)
    return () => ro.disconnect()
  }, [tall])

  // geometry: bubbles on an ellipse around the centre
  const size = n <= 6 ? 100 : n <= 8 ? 88 : n <= 10 ? 76 : 64
  const centre = Math.min(120, Math.max(84, size + 20))
  const rx = Math.max(60, (box.w - size) / 2 - 8)
  const ry = Math.max(60, (box.h - size) / 2 - 8)
  const cx = box.w / 2, cy = box.h / 2
  const pos = branches.map((_, i) => {
    const a = (-90 + (360 / Math.max(n, 1)) * i) * Math.PI / 180
    return { x: cx + rx * Math.cos(a), y: cy + ry * Math.sin(a) }
  })
  const cur = branches[Math.min(sel, Math.max(n - 1, 0))]
  const curColor = COLORS[Math.min(sel, Math.max(n - 1, 0)) % COLORS.length]
  const doneCount = Object.values(done).filter(Boolean).length

  if (!n) return <div className="grid h-full place-items-center text-slate-500">This mind map has no branches.</div>

  return (
    <div className="flex h-full w-full flex-col bg-white pt-[84px]">
      <div className="flex items-center justify-end px-4 pb-1">
        <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-[#14295c]">{doneCount} / {n} revised</span>
      </div>

      {/* map */}
      <div ref={mapRef} className={`relative min-h-0 ${tall ? "h-[26%]" : "flex-1"}`}>
        {!tall && (
          <svg className="pointer-events-none absolute inset-0" width={box.w} height={box.h} aria-hidden="true">
            {pos.map((p, i) => <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke={COLORS[i % COLORS.length]} strokeOpacity={0.45} strokeWidth={3} strokeLinecap="round" />)}
          </svg>
        )}
        {!tall && (
          <div className="absolute grid place-items-center rounded-full bg-[#14295c] text-center text-white" style={{ left: cx - centre / 2, top: cy - centre / 2, width: centre, height: centre, boxShadow: "0 0 0 8px #e6edff" }}>
            <div className="px-2.5">
              <div className="line-clamp-3 font-serif text-[16px] font-bold leading-tight">{tree.name}</div>
              <div className="mt-1 text-[11px] font-bold text-[#f1d98a]">{n} branches</div>
            </div>
          </div>
        )}
        {!tall && branches.map((b, i) => {
          const on = i === sel, c = COLORS[i % COLORS.length]
          return (
            <button key={i} onClick={() => setSel(i)} aria-pressed={on} aria-label={b.name}
              className="absolute grid place-items-center rounded-full border-[3px] p-1.5 text-center transition active:scale-95"
              style={{ left: pos[i].x - size / 2, top: pos[i].y - size / 2, width: size, height: size, borderColor: c, background: on ? c : "#fff", color: on ? "#fff" : "#0f1b3d", boxShadow: on ? "0 8px 22px rgba(15,27,61,.28)" : "0 3px 10px rgba(15,27,61,.1)" }}>
              <span>
                <span className="block text-[11px] font-extrabold opacity-85">{i + 1}</span>
                <span className="line-clamp-3 block break-words font-extrabold leading-[1.15]" style={{ fontSize: size >= 88 ? 12.5 : 11 }}>{b.name}</span>
              </span>
              {done[i] && <span className="absolute -right-0.5 -top-0.5 grid h-6 w-6 place-items-center rounded-full border-2 border-white bg-green-700 text-white"><Check className="h-3 w-3" strokeWidth={4} /></span>}
            </button>
          )
        })}
        {tall && (
          <div className="flex h-full items-center gap-2 overflow-x-auto px-4" style={{ scrollbarWidth: "none" }}>
            {branches.map((b, i) => (
              <button key={i} onClick={() => setSel(i)} className="shrink-0 rounded-full border-2 px-3 py-2 text-xs font-extrabold" style={{ borderColor: COLORS[i % COLORS.length], background: i === sel ? COLORS[i % COLORS.length] : "#fff", color: i === sel ? "#fff" : "#0f1b3d" }}>{i + 1}. {b.name}</button>
            ))}
          </div>
        )}
      </div>

      {/* detail sheet */}
      <div className={`flex flex-col rounded-t-[28px] bg-slate-50 shadow-[0_-12px_32px_rgba(15,27,61,.12)] ${tall ? "min-h-0 flex-1" : "h-[44%] min-h-[240px]"}`}>
        <button onClick={() => setTall((v) => !v)} aria-label={tall ? "Show the map" : "Expand the details"} className="grid h-7 w-full place-items-center">
          <span className="h-1 w-10 rounded-full bg-slate-300" />
        </button>
        <div className="flex items-center gap-3 px-4 pb-2">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-[15px] font-extrabold text-white" style={{ background: curColor }}>{sel + 1}</span>
          <div className="min-w-0 flex-1 text-lg font-extrabold leading-tight text-slate-900">{cur.name}</div>
          <button onClick={() => setNotes((v) => !v)} aria-pressed={notes} aria-label="Show or hide short notes" className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl border ${notes ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-white text-slate-400"}`}><FileText className="h-5 w-5" /></button>
          <button onClick={() => flip(sel)} aria-pressed={!!done[sel]} className={`flex h-11 shrink-0 items-center gap-1.5 rounded-2xl border-[1.5px] px-3 text-[13px] font-bold ${done[sel] ? "border-green-700 bg-green-700 text-white" : "border-slate-300 bg-white text-slate-700"}`}>
            <Check className="h-4 w-4" strokeWidth={3} />{done[sel] ? "Revised" : "Mark revised"}
          </button>
        </div>
        <div className="min-h-0 flex-1 space-y-1 overflow-y-auto px-4 pb-24" key={sel}>
          {describe(cur) && <div className="rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed text-slate-700" style={{ background: tint(curColor) }}>{describe(cur)}</div>}
          {(cur.branches || []).length === 0 && !describe(cur) && <p className="py-4 text-sm text-slate-500">No sub-topics under this branch.</p>}
          {(cur.branches || []).map((k, i) => <div key={i} className="rounded-2xl border border-slate-200 bg-white px-3.5 py-1"><Point node={k} color={curColor} notes={notes} depth={0} /></div>)}
        </div>
      </div>
    </div>
  )
}
