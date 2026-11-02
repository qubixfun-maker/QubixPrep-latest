"use client"

import { useEffect, useLayoutEffect, useRef, useState } from "react"
import { ChevronDown } from "lucide-react"
import { CLASS_INFO, drugBrand, drugDose, drugName, type DrugChart, type DrugNode } from "@/data/drug-classification"

// Look of the printed classification charts: red boxes for the branches, a salmon heading over a white list of drugs,
// red connecting lines, doses in maroon.
const RED = "#e31e24"
const SALMON = "#f9b8a8"
const MAROON = "#8a1c1c"

const CSS = `
.dtree ul{display:flex;justify-content:center;margin:0;padding:20px 0 0;position:relative}
.dtree li{list-style:none;display:flex;flex-direction:column;align-items:center;position:relative;padding:20px 7px 0}
.dtree li::before,.dtree li::after{content:"";position:absolute;top:0;right:50%;width:50%;height:20px;border-top:3px solid ${RED}}
.dtree li::after{right:auto;left:50%;border-left:3px solid ${RED}}
.dtree li:only-child::before,.dtree li:only-child::after{display:none}
.dtree li:only-child{padding-top:0}
.dtree li:first-child::before,.dtree li:last-child::after{border:0 none}
.dtree li:last-child::before{border-right:3px solid ${RED};border-radius:0 6px 0 0}
.dtree li:first-child::after{border-radius:6px 0 0 0}
.dtree ul ul::before{content:"";position:absolute;top:0;left:50%;border-left:3px solid ${RED};height:20px}
.dtree>ul{padding-top:0}
.dtree>ul>li{padding-top:0}
.dtree>ul>li::before,.dtree>ul>li::after{display:none}
`

