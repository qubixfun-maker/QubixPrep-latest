"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Mic, Square } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { splitSentences, type Gender } from "@/lib/osce/shared"

/* ---------------- Speaking: server voice (male / female, local language) with browser fallback ---------------- */

const FEMALE_RE = /female|woman|zira|heera|swara|kalpana|lekha|neerja|pallavi|aditi|priya|veena|sangeeta|raveena|shruti|tessa|samantha|karen|google (हिन्दी|bengali|tamil|telugu|kannada|malayalam|marathi)/i
const MALE_RE = /\bmale\b|\bman\b|ravi|hemant|prabhat|madhur|valluvar|mohan|prabhat|rishi|david|mark|daniel|alex/i

function browserVoice(lang: string, gender: Gender): SpeechSynthesisVoice | null {
  const all = window.speechSynthesis.getVoices()
  const pool = all.filter((v) => v.lang === lang).concat(all.filter((v) => v.lang !== lang && v.lang?.startsWith(lang.split("-")[0])))
  if (!pool.length) return null
  const want = gender === "female" ? FEMALE_RE : MALE_RE
  const other = gender === "female" ? MALE_RE : FEMALE_RE
  return pool.find((v) => want.test(v.name)) || pool.find((v) => !other.test(v.name)) || pool[0]
}

function browserSpeak(text: string, lang: string, gender: Gender, kid = false): Promise<void> {
  return new Promise((resolve) => {
    try {
      if (!window.speechSynthesis) return resolve()
      const u = new SpeechSynthesisUtterance(text)
      u.lang = lang
      const v = browserVoice(lang, gender)
      if (v) u.voice = v
      u.pitch = kid ? 1.7 : gender === "male" ? 0.8 : 1.15 // makes the gender audible even when only one voice exists
      if (kid) u.rate = 1.1
      u.onend = () => resolve()
      u.onerror = () => resolve()
      window.speechSynthesis.speak(u)
    } catch { resolve() }
  })
}

export type Speaker = { push: (t: string) => void; end: () => void; stop: () => void }
let current: Speaker | null = null
export const stopSpeaking = () => { current?.stop(); current = null }

export function createSpeaker(o: { lang: string; gender: Gender; variant?: number; kid?: boolean; getToken: () => Promise<string>; onStart?: () => void; onEnd?: () => void }): Speaker {
  stopSpeaking()
  let buf = ""; let first = true; let playing = false; let stopped = false; let ended = false; let finished = false; let audio: HTMLAudioElement | null = null
  const jobs: { text: string; url: Promise<string | null> }[] = []

  const fetchAudio = async (text: string): Promise<string | null> => {
    try {
      const res = await fetch("/api/osce-stations/tts", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken: await o.getToken(), text, lang: o.lang, gender: o.gender, variant: o.variant || 0, kid: !!o.kid }),
      })
      if (!res.ok) return null
      return URL.createObjectURL(await res.blob())
    } catch { return null }
  }
  const play = (url: string) => new Promise<void>((resolve) => {
    audio = new Audio(url)
    audio.onended = () => resolve(); audio.onerror = () => resolve()
    audio.play().catch(() => resolve())
  }).finally(() => URL.revokeObjectURL(url))

  const finish = () => { if (finished) return; finished = true; o.onEnd?.() }
  const pump = async () => {
    if (playing) return
    playing = true; o.onStart?.()
    while (jobs.length && !stopped) {
      const j = jobs.shift()!
      const url = await j.url
      if (stopped) break
      if (url) await play(url); else await browserSpeak(j.text, o.lang, o.gender, o.kid)
    }
    playing = false
    if (stopped || (ended && !jobs.length)) finish()
  }
  const enqueue = (text: string) => { if (!text.trim()) return; jobs.push({ text, url: fetchAudio(text) }); pump() }

  const sp: Speaker = {
    push(t) {
      buf += t
      const re = first ? /[.!?।॥,;]\s/g : /[.!?।॥]\s/g
      let cut = -1; let m: RegExpExecArray | null
      while ((m = re.exec(buf))) cut = m.index + 1
      if (cut > (first ? 20 : 40)) { splitSentences(buf.slice(0, cut)).forEach(enqueue); buf = buf.slice(cut); first = false }
    },
    end() { splitSentences(buf).forEach(enqueue); buf = ""; ended = true; if (!playing && !jobs.length) finish() },
    stop() { stopped = true; jobs.length = 0; try { audio?.pause() } catch {} try { window.speechSynthesis?.cancel() } catch {} finish() },
  }
  current = sp
  return sp
}

