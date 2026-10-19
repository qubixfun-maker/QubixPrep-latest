"use client"

import { useEffect, useMemo, useState, useCallback } from "react"
import { ArrowLeft, Printer, Copy, Presentation as PresentIcon, ChevronLeft, ChevronRight, X, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { CaseDef, Answers } from "@/lib/casepres/types"
import { StudyPanel } from "./study-panel"
import { buildDocument, openingStatement, docToText, type DocSection, type DocLine, type ExamItem } from "@/lib/casepres/format"

function PresentRow({ i, big }: { i: ExamItem; big?: boolean }) {
  return (
    <li className={cn("rounded-lg border border-teal-100 bg-teal-50/50 px-3 py-2", big ? "text-lg" : "text-[15px]")}>
      <div className="font-semibold text-teal-900">{i.label}{i.detail && <span className="font-normal text-slate-800">: {i.detail}</span>}</div>
      {i.meaning && <div className={cn("text-slate-600 leading-relaxed mt-0.5", big ? "text-base" : "text-sm")}>{i.meaning}</div>}
      {i.photo && <img src={i.photo} alt={i.label} className="mt-2 max-h-48 rounded-lg border border-slate-200" />}
    </li>
  )
}

function TestCard({ i, explain, big }: { i: ExamItem; explain: boolean; big?: boolean }) {
  const pos = i.tone === "pos"
  return (
    <li className={cn("rounded-xl border px-4 py-3", pos ? "border-teal-200 bg-teal-50/60" : "border-slate-200 bg-slate-50")}>
      <div className="flex flex-wrap items-center gap-2">
        <span className={cn("font-semibold text-slate-900", big ? "text-lg" : "text-[15px]")}>{i.test?.name}</span>
        <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide", pos ? "bg-teal-600 text-white" : "bg-slate-300 text-slate-800")}>{i.result}</span>
      </div>
      {i.detail && <div className={cn("text-slate-800 mt-1", big ? "text-base" : "text-sm")}>{i.detail}</div>}
      {i.photo && <img src={i.photo} alt={i.label} className="mt-2 max-h-48 rounded-lg border border-slate-200" />}
      {i.meaning && <div className={cn("mt-1.5 text-slate-900 leading-relaxed", big ? "text-base" : "text-sm")}><b>Interpretation: </b>{i.meaning}</div>}
      {explain && i.test?.how && (
        <div className={cn("mt-2 space-y-1 text-slate-600 leading-relaxed border-t border-slate-200/80 pt-2", big ? "text-base" : "text-sm")}>
          <div><b className="text-slate-700">Method: </b>{i.test.how}</div>
          {i.test.why && <div><b className="text-slate-700">Why we do it: </b>{i.test.why}</div>}
        </div>
      )}
    </li>
  )
}

function Line({ l, big, explain }: { l: DocLine; big?: boolean; explain: boolean }) {
  const t = big ? "text-lg" : "text-[15px]"
  switch (l.k) {
    case "kv":
      return (
        <div className={cn("grid gap-x-4 gap-y-0.5 sm:grid-cols-[200px_1fr] py-2 border-b border-slate-100 last:border-0", t)}>
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 pt-1">{l.label}</div>
          <div className="text-slate-900 whitespace-pre-wrap leading-relaxed">{l.value}</div>
        </div>
      )
    case "para":
      return <p className={cn("text-slate-800 leading-[1.75] py-1 text-justify", t)}>{l.text}</p>
    case "list":
      return (
        <ol className={cn("space-y-1.5 py-1", t)}>
          {l.items.map((i, n) => (
            <li key={n} className="flex gap-3 text-slate-900">
              <span className="shrink-0 h-6 w-6 rounded-full bg-teal-600 text-white text-xs font-bold flex items-center justify-center mt-0.5">{n + 1}</span>
              <span className="leading-relaxed">{i}</span>
            </li>
          ))}
        </ol>
      )
    case "exam":
      return (
        <div className="py-2 space-y-3">
          {l.present.length > 0 && (
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-teal-700 mb-1.5">{l.label}: present</div>
              <ul className="space-y-1.5">{l.present.map((i) => <PresentRow key={i.label} i={i} big={big} />)}</ul>
            </div>
          )}
          {l.tests.length > 0 && (
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-600 mb-1.5">Tests and signs</div>
              <ul className="space-y-2">{l.tests.map((i) => <TestCard key={i.label} i={i} explain={explain} big={big} />)}</ul>
            </div>
          )}
          {l.absent.length > 0 && (
            <div className={cn("text-slate-600 leading-relaxed", big ? "text-base" : "text-sm")}>
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 mr-2">{l.label}: absent / normal</span>
              {l.absent.join(", ")}
            </div>
          )}
        </div>
      )
    case "present":
      return (
        <div className="py-2">
          <div className="text-xs font-semibold uppercase tracking-wide text-teal-700 mb-1.5">{l.label}: present</div>
          <div className="flex flex-wrap gap-1.5">
            {l.items.map((i) => (
              <span key={i} className={cn("rounded-md bg-teal-50 border border-teal-200 text-teal-900 px-2.5 py-1 font-medium", big ? "text-base" : "text-sm")}>{i}</span>
            ))}
          </div>
        </div>
      )
    case "absent":
      return (
        <div className={cn("py-1.5 text-slate-600 leading-relaxed", big ? "text-base" : "text-sm")}>
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 mr-2">{l.label}: absent / normal</span>
          {l.items.join(", ")}
        </div>
      )
    case "vitals":
      return (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 py-2">
          {l.items.map((i) => (
            <div key={i.label} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              <div className="text-[11px] uppercase tracking-wide text-slate-500">{i.label}</div>
              <div className={cn("font-bold text-slate-900", big ? "text-xl" : "text-base")}>{i.value}</div>
            </div>
          ))}
        </div>
      )
  }
}

function SectionBlock({ s, n, big, explain }: { s: DocSection; n: number; big?: boolean; explain: boolean }) {
  return (
    <section className="break-inside-avoid-page">
      <div className="flex items-center gap-3 mb-2">
        <span className="h-8 w-8 rounded-lg bg-slate-900 text-white font-bold text-sm flex items-center justify-center shrink-0">{n}</span>
        <h2 className={cn("font-bold text-slate-900 tracking-tight", big ? "text-2xl" : "text-lg")}>{s.title}</h2>
      </div>
      {s.id === "particulars" || s.id === "particular" ? (
        <div className="sm:pl-11 grid sm:grid-cols-2 gap-x-6 gap-y-2">
          {s.lines.map((l, i) => l.k === "kv" ? (
            <div key={i} className="border-b border-slate-100 pb-1.5">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{l.label}</div>
              <div className={cn("text-slate-900", big ? "text-lg" : "text-[15px]")}>{l.value}</div>
            </div>
          ) : <Line key={i} l={l} big={big} explain={explain} />)}
        </div>
      ) : (
        <div className="pl-0 sm:pl-11">{s.lines.map((l, i) => <Line key={i} l={l} big={big} explain={explain} />)}</div>
      )}
    </section>
  )
}

export function CasePresentation({ caseDef, answers, onBack }: { caseDef: CaseDef; answers: Answers; onBack: () => void }) {
  const sections = useMemo(() => buildDocument(caseDef, answers), [caseDef, answers])
  const opening = useMemo(() => openingStatement(caseDef, answers), [caseDef, answers])
  const [slides, setSlides] = useState(false)
  const [i, setI] = useState(0)
  const [copied, setCopied] = useState(false)
  const [explain, setExplain] = useState(true)
  const today = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
  const total = sections.length + 1

  const next = useCallback(() => setI((x) => Math.min(x + 1, total - 1)), [total])
  const prev = useCallback(() => setI((x) => Math.max(x - 1, 0)), [])
  useEffect(() => {
    if (!slides) return
    const h = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " " || e.key === "PageDown") { e.preventDefault(); next() }
      else if (e.key === "ArrowLeft" || e.key === "PageUp") { e.preventDefault(); prev() }
      else if (e.key === "Escape") setSlides(false)
    }
    window.addEventListener("keydown", h)
    return () => window.removeEventListener("keydown", h)
  }, [slides, next, prev])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(docToText(caseDef, answers))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <style>{`@media print {
        body * { visibility: hidden !important; }
        #case-paper, #case-paper * { visibility: visible !important; }
        #case-paper { position: absolute; left: 0; top: 0; width: 100%; box-shadow: none !important; border: 0 !important; }
        .no-print { display: none !important; }
      }`}</style>

      <div className="no-print flex flex-wrap items-center gap-2 mb-4">
        <Button variant="outline" onClick={onBack} className="gap-2"><ArrowLeft className="h-4 w-4" /> Back to edit</Button>
        <div className="flex-1" />
        <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer select-none">
          <input type="checkbox" checked={explain} onChange={(e) => setExplain(e.target.checked)} className="h-4 w-4 accent-teal-600" />
          Show test methods
        </label>
        <Button variant="outline" onClick={copy} className="gap-2">{copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}{copied ? "Copied" : "Copy text"}</Button>
        <Button variant="outline" onClick={() => window.print()} className="gap-2"><Printer className="h-4 w-4" /> Print / PDF</Button>
        <Button onClick={() => { setI(0); setSlides(true) }} className="gap-2"><PresentIcon className="h-4 w-4" /> Slide mode</Button>
      </div>

      <article id="case-paper" className="bg-white text-slate-900 rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        <header className="bg-gradient-to-r from-slate-900 to-teal-800 text-white px-6 sm:px-10 py-8">
          <div className="text-xs uppercase tracking-[0.25em] text-teal-200">QubixPrep · Case Presentation</div>
          <h1 className="text-2xl sm:text-3xl font-bold mt-2 tracking-tight">{caseDef.title}</h1>
          <div className="text-sm text-teal-100 mt-1">{today}</div>
        </header>
        <div className="px-6 sm:px-10 py-8 space-y-8">
          <blockquote className="border-l-4 border-teal-600 bg-teal-50/60 rounded-r-xl px-5 py-4 text-lg leading-relaxed text-slate-900 font-medium">
            {opening}
          </blockquote>
          {sections.map((s, n) => <SectionBlock key={s.id} s={s} n={n + 1} explain={explain} />)}
          {sections.length === 0 && <p className="text-slate-500">Nothing filled in yet. Go back and answer a few questions.</p>}
        </div>
        <footer className="px-6 sm:px-10 py-4 border-t border-slate-200 text-xs text-slate-500">Prepared with QubixPrep for study and presentation practice.</footer>
      </article>

      <StudyPanel caseDef={caseDef} answers={answers} />

      {slides && (
        <div className="no-print fixed inset-0 z-[100] bg-slate-950 text-white flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <div className="text-sm text-slate-300">{caseDef.title} · {i + 1} / {total}</div>
            <button onClick={() => setSlides(false)} className="p-2 rounded-lg hover:bg-white/10" aria-label="Close"><X className="h-5 w-5" /></button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-4xl mx-auto p-4 sm:p-8">
              <div className="bg-white text-slate-900 rounded-3xl p-6 sm:p-10 shadow-2xl">
                {i === 0 ? (
                  <div className="py-6 sm:py-12">
                    <div className="text-xs uppercase tracking-[0.25em] text-teal-700">Case presentation</div>
                    <h1 className="text-3xl sm:text-5xl font-bold mt-3 tracking-tight">{caseDef.title}</h1>
                    <p className="mt-8 text-xl sm:text-2xl leading-relaxed text-slate-800">{opening}</p>
                  </div>
                ) : (
                  <SectionBlock s={sections[i - 1]} n={i} big explain={explain} />
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between px-4 py-3 border-t border-white/10">
            <Button variant="outline" onClick={prev} disabled={i === 0} className="gap-1 bg-transparent text-white border-white/20"><ChevronLeft className="h-4 w-4" /> Previous</Button>
            <div className="flex gap-1.5">{Array.from({ length: total }).map((_, k) => <button key={k} onClick={() => setI(k)} aria-label={`Slide ${k + 1}`} className={cn("h-2 rounded-full transition-all", k === i ? "w-6 bg-teal-400" : "w-2 bg-white/25")} />)}</div>
            <Button onClick={next} disabled={i === total - 1} className="gap-1">Next <ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>
      )}
    </div>
  )
}
