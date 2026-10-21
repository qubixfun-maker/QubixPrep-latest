"use client"

import { useEffect, useRef, useState } from "react"
import { Loader2, Mic, Square, Send, Trash2, Volume2, VolumeX, Settings2, BookOpen, HelpCircle, Stethoscope, Layers, CalendarDays, MessageCircleQuestion } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRequireAuth } from "@/hooks/use-require-auth"
import { usePlan } from "@/hooks/use-plan"
import { UpgradeGate } from "@/components/upgrade-gate"
import { JellyAvatar } from "@/components/jelly/JellyAvatar"
import { JellyMessages } from "@/components/jelly/JellyMessages"
import { JellySettings } from "@/components/jelly/JellySettings"
import { useJelly } from "@/components/jelly/jelly-store"
import { personaOf } from "@/lib/jelly/personas"
import { nudgeLine, weakTopics, type Mode } from "@/lib/jelly/profile"

const MODES: { id: Mode; label: string; hint: string; start: string; icon: any }[] = [
  { id: "topic", label: "Explain a topic", hint: "Clear, exam-focused teaching", start: "Which topic should I explain?", icon: BookOpen },
  { id: "quiz", label: "Quiz me", hint: "One MCQ at a time", start: "Quiz me on ", icon: HelpCircle },
  { id: "viva", label: "Viva practice", hint: "Examiner-style questions", start: "Take my viva on ", icon: Stethoscope },
  { id: "cards", label: "Make flashcards", hint: "Quick recall cards", start: "Make flashcards on ", icon: Layers },
  { id: "plan", label: "Study plan", hint: "Plan around your exam date", start: "Make me a study plan for ", icon: CalendarDays },
  { id: "doubt", label: "Ask a doubt", hint: "Anything in medicine", start: "", icon: MessageCircleQuestion },
]

export default function JellyPlayground() {
  const j = useJelly()
  const { checkingAuth } = useRequireAuth()
  const { canAccessContent, loading: planLoading } = usePlan()
  const [text, setText] = useState("")
  const [settings, setSettings] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)
  const p = personaOf(j.persona)
  const weak = weakTopics(j.profile, 4)
  const nudge = nudgeLine(j.profile, j.name)
  const talking = j.busy || j.speaking
  const quiz = j.mode === "quiz"

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }) }, [j.messages, j.interim])

  if (checkingAuth || planLoading) {
    return <div className="flex justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  }
  if (!canAccessContent) {
    return <div className="max-w-2xl mx-auto p-4"><UpgradeGate type="content" title="Jelly needs an active plan" description="Your study companion that explains, quizzes and learns how you study." /></div>
  }

  const send = (t?: string) => {
    const v = (t ?? text).trim()
    if (!v || j.busy) return
    j.ask(v); setText("")
  }
  const pick = (id: Mode, start: string) => { j.setMode(id); setText(start) }

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-4">
      <div className="flex items-center gap-4 rounded-3xl border border-white/10 bg-gradient-to-r from-primary/15 to-accent/10 p-4">
        <div className={`rounded-full shrink-0 ${j.busy || j.listening ? "ring-2 ring-primary/60 animate-pulse" : "ring-1 ring-white/10"}`}>
          <JellyAvatar size={72} mood={j.mood} talking={talking} />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold leading-tight">Jelly Playground</h1>
          <p className="text-xs uppercase tracking-widest text-muted-foreground mt-0.5">{p.label} mode{j.usage && j.usage.limit > 0 ? ` - ${Math.max(j.usage.limit - j.usage.used, 0)} of ${j.usage.limit} chats left today` : ""}</p>
          {nudge && <p className="text-sm mt-1.5">{nudge}</p>}
        </div>
        <div className="flex flex-col gap-1 shrink-0">
          <button aria-label={j.voiceOn ? "Mute Jelly" : "Let Jelly speak"} onClick={() => (j.speaking ? j.stopSpeaking() : j.setVoiceOn(!j.voiceOn))}
            className={`p-2 rounded-xl hover:bg-white/10 ${j.voiceOn ? "text-primary" : "text-muted-foreground"}`}>{j.voiceOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}</button>
          <button aria-label="Settings" onClick={() => setSettings((s) => !s)} className="p-2 rounded-xl hover:bg-white/10 text-muted-foreground"><Settings2 className="h-4 w-4" /></button>
        </div>
      </div>

      {settings && <div className="rounded-3xl border border-white/10 overflow-hidden"><JellySettings /></div>}

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {MODES.map((m) => {
          const Icon = m.icon
          return (
            <button key={m.id} onClick={() => pick(m.id, m.start)}
              className={`text-left rounded-2xl border p-3 transition ${j.mode === m.id ? "border-primary bg-primary/15" : "border-white/10 hover:bg-white/5"}`}>
              <Icon className={`h-4 w-4 mb-1.5 ${j.mode === m.id ? "text-primary" : "text-muted-foreground"}`} />
              <p className="text-sm font-semibold">{m.label}</p>
              <p className="text-[11px] text-muted-foreground">{m.hint}</p>
            </button>
          )
        })}
      </div>

      {weak.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] uppercase tracking-widest text-muted-foreground">Needs work</span>
          {weak.map((w) => (
            <button key={w.label} onClick={() => { j.setMode("topic"); send(`Explain ${w.label} for me, I keep getting it wrong`) }} disabled={j.busy}
              className="rounded-full border border-white/10 px-3 py-1 text-xs hover:bg-white/5 disabled:opacity-50">{w.label}</button>
          ))}
        </div>
      )}

      <div className="rounded-3xl border border-white/10 bg-white/[0.03] min-h-[260px] max-h-[55vh] overflow-y-auto p-4 space-y-3">
        {j.messages.length === 0 && (
          <p className="text-sm text-muted-foreground leading-relaxed">
            {j.persona === "jarvis" ? `Ready when you are, ${j.name}.` : `Hi ${j.name}!`} Pick a mode above, or just type or say a topic. Try &quot;Explain nephrotic syndrome&quot;, &quot;Quiz me on cardiology&quot;, or tap the mic.
          </p>
        )}
        <JellyMessages messages={j.messages} rated={j.rated} rate={j.rate} busy={j.busy} />
        {j.listening && <p className="text-xs italic text-primary">{j.interim || "Listening..."}</p>}
        <div ref={endRef} />
      </div>

      {quiz && j.messages.length > 0 && !j.busy && (
        <div className="flex gap-2">
          {["A", "B", "C", "D"].map((l) => (
            <Button key={l} variant="outline" className="flex-1" onClick={() => send(`My answer is ${l}`)}>{l}</Button>
          ))}
          <Button variant="outline" onClick={() => send("Next question")}>Next</Button>
        </div>
      )}

      <div className="flex gap-2">
        {j.micSupported && (
          <Button onClick={j.toggleMic} disabled={j.busy && !j.listening} aria-label={j.listening ? "Stop listening" : "Talk to Jelly"}
            className={j.listening ? "bg-red-500 hover:bg-red-600 animate-pulse" : "bg-white/10 text-foreground hover:bg-white/15"}>
            {j.listening ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </Button>
        )}
        <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") send() }}
          placeholder="Ask Jelly anything..." className="flex-1 min-w-0 rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm outline-none focus:border-primary/60" />
        <Button onClick={() => send()} disabled={j.busy || !text.trim()} aria-label="Send"><Send className="h-4 w-4" /></Button>
        <Button variant="ghost" onClick={j.clearChat} disabled={j.busy || j.messages.length === 0} aria-label="Clear chat"><Trash2 className="h-4 w-4" /></Button>
      </div>
    </div>
  )
}