function Node({ node, showDoses, top }: { node: DrugNode; showDoses: boolean; top?: boolean }) {
  const kids = node.children || []
  const hasDrugs = (node.drugs || []).length > 0
  const leaf = hasDrugs || kids.length === 0
  return (
    <li>
      {leaf ? (
        <div className="min-w-[116px] max-w-[190px]" style={{ borderRadius: 6, boxShadow: "0 2px 6px rgba(0,0,0,.18)", border: "1px solid #c9c9c9", background: "#fff" }}>
          <div className="px-2 py-1 text-center text-[13px] font-extrabold leading-tight text-[#2b1b1b]" style={{ background: SALMON, borderRadius: "5px 5px 0 0", borderBottom: "1px solid #e8a090" }}>{node.name}</div>
          <div style={{ padding: "6px 8px 7px" }}>
            {(node.drugs || []).map((d, i) => (
              <div key={i} className="text-left" style={{ padding: "1.5px 0" }}>
                <div className="text-[13.5px] leading-snug text-[#111]">{drugName(d)}</div>
                {showDoses && drugDose(d) && <div className="line-clamp-2 text-[11px] leading-snug" style={{ color: MAROON }}>{drugDose(d)}</div>}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="whitespace-pre-line px-3 py-1.5 text-center font-extrabold leading-tight text-white" style={{ background: RED, borderRadius: 4, fontSize: top ? 15 : 13 }}>{node.name}</div>
      )}
      {kids.length > 0 && (
        <ul>{kids.map((k, i) => <Node key={i} node={k} showDoses={showDoses} />)}</ul>
      )}
    </li>
  )
}

/** Outline version of the same chart, easier to read on a phone. */
function Outline({ node, showDoses, showBrands, depth = 0 }: { node: DrugNode; showDoses: boolean; showBrands: boolean; depth?: number }) {
  return (
    <div className={depth ? "ml-3 border-l-2 pl-3" : ""} style={{ borderColor: "#f3b3a9" }}>
      <div className={`py-1 font-extrabold ${depth === 0 ? "whitespace-pre-line text-[15px]" : "text-[14px]"}`} style={{ color: node.children?.length ? RED : "#2b1b1b" }}>{node.name}</div>
      {(node.drugs || []).length > 0 && (
        <ul className="mb-2 space-y-1 rounded-xl bg-[#fff4f1] px-3 py-2">
          {node.drugs!.map((d, i) => (
            <li key={i} className="text-[14px] leading-snug">
              <span className="font-semibold text-slate-900">{drugName(d)}</span>
              {showDoses && drugDose(d) && <span className="block text-[12px]" style={{ color: MAROON }}>{drugDose(d)}</span>}
              {showBrands && drugBrand(d) && <span className="block text-[12px] italic text-slate-500">Brands: {drugBrand(d)}</span>}
            </li>
          ))}
        </ul>
      )}
      {(node.children || []).map((k, i) => <Outline key={i} node={k} showDoses={showDoses} showBrands={showBrands} depth={depth + 1} />)}
    </div>
  )
}

const INFO_SECTIONS: { key: "moa" | "uses" | "adr" | "ci"; label: string; color: string }[] = [
  { key: "moa", label: "Mechanism of action", color: "#1d4ed8" },
  { key: "uses", label: "Uses", color: "#15803d" },
  { key: "adr", label: "Side effects", color: "#b45309" },
  { key: "ci", label: "Contraindications", color: "#b91c1c" },
]

function InfoPanel({ id }: { id: string }) {
  const [open, setOpen] = useState(false)
  const info = CLASS_INFO[id]
  if (!info) return null
  return (
    <div className="border-b border-[#f3c9c0] bg-[#fffaf8]">
      <button onClick={() => setOpen((v) => !v)} aria-expanded={open} className="flex min-h-[44px] w-full items-center justify-between px-4 text-left text-sm font-bold text-[#7a1212]">
        <span>Mechanism, uses, side effects &amp; contraindications</span>
        <ChevronDown className={`h-4 w-4 transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="grid gap-3 px-4 pb-4 sm:grid-cols-2">
          {INFO_SECTIONS.map((sec) => (
            <div key={sec.key} className="rounded-xl border bg-white p-3" style={{ borderColor: sec.color + "33" }}>
              <div className="mb-1 text-xs font-extrabold uppercase tracking-wide" style={{ color: sec.color }}>{sec.label}</div>
              <ul className="list-disc space-y-0.5 pl-4 text-[13px] leading-snug text-slate-800">
                {info[sec.key].split("; ").map((t, i) => <li key={i}>{t}</li>)}
              </ul>
            </div>
          ))}
          <p className="text-[11px] text-slate-500 sm:col-span-2">Quick-revision summary for the whole class. Individual drugs differ; check a standard text or formulary.</p>
        </div>
      )}
    </div>
  )
}

export function DrugChartView({ chart, showDoses, showBrands = true, view, zoom = 1, onZoom }: { chart: DrugChart; showDoses: boolean; showBrands?: boolean; view: "chart" | "list"; zoom?: number; onZoom?: (factor: number) => void }) {
  const box = useRef<HTMLDivElement>(null)
  const inner = useRef<HTMLDivElement>(null)
  const [fit, setFit] = useState({ k: 1, w: 0, h: 0 })
  const zoomCb = useRef(onZoom)
  zoomCb.current = onZoom

  useLayoutEffect(() => {
    if (view !== "chart") return
    const el = box.current, inn = inner.current
    if (!el || !inn) return
    const measure = () => {
      const w = inn.scrollWidth, h = inn.scrollHeight
      const k = Math.max(0.62, Math.min(1, (el.clientWidth - 8) / w))
      setFit({ k, w, h })
    }
    measure()
    const ro = new ResizeObserver(measure); ro.observe(el); ro.observe(inn)
    return () => ro.disconnect()
  }, [view, showDoses, chart])

  // pinch with two fingers, or Ctrl + mouse wheel / trackpad pinch, zooms every chart
  const body = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = body.current
    if (!el) return
    let d0 = 0
    const dist = (t: TouchList) => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY)
    const wheel = (e: WheelEvent) => { if (e.ctrlKey || e.metaKey) { e.preventDefault(); zoomCb.current?.(e.deltaY < 0 ? 1.1 : 1 / 1.1) } }
    const start = (e: TouchEvent) => { if (e.touches.length === 2) d0 = dist(e.touches) }
    const move = (e: TouchEvent) => {
      if (e.touches.length === 2 && d0) {
        e.preventDefault()
        const d = dist(e.touches)
        if (Math.abs(d / d0 - 1) > 0.04) { zoomCb.current?.(d / d0); d0 = d }
      }
    }
    const end = () => { d0 = 0 }
    el.addEventListener("wheel", wheel, { passive: false })
    el.addEventListener("touchstart", start, { passive: true })
    el.addEventListener("touchmove", move, { passive: false })
    el.addEventListener("touchend", end)
    return () => { el.removeEventListener("wheel", wheel); el.removeEventListener("touchstart", start); el.removeEventListener("touchmove", move); el.removeEventListener("touchend", end) }
  }, [])

  const scale = fit.k * zoom
  return (
    <div className="overflow-hidden rounded-3xl border border-[#f3c9c0] bg-white shadow-sm">
      <div className="flex items-center gap-3 px-4 py-3" style={{ background: "#fde4de" }}>
        <span className="h-5 w-1.5 rounded-full" style={{ background: RED }} />
        <h2 className="text-[15px] font-extrabold text-[#5a1010]">{chart.title}</h2>
      </div>
      <InfoPanel id={chart.id} />
      <div ref={body} style={{ touchAction: "pan-x pan-y" }}>
        {view === "chart" ? (
          <div ref={box} className="overflow-auto px-1 py-4" style={{ WebkitOverflowScrolling: "touch", maxHeight: zoom > 1 ? "85vh" : undefined }}>
            <style>{CSS}</style>
            <div className="mx-auto" style={{ width: fit.w ? fit.w * scale : undefined, height: fit.h ? fit.h * scale : undefined }}>
              <div ref={inner} className="dtree w-max origin-top-left" style={{ transform: `scale(${scale})` }}>
                <ul><Node node={chart.root} showDoses={showDoses} top /></ul>
              </div>
            </div>
            {chart.footnote && <p className="mt-2 px-3 text-xs text-slate-600">{chart.footnote}</p>}
          </div>
        ) : (
          <div className="px-4 py-4" style={{ zoom } as React.CSSProperties}>
            <Outline node={chart.root} showDoses={showDoses} showBrands={showBrands} />
            {chart.footnote && <p className="mt-2 text-xs text-slate-600">{chart.footnote}</p>}
          </div>
        )}
      </div>
    </div>
  )
}
