"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Mic, Square } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { splitSentences, type Gender } from "@/lib/osce/shared"
import { micAcquire } from "@/lib/mic-lock"

/* ---------------- Problems are shown to the student instead of failing silently ---------------- */

let issue = ""
const subs = new Set<() => void>()
export function reportVoiceIssue(msg: string) { if (issue === msg) return; issue = msg; subs.forEach((f) => f()) }
/** The latest voice problem ("" when everything is fine). Re-renders the caller when it changes. */
export function useVoiceIssue() {
  const [, bump] = useState(0)
  useEffect(() => { const f = () => bump((n) => n + 1); subs.add(f); return () => { subs.delete(f) } }, [])
  return issue
}

/** Phones only allow sound that follows a tap. This plays a silent clip on the first tap so later speech is allowed. */
const SILENT = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA="
let shared: HTMLAudioElement | null = null
export function primeAudio() {
  try {
    if (!shared) { shared = new Audio(); shared.src = SILENT; shared.play().catch(() => {}) }
    if (window.speechSynthesis) { const u = new SpeechSynthesisUtterance(" "); u.volume = 0; window.speechSynthesis.speak(u) }
  } catch {}
}
if (typeof window !== "undefined") {
  const once = () => { primeAudio(); window.removeEventListener("pointerdown", once, true) }
  window.addEventListener("pointerdown", once, true)
}

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
      if (!window.speechSynthesis) { reportVoiceIssue("This browser cannot speak. Open QubixPrep in Chrome to hear the voice."); return resolve() }
      const u = new SpeechSynthesisUtterance(text)
      u.lang = lang
      const v = browserVoice(lang, gender)
      if (v) u.voice = v
      u.pitch = kid ? 1.7 : gender === "male" ? 0.8 : 1.15 // makes the gender audible even when only one voice exists
      u.rate = kid ? 1.15 : 1.05
      u.onend = () => resolve()
      u.onerror = (e: any) => { if (e?.error && e.error !== "canceled" && e.error !== "interrupted") reportVoiceIssue("This phone's own voice failed (" + e.error + "). Check that a Text-to-speech engine is installed and the volume is up."); resolve() }
      window.speechSynthesis.speak(u)
    } catch { resolve() }
  })
}

export type Speaker = { push: (t: string) => void; end: () => void; stop: () => void }
let current: Speaker | null = null
/** Stops everything being said right now: the playing clip, clips still downloading, the waiting queue and the browser's own voice. */
export const stopSpeaking = () => {
  const c = current; current = null
  try { c?.stop() } catch {}
  try { shared?.pause() } catch {}
  try { window.speechSynthesis?.cancel() } catch {}
}

