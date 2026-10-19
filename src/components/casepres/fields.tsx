"use client"

import { useState } from "react"
import { Plus, Check, X, Minus } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import type { Field, Answers, SymptomAnswer } from "@/lib/casepres/types"
import { resolveAttr } from "@/lib/casepres/dsl"
import { VITAL_FIELDS, calcBmi } from "@/lib/casepres/format"

type Setter = (id: string, value: any) => void

const chipBase = "inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-sm transition-colors select-none text-left"

function AddOwn({ placeholder, onAdd }: { placeholder: string; onAdd: (v: string) => void }) {
  const [v, setV] = useState("")
  const commit = () => {
    const t = v.trim()
    if (!t) return
    onAdd(t)
    setV("")
  }
  return (
    <div className="flex gap-2 mt-2">
      <Input
        value={v}
        onChange={(e) => setV(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); commit() } }}
        placeholder={placeholder}
        className="h-9 text-sm"
      />
      <button type="button" onClick={commit} className="h-9 px-3 rounded-md border border-white/15 text-sm hover:bg-white/5 flex items-center gap-1">
        <Plus className="h-4 w-4" /> Add
      </button>
    </div>
  )
}

/** Pick one or many from a list, or type your own. */
export function ChipPicker({ options, value, multi, onChange, allowCustom = true }: {
  options: string[]; value: string[]; multi?: boolean; onChange: (v: string[]) => void; allowCustom?: boolean
}) {
  const custom = value.filter((v) => !options.includes(v))
  const all = [...options, ...custom]
  const toggle = (o: string) => {
    if (multi) onChange(value.includes(o) ? value.filter((x) => x !== o) : [...value, o])
    else onChange(value[0] === o ? [] : [o])
  }
  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {all.map((o) => {
          const on = value.includes(o)
          return (
            <button key={o} type="button" onClick={() => toggle(o)}
              className={cn(chipBase, on ? "bg-primary/20 border-primary text-primary font-medium" : "border-white/15 text-muted-foreground hover:border-white/30 hover:text-foreground")}>
              {on && <Check className="h-3.5 w-3.5 shrink-0" />}{o}
            </button>
          )
        })}
      </div>
      {allowCustom && (
        <AddOwn placeholder="Type your own and press Add" onAdd={(t) => { if (!value.includes(t)) onChange(multi ? [...value, t] : [t]) }} />
      )}
    </div>
  )
}

const strArr = (v: any): string[] => (Array.isArray(v) ? v : v ? [String(v)] : [])

/** Tap once = present, twice = absent, thrice = clear. */
function FindingsPicker({ field, value, onChange }: { field: Extract<Field, { t: "findings" }>; value: Record<string, "p" | "a">; onChange: (v: Record<string, "p" | "a">) => void }) {
  const v = value || {}
  const custom = Object.keys(v).filter((k) => !field.options.includes(k))
  const all = [...field.options, ...custom]
  const cycle = (o: string) => {
    const next = { ...v }
    if (!v[o]) next[o] = "p"
    else if (v[o] === "p") next[o] = "a"
    else delete next[o]
    onChange(next)
  }
  const markRest = () => {
    const next = { ...v }
    all.forEach((o) => { if (!next[o]) next[o] = "a" })
    onChange(next)
  }
  const clear = () => onChange({})
  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {all.map((o) => {
          const s = v[o]
          return (
            <button key={o} type="button" onClick={() => cycle(o)}
              className={cn(chipBase,
                s === "p" && "bg-primary/20 border-primary text-primary font-medium",
                s === "a" && "bg-white/5 border-white/10 text-muted-foreground line-through decoration-muted-foreground/60",
                !s && "border-white/15 text-muted-foreground hover:border-white/30 hover:text-foreground")}>
              {s === "p" && <Check className="h-3.5 w-3.5 shrink-0" />}
              {s === "a" && <Minus className="h-3.5 w-3.5 shrink-0" />}
              {o}
            </button>
          )
        })}
      </div>
      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
        <span>Tap: <b className="text-primary">present</b> → <b>absent</b> → blank</span>
        <button type="button" onClick={markRest} className="underline hover:text-foreground">Mark rest as absent / normal</button>
        {Object.keys(v).length > 0 && <button type="button" onClick={clear} className="underline hover:text-foreground">Clear</button>}
      </div>
      <AddOwn placeholder="Add a finding that isn't listed (marked present)" onAdd={(t) => onChange({ ...v, [t]: "p" })} />
    </div>
  )
}

const QUICK_DUR = ["1 day", "2 days", "3 days", "1 week", "2 weeks", "1 month", "3 months", "6 months", "1 year"]

