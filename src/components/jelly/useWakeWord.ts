"use client"

import { useEffect, useRef, useState } from "react"
import { useMicBusy } from "@/lib/mic-lock"

const WAKE = /\b(?:hey |hi |ok |okay )?(?:jelly|jelli|jeli|jally|jolly|chelly|gelly)\b/i

/**
 * Listens for the word "Jelly" using the browser's speech recognition.
 * Works only while the app is open in a browser that supports it, with the microphone allowed.
 * Pauses itself while `paused` is true (Jelly speaking or the mic already in use).
 */
export function useWakeWord(enabled: boolean, paused: boolean, onWake: (command: string) => void) {
  const [supported, setSupported] = useState(true)
  const cb = useRef(onWake); cb.current = onWake
  const micBusy = useMicBusy() // another part of the app (for example the OSCE mic) is using speech recognition
  const active = enabled && !paused && !micBusy

  useEffect(() => {
    if (!active) return
    const Ctor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!Ctor) { setSupported(false); return }
    let stopped = false; let rec: any = null; let timer: any = null
    let last = ""; let matched = false

    const fire = () => {
      stopped = true
      try { rec?.abort() } catch {}
      const m = WAKE.exec(last)
      const cmd = m ? last.slice(m.index + m[0].length).replace(/^[\s,.:;!?-]+/, "").trim() : ""
      cb.current(cmd)
    }
    const start = () => {
      if (stopped) return
      rec = new Ctor()
      rec.lang = "en-IN"; rec.continuous = true; rec.interimResults = true
      rec.onresult = (e: any) => {
        let t = ""
        for (let i = 0; i < e.results.length; i++) t += e.results[i][0].transcript + " "
        last = t
        if (!matched && WAKE.test(t)) { matched = true; timer = setTimeout(fire, 1300) } // wait a moment for a command in the same breath
      }
      rec.onend = () => { if (!stopped && !matched) setTimeout(start, 300) }
      rec.onerror = (e: any) => { if (e.error === "not-allowed" || e.error === "service-not-allowed") { stopped = true; setSupported(false) } }
      try { rec.start() } catch {}
    }
    start()
    return () => { stopped = true; clearTimeout(timer); try { rec?.abort() } catch {} }
  }, [active])

  return { supported }
}
