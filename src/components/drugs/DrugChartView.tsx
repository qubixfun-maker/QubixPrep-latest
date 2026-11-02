"use client"

import { useLayoutEffect, useRef, useState } from "react"
import { drugBrand, drugDose, drugName, type DrugChart, type DrugNode } from "@/data/drug-classification"

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

export function DrugChartView({ chart, showDoses, showBrands = true, view }: { chart: DrugChart; showDoses: boolean; showBrands?: boolean; view: "chart" | "list" }) {
  const box = useRef<HTMLDivElement>(null)
  const inner = useRef<HTMLDivElement>(null)
  const [fit, setFit] = useState({ k: 1, h: 0 })

  useLayoutEffect(() => {
    if (view !== "chart") return
    const el = box.current, inn = inner.current
    if (!el || !inn) return
    const measure = () => {
      const w = inn.scrollWidth, h = inn.scrollHeight
      const k = Math.max(0.62, Math.min(1, (el.clientWidth - 8) / w))
      setFit({ k, h: h * k })
    }
    measure()
    const ro = new ResizeObserver(measure); ro.observe(el); ro.observe(inn)
    return () => ro.disconnect()
  }, [view, showDoses, chart])

  return (
    <div className="overflow-hidden rounded-3xl border border-[#f3c9c0] bg-white shadow-sm">
      <div className="flex items-center gap-3 px-4 py-3" style={{ background: "#fde4de" }}>
        <span className="h-5 w-1.5 rounded-full" style={{ background: RED }} />
        <h2 className="text-[15px] font-extrabold text-[#5a1010]">{chart.title}</h2>
      </div>
      {view === "chart" ? (
        <div ref={box} className="overflow-x-auto px-1 py-4" style={{ WebkitOverflowScrolling: "touch" }}>
          <style>{CSS}</style>
          <div style={{ height: fit.h || undefined, minWidth: "min-content" }}>
            <div ref={inner} className="dtree mx-auto w-max origin-top-left" style={{ transform: `scale(${fit.k})`, marginLeft: fit.k < 1 ? 0 : undefined }}>
              <ul><Node node={chart.root} showDoses={showDoses} top /></ul>
            </div>
          </div>
          {chart.footnote && <p className="mt-2 px-3 text-xs text-slate-600">{chart.footnote}</p>}
        </div>
      ) : (
        <div className="px-4 py-4">
          <Outline node={chart.root} showDoses={showDoses} showBrands={showBrands} />
          {chart.footnote && <p className="mt-2 text-xs text-slate-600">{chart.footnote}</p>}
        </div>
      )}
    </div>
  )
}
