"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { ChevronLeft, ChevronRight, Maximize2, Minimize2, Shuffle, Check, RotateCcw, Trophy, Keyboard } from "lucide-react"

type Card = { front: string; back: string }

function hueOf(s: string) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360; return h }
function fit(t: string, kind: "q" | "a") {
  const n = (t || "").length
  if (kind === "q") return n < 40 ? "clamp(1.9rem,4.6vw,4rem)" : n < 100 ? "clamp(1.5rem,3.4vw,2.9rem)" : n < 220 ? "clamp(1.2rem,2.5vw,2.1rem)" : "clamp(1rem,1.9vw,1.55rem)"
  return n < 60 ? "clamp(1.6rem,3.8vw,3.2rem)" : n < 160 ? "clamp(1.3rem,2.9vw,2.4rem)" : n < 320 ? "clamp(1.1rem,2.2vw,1.8rem)" : "clamp(.95rem,1.7vw,1.4rem)"
}

const CSS = `
@keyframes fcDrift1{0%,100%{transform:translate3d(-8%,-6%,0) scale(1)}50%{transform:translate3d(10%,8%,0) scale(1.25)}}
@keyframes fcDrift2{0%,100%{transform:translate3d(8%,10%,0) scale(1.1)}50%{transform:translate3d(-10%,-8%,0) scale(.9)}}
@keyframes fcDrift3{0%,100%{transform:translate3d(0,8%,0) scale(1)}50%{transform:translate3d(6%,-10%,0) scale(1.3)}}
@keyframes fcTwinkle{0%,100%{opacity:.15}50%{opacity:.9}}
@keyframes fcEcg{from{stroke-dashoffset:1400}to{stroke-dashoffset:0}}
@keyframes fcSheen{0%{transform:translateX(-130%) skewX(-18deg)}60%,100%{transform:translateX(230%) skewX(-18deg)}}
@keyframes fcPop{0%{transform:scale(.92) translateY(14px);opacity:0}100%{transform:scale(1) translateY(0);opacity:1}}
@keyframes fcSpin{to{transform:rotate(360deg)}}
@keyframes fcFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}
.fc-pop{animation:fcPop .5s cubic-bezier(.2,.8,.2,1) both}
.fc-scroll::-webkit-scrollbar{width:6px}.fc-scroll::-webkit-scrollbar-thumb{background:rgba(255,255,255,.25);border-radius:9px}
@media (prefers-reduced-motion:reduce){.fc-anim{animation:none!important}}
`

