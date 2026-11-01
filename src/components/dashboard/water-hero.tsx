"use client"
import { useRef, useState } from "react"

/** A calm water surface behind the greeting: drifting waves, rising bubbles, and a ripple wherever you tap. */
export function WaterHero({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([])
  const n = useRef(0)

  const tap = (e: React.PointerEvent) => {
    const r = ref.current?.getBoundingClientRect()
    if (!r) return
    const id = ++n.current
    setRipples((l) => [...l.slice(-4), { id, x: e.clientX - r.left, y: e.clientY - r.top }])
    setTimeout(() => setRipples((l) => l.filter((x) => x.id !== id)), 1400)
  }

  return (
    <div ref={ref} onPointerDown={tap} className="wh relative overflow-hidden rounded-[26px] border border-[#e4dcfa] bg-gradient-to-br from-[#faf8ff] via-white to-[#efe9ff] px-5 pb-16 pt-6 md:px-7">
      <style>{CSS}</style>
      <div className="relative z-10">{children}</div>

      <svg className="wh-wave wh-w1" viewBox="0 0 1200 120" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 60 C150 20 250 100 400 60 S650 20 800 60 S1050 100 1200 60 V120 H0Z" fill="#b9a5f7" fillOpacity=".35" />
        <path d="M0 60 C150 20 250 100 400 60 S650 20 800 60 S1050 100 1200 60 V120 H0Z" transform="translate(1200 0)" fill="#b9a5f7" fillOpacity=".35" />
      </svg>
      <svg className="wh-wave wh-w2" viewBox="0 0 1200 120" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 70 C200 110 300 30 500 70 S800 110 1000 70 S1150 40 1200 70 V120 H0Z" fill="#8f73f0" fillOpacity=".3" />
        <path d="M0 70 C200 110 300 30 500 70 S800 110 1000 70 S1150 40 1200 70 V120 H0Z" transform="translate(1200 0)" fill="#8f73f0" fillOpacity=".3" />
      </svg>
      <svg className="wh-wave wh-w3" viewBox="0 0 1200 120" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 85 C180 55 320 115 520 85 S850 55 1020 85 S1150 105 1200 85 V120 H0Z" fill="#7552ee" fillOpacity=".25" />
        <path d="M0 85 C180 55 320 115 520 85 S850 55 1020 85 S1150 105 1200 85 V120 H0Z" transform="translate(1200 0)" fill="#7552ee" fillOpacity=".25" />
      </svg>

      {[8, 22, 37, 55, 71, 86].map((l, i) => (
        <i key={i} className="wh-bub" style={{ left: `${l}%`, animationDelay: `${i * 0.9}s`, width: 6 + (i % 3) * 4, height: 6 + (i % 3) * 4 }} />
      ))}

      {ripples.map((r) => (
        <span key={r.id} className="wh-rip" style={{ left: r.x, top: r.y }} />
      ))}
    </div>
  )
}

const CSS = `
.wh-wave{position:absolute;left:0;bottom:0;width:200%;height:64px;pointer-events:none}
.wh-w1{animation:whSlide 14s linear infinite}
.wh-w2{animation:whSlide 9s linear infinite reverse;height:52px}
.wh-w3{animation:whSlide 6s linear infinite;height:40px}
@keyframes whSlide{to{transform:translateX(-50%)}}
.wh-bub{position:absolute;bottom:-12px;border-radius:50%;background:rgba(255,255,255,.7);border:1px solid rgba(117,82,238,.35);pointer-events:none;animation:whRise 7s ease-in infinite}
@keyframes whRise{0%{transform:translateY(0) scale(.6);opacity:0}15%{opacity:.9}100%{transform:translateY(-150px) scale(1.1);opacity:0}}
.wh-rip{position:absolute;width:20px;height:20px;margin:-10px 0 0 -10px;border-radius:50%;border:2px solid rgba(117,82,238,.55);pointer-events:none;animation:whRip 1.3s ease-out forwards}
@keyframes whRip{0%{transform:scale(.3);opacity:.9}100%{transform:scale(14);opacity:0}}
@media (prefers-reduced-motion:reduce){.wh-wave,.wh-bub,.wh-rip{animation:none}}
`