/* ---------------- Listening: keeps listening through pauses, sends after a real silence ---------------- */

export function useListen(lang: string, onFinal: (t: string) => void, silenceMs = 2500) {
  const [listening, setListening] = useState(false)
  const [interim, setInterim] = useState("")
  const [supported, setSupported] = useState(true)
  const recRef = useRef<any>(null)
  const finalRef = useRef(""); const interimRef = useRef("")
  const want = useRef(false); const timer = useRef<any>(null); const startedAt = useRef(0)
  const cb = useRef(onFinal); cb.current = onFinal

  const flush = useCallback(() => {
    setListening(false); clearTimeout(timer.current)
    const t = `${finalRef.current} ${interimRef.current}`.trim()
    finalRef.current = ""; interimRef.current = ""; setInterim("")
    if (t) cb.current(t)
  }, [])

  const stop = useCallback(() => { want.current = false; clearTimeout(timer.current); try { recRef.current?.stop() } catch { flush() } }, [flush])
  const arm = useCallback((ms: number) => { clearTimeout(timer.current); timer.current = setTimeout(stop, ms) }, [stop])

  const make = useCallback(() => {
    const Ctor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    const r = new Ctor()
    r.lang = lang; r.continuous = true; r.interimResults = true; r.maxAlternatives = 1
    r.onresult = (e: any) => {
      let it = ""
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i]
        if (res.isFinal) finalRef.current = `${finalRef.current} ${res[0].transcript}`.trim(); else it += res[0].transcript
      }
      interimRef.current = it; setInterim(it); arm(silenceMs)
    }
    r.onerror = (e: any) => { if (e.error === "not-allowed" || e.error === "service-not-allowed") want.current = false }
    r.onend = () => {
      if (want.current && Date.now() - startedAt.current > 600) {
        try { const n = make(); recRef.current = n; startedAt.current = Date.now(); n.start(); return } catch {}
      }
      want.current = false; flush()
    }
    return r
  }, [lang, arm, flush, silenceMs])

  useEffect(() => {
    if (typeof window === "undefined") return
    if (!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)) setSupported(false)
    return () => { want.current = false; clearTimeout(timer.current); try { recRef.current?.abort() } catch {} }
  }, [])

  const start = useCallback(() => {
    if (want.current) return
    stopSpeaking()
    finalRef.current = ""; interimRef.current = ""; setInterim("")
    try {
      const r = make(); recRef.current = r; want.current = true; startedAt.current = Date.now()
      r.start(); setListening(true); arm(9000)
    } catch { want.current = false; setListening(false) }
  }, [make, arm])

  return { start, stop, listening, interim, supported }
}

export function VoiceOrTextInput({ onSubmit, disabled, lang, placeholder, autoStartKey, extra }: {
  onSubmit: (text: string) => void; disabled?: boolean; lang: string; placeholder?: string; autoStartKey?: number; extra?: React.ReactNode
}) {
  const [typed, setTyped] = useState("")
  const { start, stop, listening, interim, supported } = useListen(lang, (t) => onSubmit(t))
  const last = useRef(autoStartKey || 0)
  useEffect(() => {
    if (autoStartKey && autoStartKey !== last.current) { last.current = autoStartKey; if (!disabled && supported) start() }
  }, [autoStartKey, disabled, supported, start])

  return (
    <div className="space-y-2">
      {supported && (
        <Button disabled={disabled && !listening} onClick={() => (listening ? stop() : start())}
          className={`w-full gap-2 ${listening ? "bg-red-500 hover:bg-red-600 animate-pulse" : ""}`}>
          {listening ? <><Square className="h-4 w-4" /> Listening... tap when finished</> : <><Mic className="h-4 w-4" /> Tap to speak</>}
        </Button>
      )}
      {listening && interim && <p className="text-xs text-muted-foreground italic px-1">{interim}</p>}
      <div className="flex gap-2">
        <Input placeholder={placeholder || "Or type here..."} value={typed} onChange={(e) => setTyped(e.target.value)} disabled={disabled}
          onKeyDown={(e) => { if (e.key === "Enter" && typed.trim()) { onSubmit(typed.trim()); setTyped("") } }} />
        <Button disabled={disabled || !typed.trim()} onClick={() => { onSubmit(typed.trim()); setTyped("") }}>Send</Button>
      </div>
      {extra}
    </div>
  )
}
