"use client"

import { X } from "lucide-react"
import { useJelly } from "./jelly-store"
import { PERSONAS, personaOf } from "@/lib/jelly/personas"
import { EXAMS, LANGS, YEARS, type Depth } from "@/lib/jelly/profile"

const sel = "w-full rounded-lg bg-white/5 border border-white/10 px-2 py-1.5 text-xs outline-none focus:border-primary/60"
const lab = "block text-[10px] uppercase tracking-widest text-muted-foreground mb-1"

/** Personality, voice and everything Jelly knows about the student. */
export function JellySettings() {
  const j = useJelly()
  const p = j.profile
  const persona = personaOf(j.persona)
  return (
    <div className="px-4 py-3 border-b border-white/10 space-y-4 text-xs bg-white/5">
      <div>
        <p className="font-bold uppercase tracking-widest text-primary mb-2">Personality</p>
        <div className="flex flex-wrap gap-1.5">
          {PERSONAS.map((x) => (
            <button key={x.id} onClick={() => j.setPersona(x.id)} title={x.blurb}
              className={`rounded-full border px-2.5 py-1 ${j.persona === x.id ? "border-primary bg-primary/20 text-primary" : "border-white/10 text-muted-foreground hover:bg-white/5"}`}>
              {x.label}
            </button>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground mt-1.5">{persona.blurb}</p>
      </div>

      <div className="space-y-2">
        <p className="font-bold uppercase tracking-widest text-primary">About you</p>
        <div className="grid grid-cols-2 gap-2">
          <div><label className={lab}>Year</label>
            <select className={sel} value={p.year || ""} onChange={(e) => j.saveProfile({ year: e.target.value })}>
              <option value="">Not set</option>{YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
            </select></div>
          <div><label className={lab}>Preparing for</label>
            <select className={sel} value={p.exam || ""} onChange={(e) => j.saveProfile({ exam: e.target.value })}>
              <option value="">Not set</option>{EXAMS.map((y) => <option key={y} value={y}>{y}</option>)}
            </select></div>
          <div><label className={lab}>Exam date</label>
            <input type="date" className={sel} value={p.examDate || ""} onChange={(e) => j.saveProfile({ examDate: e.target.value })} /></div>
          <div><label className={lab}>Language</label>
            <select className={sel} value={p.language || "English"} onChange={(e) => j.saveProfile({ language: e.target.value })}>
              {LANGS.map((y) => <option key={y} value={y}>{y}</option>)}
            </select></div>
          <div className="col-span-2"><label className={lab}>Explanations</label>
            <div className="flex gap-1.5">
              {(["brief", "balanced", "detailed"] as Depth[]).map((d) => (
                <button key={d} onClick={() => j.saveProfile({ depth: d })}
                  className={`flex-1 rounded-lg border px-2 py-1 capitalize ${(p.depth || "balanced") === d ? "border-primary bg-primary/20 text-primary" : "border-white/10 text-muted-foreground hover:bg-white/5"}`}>{d}</button>
              ))}
            </div></div>
        </div>
      </div>

      <div className="space-y-2">
        <p className="font-bold uppercase tracking-widest text-primary">Voice</p>
        <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={j.voiceOn} onChange={(e) => j.setVoiceOn(e.target.checked)} /> Jelly speaks her answers</label>
        <div className="flex gap-1.5">
          {(["female", "male"] as const).map((g) => (
            <button key={g} onClick={() => j.saveProfile({ voiceGender: g })}
              className={`flex-1 rounded-lg border px-2 py-1 capitalize ${(p.voiceGender || "female") === g ? "border-primary bg-primary/20 text-primary" : "border-white/10 text-muted-foreground hover:bg-white/5"}`}>{g} voice</button>
          ))}
        </div>
        <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={j.conversation} onChange={(e) => j.setConversation(e.target.checked)} /> Conversation mode (she listens again after speaking)</label>
        <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={j.wakeOn} onChange={(e) => j.setWakeOn(e.target.checked)} disabled={!j.wakeSupported && !j.wakeOn} /> Wake word: say &quot;Hey Jelly&quot;</label>
        <p className="text-[10px] text-muted-foreground">The wake word works only while QubixPrep is open in Chrome with the microphone allowed.{!j.wakeSupported && " It is not available in this browser."}</p>
        <label className="flex items-center gap-2 cursor-pointer text-muted-foreground"><input type="checkbox" checked={j.sadOnWrong} onChange={(e) => j.setSadOnWrong(e.target.checked)} /> Look sad when I get one wrong (otherwise encouraging)</label>
      </div>

      <div className="space-y-1.5">
        <p className="font-bold uppercase tracking-widest text-primary">What Jelly remembers</p>
        {p.notes.length === 0 && <p className="text-muted-foreground">Nothing yet. Tell her your year, exam or how you like things explained, and she will remember.</p>}
        {p.notes.map((n, i) => (
          <div key={i} className="flex items-start justify-between gap-2 rounded-lg bg-white/5 px-2 py-1">
            <span>{n}</span>
            <button aria-label="Forget this" onClick={() => j.removeNote(i)} className="text-muted-foreground hover:text-red-400 shrink-0"><X className="h-3 w-3" /></button>
          </div>
        ))}
        <div className="flex items-center gap-3 pt-1">
          <button onClick={() => { if (window.confirm("Forget everything Jelly knows about you, including your weak areas?")) j.forgetMe() }} className="text-muted-foreground underline">Forget everything</button>
          <button onClick={() => j.setHidden(true)} className="text-muted-foreground underline">Hide Jelly for now</button>
        </div>
      </div>
    </div>
  )
}
