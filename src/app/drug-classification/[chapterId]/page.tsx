"use client"
import Link from "next/link"
import { use, useEffect, useState } from "react"
import { ArrowLeft, Minus, Plus } from "lucide-react"
import { DRUG_CHAPTERS } from "@/data/drug-classification"
import { DrugChartView } from "@/components/drugs/DrugChartView"

export default function DrugChapterPage({ params }: { params: Promise<{ chapterId: string }> }) {
  const { chapterId } = use(params)
  const chapter = DRUG_CHAPTERS.find((c) => c.id === chapterId)
  const [view, setView] = useState<"chart" | "list">("chart")
  const [doses, setDoses] = useState(true)
  const [brands, setBrands] = useState(true)
  const [zoom, setZoom] = useState(1)
  const zoomBy = (f: number) => setZoom((z) => Math.min(3, Math.max(0.5, Math.round(z * f * 100) / 100)))
  // the wide chart needs sideways scrolling on a phone, so phones start on the simple list
  useEffect(() => { if (window.innerWidth < 640) setView("list") }, [])

  if (!chapter) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <p className="text-muted-foreground">That chapter is not available yet.</p>
        <Link href="/drug-classification" className="mt-4 inline-block font-bold text-primary">Back to chapters</Link>
      </div>
    )
  }
  const pill = (on: boolean) => `min-h-[40px] rounded-full px-4 text-sm font-bold transition ${on ? "bg-[#e31e24] text-white" : "border border-[#f3c9c0] bg-white text-[#7a1212]"}`
  return (
    <div className="mx-auto max-w-5xl px-3 py-6 sm:px-4">
      <Link href="/drug-classification" className="mb-3 inline-flex items-center gap-1 text-sm font-bold text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> All chapters</Link>
      <div className="flex items-center gap-4">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border-2 border-[#e31e24] bg-[#fde4de] text-xl font-extrabold text-[#e31e24]">{chapter.number}</span>
        <h1 className="text-2xl font-extrabold leading-tight text-[#2b1b1b]">{chapter.title}</h1>
      </div>

      <div className="sticky top-[68px] z-20 -mx-3 mt-4 flex flex-wrap items-center gap-2 bg-white/95 px-3 py-2 backdrop-blur sm:mx-0 sm:px-0">
        <button className={pill(view === "chart")} onClick={() => setView("chart")}>Chart</button>
        <button className={pill(view === "list")} onClick={() => setView("list")}>List</button>
        <button className={pill(doses)} onClick={() => setDoses((v) => !v)} aria-pressed={doses}>Doses</button>
        <span className="ml-auto inline-flex items-center gap-1 rounded-full border border-[#f3c9c0] bg-white p-0.5">
          <button aria-label="Zoom out" className="grid h-9 w-9 place-items-center rounded-full text-[#7a1212] hover:bg-[#fde4de]" onClick={() => zoomBy(1 / 1.2)}><Minus className="h-4 w-4" /></button>
          <button aria-label="Reset zoom" className="min-w-[48px] text-xs font-bold text-[#7a1212]" onClick={() => setZoom(1)}>{Math.round(zoom * 100)}%</button>
          <button aria-label="Zoom in" className="grid h-9 w-9 place-items-center rounded-full text-[#7a1212] hover:bg-[#fde4de]" onClick={() => zoomBy(1.2)}><Plus className="h-4 w-4" /></button>
        </span>
        {view === "list" && <button className={pill(brands)} onClick={() => setBrands((v) => !v)} aria-pressed={brands}>Brands</button>}
      </div>
      <div className="flex gap-2 overflow-x-auto pb-2 pt-1" style={{ scrollbarWidth: "none" }}>
        {chapter.charts.map((c) => <a key={c.id} href={`#${c.id}`} className="shrink-0 rounded-full bg-[#fde4de] px-3 py-1.5 text-xs font-bold text-[#7a1212]">{c.title}</a>)}
      </div>

      <div className="mt-2 space-y-5">
        {chapter.charts.map((c) => <section key={c.id} id={c.id} className="scroll-mt-32"><DrugChartView chart={c} showDoses={doses} showBrands={brands} view={view} zoom={zoom} onZoom={zoomBy} /></section>)}
      </div>
      <p className="mt-6 text-center text-xs text-muted-foreground">Doses and brand names are for quick revision. The chart shows names and short doses; the List shows full doses and brands. Check a current formulary before prescribing.</p>
    </div>
  )
}
