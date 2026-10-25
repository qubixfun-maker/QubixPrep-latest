"use client"

import Link from "next/link"
import type { ReactNode } from "react"

type Way = {
  name: string
  href: string
  micro: string
  title: string
  tagline: string
  from: string
  to: string
  ink: string
  art: ReactNode
}

const S = { filter: "drop-shadow(0 6px 8px rgba(0,0,0,.16))" } as const

/* ---------- artwork (inline SVG, no image files needed) ---------- */

const LongAnswersArt = (
  <svg viewBox="0 0 160 160" className="h-full w-full" style={S} aria-hidden>
    <defs>
      <linearGradient id="la-pen" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#ffd45e" /><stop offset="1" stopColor="#f2a516" /></linearGradient>
    </defs>
    <g transform="rotate(-9 70 85)"><rect x="26" y="22" width="86" height="112" rx="10" fill="#c9e6bd" /></g>
    <g transform="rotate(5 70 85)"><rect x="30" y="20" width="86" height="112" rx="10" fill="#e7f5df" /></g>
    <rect x="34" y="18" width="86" height="116" rx="10" fill="#fff" />
    <rect x="46" y="34" width="40" height="7" rx="3.5" fill="#5fae4b" />
    {[52, 64, 76, 88, 100, 112].map((y, i) => (
      <rect key={y} x="46" y={y} width={i % 3 === 2 ? 44 : 62} height="5" rx="2.5" fill="#cfe5c6" />
    ))}
    <g transform="rotate(38 118 100)">
      <rect x="106" y="58" width="16" height="64" rx="6" fill="url(#la-pen)" />
      <rect x="106" y="58" width="16" height="12" rx="6" fill="#ee7d6a" />
      <path d="M106 122 h16 l-8 18 z" fill="#f6dcb0" />
      <path d="M111 134 h6 l-3 6 z" fill="#3d3a4a" />
    </g>
    <circle cx="124" cy="36" r="16" fill="#5fae4b" /><path d="M116 36 l6 6 l11 -12" stroke="#fff" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </svg>
)

const CaseArt = (
  <svg viewBox="0 0 160 160" className="h-full w-full" style={S} aria-hidden>
    <defs>
      <linearGradient id="cp-board" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ffffff" /><stop offset="1" stopColor="#e6f6fb" /></linearGradient>
    </defs>
    <path d="M52 112 L40 150 M108 112 L120 150" stroke="#2c7a96" strokeWidth="6" strokeLinecap="round" />
    <rect x="22" y="22" width="116" height="90" rx="12" fill="url(#cp-board)" stroke="#2c7a96" strokeWidth="5" />
    <rect x="34" y="32" width="46" height="7" rx="3.5" fill="#2c7a96" opacity=".85" />
    <path d="M32 78 h22 l7 -22 l11 40 l9 -30 l6 12 h24" stroke="#e5476b" strokeWidth="4.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M116 44 c-5 -7 -16 -2 -11 7 c3 5 11 9 11 9 s8 -4 11 -9 c5 -9 -6 -14 -11 -7 z" fill="#ff7a93" />
    <rect x="34" y="94" width="30" height="6" rx="3" fill="#bfe3ee" /><rect x="70" y="94" width="20" height="6" rx="3" fill="#bfe3ee" />
    <g transform="rotate(24 132 96)"><rect x="128" y="60" width="6" height="64" rx="3" fill="#f2a516" /><circle cx="131" cy="58" r="7" fill="#ee7d6a" /></g>
    <circle cx="140" cy="132" r="16" fill="#fff" /><circle cx="140" cy="127" r="6" fill="#f4c9a4" /><path d="M128 146 c2 -9 22 -9 24 0 z" fill="#2c7a96" />
  </svg>
)

