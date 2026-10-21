"use client"
import { useCallback, useEffect, useRef, useState } from "react"
import { X, Pause, Play, ExternalLink, ChevronUp } from "lucide-react"

export type Story = { id: string; title: string; summary: string; image: string | null; source: string; url: string; date: number; tag: string }

export const TAG_STYLE: Record<string, { emoji: string; from: string; to: string }> = {
  Oncology: { emoji: "🎗️", from: "#7b2d8e", to: "#c0568f" },
  Cardiology: { emoji: "❤️", from: "#b3263e", to: "#f0697f" },
  Neurology: { emoji: "🧠", from: "#4b3aa8", to: "#8e7bff" },
  Endocrine: { emoji: "🧪", from: "#a35b0e", to: "#f0a24a" },
  "Infectious disease": { emoji: "🦠", from: "#1d7a5a", to: "#52c9a0" },
  Nephrology: { emoji: "🫘", from: "#8a4a1c", to: "#d99560" },
  Pulmonology: { emoji: "🫁", from: "#2563a8", to: "#6aaef0" },
  "Obs & Gyn": { emoji: "🤰", from: "#a83278", to: "#f08ac0" },
  Paediatrics: { emoji: "🧸", from: "#b8860b", to: "#f5c842" },
  Psychiatry: { emoji: "💭", from: "#5a3ea8", to: "#a58cf0" },
  Dermatology: { emoji: "🧴", from: "#b8532a", to: "#f2a06e" },
  Ophthalmology: { emoji: "👁️", from: "#1f6aa8", to: "#78c0f2" },
  Orthopaedics: { emoji: "🦴", from: "#6d5a3a", to: "#c2a878" },
  Gastro: { emoji: "🫃", from: "#8a5a1c", to: "#e0b060" },
  "Clinical trials": { emoji: "💊", from: "#1c6a8a", to: "#5cc0e0" },
  Medicine: { emoji: "🩺", from: "#3a4aa8", to: "#7a8cf0" },
}
export const styleFor = (tag: string) => TAG_STYLE[tag] || TAG_STYLE.Medicine

