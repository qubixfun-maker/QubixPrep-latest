"use client"
import Link from "next/link"

type Art = { re: RegExp; emoji: string; extras: string[]; from: string; to: string; ink: string; tag: string }

const ARTS: Art[] = [
  { re: /anat/i, emoji: "🦴", extras: ["🫀", "🧠", "🦷"], from: "#ffe6d6", to: "#ffc7a3", ink: "#7a3512", tag: "Structure & form" },
  { re: /physio/i, emoji: "❤️", extras: ["🫁", "⚡", "🩸"], from: "#d9f6ec", to: "#a6e8cf", ink: "#17543f", tag: "How the body works" },
  { re: /bio.?chem/i, emoji: "🧬", extras: ["⚗️", "🧪", "✨"], from: "#e9e0ff", to: "#c8b5ff", ink: "#43299a", tag: "Molecules & metabolism" },
  { re: /patho/i, emoji: "🔬", extras: ["🧫", "🩸", "✨"], from: "#ffdfe9", to: "#ffb1c8", ink: "#86233f", tag: "Disease mechanisms" },
  { re: /pharm/i, emoji: "💊", extras: ["💉", "🧴", "⚕️"], from: "#fff2c6", to: "#ffd873", ink: "#715000", tag: "Drugs & actions" },
  { re: /micro/i, emoji: "🦠", extras: ["🧫", "🔬", "✨"], from: "#dcedff", to: "#a8d3ff", ink: "#1b4a80", tag: "Microbes & immunity" },
  { re: /forensic/i, emoji: "⚖️", extras: ["🔍", "🧤", "🧾"], from: "#efe9df", to: "#d9ceba", ink: "#55452d", tag: "Medicine & law" },
  { re: /community|psm|preventive|social/i, emoji: "🏘️", extras: ["🩺", "🌍", "💉"], from: "#d3f0fa", to: "#9edcf1", ink: "#175872", tag: "Health of the public" },
  { re: /anaes|anest/i, emoji: "😷", extras: ["💉", "🫁", "⏱️"], from: "#dcf5ef", to: "#abe9dc", ink: "#1b5a4f", tag: "Sleep & safety" },
  { re: /derm|skin/i, emoji: "🧴", extras: ["✨", "🩹", "🌞"], from: "#ffeadb", to: "#ffd1a8", ink: "#7a4318", tag: "Skin & venereology" },
  { re: /ortho/i, emoji: "🦿", extras: ["🦴", "🩻", "🩹"], from: "#ece6da", to: "#d6c9b0", ink: "#58472a", tag: "Bones & joints" },
  { re: /surg/i, emoji: "🏥", extras: ["✂️", "🩹", "🩻"], from: "#ffe0dc", to: "#ffb9b0", ink: "#842a22", tag: "Operative care" },
  { re: /pead|paed|child/i, emoji: "🧸", extras: ["🍼", "👶", "💉"], from: "#fff3cd", to: "#ffe08c", ink: "#6f4f00", tag: "Child health" },
  { re: /obs|gyn/i, emoji: "🤰", extras: ["👶", "🌸", "🩺"], from: "#ffe3f0", to: "#ffbdda", ink: "#862a5c", tag: "Women's health" },
  { re: /ophth|eye/i, emoji: "👁️", extras: ["��", "🔍", "✨"], from: "#e0f1ff", to: "#b7dcff", ink: "#1d4d7d", tag: "Vision" },
  { re: /\bent\b|oto|rhino/i, emoji: "👂", extras: ["👃", "🗣️", "✨"], from: "#fde5e5", to: "#f8bcbc", ink: "#80282a", tag: "Ear, nose & throat" },
  { re: /psych/i, emoji: "🧠", extras: ["💭", "🫂", "✨"], from: "#eee2ff", to: "#d5baff", ink: "#4b2a8a", tag: "Mind & behaviour" },
  { re: /radio/i, emoji: "🩻", extras: ["☢️", "🖥️", "✨"], from: "#e4e9f4", to: "#c3cde4", ink: "#2d3b5f", tag: "Imaging" },
  { re: /medicine/i, emoji: "🩺", extras: ["💊", "📋", "🫀"], from: "#d8e9ff", to: "#b0d0ff", ink: "#1c4a85", tag: "Clinical practice" },
]
const FALLBACK = [
  { from: "#ffe6d6", to: "#ffc7a3", ink: "#7a3512" }, { from: "#d9f6ec", to: "#a6e8cf", ink: "#17543f" },
  { from: "#e9e0ff", to: "#c8b5ff", ink: "#43299a" }, { from: "#ffdfe9", to: "#ffb1c8", ink: "#86233f" },
  { from: "#fff2c6", to: "#ffd873", ink: "#715000" }, { from: "#dcedff", to: "#a8d3ff", ink: "#1b4a80" },
]