const SpotArt = (
  <svg viewBox="0 0 160 160" className="h-full w-full" style={S} aria-hidden>
    <defs>
      <linearGradient id="sp-body" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#ff9db9" /><stop offset="1" stopColor="#e5476b" /></linearGradient>
      <radialGradient id="sp-lens" cx=".4" cy=".35" r=".8"><stop offset="0" stopColor="#fff" /><stop offset="1" stopColor="#ffd3e0" /></radialGradient>
    </defs>
    <rect x="28" y="136" width="96" height="14" rx="7" fill="#8a2a4d" />
    <path d="M60 136 c-8 -50 -4 -92 34 -104" stroke="url(#sp-body)" strokeWidth="18" fill="none" strokeLinecap="round" />
    <g transform="rotate(-28 92 36)"><rect x="80" y="14" width="22" height="50" rx="8" fill="url(#sp-body)" /><rect x="84" y="4" width="14" height="14" rx="4" fill="#8a2a4d" /></g>
    <rect x="62" y="110" width="68" height="10" rx="4" fill="#fff" opacity=".9" />
    <circle cx="112" cy="94" r="30" fill="url(#sp-lens)" stroke="#8a2a4d" strokeWidth="6" />
    <path d="M134 116 l20 22" stroke="#8a2a4d" strokeWidth="9" strokeLinecap="round" />
    {[[100, 86, 7], [118, 90, 5], [108, 104, 6], [124, 102, 4], [96, 100, 3]].map(([x, y, r], i) => (
      <circle key={i} cx={x} cy={y} r={r} fill={i % 2 ? "#c2185b" : "#e5476b"} opacity=".85" />
    ))}
  </svg>
)

const GrandArt = (
  <svg viewBox="0 0 160 160" className="h-full w-full" style={S} aria-hidden>
    <defs>
      <linearGradient id="gt-ring" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#ffd45e" /><stop offset="1" stopColor="#e8890c" /></linearGradient>
    </defs>
    <g transform="rotate(-8 50 90)"><rect x="12" y="44" width="76" height="98" rx="9" fill="#fff" />
      {[0, 1, 2, 3].map((i) => (
        <g key={i}><circle cx="28" cy={66 + i * 20} r="6" fill={i === 1 ? "#f2a516" : "none"} stroke="#e8890c" strokeWidth="3" /><rect x="42" y={63 + i * 20} width="36" height="6" rx="3" fill="#ffe7a8" /></g>
      ))}
    </g>
    <rect x="94" y="14" width="22" height="14" rx="5" fill="#8a5a0b" /><rect x="86" y="24" width="38" height="8" rx="4" fill="#8a5a0b" />
    <circle cx="105" cy="84" r="46" fill="url(#gt-ring)" />
    <circle cx="105" cy="84" r="36" fill="#fff8e1" />
    {Array.from({ length: 12 }).map((_, i) => {
      const a = (i * 30 - 90) * (Math.PI / 180)
      return <line key={i} x1={105 + Math.cos(a) * 30} y1={84 + Math.sin(a) * 30} x2={105 + Math.cos(a) * (i % 3 === 0 ? 24 : 27)} y2={84 + Math.sin(a) * (i % 3 === 0 ? 24 : 27)} stroke="#8a5a0b" strokeWidth={i % 3 === 0 ? 3.5 : 2} strokeLinecap="round" />
    })}
    <path d="M105 84 L105 62" stroke="#e5476b" strokeWidth="4.5" strokeLinecap="round" /><path d="M105 84 L122 94" stroke="#8a5a0b" strokeWidth="4.5" strokeLinecap="round" />
    <circle cx="105" cy="84" r="5.5" fill="#8a5a0b" />
  </svg>
)

const QuizArt = (
  <svg viewBox="0 0 160 160" className="h-full w-full" style={S} aria-hidden>
    <defs>
      <linearGradient id="cq-q" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#9b7bff" /><stop offset="1" stopColor="#6243b4" /></linearGradient>
    </defs>
    <rect x="14" y="16" width="70" height="70" rx="20" fill="url(#cq-q)" />
    <text x="49" y="68" textAnchor="middle" fontSize="52" fontWeight="900" fill="#fff" fontFamily="system-ui, sans-serif">?</text>
    {[0, 1, 2].map((i) => (
      <g key={i} transform={`translate(${46 + i * 6} ${96 + i * 17})`}>
        <rect x="0" y="0" width="92" height="14" rx="7" fill="#fff" opacity={i === 1 ? 1 : 0.85} />
        <circle cx="9" cy="7" r="4.5" fill={i === 1 ? "#6243b4" : "none"} stroke="#9b7bff" strokeWidth="2.5" />
        <rect x="20" y="4.5" width={46 - i * 6} height="5" rx="2.5" fill="#d9ccff" />
      </g>
    ))}
    <circle cx="132" cy="38" r="15" fill="#ffd45e" /><path d="M125 38 l5 5 l9 -11" stroke="#8a5a0b" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </svg>
)

