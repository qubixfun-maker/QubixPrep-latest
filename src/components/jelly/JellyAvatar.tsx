"use client"

import { useEffect, useState } from "react"

export type Mood = "idle" | "happy" | "cheering" | "oops" | "sad" | "thinking" | "explaining" | "listening" | "sleep"

/** Which picture (in /public/jelly) each mood uses. */
const SPRITE: Record<Mood, string> = {
  idle: "idle", happy: "happy", cheering: "cheering", oops: "thinking", sad: "thinking",
  thinking: "thinking", explaining: "explaining", listening: "listening", sleep: "sleep",
}
/** While speaking, Jelly keeps changing pose (waving, arms up, pointing, laughing) so it looks alive. */
const GESTURES: Partial<Record<Mood, string[]>> = {
  idle: ["idle", "explaining", "happy", "idle", "cheering", "explaining"],
  happy: ["happy", "cheering", "idle", "happy", "explaining"],
  cheering: ["cheering", "happy", "idle", "cheering"],
  explaining: ["explaining", "idle", "explaining", "happy", "cheering"],
}
const ALL = ["idle", "happy", "cheering", "thinking", "explaining", "listening", "sleep"]

let preloaded = false
function preload() {
  if (preloaded || typeof window === "undefined") return
  preloaded = true
  ALL.forEach((n) => { const i = new Image(); i.src = `/jelly/${n}.webp` })
}

const CSS = `
@keyframes jyFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
@keyframes jyIn{from{opacity:0;transform:scale(.92)}to{opacity:1;transform:scale(1)}}
@keyframes jySpeak{0%,100%{transform:translateY(0) rotate(-2.5deg) scale(var(--s))}25%{transform:translateY(-4px) rotate(0deg) scale(calc(var(--s) * 1.04))}50%{transform:translateY(0) rotate(2.5deg) scale(var(--s))}75%{transform:translateY(-3px) rotate(0deg) scale(calc(var(--s) * 1.03))}}
@keyframes jyGlow{0%,100%{filter:drop-shadow(0 0 3px rgba(150,170,255,.5))}50%{filter:drop-shadow(0 0 10px rgba(170,150,255,.95))}}
@keyframes jyPop{0%,100%{opacity:.25;transform:scale(.8)}50%{opacity:1;transform:scale(1.1)}}
.jy-wrap{position:relative;display:inline-block;flex-shrink:0;animation:jyFloat 3.6s ease-in-out infinite}
.jy-inner{position:absolute;inset:0;--s:1;transform:scale(var(--s));transform-origin:center bottom}
.jy-inner.jy-idle{--s:1.2}
.jy-inner.jy-speak{animation:jySpeak .9s ease-in-out infinite,jyGlow 1.4s ease-in-out infinite}
.jy-img.jy-quick{animation-duration:.14s}
.jy-img{width:100%;height:100%;object-fit:contain;object-position:center bottom;animation:jyIn .25s ease-out;user-select:none;-webkit-user-drag:none}
.jy-pop{animation:jyPop 1s ease-in-out infinite;transform-box:fill-box;transform-origin:center}
@media (prefers-reduced-motion: reduce){.jy-wrap,.jy-inner.jy-speak,.jy-img,.jy-pop{animation:none}}
`

/** Jelly: the mascot artwork (white coat and stethoscope when idle). Extra bits are drawn on top for some moods. */
export function JellyAvatar({ mood = "idle", size = 80, talking = false, className = "" }: { mood?: Mood; size?: number; talking?: boolean; className?: string; doctor?: boolean }) {
  useEffect(preload, [])
  const [step, setStep] = useState(0)
  const seq = talking ? GESTURES[mood] : undefined
  useEffect(() => {
    if (!seq) { setStep(0); return }
    let t: any
    const tick = () => { setStep((n) => n + 1); t = setTimeout(tick, 650 + Math.random() * 500) }
    t = setTimeout(tick, 500)
    return () => clearTimeout(t)
  }, [seq])
  const sprite = seq ? seq[step % seq.length] : SPRITE[mood]
  return (
    <div className={`jy-wrap ${className}`} style={{ width: size, height: size }} role="img" aria-label={`Jelly is ${mood}`}>
      <style>{CSS}</style>
      <div className={`jy-inner ${sprite === "idle" ? "jy-idle" : ""} ${talking ? "jy-speak" : ""}`}>
        <img key={sprite} className={`jy-img ${seq ? "jy-quick" : ""}`} src={`/jelly/${sprite}.webp`} alt="" draggable={false}
          style={mood === "sad" ? { filter: "saturate(.75) brightness(.96)" } : undefined} />
      </div>
      <svg viewBox="0 0 100 100" width={size} height={size} style={{ position: "absolute", inset: 0, overflow: "visible", pointerEvents: "none" }} aria-hidden="true">
        {mood === "oops" && <path className="jy-pop" d="M82 14 C86 20 88 24 82 29 C76 24 78 20 82 14 Z" fill="#7fc4ff" stroke="#fff" strokeWidth="1" />}
        {mood === "sad" && <path className="jy-pop" d="M33 54 C36 59 38 62 33 67 C28 62 30 59 33 54 Z" fill="#7fc4ff" stroke="#fff" strokeWidth="1" />}
        {mood === "thinking" && <text className="jy-pop" x="80" y="22" fontSize="22" fontWeight="800" fill="#8e86ff">?</text>}
        {mood === "sleep" && <text className="jy-pop" x="80" y="22" fontSize="20" fontWeight="800" fill="#8e86ff">z</text>}
        {(mood === "happy" || mood === "cheering") && (
          <g className="jy-pop" stroke="#8ea2ff" strokeWidth="3" strokeLinecap="round">
            <path d="M84 12 L88 4" />
            <path d="M92 22 L99 18" />
          </g>
        )}
        {mood === "cheering" && <text className="jy-pop" x="2" y="18" fontSize="16" fill="#ff7fb0">♥</text>}
      </svg>
    </div>
  )
}
