"use client"
import Link from "next/link"

const DECKS: Record<string, { emoji: string; extras: string[]; from: string; to: string; ink: string }> = {
  "lab-decoded": { emoji: "🧪", extras: ["🩸", "🔬", "📊"], from: "#ece3ff", to: "#c9b8ff", ink: "#43299a" },
  "opd-cases": { emoji: "🩺", extras: ["📋", "💊", "🫀"], from: "#d9f1fb", to: "#a3dcf2", ink: "#165a75" },
  "drug-cards": { emoji: "💊", extras: ["💉", "🧴", "⚕️"], from: "#ffe6d8", to: "#ffc3a0", ink: "#7a3512" },
  "emergency-playbook": { emoji: "🚑", extras: ["🚨", "🫀", "⏱️"], from: "#ffdfe9", to: "#ffb0c6", ink: "#86233f" },
  "counselling-cards": { emoji: "💬", extras: ["🤝", "💚", "🗣️"], from: "#d9f6ec", to: "#a6e8cf", ink: "#17543f" },
  "surgery-algorithms": { emoji: "🏥", extras: ["✂️", "🧭", "🩹"], from: "#fff1c4", to: "#ffd873", ink: "#715000" },
  "fluid-cards": { emoji: "💧", extras: ["🧂", "💦", "📈"], from: "#e0eeff", to: "#aed2ff", ink: "#1b4a80" },
  "ecg-cards": { emoji: "🫀", extras: ["📈", "⚡", "🩺"], from: "#e2e8fa", to: "#bcc8ee", ink: "#2c3a72" },
}
const DEFAULT = { emoji: "⚡", extras: ["✨", "📚", "🩺"], from: "#fff0bf", to: "#ffd873", ink: "#715000" }

/** Big illustrated tile for one QuickCards deck on the home page. */
export function QuickDeckCard({ slug, name, description, tags, index }: { slug: string; name: string; description: string; tags: string[]; index: number }) {
  const d = DECKS[slug] || DEFAULT
  const shown = tags.slice(0, 3)
  const more = tags.length - shown.length
  return (
    <Link href={`/quickcards/${slug}`} className="group block h-full focus-visible:outline-none">
      <div
        className="relative flex min-h-[290px] h-full flex-col overflow-hidden rounded-[28px] border border-white/70 p-5 shadow-[0_12px_32px_-14px_rgba(60,40,120,0.35)] transition-all duration-300 group-hover:-translate-y-1.5 group-hover:shadow-[0_26px_44px_-16px_rgba(60,40,120,0.45)] group-focus-visible:ring-4 group-focus-visible:ring-primary/40"
        style={{ background: `linear-gradient(150deg, ${d.from} 0%, ${d.to} 100%)`, color: d.ink }}
      >
        <div className="pointer-events-none absolute -right-14 -top-14 h-56 w-56 rounded-full bg-white/50 blur-2xl" />
        <div className="pointer-events-none absolute inset-0 opacity-60" style={{ backgroundImage: "radial-gradient(rgba(255,255,255,.75) 1.2px, transparent 1.2px)", backgroundSize: "18px 18px", maskImage: "linear-gradient(160deg, black, transparent 65%)", WebkitMaskImage: "linear-gradient(160deg, black, transparent 65%)" }} />
        <div className="pointer-events-none absolute -bottom-10 -right-4 rotate-[-10deg] select-none text-[180px] leading-none opacity-[0.12]" aria-hidden>{d.emoji}</div>

        <div className="relative z-10 flex items-start justify-between">
          <span className="rounded-full bg-white/70 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em]">Deck {index + 1}</span>
          <span className="qp-float select-none text-[84px] leading-none drop-shadow-[0_14px_10px_rgba(40,20,80,0.25)] transition-transform duration-300 group-hover:scale-110" style={{ animationDelay: `${-(index % 4) * 0.8}s` }} aria-hidden>{d.emoji}</span>
        </div>
        <span className="qp-twinkle pointer-events-none absolute left-[46%] top-5 select-none text-[20px]" style={{ animationDelay: "-0.6s" }} aria-hidden>{d.extras[0]}</span>
        <span className="qp-twinkle pointer-events-none absolute right-5 top-[100px] select-none text-[18px]" style={{ animationDelay: "-1.5s" }} aria-hidden>{d.extras[1]}</span>
        <span className="qp-twinkle pointer-events-none absolute left-4 top-[68px] select-none text-[18px]" style={{ animationDelay: "-2.2s" }} aria-hidden>{d.extras[2]}</span>

        <div className="relative z-10 mt-auto">
          <h3 className="text-[23px] font-black leading-[1.1] tracking-tight">{name}</h3>
          <p className="mt-1.5 text-[13px] font-medium leading-snug opacity-85">{description}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {shown.map((t) => <span key={t} className="rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-bold">{t}</span>)}
            {more > 0 && <span className="rounded-full bg-white/45 px-2 py-0.5 text-[10px] font-bold">+{more} more</span>}
          </div>
          <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white/85 px-3.5 py-1.5 text-xs font-extrabold shadow-sm transition-all group-hover:gap-2.5 group-hover:bg-white">Open deck <span aria-hidden>→</span></span>
        </div>
      </div>
    </Link>
  )
}