const AiArt = (
  <svg viewBox="0 0 160 160" className="h-full w-full" style={S} aria-hidden>
    <defs>
      <linearGradient id="ai-b" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#6aa8ff" /><stop offset="1" stopColor="#3b64d8" /></linearGradient>
      <radialGradient id="ai-orb" cx=".35" cy=".3" r=".9"><stop offset="0" stopColor="#fff" /><stop offset=".5" stopColor="#b6a5ff" /><stop offset="1" stopColor="#7552ee" /></radialGradient>
    </defs>
    <path d="M22 26 h92 a14 14 0 0 1 14 14 v44 a14 14 0 0 1 -14 14 h-52 l-24 22 v-22 h-16 a14 14 0 0 1 -14 -14 v-44 a14 14 0 0 1 14 -14 z" fill="url(#ai-b)" />
    <rect x="34" y="44" width="62" height="7" rx="3.5" fill="#fff" opacity=".95" /><rect x="34" y="60" width="78" height="7" rx="3.5" fill="#fff" opacity=".7" /><rect x="34" y="76" width="44" height="7" rx="3.5" fill="#fff" opacity=".5" />
    <circle cx="116" cy="118" r="26" fill="url(#ai-orb)" />
    <ellipse cx="108" cy="108" rx="9" ry="6" fill="#fff" opacity=".55" />
    {[[140, 70, 12], [26, 130, 9], [92, 140, 7]].map(([x, y, s], i) => (
      <path key={i} transform={`translate(${x} ${y}) scale(${s / 10})`} d="M0 -10 C1 -3 3 -1 10 0 C3 1 1 3 0 10 C-1 3 -3 1 -10 0 C-3 -1 -1 -3 0 -10 z" fill="#ffd45e" />
    ))}
  </svg>
)

const ReviewArt = (
  <svg viewBox="0 0 160 160" className="h-full w-full" style={S} aria-hidden>
    <defs>
      <linearGradient id="dr-c" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#5ed3a3" /><stop offset="1" stopColor="#1f9e74" /></linearGradient>
    </defs>
    <g transform="rotate(-14 70 84)"><rect x="22" y="34" width="84" height="100" rx="12" fill="#bdeed9" /></g>
    <g transform="rotate(-4 70 84)"><rect x="26" y="30" width="84" height="100" rx="12" fill="#e9fbf3" /></g>
    <rect x="30" y="26" width="84" height="100" rx="12" fill="#fff" />
    <rect x="44" y="42" width="40" height="7" rx="3.5" fill="#1f9e74" />
    <rect x="44" y="60" width="56" height="6" rx="3" fill="#cdeee0" /><rect x="44" y="74" width="48" height="6" rx="3" fill="#cdeee0" />
    <rect x="44" y="96" width="34" height="16" rx="8" fill="url(#dr-c)" />
    <path d="M114 70 a34 34 0 1 1 -10 -24" stroke="#1f9e74" strokeWidth="9" fill="none" strokeLinecap="round" />
    <path d="M96 38 l16 2 l-6 14 z" fill="#1f9e74" />
    <circle cx="128" cy="118" r="15" fill="#ffb347" /><path d="M128 107 c6 6 8 10 6 15 c-2 5 -10 5 -12 0 c-2 -3 0 -6 2 -9 c1 2 2 3 4 3 c0 -3 -1 -6 0 -9 z" fill="#fff" opacity=".9" />
  </svg>
)

