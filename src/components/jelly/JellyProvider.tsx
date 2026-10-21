"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { usePathname } from "next/navigation"
import { useUser } from "@/firebase"
import { usePlan } from "@/hooks/use-plan"
import { JellyContext, type JellyApi, type JellyEvent, type JellyMessage } from "./jelly-store"
import type { Mood } from "./JellyAvatar"
import { JellyWidget } from "./JellyWidget"
import { useWakeWord } from "./useWakeWord"
import { createSpeaker, stopSpeaking as stopAllSpeech, useListen, type Speaker } from "@/components/osce/voice"
import { LANG_CODES } from "@/lib/osce/shared"
import { personaOf, PERSONAS, type Intent, type JellyCtx, type PersonaId } from "@/lib/jelly/personas"
import { EMPTY_PROFILE, topicKey, type JellyProfile, type Mode } from "@/lib/jelly/profile"

const KEY = { persona: "jelly.persona", sad: "jelly.sad", hidden: "jelly.hidden", wake: "jelly.wake", conv: "jelly.conv" }
const read = (k: string) => { try { return localStorage.getItem(k) } catch { return null } }
const write = (k: string, v: string) => { try { localStorage.setItem(k, v) } catch {} }
const pickOne = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)]
const plain = (s: string) => s.replace(/[*_#`>]/g, "").replace(/\s{2,}/g, " ")

const LABEL: Record<Intent, string> = {
  chat: "", explain: "Explain this", others: "Why are the others wrong?", mnemonic: "Give me a mnemonic", simple: "Explain it simply",
}

function moodFor(t: string): Mood {
  if (/(^|\n)\s*\**Q\d*[:.)]/i.test(t) && /(^|\n)\s*\**A\d*[:.)]/i.test(t)) return "cheering"
  if (/(well done|great job|excellent|brilliant|nice work|spot on|exactly right|you got it|that's right|correct!)/i.test(t)) return "cheering"
  if (/(sorry|oops|not quite|incorrect|mistake|careful|don't worry)/i.test(t)) return "oops"
  if (/(great|good|nice|easy|remember|tip|pearl|mnemonic|!)/i.test(t)) return "happy"
  return "explaining"
}

export function JellyProvider({ children }: { children: React.ReactNode }) {
  const { user } = useUser()
  const { canAccessContent, loading } = usePlan()
  const pathname = usePathname()
  const authPage = pathname === "/login" || pathname === "/signup"
  const visible = !!user && !authPage && !loading
  const active = visible && canAccessContent

  const [persona, setPersonaState] = useState<PersonaId>("jarvis")
  const [sadOnWrong, setSadState] = useState(false)
  const [hidden, setHiddenState] = useState(false)
  const [mood, setMood] = useState<Mood>("idle")
  const [bubble, setBubble] = useState<{ text: string; intent?: Intent } | null>(null)
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<JellyMessage[]>([])
  const [rated, setRated] = useState<Record<number, "up" | "down">>({})
  const [busy, setBusy] = useState(false)
  const [hasContext, setHasContext] = useState(false)
  const [mode, setMode] = useState<Mode>("doubt")
  const [profile, setProfile] = useState<JellyProfile>(EMPTY_PROFILE)
  const [usage, setUsage] = useState<{ used: number; limit: number } | null>(null)
  const [speaking, setSpeaking] = useState(false)
  const [conversation, setConvState] = useState(false)
  const [wakeOn, setWakeState] = useState(false)

  const name = user?.displayName?.trim().split(/\s+/)[0] || "Doctor"
  const voiceOn = !!profile.voiceOn
  const speechLang = LANG_CODES[profile.language || "English"] || "en-IN"

  const ref = useRef({ persona, sadOnWrong, active, name, open, messages, user, mode, profile, voiceOn, conversation, speechLang })
  ref.current = { persona, sadOnWrong, active, name, open, messages, user, mode, profile, voiceOn, conversation, speechLang }
  const ctxRef = useRef<JellyCtx | null>(null)
  const busyRef = useRef(false)
  const streak = useRef(0)
  const moodTimer = useRef<any>(null)
  const bubbleTimer = useRef<any>(null)
  const trackQ = useRef<{ topic: string; correct: boolean }[]>([])
  const trackTimer = useRef<any>(null)
  const heard = useRef<(t: string) => void>(() => {})

  /* ---------- profile (personalisation) ---------- */
  const profileCall = useCallback(async (action: string, extra: Record<string, unknown> = {}) => {
    const u = ref.current.user
    if (!u) throw new Error("Not signed in")
    const res = await fetch("/api/jelly/profile", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ idToken: await u.getIdToken(), action, ...extra }) })
    const d = await res.json()
    if (!res.ok) throw new Error(d.error || "Request failed")
    return d
  }, [])

  const refreshUsage = useCallback(() => {
    profileCall("get").then((d) => setUsage(d.usage)).catch(() => {})
  }, [profileCall])

  useEffect(() => {
    const p = read(KEY.persona)
    if (p && PERSONAS.some((x) => x.id === p)) setPersonaState(p as PersonaId)
    setSadState(read(KEY.sad) === "1")
    setHiddenState(read(KEY.hidden) === "1")
    setWakeState(read(KEY.wake) === "1")
    setConvState(read(KEY.conv) === "1")
  }, [])

  useEffect(() => {
    if (!user || !canAccessContent) return
    profileCall("get").then((d) => {
      setProfile(d.profile); setUsage(d.usage)
      if (d.profile.persona && PERSONAS.some((x) => x.id === d.profile.persona)) setPersonaState(d.profile.persona)
    }).catch(() => {})
  }, [user, canAccessContent, profileCall])

  const saveProfile = useCallback((patch: Partial<JellyProfile>) => {
    setProfile((p) => ({ ...p, ...patch }))
    profileCall("save", { patch }).then((d) => setProfile(d.profile)).catch(() => {})
  }, [profileCall])
  const removeNote = useCallback((i: number) => saveProfile({ notes: ref.current.profile.notes.filter((_, k) => k !== i) }), [saveProfile])
  const forgetMe = useCallback(() => { profileCall("forget").then((d) => setProfile(d.profile)).catch(() => {}) }, [profileCall])

  const setPersona = useCallback((p: PersonaId) => { setPersonaState(p); write(KEY.persona, p); saveProfile({ persona: p }) }, [saveProfile])
  const setSadOnWrong = useCallback((v: boolean) => { setSadState(v); write(KEY.sad, v ? "1" : "0") }, [])
  const setHidden = useCallback((v: boolean) => { setHiddenState(v); write(KEY.hidden, v ? "1" : "0"); if (v) setOpen(false) }, [])
  const setConversation = useCallback((v: boolean) => { setConvState(v); write(KEY.conv, v ? "1" : "0") }, [])
  const setWakeOn = useCallback((v: boolean) => { setWakeState(v); write(KEY.wake, v ? "1" : "0") }, [])
  const setVoiceOn = useCallback((v: boolean) => { if (!v) stopAllSpeech(); saveProfile({ voiceOn: v }) }, [saveProfile])

  /* ---------- tracking answers to learn the student's weak areas ---------- */
  const flushTrack = useCallback(() => {
    clearTimeout(trackTimer.current)
    const items = trackQ.current.splice(0)
    if (items.length) profileCall("track", { items }).catch(() => {})
  }, [profileCall])
  useEffect(() => () => flushTrack(), [flushTrack])

  /* ---------- mood, bubble, speech ---------- */
  const flashMood = useCallback((m: Mood, ms = 5000) => {
    setMood(m)
    clearTimeout(moodTimer.current)
    moodTimer.current = setTimeout(() => setMood("idle"), ms)
  }, [])

  const micStart = useRef<() => void>(() => {})

  const startSpeaker = useCallback((listenAfter = false): Speaker | null => {
    const u = ref.current.user
    if (!u) return null
    return createSpeaker({
      lang: ref.current.speechLang,
      gender: ref.current.profile.voiceGender || "female",
      variant: 1,
      kid: ref.current.profile.voiceKid !== false,
      getToken: () => u.getIdToken(),
      onStart: () => setSpeaking(true),
      onEnd: () => { setSpeaking(false); if (listenAfter && ref.current.conversation && ref.current.voiceOn) setTimeout(() => micStart.current(), 250) },
    })
  }, [])

  const show = useCallback((text: string, m: Mood, intent?: Intent) => {
    flashMood(m, 6000)
    if (ref.current.voiceOn) { const sp = startSpeaker(); sp?.push(plain(text)); sp?.end() }
    if (ref.current.open) return
    setBubble({ text, intent })
    clearTimeout(bubbleTimer.current)
    bubbleTimer.current = setTimeout(() => setBubble(null), intent ? 10000 : 7000)
  }, [flashMood, startSpeaker])

  const dismissBubble = useCallback(() => { clearTimeout(bubbleTimer.current); setBubble(null) }, [])

  const setContext = useCallback((c: JellyCtx | null) => {
    const prev = ctxRef.current
    ctxRef.current = c
    setHasContext(!!c)
    if (c && (!prev || prev.question !== c.question)) { setMessages([]); setRated({}) }
  }, [])

  const react = useCallback((e: JellyEvent) => {
    const r = ref.current
    if (!r.active) return
    const p = personaOf(r.persona)
    const fill = (s: string, x: Record<string, string | number> = {}) =>
      s.replace("{n}", r.name).replace("{s}", String(x.s ?? "")).replace("{score}", String(x.score ?? "")).replace("{total}", String(x.total ?? ""))
    if (e.type === "say") { show(e.text, e.mood || "happy"); return }
    if (e.type === "answer") {
      const topic = ctxRef.current?.topic
      if (topic && topicKey(topic)) {
        trackQ.current.push({ topic, correct: e.correct })
        setProfile((pr) => {
          const k = topicKey(topic); const cur = pr.weak[k] || { label: topic, w: 0, t: 0 }
          return { ...pr, weak: { ...pr.weak, [k]: { ...cur, t: cur.t + 1, w: cur.w + (e.correct ? 0 : 1) } } }
        })
        clearTimeout(trackTimer.current)
        if (trackQ.current.length >= 5) flushTrack(); else trackTimer.current = setTimeout(flushTrack, 20000)
      }
      if (e.correct) {
        streak.current += 1
        const s = streak.current
        show(fill(pickOne(s >= 3 ? p.lines.streak : p.lines.correct), { s }), s >= 3 ? "cheering" : "happy")
      } else {
        streak.current = 0
        show(fill(pickOne(p.lines.wrong)), r.sadOnWrong ? "sad" : "oops", "explain")
      }
      return
    }
    const ratio = e.total ? e.score / e.total : 0
    show(fill(pickOne(p.lines.finish), { score: e.score, total: e.total }), ratio >= 0.7 ? "cheering" : ratio >= 0.4 ? "happy" : "oops")
  }, [show, flushTrack])

  /* ---------- asking Jelly ---------- */
  const ask = useCallback(async (text: string, intent: Intent = "chat") => {
    const u = ref.current.user
    if (!u || !ref.current.active || busyRef.current) return
    if (intent === "chat" && !text.trim()) return
    const history = ref.current.messages
    setOpen(true); setBubble(null)
    setMessages([...history, { role: "user", text: intent === "chat" ? text : LABEL[intent] }, { role: "jelly", text: "" }])
    busyRef.current = true; setBusy(true); setMood("thinking")
    const append = (s: string) => setMessages((m) => { const c = [...m]; const k = c.length - 1; c[k] = { ...c[k], text: c[k].text + s }; return c })
    let got = false
    let full = ""
    let sp: Speaker | null = null
    try {
      const idToken = await u.getIdToken()
      const res = await fetch("/api/jelly", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken, intent, mode: (intent === "chat" && /flash\s?-?cards?/i.test(text)) ? "cards" : ref.current.mode, ask: text, persona: ref.current.persona, name: ref.current.name, ctx: ctxRef.current, messages: history.slice(-12) }),
      })
      if (!res.ok || !res.body) { const d = await res.json().catch(() => ({})); throw new Error(d.error || "No response") }
      if (ref.current.voiceOn) sp = startSpeaker(true)
      const reader = res.body.getReader(); const dec = new TextDecoder(); let buf = ""
      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        buf += dec.decode(value, { stream: true })
        let i: number
        while ((i = buf.indexOf("\n")) >= 0) {
          const line = buf.slice(0, i).trim(); buf = buf.slice(i + 1)
          if (!line) continue
          const ev = JSON.parse(line)
          if (ev.t === "d") { if (!got) { got = true; setMood("explaining") } full += ev.x; append(ev.x); sp?.push(plain(ev.x)) }
          else if (ev.t === "err") throw new Error(ev.x)
        }
      }
      if (!got) throw new Error("Empty")
      sp?.end()
      flashMood(moodFor(full), 3500)
    } catch (e: any) {
      sp?.stop()
      const msg = e?.message && !/^(No response|Empty|Failed)$/.test(e.message) ? e.message : "I couldn't reach my systems just now. Please try again in a moment."
      setMessages((m) => { const c = [...m]; c[c.length - 1] = { role: "jelly", text: msg }; return c })
      flashMood("oops", 4000)
    } finally {
      busyRef.current = false; setBusy(false)
      refreshUsage()
    }
  }, [flashMood, startSpeaker, refreshUsage])

  const clearChat = useCallback(() => { setMessages([]); setRated({}) }, [])
  const rate = useCallback((index: number, rating: "up" | "down") => {
    const m = ref.current.messages
    const a = m[index]; const q = m.slice(0, index).reverse().find((x) => x.role === "user")
    if (!a || a.role !== "jelly") return
    setRated((r) => ({ ...r, [index]: rating }))
    profileCall("feedback", { rating, q: q?.text || "", a: a.text, persona: ref.current.persona }).catch(() => {})
  }, [profileCall])

  /* ---------- microphone and wake word ---------- */
  heard.current = (t: string) => { setOpen(true); ask(t) }
  const L = useListen(speechLang, (t) => heard.current(t))
  micStart.current = () => { if (!busyRef.current && ref.current.active) { setOpen(true); L.start() } }
  const toggleMic = useCallback(() => { if (L.listening) L.stop(); else micStart.current() }, [L])
  const stopSpeaking = useCallback(() => { stopAllSpeech(); setSpeaking(false) }, [])

  const wake = useWakeWord(active && wakeOn && L.supported, L.listening || speaking || busy, (cmd) => {
    setOpen(true)
    if (cmd.length >= 4) ask(cmd); else { flashMood("listening", 6000); L.start() }
  })

  const shownMood: Mood = L.listening ? "listening" : mood

  const value: JellyApi = useMemo(() => ({
    active, mood: shownMood, persona, setPersona, sadOnWrong, setSadOnWrong, hidden, setHidden, open, setOpen, busy, messages,
    hasContext, bubble, dismissBubble, setContext, react, ask, name, mode, setMode, clearChat, rated, rate,
    profile, saveProfile, removeNote, forgetMe, usage, voiceOn, setVoiceOn, speaking, stopSpeaking,
    listening: L.listening, interim: L.interim, micSupported: L.supported, toggleMic, conversation, setConversation,
    wakeOn, setWakeOn, wakeSupported: wake.supported && L.supported,
  }), [active, shownMood, persona, setPersona, sadOnWrong, setSadOnWrong, hidden, setHidden, open, busy, messages, hasContext, bubble, dismissBubble, setContext, react, ask, name, mode, clearChat, rated, rate,
    profile, saveProfile, removeNote, forgetMe, usage, voiceOn, setVoiceOn, speaking, stopSpeaking, L.listening, L.interim, L.supported, toggleMic, conversation, setConversation, wakeOn, setWakeOn, wake.supported])

  return (
    <JellyContext.Provider value={value}>
      {children}
      {visible && pathname !== "/jelly" && <JellyWidget />}
    </JellyContext.Provider>
  )
}
