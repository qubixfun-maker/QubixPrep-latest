"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import ReactMarkdown from "react-markdown"
import { X, Send, Settings2, Lock, Loader2 } from "lucide-react"
import { JellyAvatar } from "./JellyAvatar"
import { useJelly } from "./jelly-store"
import { PERSONAS, personaOf } from "@/lib/jelly/personas"

const CHIPS: { intent: "explain" | "others" | "mnemonic" | "simple"; label: string }[] = [
  { intent: "explain", label: "Explain this" },
  { intent: "others", label: "Why the others are wrong" },
  { intent: "mnemonic", label: "Mnemonic" },
  { intent: "simple", label: "Simpler please" },
]

const POS_KEY = "jelly.pos"

export function JellyWidget() {
  const j = useJelly()
  const [pos, setPos] = useState({ r: 16, b: 16 })
  const [text, setText] = useState("")
  const [settings, setSettings] = useState(false)
  const drag = useRef<{ x: number; y: number; r: number; b: number; moved: boolean } | null>(null)
  const endRef = useRef<HTMLDivElement>(null)
  const p = personaOf(j.persona)

  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem(POS_KEY) || "null")
      if (s && typeof s.r === "number" && typeof s.b === "number") setPos(s)
    } catch {}
  }, [])
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }) }, [j.messages, j.open])

  const onDown = (e: React.PointerEvent) => {
    drag.current = { x: e.clientX, y: e.clientY, r: pos.r, b: pos.b, moved: false }
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }
  const onMove = (e: React.PointerEvent) => {
    const d = drag.current
    if (!d) return
    const dx = d.x - e.clientX; const dy = d.y - e.clientY
    if (Math.abs(dx) + Math.abs(dy) > 6) d.moved = true
    if (d.moved) setPos({ r: Math.min(Math.max(d.r + dx, 8), window.innerWidth - 90), b: Math.min(Math.max(d.b + dy, 8), window.innerHeight - 90) })
  }
  const onUp = () => {
    const d = drag.current
    drag.current = null
    if (!d) return
    if (d.moved) { try { localStorage.setItem(POS_KEY, JSON.stringify(pos)) } catch {} }
    else j.setOpen(!j.open)
  }

  if (j.hidden) {
    return (
      <button onClick={() => j.setHidden(false)} aria-label="Show Jelly"
        className="fixed z-50 right-0 bottom-24 flex items-center gap-1 rounded-l-2xl border border-white/10 bg-background/90 backdrop-blur px-2 py-1.5 text-[11px] font-semibold text-primary shadow-lg">
        <JellyAvatar size={26} mood="idle" /> Jelly
      </button>
    )
  }

  const send = () => { if (!text.trim() || j.busy) return; j.ask(text.trim()); setText("") }

  return (
    <>
      {j.open && (
        <div className="fixed z-50 right-3 sm:right-6 bottom-28 w-[min(92vw,380px)] max-h-[70vh] flex flex-col rounded-3xl border border-white/10 bg-background/95 backdrop-blur-xl shadow-2xl shadow-primary/20 overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10 bg-gradient-to-r from-primary/15 to-accent/10">
            <div className={`rounded-full ${j.busy ? "ring-2 ring-primary/60 animate-pulse" : "ring-1 ring-white/10"}`}>
              <JellyAvatar size={42} mood={j.mood} talking={j.busy && j.mood === "explaining"} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold leading-none">Jelly</p>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1 flex items-center gap-1">
                <span className={`h-1.5 w-1.5 rounded-full ${j.active ? "bg-emerald-400" : "bg-amber-400"}`} /> {j.active ? `online - ${p.label}` : "locked"}
              </p>
            </div>
            {j.active && <button aria-label="Settings" onClick={() => setSettings((s) => !s)} className="p-1.5 rounded-lg hover:bg-white/10 text-muted-foreground"><Settings2 className="h-4 w-4" /></button>}
            <button aria-label="Close" onClick={() => j.setOpen(false)} className="p-1.5 rounded-lg hover:bg-white/10 text-muted-foreground"><X className="h-4 w-4" /></button>
          </div>

          {!j.active ? (
            <div className="p-6 text-center space-y-3">
              <Lock className="h-6 w-6 mx-auto text-amber-400" />
              <p className="text-sm font-semibold">Jelly is part of an active plan</p>
              <p className="text-xs text-muted-foreground">Get instant reactions to your answers, explanations on demand, mnemonics and a study companion that never sleeps.</p>
              <Link href="/pricing" className="inline-block rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground">See plans</Link>
            </div>
          ) : (
            <>
              {settings && (
                <div className="px-4 py-3 border-b border-white/10 space-y-3 text-xs bg-white/5">
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
                    <p className="text-[10px] text-muted-foreground mt-1.5">{p.blurb}</p>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer text-muted-foreground">
                    <input type="checkbox" checked={j.sadOnWrong} onChange={(e) => j.setSadOnWrong(e.target.checked)} /> Look sad when I get one wrong (otherwise encouraging)
                  </label>
                  <button onClick={() => j.setHidden(true)} className="text-muted-foreground underline">Hide Jelly for now</button>
                </div>
              )}

              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-[120px]">
                {j.messages.length === 0 && (
                  <div className="text-sm text-muted-foreground leading-relaxed">
                    {j.persona === "jarvis" ? `Systems online, ${j.name}. ` : `Hi ${j.name}! `}
                    {j.hasContext ? "I can see the question you're on. Tap a button below, or ask me anything about it." : "Ask me anything about medicine, or open a question and I'll help with that one."}
                  </div>
                )}
                {j.messages.map((m, i) => (
                  <div key={i} className={m.role === "user" ? "flex justify-end" : ""}>
                    <div className={`max-w-[92%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${m.role === "user" ? "bg-primary/20 text-foreground" : "bg-white/5"}`}>
                      {m.role === "jelly" && !m.text ? <Loader2 className="h-4 w-4 animate-spin text-primary" /> : (
                        <div className="prose prose-invert prose-sm max-w-none [&>*]:my-1.5"><ReactMarkdown>{m.text}</ReactMarkdown></div>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={endRef} />
              </div>

              {j.hasContext && (
                <div className="px-4 pb-2 flex flex-wrap gap-1.5">
                  {CHIPS.map((c) => (
                    <button key={c.intent} disabled={j.busy} onClick={() => j.ask("", c.intent)}
                      className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] text-muted-foreground hover:bg-white/5 disabled:opacity-50">
                      {c.label}
                    </button>
                  ))}
                </div>
              )}
              <div className="flex gap-2 p-3 border-t border-white/10">
                <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") send() }}
                  placeholder="Ask Jelly anything..." className="flex-1 min-w-0 rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm outline-none focus:border-primary/60" />
                <button onClick={send} disabled={j.busy || !text.trim()} aria-label="Send" className="rounded-xl bg-primary px-3 text-primary-foreground disabled:opacity-50"><Send className="h-4 w-4" /></button>
              </div>
            </>
          )}
        </div>
      )}

      <div className="fixed z-50" style={{ right: pos.r, bottom: pos.b }}>
        {j.bubble && !j.open && (
          <div className="absolute right-full bottom-6 mr-2 w-max max-w-[220px] rounded-2xl rounded-br-sm border border-white/10 bg-background/95 backdrop-blur px-3 py-2 text-xs shadow-lg animate-in fade-in zoom-in-95 duration-300">
            <button aria-label="Dismiss" onClick={j.dismissBubble} className="absolute -top-2 -right-2 rounded-full bg-background border border-white/10 p-0.5 text-muted-foreground"><X className="h-3 w-3" /></button>
            <p className="leading-snug">{j.bubble.text}</p>
            {j.bubble.intent && (
              <button onClick={() => { const i = j.bubble!.intent!; j.dismissBubble(); j.ask("", i) }} className="mt-1.5 rounded-full bg-primary/20 px-2.5 py-0.5 font-semibold text-primary hover:bg-primary/30">
                Explain
              </button>
            )}
          </div>
        )}
        <div role="button" tabIndex={0} aria-label="Open Jelly" onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") j.setOpen(!j.open) }}
          className="cursor-pointer touch-none select-none rounded-full drop-shadow-[0_6px_16px_rgba(124,58,237,0.35)]">
          <JellyAvatar size={76} mood={j.active ? j.mood : "sleep"} talking={j.busy && j.mood === "explaining"} />
        </div>
      </div>
    </>
  )
}