const PlanArt = (
  <svg viewBox="0 0 160 160" className="h-full w-full" style={S} aria-hidden>
    <defs>
      <linearGradient id="sp2-h" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#ff9a63" /><stop offset="1" stopColor="#e5601f" /></linearGradient>
    </defs>
    <rect x="16" y="26" width="112" height="108" rx="14" fill="#fff" />
    <path d="M16 40 a14 14 0 0 1 14 -14 h84 a14 14 0 0 1 14 14 v16 h-112 z" fill="url(#sp2-h)" />
    <rect x="42" y="14" width="8" height="24" rx="4" fill="#8a3b16" /><rect x="94" y="14" width="8" height="24" rx="4" fill="#8a3b16" />
    {Array.from({ length: 12 }).map((_, i) => {
      const x = 28 + (i % 4) * 25, y = 68 + Math.floor(i / 4) * 20
      const done = [0, 1, 2, 4, 5, 8].includes(i)
      return <rect key={i} x={x} y={y} width="19" height="14" rx="5" fill={done ? "#ffb98c" : i === 6 ? "#e5601f" : "#ffe9dc"} />
    })}
    <path d="M32 75 l4 4 l7 -8" stroke="#8a3b16" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="128" cy="116" r="26" fill="#fff" stroke="#e5601f" strokeWidth="6" />
    <path d="M128 100 v17 l12 7" stroke="#8a3b16" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const WAYS: Way[] = [
  { name: "Long Answers", href: "/long-answers", micro: "WRITE · ESSAYS", title: "Answers that\nscore marks", tagline: "Essays and short answers, step by step.", from: "#eaf6e1", to: "#bfe2ad", ink: "#2f5a2a", art: LongAnswersArt },
  { name: "Case Presentation", href: "/case-presentation", micro: "SPEAK · VIVA", title: "Present like\nin the viva", tagline: "Practise history, findings and plan.", from: "#e1f5fb", to: "#a6dcee", ink: "#17566d", art: CaseArt },
  { name: "Spot & Identify", href: "/spotters", micro: "SEE · RECOGNISE", title: "Spot it in\nfive seconds", tagline: "Specimens, slides and instruments.", from: "#ffeaf0", to: "#ffbdd1", ink: "#8a2a4d", art: SpotArt },
  { name: "Grand Test", href: "/grand-test", micro: "TEST · TIMED", title: "Full-length\nmock paper", tagline: "Real exam timing and ranking.", from: "#fff4cc", to: "#ffd36e", ink: "#6b4a08", art: GrandArt },
  { name: "Custom Quiz", href: "/test-series", micro: "BUILD · PRACTISE", title: "Your test,\nyour rules", tagline: "Pick subjects, topics and length.", from: "#f1eaff", to: "#cbbcff", ink: "#4b2f96", art: QuizArt },
  { name: "AI Tools", href: "/ai-tools", micro: "SMART · SHORTCUTS", title: "Notes to quiz\nin one tap", tagline: "Summarise, make flashcards, quiz.", from: "#e4f1ff", to: "#adcfff", ink: "#1f4f8a", art: AiArt },
  { name: "Daily Review", href: "/review", micro: "REMEMBER · REPEAT", title: "Review what\nyou'd forget", tagline: "Spaced-repetition cards due today.", from: "#dcf7ec", to: "#a2e4c6", ink: "#1d6048", art: ReviewArt },
  { name: "Study Plan", href: "/plan", micro: "PLAN · STAY ON TRACK", title: "Plan your\nweek", tagline: "A simple schedule that adapts.", from: "#ffe9dc", to: "#ffbf9a", ink: "#8a3b16", art: PlanArt },
]

export function MoreWays({ loggedIn }: { loggedIn: boolean }) {
  return (
    <section>
      <div className="mb-3.5">
        <h2 className="text-[21px] font-black tracking-tight">More ways to study 🎒</h2>
        <p className="mt-1 text-xs text-muted-foreground">Everything else, one tap away.</p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {WAYS.map((w, i) => (
          <Link
            key={w.name}
            href={loggedIn ? w.href : "/signup"}
            className="group relative flex min-h-[210px] flex-col justify-between overflow-hidden rounded-[26px] border border-white/60 p-5 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-primary/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary md:min-h-[236px]"
            style={{ background: `linear-gradient(140deg, ${w.from} 0%, ${w.to} 100%)`, color: w.ink }}
          >
            <span className="pointer-events-none absolute -right-10 -top-12 h-44 w-44 rounded-full bg-white/45 blur-2xl" />
            <span className="pointer-events-none absolute -bottom-16 -left-10 h-40 w-40 rounded-full bg-white/25 blur-2xl" />
            <span className="qp-twinkle pointer-events-none absolute right-5 top-4 text-[16px] opacity-70">✦</span>

            <div className="relative z-10 max-w-[62%]">
              <div className="text-[10px] font-black uppercase tracking-[0.14em] opacity-70">{w.micro}</div>
              <h3 className="mb-1 mt-2 whitespace-pre-line text-[22px] font-black leading-[1.05] tracking-tight md:text-[25px]">{w.title}</h3>
              <p className="text-[12px] leading-snug opacity-80">{w.tagline}</p>
            </div>

            <div className="relative z-10 mt-4 flex items-center gap-2">
              <span className="rounded-full bg-white/75 px-3 py-1.5 text-[12px] font-extrabold shadow-sm">{w.name}</span>
              <span className="grid h-8 w-8 place-items-center rounded-full bg-white/75 text-sm font-black shadow-sm transition-transform group-hover:translate-x-1">→</span>
            </div>

            <div
              className="qp-float pointer-events-none absolute -bottom-1 right-1 z-[5] h-[62%] w-[54%] max-w-[190px] origin-bottom-right transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3"
              style={{ animationDelay: `${-(i % 4) * 0.9}s` }}
            >
              {w.art}
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