export function createSpeaker(o: { lang: string; gender: Gender; variant?: number; kid?: boolean; getToken: () => Promise<string>; onStart?: () => void; onEnd?: (info?: { stopped: boolean }) => void }): Speaker {
  stopSpeaking()
  let buf = ""; let first = true; let playing = false; let stopped = false; let ended = false; let finished = false; const live = new Set<HTMLAudioElement>()
  const cancels = new Set<() => void>() // wake up anything still waiting when stop() is pressed
  const aborts = new Set<AbortController>() // voice requests still downloading
  const jobs: { text: string; url: Promise<string | null> }[] = []

  let lastWhy = ""
  const fetchOnce = async (text: string): Promise<string | null> => {
    if (stopped) return null
    const ac = new AbortController(); aborts.add(ac)
    try {
      const res = await fetch("/api/osce-stations/tts", {
        method: "POST", headers: { "Content-Type": "application/json" }, signal: ac.signal,
        body: JSON.stringify({ idToken: await o.getToken(), text, lang: o.lang, gender: o.gender, variant: o.variant || 0, kid: !!o.kid }),
      })
      if (!res.ok) { lastWhy = `${res.status} ${(await res.text().catch(() => "")).slice(0, 140)}`; return null }
      reportVoiceIssue("")
      return URL.createObjectURL(await res.blob())
    } catch (e: any) { lastWhy = e?.message || "network error"; return null }
    finally { aborts.delete(ac) }
  }
  const fetchAudio = async (text: string): Promise<string | null> => {
    for (let i = 0; i < 3; i++) {
      if (stopped) return null
      const u = await fetchOnce(text)
      if (u) return u
      if (stopped) return null
      await new Promise((ok) => setTimeout(ok, 400 * (i + 1)))
    }
    if (stopped) return null
    reportVoiceIssue("The server voice is not responding (" + lastWhy + "). Using this device's own voice instead.")
    return null
  }
  const play = (url: string) => new Promise<void>((resolve) => {
    const a = shared || new Audio()
    a.src = url
    const rate = o.kid ? 1.15 : 1 // Jelly talks a little faster, like a normal person
    a.defaultPlaybackRate = rate; a.playbackRate = rate
    try { (a as any).preservesPitch = true } catch {}
    live.add(a)
    let done = false
    const fin = () => { if (done) return; done = true; clearInterval(iv); cancels.delete(fin); resolve() }
    const iv = setInterval(() => { if (a.duration && a.duration - a.currentTime < 0.2) fin() }, 30)
    cancels.add(fin)
    a.onended = () => { live.delete(a); fin() }; a.onerror = () => { live.delete(a); fin() }
    a.play().catch((e) => { if (!stopped) reportVoiceIssue(e?.name === "NotAllowedError" ? "The browser blocked sound. Tap anywhere on the page once, then try again." : "Could not play the voice (" + (e?.name || "error") + ")."); fin() })
  }).finally(() => setTimeout(() => URL.revokeObjectURL(url), 3000))
  // the browser's own voice sometimes never reports that it was cancelled, so stop() must be able to end the wait itself
  const cancellable = (p: Promise<void>) => new Promise<void>((resolve) => {
    const done = () => { cancels.delete(done); resolve() }
    cancels.add(done); p.then(done, done)
  })

  const finish = (byStop = false) => { if (finished) return; finished = true; o.onEnd?.({ stopped: byStop }) }
  const pump = async () => {
    if (playing || stopped) return
    playing = true; o.onStart?.()
    while (jobs.length && !stopped) {
      const j = jobs.shift()!
      const url = await j.url
      if (stopped) { if (url) URL.revokeObjectURL(url); break }
      if (url) await play(url); else await cancellable(browserSpeak(j.text, o.lang, o.kid ? "female" : o.gender, o.kid))
    }
    playing = false
    if (stopped || (ended && !jobs.length)) finish(stopped)
  }
  const enqueue = (text: string) => { if (stopped || !text.trim()) return; jobs.push({ text, url: fetchAudio(text) }); pump() }

  const sp: Speaker = {
    push(t) {
      if (stopped) return
      buf += t
      const re = /[.!?।॥]\s/g
      let cut = -1; let m: RegExpExecArray | null
      while ((m = re.exec(buf))) cut = m.index + 1
      if (cut < 0 && first && buf.length > 50) { const c = buf.lastIndexOf(", "); if (c > 22) cut = c + 1 }
      if (cut > (first ? 14 : 40)) { splitSentences(buf.slice(0, cut)).forEach(enqueue); buf = buf.slice(cut); first = false }
    },
    end() { if (stopped) return; splitSentences(buf).forEach(enqueue); buf = ""; ended = true; if (!playing && !jobs.length) finish() },
    stop() {
      if (stopped) return
      stopped = true
      // clips that finish downloading after the stop are thrown away, never played
      jobs.splice(0).forEach((j) => { j.url.then((u) => { if (u) URL.revokeObjectURL(u) }).catch(() => {}) })
      aborts.forEach((c) => { try { c.abort() } catch {} }); aborts.clear()
      live.forEach((a) => { try { a.pause() } catch {} }); live.clear()
      try { window.speechSynthesis?.cancel() } catch {}
      cancels.forEach((f) => { try { f() } catch {} }); cancels.clear()
      if (current === sp) current = null
      finish(true)
    },
  }
  current = sp
  return sp
}

/* ---------------- Listening: keeps listening through pauses, sends after a real silence ---------------- */

