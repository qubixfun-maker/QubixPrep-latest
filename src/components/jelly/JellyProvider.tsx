"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { usePathname } from "next/navigation"
import { useUser } from "@/firebase"
import { usePlan } from "@/hooks/use-plan"
import { JellyContext, type JellyApi, type JellyEvent, type JellyMessage } from "./jelly-store"
import type { Mood } from "./JellyAvatar"
import { JellyWidget } from "./JellyWidget"
import { personaOf, PERSONAS, type Intent, type JellyCtx, type PersonaId } from "@/lib/jelly/personas"

const KEY = { persona: "jelly.persona", sad: "jelly.sad", hidden: "jelly.hidden" }
const read = (k: string) => { try { return localStorage.getItem(k) } catch { return null } }
const write = (k: string, v: string) => { try { localStorage.setItem(k, v) } catch {} }
const pickOne = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)]

const LABEL: Record<Intent, string> = {
  chat: "", explain: "Explain this", others: "Why are the others wrong?", mnemonic: "Give me a mnemonic", simple: "Explain it simply",
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
  const [busy, setBusy] = useState(false)
  const [hasContext, setHasContext] = useState(false)

  const name = user?.displayName?.trim().split(/\s+/)[0] || "Doctor"

  const ref = useRef({ persona, sadOnWrong, active, name, open, messages, user })
  ref.current = { persona, sadOnWrong, active, name, open, messages, user }
  const ctxRef = useRef<JellyCtx | null>(null)
  const busyRef = useRef(false)
  const streak = useRef(0)
  const moodTimer = useRef<any>(null)
  const bubbleTimer = useRef<any>(null)

  useEffect(() => {
    const p = read(KEY.persona)
    if (p && PERSONAS.some((x) => x.id === p)) setPersonaState(p as PersonaId)
    setSadState(read(KEY.sad) === "1")
    setHiddenState(read(KEY.hidden) === "1")
  }, [])

  const setPersona = useCallback((p: PersonaId) => { setPersonaState(p); write(KEY.persona, p) }, [])
  const setSadOnWrong = useCallback((v: boolean) => { setSadState(v); write(KEY.sad, v ? "1" : "0") }, [])
  const setHidden = useCallback((v: boolean) => { setHiddenState(v); write(KEY.hidden, v ? "1" : "0"); if (v) setOpen(false) }, [])

  const flashMood = useCallback((m: Mood, ms = 5000) => {
    setMood(m)
    clearTimeout(moodTimer.current)
    moodTimer.current = setTimeout(() => setMood("idle"), ms)
  }, [])

  const show = useCallback((text: string, m: Mood, intent?: Intent) => {
    flashMood(m, 6000)
    if (ref.current.open) return
    setBubble({ text, intent })
    clearTimeout(bubbleTimer.current)
    bubbleTimer.current = setTimeout(() => setBubble(null), intent ? 10000 : 7000)
  }, [flashMood])

  const dismissBubble = useCallback(() => { clearTimeout(bubbleTimer.current); setBubble(null) }, [])

  const setContext = useCallback((c: JellyCtx | null) => {
    const prev = ctxRef.current
    ctxRef.current = c
    setHasContext(!!c)
    if (c && (!prev || prev.question !== c.question)) setMessages([])
  }, [])

  const react = useCallback((e: JellyEvent) => {
    const r = ref.current
    if (!r.active) return
    const p = personaOf(r.persona)
    const fill = (s: string, x: Record<string, string | number> = {}) =>
      s.replace("{n}", r.name).replace("{s}", String(x.s ?? "")).replace("{score}", String(x.score ?? "")).replace("{total}", String(x.total ?? ""))
    if (e.type === "say") { show(e.text, e.mood || "happy"); return }
    if (e.type === "answer") {
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
  }, [show])

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
    try {
      const idToken = await u.getIdToken()
      const res = await fetch("/api/jelly", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken, intent, ask: text, persona: ref.current.persona, name: ref.current.name, ctx: ctxRef.current, messages: history.slice(-8) }),
      })
      if (!res.ok || !res.body) { const d = await res.json().catch(() => ({})); throw new Error(d.error || "No response") }
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
          if (ev.t === "d") { if (!got) { got = true; setMood("explaining") } append(ev.x) }
          else if (ev.t === "err") throw new Error(ev.x)
        }
      }
      if (!got) throw new Error("Empty")
      flashMood("explaining", 2500)
    } catch (e: any) {
      const msg = e?.message && !/^(No response|Empty|Failed)$/.test(e.message) ? e.message : "I couldn't reach my systems just now. Please try again in a moment."
      setMessages((m) => { const c = [...m]; c[c.length - 1] = { role: "jelly", text: msg }; return c })
      flashMood("oops", 4000)
    } finally {
      busyRef.current = false; setBusy(false)
    }
  }, [flashMood])

  const value: JellyApi = useMemo(() => ({
    active, mood, persona, setPersona, sadOnWrong, setSadOnWrong, hidden, setHidden, open, setOpen, busy, messages,
    hasContext, bubble, dismissBubble, setContext, react, ask, name,
  }), [active, mood, persona, setPersona, sadOnWrong, setSadOnWrong, hidden, setHidden, open, busy, messages, hasContext, bubble, dismissBubble, setContext, react, ask, name])

  return (
    <JellyContext.Provider value={value}>
      {children}
      {visible && <JellyWidget />}
    </JellyContext.Provider>
  )
}
