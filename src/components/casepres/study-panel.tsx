"use client"

import { useMemo, useState } from "react"
import { Check, Copy, Circle, CheckCircle2, ChevronDown, Lightbulb } from "lucide-react"
import { cn } from "@/lib/utils"
import type { CaseDef, Answers } from "@/lib/casepres/types"
import { diagnosisHints, examChecklist, shortCase, vivaFor } from "@/lib/casepres/insights"

const TABS = [
  { id: "short", label: "Short case" },
  { id: "viva", label: "Viva questions" },
  { id: "check", label: "Exam checklist" },
  { id: "dx", label: "Diagnosis hint" },
] as const
type Tab = (typeof TABS)[number]["id"]

export function StudyPanel({ caseDef, answers }: { caseDef: CaseDef; answers: Answers }) {
  const [tab, setTab] = useState<Tab>("short")
  const [open, setOpen] = useState<number | null>(null)
  const [copied, setCopied] = useState(false)
  const sc = useMemo(() => shortCase(caseDef, answers), [caseDef, answers])
  const viva = useMemo(() => vivaFor(caseDef), [caseDef])
  const chk = useMemo(() => examChecklist(caseDef, answers), [caseDef, answers])
  const hints = useMemo(() => diagnosisHints(caseDef, answers), [caseDef, answers])
  const mins = Math.floor(sc.seconds / 60), secs = sc.seconds % 60

  const copy = async () => {
    try { await navigator.clipboard.writeText(sc.text); setCopied(true); setTimeout(() => setCopied(false), 2000) } catch {}
  }

  return (
    <div className="no-print mt-8 rounded-3xl border border-white/10 glass p-4 sm:p-6">
      <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Study tools</div>
      <div className="flex gap-1.5 overflow-x-auto pb-2">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={cn("shrink-0 rounded-full border px-3 py-1.5 text-xs whitespace-nowrap",
              tab === t.id ? "bg-primary text-primary-foreground border-primary font-medium" : "border-white/15 text-muted-foreground hover:text-foreground")}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "short" && (
        <div className="mt-3 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <span className="text-muted-foreground">Spoken version: {sc.words} words, about {mins}:{String(secs).padStart(2, "0")} minutes at a calm pace.
              {sc.seconds > 150 && " A bit long. Trim the history for a short case."}</span>
            <button onClick={copy} className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-3 py-1 text-xs hover:border-white/40">
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}{copied ? "Copied" : "Copy script"}
            </button>
          </div>
          <div className="rounded-2xl bg-white text-slate-900 p-5 space-y-3 leading-[1.8] text-[16px]">
            {sc.text.split("\n\n").map((p, i) => <p key={i}>{p}</p>)}
          </div>
        </div>
      )}

      {tab === "viva" && (
        <div className="mt-3 space-y-2">
          <p className="text-sm text-muted-foreground">Try answering aloud first, then tap to reveal the model answer.</p>
          {viva.map((v, i) => (
            <div key={i} className="rounded-xl border border-white/10">
              <button onClick={() => setOpen(open === i ? null : i)} className="w-full flex items-center justify-between gap-3 text-left px-4 py-3">
                <span className="text-sm font-medium"><span className="text-muted-foreground mr-2">{i + 1}.</span>{v.q}</span>
                <ChevronDown className={cn("h-4 w-4 shrink-0 transition-transform", open === i && "rotate-180")} />
              </button>
              {open === i && <div className="px-4 pb-4 text-sm text-muted-foreground leading-relaxed border-t border-white/10 pt-3">{v.a}</div>}
            </div>
          ))}
          {viva.length === 0 && <p className="text-sm text-muted-foreground">No questions for this case yet.</p>}
        </div>
      )}

      {tab === "check" && (
        <div className="mt-3 space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-1"><span className="text-muted-foreground">Completeness</span><b>{chk.percent}%</b></div>
            <div className="h-2 rounded-full bg-white/10 overflow-hidden"><div className="h-full bg-emerald-500" style={{ width: `${chk.percent}%` }} /></div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1.5">Sections</div>
            <ul className="grid sm:grid-cols-2 gap-1.5">
              {chk.sections.map((s) => <Row key={s.title} done={s.done} text={s.title} />)}
            </ul>
          </div>
          {chk.must.length > 0 && (
            <div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1.5">Must-do steps for this case (an examiner will look for these)</div>
              <ul className="grid sm:grid-cols-2 gap-1.5">
                {chk.must.map((s) => <Row key={s.name} done={s.done} text={s.name} />)}
              </ul>
            </div>
          )}
          <p className="text-xs text-muted-foreground">A step counts as done when you marked it present or absent. Anything left grey was skipped.</p>
        </div>
      )}

      {tab === "dx" && (
        <div className="mt-3 space-y-2">
          {hints.length === 0 && <p className="text-sm text-muted-foreground">Fill in more history and examination findings to get a suggestion.</p>}
          {hints.map((h, i) => (
            <div key={h.dx} className={cn("rounded-xl border p-4", i === 0 ? "border-primary/40 bg-primary/5" : "border-white/10")}>
              <div className="flex items-start gap-2"><Lightbulb className="h-4 w-4 mt-0.5 shrink-0 text-amber-400" /><div className="font-medium text-sm">{h.dx}</div></div>
              <div className="text-sm text-muted-foreground mt-1 pl-6">{h.why}</div>
            </div>
          ))}
          {hints.length > 0 && <p className="text-xs text-muted-foreground">This is a study aid based on your findings, not a final diagnosis. Always justify your diagnosis from the history and examination.</p>}
        </div>
      )}
    </div>
  )
}

function Row({ done, text }: { done: boolean; text: string }) {
  return (
    <li className={cn("flex items-center gap-2 rounded-lg px-3 py-2 text-sm border", done ? "border-emerald-500/30 bg-emerald-500/5" : "border-white/10 text-muted-foreground")}>
      {done ? <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" /> : <Circle className="h-4 w-4 shrink-0" />}
      <span>{text}</span>
    </li>
  )
}
