// Voice input fix for iPhone / Safari and Indian languages:
// when the browser cannot recognise speech (or the language), record a short clip and transcribe it on the server.
const fs = require("fs")
const f = "src/components/osce/voice.tsx"
if (!fs.existsSync(f)) { console.log("STOP: " + f + " not found. Nothing changed."); process.exit(1) }
let s = fs.readFileSync(f, "utf8"); const crlf = s.includes("\r\n"); if (crlf) s = s.replace(/\r\n/g, "\n")
if (s.includes("/api/osce-stations/stt")) { console.log("Already applied."); process.exit(0) }

const OLD_MSG = "The microphone is blocked. Tap the lock icon in the address bar, allow Microphone for this site, then tap again."
const NEW_MSG = "The microphone is blocked. On iPhone: Settings > Safari > Microphone > Allow. On Chrome: tap the lock icon in the address bar and allow Microphone. Then tap again."

const edits = [
  ['import { micAcquire } from "@/lib/mic-lock"\n',
   'import { micAcquire } from "@/lib/mic-lock"\nimport { useUser } from "@/firebase"\n'],

  ['  const cb = useRef(onFinal); cb.current = onFinal\n',
`  const cb = useRef(onFinal); cb.current = onFinal
  const { user: fbUser } = useUser(); const userRef = useRef<any>(null); userRef.current = fbUser
  const recMode = useRef(""); const fallingBack = useRef(false); const startRef = useRef<() => void>(() => {})
  const mr = useRef<any>(null); const chunks = useRef<Blob[]>([]); const vadStop = useRef<null | (() => void)>(null)
`],

  ['const stop = useCallback(() => { want.current = false; clearTimeout(timer.current); try { recRef.current?.stop() } catch { flush() } }, [flush])',
   'const stop = useCallback(() => { want.current = false; clearTimeout(timer.current); try { if (mr.current && mr.current.state !== "inactive") { mr.current.stop(); return } recRef.current?.stop() } catch { flush() } }, [flush])'],

  ['  const arm = useCallback((ms: number) => { clearTimeout(timer.current); timer.current = setTimeout(stop, ms) }, [stop])\n',
`  const arm = useCallback((ms: number) => { clearTimeout(timer.current); timer.current = setTimeout(stop, ms) }, [stop])

  // Fallback for browsers that cannot recognise speech (or this language): record a short clip, transcribe it on the server.
  const transcribe = useCallback(async (blob: Blob): Promise<string> => {
    try {
      const token = await userRef.current?.getIdToken()
      const fd = new FormData(); fd.append("idToken", token || ""); fd.append("lang", lang)
      fd.append("audio", blob, blob.type.includes("mp4") ? "speech.m4a" : blob.type.includes("ogg") ? "speech.ogg" : "speech.webm")
      const res = await fetch("/api/osce-stations/stt", { method: "POST", body: fd })
      const j: any = await res.json().catch(() => ({}))
      if (!res.ok) { setError(j.error || "Could not understand the audio. Please try again or type."); return "" }
      return String(j.text || "").trim()
    } catch { setError("Voice upload failed. Check your internet connection and try again."); return "" }
  }, [lang])

  const startRecorder = useCallback(async (stream: MediaStream): Promise<boolean> => {
    const Rec = (window as any).MediaRecorder
    const mime = ["audio/mp4", "audio/webm;codecs=opus", "audio/webm", "audio/ogg"].find((m) => { try { return Rec.isTypeSupported(m) } catch { return false } }) || ""
    let r: any
    try { r = mime ? new Rec(stream, { mimeType: mime }) : new Rec(stream) }
    catch { stream.getTracks().forEach((t) => t.stop()); setError("This browser cannot record audio. Please type instead."); return false }
    chunks.current = []; mr.current = r
    r.ondataavailable = (e: any) => { if (e.data && e.data.size) chunks.current.push(e.data) }
    r.onstop = async () => {
      want.current = false
      vadStop.current?.(); vadStop.current = null
      stream.getTracks().forEach((t) => t.stop()); mr.current = null
      clearTimeout(timer.current)
      const blob = new Blob(chunks.current, { type: r.mimeType || mime || "audio/mp4" }); chunks.current = []
      if (blob.size < 1500) { flush(); setError("I did not hear anything. Tap the mic and speak again."); return }
      setInterim("Understanding...")
      finalRef.current = await transcribe(blob); interimRef.current = ""
      flush()
    }
    r.start()
    // stop by itself after a real pause (skipped when the phone does not allow audio analysis; the student can tap to finish)
    try {
      const AC = (window as any).AudioContext || (window as any).webkitAudioContext
      const ctx = new AC(); try { await ctx.resume() } catch {}
      if (ctx.state === "running") {
        const an = ctx.createAnalyser(); an.fftSize = 1024; ctx.createMediaStreamSource(stream).connect(an)
        const data = new Uint8Array(an.fftSize); let spoke = false; let last = Date.now(); const t0 = Date.now()
        const iv = setInterval(() => {
          an.getByteTimeDomainData(data)
          let sum = 0; for (let i = 0; i < data.length; i++) { const v = (data[i] - 128) / 128; sum += v * v }
          if (Math.sqrt(sum / data.length) > 0.03) { spoke = true; last = Date.now() }
          if ((spoke && Date.now() - last > 1800) || (!spoke && Date.now() - t0 > 10000)) stop()
        }, 150)
        vadStop.current = () => { clearInterval(iv); try { ctx.close() } catch {} }
      } else { try { ctx.close() } catch {} }
    } catch {}
    setListening(true); arm(30000)
    return true
  }, [transcribe, flush, arm, stop])
`],

  ['    r.onerror = (e: any) => {\n      const c = e?.error\n',
`    r.onerror = (e: any) => {
      const c = e?.error
      // the browser cannot do speech recognition here (typical on iPhone for Indian languages): switch to recording
      if ((c === "not-allowed" || c === "service-not-allowed" || c === "language-not-supported" || c === "network") && (window as any).MediaRecorder && recMode.current !== lang) {
        recMode.current = lang; fallingBack.current = true; want.current = false
        try { r.abort() } catch {}
        setTimeout(() => { startRef.current() }, 150)
        return
      }
`],

  ['    r.onend = () => {\n      if (want.current && Date.now() - startedAt.current > 600) {',
   '    r.onend = () => {\n      if (fallingBack.current) return\n      if (want.current && Date.now() - startedAt.current > 600) {'],

  ['if (!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)) setSupported(false)',
   'if (!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition || (window as any).MediaRecorder)) setSupported(false)'],

  ['    starting.current = true\n    stopSpeaking(); primeAudio()',
   '    starting.current = true; fallingBack.current = false\n    stopSpeaking(); primeAudio()'],

  ['      if (navigator.mediaDevices?.getUserMedia) {\n        try { (await navigator.mediaDevices.getUserMedia({ audio: true })).getTracks().forEach((t) => t.stop()) }',
   '      let stream: MediaStream | null = null\n      if (navigator.mediaDevices?.getUserMedia) {\n        try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }) }'],

  ['      const r = make(); recRef.current = r; want.current = true; startedAt.current = Date.now()\n      r.start(); setListening(true); arm(9000)',
`      const nativeOK = !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)
      const ios = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
      const useRec = !!stream && !!(window as any).MediaRecorder && (!nativeOK || recMode.current === lang || (ios && !/^en/i.test(lang)))
      if (useRec && stream) {
        want.current = true; startedAt.current = Date.now()
        const ok = await startRecorder(stream)
        if (!ok) { want.current = false; release.current?.(); release.current = null }
        return
      }
      stream?.getTracks().forEach((t) => t.stop())
      const r = make(); recRef.current = r; want.current = true; startedAt.current = Date.now()
      r.start(); setListening(true); arm(9000)`],

  ['  }, [make, arm])\n\n  return { start, stop, listening, interim, supported, error }',
   '  }, [make, arm, startRecorder, lang])\n  startRef.current = start\n\n  return { start, stop, listening, interim, supported, error }'],
]

s = s.split(OLD_MSG).join(NEW_MSG)
for (const [a, b] of edits) {
  if (s.split(a).length !== 2) { console.log("STOP: could not find this exactly once in voice.tsx:\n  " + a.split("\n")[0].slice(0, 110) + "\nNothing changed."); process.exit(1) }
  s = s.replace(a, () => b)
}
fs.writeFileSync(f, crlf ? s.replace(/\n/g, "\r\n") : s)
console.log("Done: voice input fallback added to voice.tsx")
