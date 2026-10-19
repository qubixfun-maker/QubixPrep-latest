"use client"

import { useMemo, useState, useEffect } from "react"
import { ChevronLeft, ChevronRight, Presentation, Save, Loader2, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { CaseDef, Answers } from "@/lib/casepres/types"
import { isFieldFilled, buildSection } from "@/lib/casepres/format"
import { diagnosisHints } from "@/lib/casepres/insights"
import { FieldView } from "./fields"

export function CaseForm({ caseDef, answers, setField, onPresent, saveState }: {
  caseDef: CaseDef
  answers: Answers
  setField: (id: string, v: any) => void
  onPresent: () => void
  saveState: "idle" | "saving" | "saved" | "error"
}) {
  const [idx, setIdx] = useState(0)
  const sec = caseDef.sections[idx]
  const filled = useMemo(() => caseDef.sections.map((s) => s.fields.some((f) => isFieldFilled(f, answers))), [caseDef, answers])
  const done = filled.filter(Boolean).length
  const story = useMemo(() => {
    if (sec.id !== "hpi") return ""
    const d = buildSection(sec, answers, caseDef)
    return d.lines.filter((l) => l.k === "para").map((l: any) => l.text).join(" ")
  }, [sec, answers, caseDef])
  const isClosing = sec.fields.some((f) => f.id === "provDx")
  const hints = useMemo(() => (isClosing ? diagnosisHints(caseDef, answers) : []), [isClosing, caseDef, answers])
  useEffect(() => { window.scrollTo({ top: 0, behavior: "smooth" }) }, [idx])

  return (
    <div className="max-w-3xl mx-auto px-4 pt-6 pb-32">
      <div className="mb-4">
        <div className="text-xs uppercase tracking-widest text-muted-foreground">Case presentation</div>
        <h1 className="text-2xl font-bold tracking-tight">{caseDef.title}</h1>
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-2 -mx-4 px-4 snap-x">
        {caseDef.sections.map((s, i) => (
          <button key={s.id} onClick={() => setIdx(i)}
            className={cn("shrink-0 snap-start rounded-full border px-3 py-1.5 text-xs whitespace-nowrap flex items-center gap-1.5",
              i === idx ? "bg-primary text-primary-foreground border-primary font-medium" : "border-white/15 text-muted-foreground hover:text-foreground")}>
            {filled[i] && i !== idx && <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />}
            {i + 1}. {s.title}
          </button>
        ))}
      </div>

      <div className="glass rounded-3xl border border-white/10 p-5 sm:p-7 mt-3">
        <div className="flex items-start justify-between gap-3 mb-1">
          <h2 className="text-xl font-bold">{sec.title}</h2>
          <span className="text-xs text-muted-foreground shrink-0 pt-1">{idx + 1} of {caseDef.sections.length}</span>
        </div>
        {sec.hint && <p className="text-sm text-muted-foreground mb-4">{sec.hint}</p>}
        <div className="grid gap-5 sm:grid-cols-2 mt-4">
          {sec.fields.map((f) => <FieldView key={f.id} field={f} answers={answers} set={setField} />)}
        </div>
      </div>

      {story && (
        <div className="mt-4 rounded-2xl border border-primary/30 bg-primary/5 p-4">
          <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Live preview: how your history will be presented</div>
          <p className="text-sm leading-relaxed">{story}</p>
        </div>
      )}

      {hints.length > 0 && (
        <div className="mt-4 rounded-2xl border border-amber-400/30 bg-amber-400/5 p-4 space-y-2">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">Suggested diagnosis from your findings (study aid)</div>
          {hints.map((h) => (
            <div key={h.dx} className="flex items-start justify-between gap-3">
              <div className="text-sm"><b>{h.dx}</b><div className="text-muted-foreground text-xs mt-0.5">{h.why}</div></div>
              <button type="button" onClick={() => { const cur = String(answers.provDx || "").trim(); setField("provDx", cur ? cur + "; " + h.dx : h.dx) }}
                className="shrink-0 rounded-full border border-white/20 px-3 py-1 text-xs hover:border-white/50">Use</button>
            </div>
          ))}
        </div>
      )}

      <div className="fixed bottom-0 inset-x-0 z-30 border-t border-white/10 bg-background/90 backdrop-blur">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-2">
          <Button variant="outline" onClick={() => setIdx((i) => Math.max(0, i - 1))} disabled={idx === 0} className="gap-1"><ChevronLeft className="h-4 w-4" /><span className="hidden sm:inline">Back</span></Button>
          <Button variant="outline" onClick={() => setIdx((i) => Math.min(caseDef.sections.length - 1, i + 1))} disabled={idx === caseDef.sections.length - 1} className="gap-1"><span className="hidden sm:inline">Next</span><ChevronRight className="h-4 w-4" /></Button>
          <div className="flex-1 text-xs text-muted-foreground flex items-center justify-center gap-1.5 min-w-0">
            {saveState === "saving" && <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving</>}
            {saveState === "saved" && <><Check className="h-3.5 w-3.5 text-emerald-400" /> Saved</>}
            {saveState === "error" && <span className="text-destructive">Not saved</span>}
            {saveState === "idle" && <><Save className="h-3.5 w-3.5" /> {done}/{caseDef.sections.length} sections</>}
          </div>
          <Button onClick={onPresent} className="gap-2 font-bold"><Presentation className="h-4 w-4" /> Present case</Button>
        </div>
      </div>
    </div>
  )
}