export default function ImmersiveDeck({ cards, subject, unit, backHref }: { cards: Card[]; subject: string; unit?: string; backHref: string }) {
  const hue = hueOf(subject)
  const h2 = (hue + 60) % 360, h3 = (hue + 200) % 360
  const [order, setOrder] = useState<number[]>(() => cards.map((_, i) => i))
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [known, setKnown] = useState<Set<number>>(new Set())
  const [again, setAgain] = useState<Set<number>>(new Set())
  const [done, setDone] = useState(false)
  const [full, setFull] = useState(false)
  const [help, setHelp] = useState(false)
  const touch = useRef<number | null>(null)
  const stars = useMemo(() => Array.from({ length: 46 }).map((_, i) => ({ x: (i * 53) % 100, y: (i * 37) % 100, d: (i % 7) * 0.6, s: 1 + (i % 3) })), [])

  const total = order.length
  const cardIdx = order[index]
  const card = cards[cardIdx]

  const go = useCallback((d: number) => { setFlipped(false); setIndex((i) => Math.max(0, Math.min(total - 1, i + d))) }, [total])
  const mark = useCallback((ok: boolean) => {
    if (!card) return
    setKnown((k) => { const n = new Set(k); ok ? n.add(cardIdx) : n.delete(cardIdx); return n })
    setAgain((a) => { const n = new Set(a); ok ? n.delete(cardIdx) : n.add(cardIdx); return n })
    setFlipped(false)
    if (index >= total - 1) setDone(true); else setIndex(index + 1)
  }, [card, cardIdx, index, total])
  const shuffle = useCallback(() => {
    const a = cards.map((_, i) => i)
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]] }
    setOrder(a); setIndex(0); setFlipped(false); setDone(false)
  }, [cards])
  const restart = (onlyMissed: boolean) => {
    const base = cards.map((_, i) => i)
    setOrder(onlyMissed ? base.filter((i) => again.has(i) || !known.has(i)) : base)
    if (!onlyMissed) { setKnown(new Set()); setAgain(new Set()) }
    setIndex(0); setFlipped(false); setDone(false)
  }
  const toggleFull = useCallback(() => {
    try {
      if (document.fullscreenElement) document.exitFullscreen()
      else document.documentElement.requestFullscreen?.()
    } catch {}
  }, [])

  useEffect(() => {
    const onFs = () => setFull(!!document.fullscreenElement)
    document.addEventListener("fullscreenchange", onFs)
    return () => document.removeEventListener("fullscreenchange", onFs)
  }, [])
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => { document.body.style.overflow = prev; try { if (document.fullscreenElement) document.exitFullscreen() } catch {} }
  }, [])
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (done) return
      if (e.key === "ArrowRight") go(1)
      else if (e.key === "ArrowLeft") go(-1)
      else if (e.key === " " || e.key === "Enter") { e.preventDefault(); setFlipped((f) => !f) }
      else if (e.key === "s" || e.key === "S") shuffle()
      else if (e.key === "f" || e.key === "F") toggleFull()
      else if (e.key === "1") mark(false)
      else if (e.key === "2") mark(true)
      else if (e.key === "?") setHelp((h) => !h)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [done, go, shuffle, toggleFull, mark])

  const pct = total ? Math.round(((index + (flipped ? 1 : 0.5)) / total) * 100) : 0
  const glass = "border border-white/15 bg-white/[0.07] text-white backdrop-blur-xl transition hover:bg-white/15 active:scale-95"

  return (
    <div className="fixed inset-0 z-[80] overflow-hidden text-white" style={{ background: `radial-gradient(120% 90% at 50% 0%, hsl(${hue} 55% 14%) 0%, #06060d 62%, #020208 100%)`, height: "100dvh" }}>
      <style>{CSS}</style>

      {/* aurora */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="fc-anim absolute -left-[15%] -top-[20%] h-[75vmax] w-[75vmax] rounded-full opacity-45 blur-[110px]" style={{ background: `hsl(${hue} 90% 55%)`, animation: "fcDrift1 22s ease-in-out infinite" }} />
        <div className="fc-anim absolute -right-[20%] top-[10%] h-[65vmax] w-[65vmax] rounded-full opacity-35 blur-[120px]" style={{ background: `hsl(${h2} 90% 55%)`, animation: "fcDrift2 28s ease-in-out infinite" }} />
        <div className="fc-anim absolute -bottom-[30%] left-[15%] h-[70vmax] w-[70vmax] rounded-full opacity-30 blur-[130px]" style={{ background: `hsl(${h3} 90% 55%)`, animation: "fcDrift3 31s ease-in-out infinite" }} />
        <div className="absolute inset-0 opacity-[0.12]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.7) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.7) 1px,transparent 1px)", backgroundSize: "56px 56px", maskImage: "radial-gradient(70% 60% at 50% 45%,#000,transparent)", WebkitMaskImage: "radial-gradient(70% 60% at 50% 45%,#000,transparent)" }} />
        {stars.map((s, i) => <span key={i} className="fc-anim absolute rounded-full bg-white" style={{ left: s.x + "%", top: s.y + "%", width: s.s, height: s.s, animation: `fcTwinkle ${3 + (i % 4)}s ease-in-out ${s.d}s infinite` }} />)}
        {/* faint DNA helix */}
        <svg className="absolute bottom-0 right-0 hidden h-[70vh] w-40 opacity-[0.18] md:block" viewBox="0 0 100 400" fill="none">
          {Array.from({ length: 14 }).map((_, i) => { const y = 14 + i * 28, w = Math.sin(i * 0.9) * 34; return <g key={i}><line x1={50 - w} y1={y} x2={50 + w} y2={y} stroke="white" strokeOpacity=".5" /><circle cx={50 - w} cy={y} r="4.5" fill={`hsl(${hue} 95% 70%)`} /><circle cx={50 + w} cy={y} r="4.5" fill={`hsl(${h2} 95% 70%)`} /></g> })}
        </svg>
        {/* ECG line */}
        <svg className="absolute inset-x-0 bottom-3 h-16 w-full opacity-30" viewBox="0 0 1400 60" preserveAspectRatio="none" fill="none">
          <path className="fc-anim" d="M0 30 H220 l14-4 14 4 H330 l8 4 10-34 12 46 8-16 H520 q22-16 44 0 H760 l8 4 10-34 12 46 8-16 H940 q22-16 44 0 H1180 l8 4 10-34 12 46 8-16 H1400" stroke={`hsl(${hue} 100% 75%)`} strokeWidth="2" strokeLinecap="round" strokeDasharray="1400" style={{ animation: "fcEcg 6s linear infinite" }} />
        </svg>
      </div>

      <div className="relative z-10 flex h-full flex-col px-3 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-6 sm:pb-5">
        {/* top bar */}
        <div className="mx-auto flex w-full max-w-6xl items-center gap-2 sm:gap-3">
          <Link href={backHref} className={`flex h-10 items-center gap-1 rounded-full px-3 text-sm font-bold ${glass}`}><ChevronLeft className="h-4 w-4" /> <span className="hidden sm:inline">Back</span></Link>
          <div className="min-w-0 flex-1 text-center">
            <p className="truncate text-[11px] font-black uppercase tracking-[0.25em] text-white/60">{subject}</p>
            {unit && <p className="truncate text-xs font-semibold text-white/80">{unit}</p>}
          </div>
          <button onClick={() => setHelp((h) => !h)} aria-label="Shortcuts" className={`hidden h-10 w-10 place-items-center rounded-full sm:grid ${glass}`}><Keyboard className="h-4 w-4" /></button>
          <button onClick={shuffle} aria-label="Shuffle" className={`grid h-10 w-10 place-items-center rounded-full ${glass}`}><Shuffle className="h-4 w-4" /></button>
          <button onClick={toggleFull} aria-label="Full screen" className={`grid h-10 w-10 place-items-center rounded-full ${glass}`}>{full ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}</button>
        </div>

        {/* progress */}
        <div className="mx-auto mt-3 w-full max-w-6xl">
          <div className="mb-1.5 flex items-center justify-between font-mono text-[11px] font-bold text-white/70">
            <span>CARD {String(Math.min(index + 1, total)).padStart(2, "0")} / {total}</span>
            <span className="flex items-center gap-3"><span className="text-emerald-300">✓ {known.size}</span><span className="text-amber-300">↻ {again.size}</span><span>{pct}%</span></span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full transition-all duration-500" style={{ width: pct + "%", background: `linear-gradient(90deg, hsl(${hue} 95% 65%), hsl(${h2} 95% 65%))`, boxShadow: `0 0 14px hsl(${hue} 95% 65%)` }} /></div>
        </div>

        {/* card */}
        <div className="relative mx-auto mt-3 flex min-h-0 w-full max-w-6xl flex-1 items-center justify-center sm:mt-5"
          onTouchStart={(e) => { touch.current = e.touches[0].clientX }}
          onTouchEnd={(e) => { if (touch.current == null) return; const dx = e.changedTouches[0].clientX - touch.current; touch.current = null; if (Math.abs(dx) > 60) go(dx < 0 ? 1 : -1) }}>
          {done ? (
            <div className="fc-pop mx-auto w-full max-w-xl rounded-[2rem] border border-white/20 bg-white/[0.08] p-8 text-center backdrop-blur-2xl sm:p-12" style={{ boxShadow: `0 30px 120px hsl(${hue} 90% 50% / .35)` }}>
              <div className="fc-anim mx-auto mb-4 grid h-20 w-20 place-items-center rounded-3xl text-amber-300" style={{ background: "linear-gradient(145deg,rgba(255,255,255,.2),rgba(255,255,255,.04))", animation: "fcFloat 3s ease-in-out infinite" }}><Trophy className="h-10 w-10" /></div>
              <h2 className="text-3xl font-black sm:text-4xl">Round complete</h2>
              <p className="mt-2 text-white/70">You knew <b className="text-emerald-300">{known.size}</b> and want to revisit <b className="text-amber-300">{cards.length - known.size}</b> of {cards.length} cards.</p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
                {cards.length - known.size > 0 && <button onClick={() => restart(true)} className="h-12 rounded-2xl px-6 font-black text-slate-900" style={{ background: `linear-gradient(135deg, hsl(${hue} 95% 78%), hsl(${h2} 95% 70%))` }}>Review missed cards</button>}
                <button onClick={() => restart(false)} className={`flex h-12 items-center justify-center gap-2 rounded-2xl px-6 font-bold ${glass}`}><RotateCcw className="h-4 w-4" /> Start over</button>
                <Link href={backHref} className={`flex h-12 items-center justify-center rounded-2xl px-6 font-bold ${glass}`}>Back to deck</Link>
              </div>
            </div>
          ) : card ? (
            <button type="button" onClick={() => setFlipped((f) => !f)} aria-label="Flip card" key={cardIdx + "-" + index}
              className="fc-pop group relative block h-full max-h-[78dvh] w-full cursor-pointer text-left outline-none" style={{ perspective: "2200px" }}>
              <div className="relative h-full w-full" style={{ transformStyle: "preserve-3d", transition: "transform .75s cubic-bezier(.3,.1,.2,1)", transform: flipped ? "rotateY(180deg)" : "rotateY(0)" }}>
                {/* front */}
                <div className="absolute inset-0 overflow-hidden rounded-[1.75rem] sm:rounded-[2.5rem]" style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", background: `linear-gradient(155deg, hsl(${hue} 60% 30% / .85), hsl(${hue} 55% 12% / .95) 55%, hsl(${h3} 50% 10% / .95))`, boxShadow: `0 40px 140px hsl(${hue} 90% 45% / .4), inset 0 1px 0 rgba(255,255,255,.35), inset 0 0 0 1px rgba(255,255,255,.14)` }}>
                  <div aria-hidden className="fc-anim pointer-events-none absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/15 to-transparent" style={{ animation: "fcSheen 7s ease-in-out infinite" }} />
                  <svg aria-hidden className="pointer-events-none absolute -right-10 -top-10 h-72 w-72 opacity-[0.12]" viewBox="0 0 100 100" fill="none" stroke="white" strokeWidth=".7"><polygon points="50,6 88,28 88,72 50,94 12,72 12,28" /><polygon points="50,22 74,36 74,64 50,78 26,64 26,36" /><line x1="50" y1="6" x2="50" y2="22" /><line x1="88" y1="28" x2="74" y2="36" /><line x1="88" y1="72" x2="74" y2="64" /></svg>
                  <div className="fc-scroll relative flex h-full flex-col items-center justify-center gap-5 overflow-y-auto p-6 text-center sm:p-12">
                    <span className="rounded-full border border-white/20 bg-white/10 px-4 py-1 text-[11px] font-black uppercase tracking-[0.3em]" style={{ color: `hsl(${hue} 100% 85%)` }}>Question</span>
                    <p className="max-w-[26ch] font-extrabold leading-[1.18] tracking-tight sm:max-w-[34ch]" style={{ fontSize: fit(card.front, "q"), textShadow: "0 4px 30px rgba(0,0,0,.45)", whiteSpace: "pre-line", maxWidth: "min(100%, 62rem)" }}>{card.front}</p>
                    <span className="mt-1 flex items-center gap-2 text-xs font-semibold text-white/55 sm:text-sm"><span className="inline-block h-2 w-2 animate-ping rounded-full bg-white/70" /> Tap, or press Space, to reveal</span>
                  </div>
                </div>
                {/* back */}
                <div className="absolute inset-0 overflow-hidden rounded-[1.75rem] sm:rounded-[2.5rem]" style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", transform: "rotateY(180deg)", background: "linear-gradient(155deg, hsl(38 90% 40% / .9), hsl(28 80% 17% / .96) 55%, hsl(18 70% 9% / .97))", boxShadow: "0 40px 140px hsl(38 95% 50% / .35), inset 0 1px 0 rgba(255,255,255,.4), inset 0 0 0 1px rgba(255,255,255,.16)" }}>
                  <div aria-hidden className="fc-anim pointer-events-none absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/15 to-transparent" style={{ animation: "fcSheen 7s ease-in-out infinite" }} />
                  <div className="fc-scroll relative flex h-full flex-col items-center justify-center gap-5 overflow-y-auto p-6 text-center sm:p-12">
                    <span className="rounded-full border border-white/25 bg-white/10 px-4 py-1 text-[11px] font-black uppercase tracking-[0.3em] text-amber-100">Answer</span>
                    <p className="font-bold leading-[1.3] text-amber-50" style={{ fontSize: fit(card.back, "a"), whiteSpace: "pre-line", maxWidth: "min(100%, 62rem)", textShadow: "0 4px 24px rgba(0,0,0,.4)" }}>{card.back}</p>
                  </div>
                </div>
              </div>
            </button>
          ) : null}
        </div>

        {/* controls */}
        {!done && (
          <div className="mx-auto mt-3 flex w-full max-w-3xl items-center gap-2 pb-[env(safe-area-inset-bottom)] sm:mt-5 sm:gap-3">
            <button onClick={() => go(-1)} disabled={index === 0} aria-label="Previous" className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl disabled:opacity-30 sm:h-14 sm:w-14 ${glass}`}><ChevronLeft className="h-5 w-5" /></button>
            <button onClick={() => mark(false)} className="flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl border border-amber-300/40 bg-amber-400/15 text-sm font-black text-amber-100 backdrop-blur-xl transition hover:bg-amber-400/25 active:scale-95 sm:h-14 sm:text-base"><RotateCcw className="h-4 w-4" /> Review again</button>
            <button onClick={() => mark(true)} className="flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl border border-emerald-300/40 bg-emerald-400/20 text-sm font-black text-emerald-100 backdrop-blur-xl transition hover:bg-emerald-400/30 active:scale-95 sm:h-14 sm:text-base"><Check className="h-4 w-4" /> Got it</button>
            <button onClick={() => go(1)} disabled={index >= total - 1} aria-label="Next" className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl disabled:opacity-30 sm:h-14 sm:w-14 ${glass}`}><ChevronRight className="h-5 w-5" /></button>
          </div>
        )}
      </div>

      {help && (
        <div onClick={() => setHelp(false)} className="absolute inset-0 z-20 grid place-items-center bg-black/60 p-6 backdrop-blur-sm">
          <div className="fc-pop w-full max-w-sm rounded-3xl border border-white/20 bg-slate-900/90 p-6 text-sm">
            <p className="mb-3 text-base font-black">Keyboard shortcuts</p>
            {[["Space / Enter", "Flip card"], ["← →", "Previous / next"], ["1", "Review again"], ["2", "Got it"], ["S", "Shuffle"], ["F", "Full screen"], ["?", "This help"]].map(([k, v]) => <div key={k} className="flex justify-between border-t border-white/10 py-1.5"><kbd className="rounded bg-white/10 px-2 font-mono text-xs">{k}</kbd><span className="text-white/70">{v}</span></div>)}
            <p className="mt-3 text-xs text-white/50">On a phone, swipe left or right to move between cards.</p>
          </div>
        </div>
      )}
    </div>
  )
}