function ComplaintsPicker({ field, value, onChange }: { field: Extract<Field, { t: "complaints" }>; value: Record<string, string>; onChange: (v: Record<string, string>) => void }) {
  const v = value || {}
  const custom = Object.keys(v).filter((k) => !field.options.includes(k))
  const all = [...field.options, ...custom]
  const toggle = (o: string) => {
    const next = { ...v }
    if (o in next) delete next[o]
    else next[o] = ""
    onChange(next)
  }
  const selected = Object.keys(v)
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {all.map((o) => {
          const on = o in v
          return (
            <button key={o} type="button" onClick={() => toggle(o)}
              className={cn(chipBase, on ? "bg-primary/20 border-primary text-primary font-medium" : "border-white/15 text-muted-foreground hover:border-white/30 hover:text-foreground")}>
              {on && <Check className="h-3.5 w-3.5 shrink-0" />}{o}
            </button>
          )
        })}
      </div>
      <AddOwn placeholder="Add a complaint that isn't listed" onAdd={(t) => onChange({ ...v, [t]: "" })} />
      {selected.length > 0 && (
        <div className="rounded-2xl border border-white/10 divide-y divide-white/10">
          {selected.map((o, i) => (
            <div key={o} className="p-3 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="font-medium text-sm"><span className="text-muted-foreground mr-2">{i + 1}.</span>{o}</div>
                <button type="button" onClick={() => toggle(o)} className="text-muted-foreground hover:text-foreground" aria-label={`Remove ${o}`}><X className="h-4 w-4" /></button>
              </div>
              <Input value={v[o]} onChange={(e) => onChange({ ...v, [o]: e.target.value })} placeholder="Duration, e.g. 3 days" className="h-9 text-sm" />
              <div className="flex flex-wrap gap-1.5">
                {QUICK_DUR.map((d) => (
                  <button key={d} type="button" onClick={() => onChange({ ...v, [o]: d })}
                    className={cn("rounded-full border px-2.5 py-1 text-xs", v[o] === d ? "bg-primary/20 border-primary text-primary" : "border-white/10 text-muted-foreground hover:text-foreground")}>{d}</button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function SymptomCard({ field, value, onChange }: { field: Extract<Field, { t: "symptom" }>; value: SymptomAnswer; onChange: (v: SymptomAnswer) => void }) {
  const v = value || {}
  const set = (s?: "p" | "a") => onChange({ ...v, s: v.s === s ? undefined : s })
  const setAttr = (k: string, val: string[]) => onChange({ ...v, a: { ...(v.a || {}), [k]: val } })
  return (
    <div className={cn("rounded-2xl border p-4 space-y-3 transition-colors", v.s === "p" ? "border-primary/40 bg-primary/5" : "border-white/10")}>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className={cn("font-semibold", v.s === "a" && "text-muted-foreground")}>{field.label}</div>
        <div className="inline-flex rounded-full border border-white/15 overflow-hidden text-sm">
          <button type="button" onClick={() => set("p")} className={cn("px-4 py-1.5", v.s === "p" ? "bg-primary text-primary-foreground font-medium" : "hover:bg-white/5")}>Present</button>
          <button type="button" onClick={() => set("a")} className={cn("px-4 py-1.5 border-l border-white/15", v.s === "a" ? "bg-white/15 font-medium" : "hover:bg-white/5")}>Absent</button>
        </div>
      </div>
      {v.s === "p" && (
        <div className="space-y-4 pt-1">
          {field.attrs.map((ref) => {
            const def = resolveAttr(ref)
            const val = strArr(v.a?.[def.key])
            return (
              <div key={def.key}>
                <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1.5">{def.label}</div>
                <ChipPicker options={def.options || []} value={val} multi={def.multi} onChange={(n) => setAttr(def.key, n)} />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function VitalsBlock({ field, value, onChange }: { field: Extract<Field, { t: "vitals" }>; value: Record<string, string>; onChange: (v: Record<string, string>) => void }) {
  const v = value || {}
  const bmi = calcBmi(v)
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {VITAL_FIELDS(field.paeds).map((f) => (
        <div key={f.key}>
          <Label className="text-xs text-muted-foreground">{f.label}{f.unit ? ` (${f.unit})` : ""}</Label>
          <Input value={v[f.key] || ""} onChange={(e) => onChange({ ...v, [f.key]: e.target.value })} className="h-9 mt-1" />
        </div>
      ))}
      {bmi && (
        <div>
          <Label className="text-xs text-muted-foreground">BMI (calculated)</Label>
          <div className="h-9 mt-1 flex items-center px-3 rounded-md border border-white/10 text-sm">{bmi} kg/m²</div>
        </div>
      )}
    </div>
  )
}

export function FieldView({ field, answers, set }: { field: Field; answers: Answers; set: Setter }) {
  const v = answers[field.id]
  const wrap = (children: React.ReactNode, half = false) => (
    <div className={cn("space-y-1.5", half ? "sm:col-span-1" : "sm:col-span-2")}>
      {"label" in field && field.t !== "symptom" && field.t !== "vitals" && <Label className="text-sm font-medium">{field.label}</Label>}
      {field.t === "vitals" && <Label className="text-sm font-medium">{field.label}</Label>}
      {children}
    </div>
  )
  switch (field.t) {
    case "text":
      return wrap(<Input value={v || ""} onChange={(e) => set(field.id, e.target.value)} placeholder={field.placeholder} />, !!field.half)
    case "date":
      return wrap(<Input type="date" value={v || ""} onChange={(e) => set(field.id, e.target.value)} />, !!field.half)
    case "area":
      return wrap(<Textarea value={v || ""} onChange={(e) => set(field.id, e.target.value)} placeholder={field.placeholder} rows={3} />)
    case "choice":
      return wrap(<ChipPicker options={field.options} value={strArr(v)} multi={field.multi} onChange={(n) => set(field.id, field.multi ? n : n[0] ?? "")} />)
    case "findings":
      return wrap(<FindingsPicker field={field} value={v || {}} onChange={(n) => set(field.id, n)} />)
    case "complaints":
      return wrap(<ComplaintsPicker field={field} value={v || {}} onChange={(n) => set(field.id, n)} />)
    case "symptom":
      return <div className="sm:col-span-2"><SymptomCard field={field} value={v || {}} onChange={(n) => set(field.id, n)} /></div>
    case "vitals":
      return wrap(<VitalsBlock field={field} value={v || {}} onChange={(n) => set(field.id, n)} />)
  }
}