export function useListen(lang: string, onFinal: (t: string) => void, silenceMs = 2500) {
  const [listening, setListening] = useState(false)
  const [interim, setInterim] = useState("")
  const [supported, setSupported] = useState(true)
  const [error, setError] = useState("")
  const starting = useRef(false); const heard = useRef(false)
  const recRef = useRef<any>(null)
  const finalRef = useRef(""); const interimRef = useRef("")
  const want = useRef(false); const timer = useRef<any>(null); const startedAt = useRef(0)
  const release = useRef<null | (() => void)>(null)
  const cb = useRef(onFinal); cb.current = onFinal

  const flush = useCallback(() => {
    setListening(false); clearTimeout(timer.current); release.current?.(); release.current = null
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
      heard.current = true; setError("")
      let it = ""
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i]
        if (res.isFinal) finalRef.current = `${finalRef.current} ${res[0].transcript}`.trim(); else it += res[0].transcript
      }
      interimRef.current = it; setInterim(it); arm(silenceMs)
    }
    r.onerror = (e: any) => {
      const c = e?.error
      if (c === "not-allowed" || c === "service-not-allowed") { want.current = false; setError("The microphone is blocked. Tap the lock icon in the address bar, allow Microphone for this site, then tap again.") }
      else if (c === "audio-capture") { want.current = false; setError("No microphone was found, or another app is using it. Close other apps that use the mic and try again.") }
      else if (c === "network") { want.current = false; setError("Voice input needs an internet connection (it uses Google's speech service). Check your connection and try again.") }
      else if (c === "language-not-supported") { want.current = false; setError("This browser does not support voice input in the chosen language. Pick English or type instead.") }
      else if (c === "no-speech") setError("I did not hear anything. Tap the mic and speak again.")
    }
    r.onend = () => {
      if (want.current && Date.now() - startedAt.current > 600) {
        try { const n = make(); recRef.current = n; startedAt.current = Date.now(); n.start(); return } catch {}
      }
      const quick = Date.now() - startedAt.current <= 600
      want.current = false
      if (quick && !heard.current) setError((prev) => prev || "The microphone stopped right away. Close other apps that use the mic, then tap again.")
      flush()
    }
    return r
  }, [lang, arm, flush, silenceMs])

  useEffect(() => {
    if (typeof window === "undefined") return
    if (!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)) setSupported(false)
    return () => { want.current = false; clearTimeout(timer.current); release.current?.(); release.current = null; try { recRef.current?.abort() } catch {} }
  }, [])

  const start = useCallback(async () => {
    if (want.current || starting.current) return
    starting.current = true
    stopSpeaking(); primeAudio()
    finalRef.current = ""; interimRef.current = ""; setInterim(""); setError(""); heard.current = false
    // tell the "Hey Jelly" listener to let go of the microphone first (Chrome allows one speech recognizer at a time)
    release.current?.(); release.current = micAcquire()
    await new Promise((r) => setTimeout(r, 400))
    try {
      // ask for the microphone first, so a blocked mic gives a clear message instead of silence
      if (navigator.mediaDevices?.getUserMedia) {
        try { (await navigator.mediaDevices.getUserMedia({ audio: true })).getTracks().forEach((t) => t.stop()) }
        catch (e: any) {
          setError(e?.name === "NotFoundError" ? "No microphone was found on this device." : "The microphone is blocked. Tap the lock icon in the address bar, allow Microphone for this site, then tap again.")
          release.current?.(); release.current = null
          return
        }
      }
      const r = make(); recRef.current = r; want.current = true; startedAt.current = Date.now()
      r.start(); setListening(true); arm(9000)
    } catch (e: any) { want.current = false; setListening(false); release.current?.(); release.current = null; setError("Could not start the microphone (" + (e?.message || "unknown error") + ").") }
    finally { starting.current = false }
  }, [make, arm])

  return { start, stop, listening, interim, supported, error }
}

export function VoiceOrTextInput({ onSubmit, disabled, lang, placeholder, autoStartKey, extra }: {
  onSubmit: (text: string) => void; disabled?: boolean; lang: string; placeholder?: string; autoStartKey?: number; extra?: React.ReactNode
}) {
  const [typed, setTyped] = useState("")
  const { start, stop, listening, interim, supported, error } = useListen(lang, (t) => onSubmit(t))
  const voiceIssue = useVoiceIssue()
  const last = useRef(autoStartKey || 0)
  useEffect(() => {
    if (autoStartKey && autoStartKey !== last.current) { last.current = autoStartKey; if (!disabled && supported) start() }
  }, [autoStartKey, disabled, supported, start])

  return (
    <div className="space-y-2">
      {!supported && <p className="text-xs rounded-lg bg-amber-100 text-amber-900 px-3 py-2">Voice input is not available in this browser. Open QubixPrep in Chrome to speak to the patient. You can still type below.</p>}
      {supported && (
        <Button disabled={disabled && !listening} onClick={() => { primeAudio(); listening ? stop() : start() }}
          className={`w-full gap-2 ${listening ? "bg-red-500 hover:bg-red-600 animate-pulse" : ""}`}>
          {listening ? <><Square className="h-4 w-4" /> Listening... tap when finished</> : <><Mic className="h-4 w-4" /> Tap to speak</>}
        </Button>
      )}
      {listening && interim && <p className="text-xs text-muted-foreground italic px-1">{interim}</p>}
      {error && <p className="text-xs rounded-lg bg-red-100 text-red-800 px-3 py-2">{error}</p>}
      {voiceIssue && <p className="text-xs rounded-lg bg-amber-100 text-amber-900 px-3 py-2">{voiceIssue}</p>}
      <div className="flex gap-2">
        <Input placeholder={placeholder || "Or type here..."} value={typed} onChange={(e) => setTyped(e.target.value)} disabled={disabled}
          onKeyDown={(e) => { if (e.key === "Enter" && typed.trim()) { onSubmit(typed.trim()); setTyped("") } }} />
        <Button disabled={disabled || !typed.trim()} onClick={() => { onSubmit(typed.trim()); setTyped("") }}>Send</Button>
      </div>
      {extra}
    </div>
  )
}