export function timeAgo(ms: number) {
  const m = Math.max(1, Math.round((Date.now() - ms) / 60000))
  if (m < 60) return `${m}m ago`
  const h = Math.round(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.round(h / 24)
  return d < 8 ? `${d}d ago` : new Date(ms).toLocaleDateString(undefined, { day: "numeric", month: "short" })
}

const SLIDES = 3
const SLIDE_MS = 6500

export function StoryViewer({ stories, start, onClose }: { stories: Story[]; start: number; onClose: () => void }) {
  const [si, setSi] = useState(start)
  const [slide, setSlide] = useState(0)
  const [paused, setPaused] = useState(false)
  const [bad, setBad] = useState<Record<string, boolean>>({})
  const press = useRef<{ t: number; x: number; y: number } | null>(null)
  const s = stories[si]
  const st = styleFor(s.tag)
  const img = s.image && !bad[s.id] ? s.image : null

  const nextStory = useCallback(() => { if (si < stories.length - 1) { setSi(si + 1); setSlide(0) } else onClose() }, [si, stories.length, onClose])
  const prevStory = useCallback(() => { if (si > 0) { setSi(si - 1); setSlide(0) } }, [si])
  const next = useCallback(() => { if (slide < SLIDES - 1) setSlide(slide + 1); else nextStory() }, [slide, nextStory])
  const prev = useCallback(() => { if (slide > 0) setSlide(slide - 1); else prevStory() }, [slide, prevStory])

  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); else if (e.key === "ArrowRight") next(); else if (e.key === "ArrowLeft") prev(); else if (e.key === "ArrowDown") nextStory(); else if (e.key === "ArrowUp") prevStory() }
    window.addEventListener("keydown", k)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => { window.removeEventListener("keydown", k); document.body.style.overflow = prevOverflow }
  }, [next, prev, nextStory, prevStory, onClose])

  useEffect(() => { const n = stories[si + 1]; if (n?.image) { const i = new Image(); i.src = n.image } }, [si, stories])

  const down = (e: React.PointerEvent) => { press.current = { t: Date.now(), x: e.clientX, y: e.clientY }; setPaused(true) }
  const up = (e: React.PointerEvent) => {
    const p = press.current; press.current = null; setPaused(false)
    if (!p) return
    const dx = e.clientX - p.x; const dy = e.clientY - p.y
    if (Math.abs(dy) > 70 && Math.abs(dy) > Math.abs(dx)) { if (dy < 0) nextStory(); else prevStory(); return }
    if (Date.now() - p.t < 260 && Math.abs(dx) < 12 && Math.abs(dy) < 12) {
      const r = (e.currentTarget as HTMLElement).getBoundingClientRect()
      if (e.clientX - r.left < r.width * 0.33) prev(); else next()
    }
  }

  return (
    <div className="keep-dark fixed inset-0 z-[80] flex items-center justify-center bg-black/90 backdrop-blur-sm" role="dialog" aria-label="Medical story">
      <style>{`@keyframes stFill{from{width:0}to{width:100%}} @keyframes stRise{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}`}</style>
      <div className="relative h-[100dvh] w-full max-w-[440px] select-none overflow-hidden bg-black text-white sm:h-[min(100dvh-24px,860px)] sm:rounded-[28px] sm:shadow-2xl"
        onPointerDown={down} onPointerUp={up} onPointerCancel={() => { press.current = null; setPaused(false) }} style={{ touchAction: "none" }}>
        {/* backdrop */}
        <div className="absolute inset-0" style={{ background: `linear-gradient(160deg, ${st.from}, ${st.to})` }} />
        {img && <img key={s.id} src={img} alt="" referrerPolicy="no-referrer" onError={() => setBad((b) => ({ ...b, [s.id]: true }))} className={`absolute inset-0 h-full w-full object-cover transition-all duration-500 ${slide === 0 ? "scale-100" : "scale-110 blur-md brightness-50"}`} draggable={false} />}
        {!img && <div className="absolute right-6 top-24 text-[150px] leading-none opacity-30" aria-hidden>{st.emoji}</div>}
        <div className={`absolute inset-0 ${slide === 0 ? "bg-gradient-to-t from-black/90 via-black/20 to-black/50" : "bg-black/40"}`} />

        {/* progress + controls */}
        <div className="absolute inset-x-0 top-0 z-10 px-3 pt-3">
          <div className="flex gap-1.5">
            {Array.from({ length: SLIDES }).map((_, i) => (
              <div key={i} className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/30">
                {i < slide && <div className="h-full w-full bg-white" />}
                {i === slide && <div key={`${si}-${slide}`} className="h-full bg-white" style={{ animation: `stFill ${SLIDE_MS}ms linear forwards`, animationPlayState: paused ? "paused" : "running" }} onAnimationEnd={next} />}
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-2 text-[12px] font-bold">
            <span className="rounded-full bg-white/20 px-2.5 py-1 backdrop-blur">{st.emoji} {s.tag}</span>
            <span className="truncate opacity-80">{s.source} · {timeAgo(s.date)}</span>
            <button aria-label="Close" onPointerDown={(e) => e.stopPropagation()} onPointerUp={(e) => { e.stopPropagation(); onClose() }} className="ml-auto grid h-9 w-9 place-items-center rounded-full bg-white/15 backdrop-blur"><X className="h-5 w-5" /></button>
          </div>
        </div>

        {/* slides */}
        <div className="absolute inset-x-0 bottom-0 z-10 p-6 pb-10" key={`${si}-${slide}`} style={{ animation: "stRise .45s ease-out" }}>
          {slide === 0 && (
            <>
              <h2 className="text-[28px] font-black leading-[1.1] tracking-tight drop-shadow-lg">{s.title}</h2>
              <p className="mt-4 flex items-center gap-1.5 text-[12px] font-bold opacity-80"><ChevronUp className="h-4 w-4" /> Tap to continue · swipe up for the next story</p>
            </>
          )}
          {slide === 1 && (
            <>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] opacity-70">The gist</p>
              <p className="mt-3 text-[21px] font-semibold leading-snug drop-shadow">{s.summary || "Tap through to read the full article at the source."}</p>
            </>
          )}
          {slide === 2 && (
            <>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] opacity-70">Want the full story?</p>
              <h3 className="mt-2 text-[22px] font-black leading-tight">{s.title}</h3>
              <a href={s.url} target="_blank" rel="noopener noreferrer" onPointerDown={(e) => e.stopPropagation()} onPointerUp={(e) => e.stopPropagation()}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3.5 text-[15px] font-black text-black shadow-xl">
                Read on {s.source} <ExternalLink className="h-4 w-4" />
              </a>
              <button onPointerDown={(e) => e.stopPropagation()} onPointerUp={(e) => { e.stopPropagation(); nextStory() }} className="mt-3 w-full rounded-2xl bg-white/20 px-4 py-3 text-[14px] font-extrabold backdrop-blur">Next story →</button>
            </>
          )}
        </div>
        <button aria-label={paused ? "Play" : "Pause"} onPointerDown={(e) => e.stopPropagation()} onPointerUp={(e) => { e.stopPropagation(); setPaused((p) => !p) }} className="absolute bottom-3 right-4 z-20 hidden h-8 w-8 place-items-center rounded-full bg-white/15 backdrop-blur sm:grid">
          {paused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
        </button>
      </div>
    </div>
  )
}