function artFor(name: string): Art {
  const hit = ARTS.find((a) => a.re.test(name))
  if (hit) return hit
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0
  const f = FALLBACK[Math.abs(h) % FALLBACK.length]
  return { re: /./, emoji: "📘", extras: ["📖", "✨", "🩺"], tag: "Subject", ...f }
}

/** A big illustrated card for a subject. Used on Notes, Long Answers, Mind Maps, Flashcards and QBank. */
export function SubjectArtCard({ href, name, subtitle, cta = "Open" }: { href: string; name: string; subtitle: string; cta?: string }) {
  const a = artFor(name)
  const delay = (name.length % 4) * -0.7
  return (
    <Link href={href} className="group block h-full focus-visible:outline-none">
      <div
        className="relative flex min-h-[236px] h-full flex-col justify-end overflow-hidden rounded-[28px] border border-white/70 p-6 shadow-[0_12px_32px_-14px_rgba(60,40,120,0.35)] transition-all duration-300 group-hover:-translate-y-1.5 group-hover:shadow-[0_26px_44px_-16px_rgba(60,40,120,0.45)] group-focus-visible:ring-4 group-focus-visible:ring-primary/40"
        style={{ background: `linear-gradient(135deg, ${a.from} 0%, ${a.to} 100%)`, color: a.ink }}
      >
        {/* depth: glows, dots, giant watermark */}
        <div className="pointer-events-none absolute -right-12 -top-12 h-52 w-52 rounded-full bg-white/50 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-14 -left-10 h-44 w-44 rounded-full bg-white/35 blur-xl" />
        <div className="pointer-events-none absolute inset-0 opacity-60" style={{ backgroundImage: "radial-gradient(rgba(255,255,255,.75) 1.2px, transparent 1.2px)", backgroundSize: "18px 18px", maskImage: "linear-gradient(115deg, black, transparent 70%)", WebkitMaskImage: "linear-gradient(115deg, black, transparent 70%)" }} />
        <div className="pointer-events-none absolute -bottom-8 -right-3 rotate-12 select-none text-[170px] leading-none opacity-[0.14]" aria-hidden>{a.emoji}</div>

        {/* hero illustration + floating extras */}
        <div className="qp-float pointer-events-none absolute right-4 top-3 select-none text-[92px] leading-none drop-shadow-[0_14px_10px_rgba(40,20,80,0.25)] transition-transform duration-300 group-hover:scale-110" style={{ animationDelay: `${delay}s` }} aria-hidden>{a.emoji}</div>
        <span className="qp-twinkle pointer-events-none absolute right-28 top-5 select-none text-[22px]" style={{ animationDelay: "-0.4s" }} aria-hidden>{a.extras[0]}</span>
        <span className="qp-twinkle pointer-events-none absolute right-5 top-[104px] select-none text-[20px]" style={{ animationDelay: "-1.3s" }} aria-hidden>{a.extras[1]}</span>
        <span className="qp-twinkle pointer-events-none absolute left-5 top-5 select-none text-[18px]" style={{ animationDelay: "-2.1s" }} aria-hidden>{a.extras[2]}</span>

        <div className="relative z-10">
          <span className="inline-block rounded-full bg-white/65 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em]">{a.tag}</span>
          <h2 className="mt-2.5 max-w-[80%] text-[28px] font-black leading-[1.05] tracking-tight">{name}</h2>
          <p className="mt-1.5 max-w-[85%] text-[13px] font-medium opacity-80">{subtitle}</p>
          <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3.5 py-1.5 text-xs font-extrabold shadow-sm transition-all group-hover:gap-2.5 group-hover:bg-white">{cta} <span aria-hidden>→</span></span>
        </div>
      </div>
    </Link>
  )
}
