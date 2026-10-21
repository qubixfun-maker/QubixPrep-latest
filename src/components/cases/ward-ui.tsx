"use client"

import { Heart } from "lucide-react"

export type Vitals = { hr: number; bp: string; rr: number; temp: number; spo2: number }
export type Mood = "ok" | "worry" | "pain" | "breathless" | "drowsy" | "faint"

const hash = (s: string) => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return Math.abs(h) }

export function moodOf(appearance: string | undefined, stability: number): Mood {
  if (stability <= 25) return "faint"
  if (stability < 50) return "pain"
  if (stability < 75) return appearance === "breathless" ? "breathless" : appearance === "in-pain" ? "pain" : "worry"
  switch (appearance) {
    case "comfortable": return "ok"
    case "breathless": return "breathless"
    case "drowsy": return "drowsy"
    case "in-pain": return "pain"
    default: return "worry"
  }
}

export function ageLabel(p?: { age: number; ageUnit?: string }) {
  if (!p) return ""
  const u = p.ageUnit === "months" ? "mo" : p.ageUnit === "days" ? "d" : "y"
  return `${p.age}${u}`
}

const num = (s: string, i: number) => { const n = parseInt(s.split("/")[i], 10); return Number.isFinite(n) ? n : i ? 80 : 120 }

/** Vitals shown on the monitor: worsen as stability falls, recover once treated. */
export function liveVitals(base: Vitals, stability: number, treated: boolean): Vitals {
  const f = Math.max(0, Math.min(1, (100 - stability) / 100))
  let hr = base.hr + f * 38, sys = num(base.bp, 0) - f * 42, dia = num(base.bp, 1) - f * 26
  let spo2 = base.spo2 - f * 15, rr = base.rr + f * 12, temp = base.temp
  if (treated) {
    const k = 0.65
    hr = hr + (80 - hr) * k; sys = sys + (118 - sys) * k; dia = dia + (76 - dia) * k
    spo2 = spo2 + (98 - spo2) * k; rr = rr + (16 - rr) * k; temp = temp + (36.9 - temp) * k
  }
  return { hr: Math.round(hr), bp: `${Math.round(Math.max(40, sys))}/${Math.round(Math.max(20, dia))}`, spo2: Math.round(Math.max(50, Math.min(100, spo2))), rr: Math.round(rr), temp: Math.round(temp * 10) / 10 }
}

/* ---------------------------------------------------------------- patient */
const SKIN = ["#f6d2b0", "#e8b78c", "#d19a6c", "#b87a4b", "#94603a"]

export function PatientGlyph({ x, y, name, age = 40, ageUnit = "years", sex = "M", mood, rr = 16, scale = 1 }: { x: number; y: number; name?: string; age?: number; ageUnit?: string; sex?: string; mood: Mood; rr?: number; scale?: number }) {
  const h = hash(name || "p")
  const skin = SKIN[h % SKIN.length]
  const child = ageUnit !== "years" || age < 13
  const old = ageUnit === "years" && age >= 60
  const female = sex === "F"
  const hair = old ? "#c9c9cf" : ["#1d1814", "#2a1d14", "#3a2518"][h % 3]
  const s = child ? 0.74 : 1
  const eyesClosed = mood === "faint"
  const sag = mood === "drowsy"
  const brow = mood === "ok" ? 0 : mood === "worry" ? -3 : mood === "drowsy" ? 2 : -5
  const dur = Math.max(1.2, Math.min(5, 60 / Math.max(8, rr))) + "s"
  return (
    <g transform={`translate(${x},${y}) scale(${scale * s})`}>
      <g style={{ transformOrigin: "0px 0px", animation: `wr-breathe ${dur} ease-in-out infinite` }}>
        <path d="M-66 8 Q-62 -22 -26 -30 L26 -30 Q62 -22 66 8 Z" fill="#bfe3f2" />
        <path d="M-12 -30 L0 -14 L12 -30Z" fill="#8cc6df" />
        <g stroke="#8cc6df" strokeWidth="2" opacity=".7"><line x1="-44" y1="-14" x2="-30" y2="-14" /><line x1="30" y1="-14" x2="44" y2="-14" /></g>
        <rect x="-10" y="-42" width="20" height="16" rx="6" fill={skin} />
        {female && !child && <path d="M-34 -62 Q-44 -20 -30 2 L-24 -40Z M34 -62 Q44 -20 30 2 L24 -40Z" fill={hair} />}
        <ellipse cx="-31" cy="-64" rx="5" ry="9" fill={skin} /><ellipse cx="31" cy="-64" rx="5" ry="9" fill={skin} />
        <ellipse cx="0" cy="-66" rx="30" ry="33" fill={skin} />
        {!old && <path d={female || child ? "M-32 -70 Q-30 -104 0 -102 Q30 -104 32 -70 Q18 -88 0 -88 Q-18 -88 -32 -70Z" : "M-31 -70 Q-30 -100 0 -99 Q30 -100 31 -70 Q20 -84 0 -83 Q-20 -84 -31 -70Z"} fill={hair} />}
        {old && <path d="M-31 -66 Q-34 -82 -24 -88 Q-30 -76 -29 -62Z M31 -66 Q34 -82 24 -88 Q30 -76 29 -62Z" fill={hair} />}
        {child && <circle cx="0" cy="-102" r="9" fill={hair} />}
        {old && <g stroke="#00000022" strokeWidth="1.5" fill="none"><path d="M-18 -78 q18 -6 36 0" /><path d="M-22 -56 q-3 6 0 10" /><path d="M22 -56 q3 6 0 10" /></g>}
        {(mood === "faint" || mood === "pain") && <ellipse cx="0" cy="-66" rx="30" ry="33" fill="#fff" opacity={mood === "faint" ? 0.3 : 0.12} />}
        <g stroke="#2a1d12" strokeWidth="2.6" strokeLinecap="round" fill="none">
          <path d={`M-18 ${-80 + brow} L-8 ${-80 - brow / 2}`} /><path d={`M18 ${-80 + brow} L8 ${-80 - brow / 2}`} />
        </g>
        {eyesClosed ? (
          <g stroke="#2a1d12" strokeWidth="2.6" strokeLinecap="round" fill="none"><path d="M-17 -68 q6 4 12 0" /><path d="M5 -68 q6 4 12 0" /></g>
        ) : (
          <g style={{ transformOrigin: "0px -69px", animation: "wr-blinkeye 4.5s infinite" }}>
            <ellipse cx="-11" cy="-69" rx="5" ry={sag ? 2.2 : 5.4} fill="#fff" /><ellipse cx="11" cy="-69" rx="5" ry={sag ? 2.2 : 5.4} fill="#fff" />
            <circle cx="-11" cy="-69" r={sag ? 1.8 : 2.8} fill="#2a1d12" /><circle cx="11" cy="-69" r={sag ? 1.8 : 2.8} fill="#2a1d12" />
          </g>
        )}
        <path d="M0 -64 q-3 9 2 11" stroke="#00000030" strokeWidth="2" fill="none" strokeLinecap="round" />
        {mood === "ok" && <path d="M-9 -45 Q0 -38 9 -45" stroke="#7a3b2a" strokeWidth="2.6" fill="none" strokeLinecap="round" />}
        {mood === "worry" && <path d="M-8 -41 Q0 -46 8 -41" stroke="#7a3b2a" strokeWidth="2.6" fill="none" strokeLinecap="round" />}
        {mood === "drowsy" && <path d="M-7 -43 L7 -43" stroke="#7a3b2a" strokeWidth="2.6" strokeLinecap="round" />}
        {mood === "faint" && <path d="M-6 -42 Q0 -44 6 -42" stroke="#7a3b2a" strokeWidth="2.4" fill="none" strokeLinecap="round" />}
        {(mood === "pain" || mood === "breathless") && <ellipse cx="0" cy="-42" rx={mood === "pain" ? 6 : 5} ry={mood === "pain" ? 4.5 : 6} fill="#7a2b24" />}
        {(mood === "pain" || mood === "faint" || mood === "breathless") && (
          <g fill="#7fc4f2">
            <path d="M-30 -80 q-3 6 0 9 q3 -3 0 -9z" style={{ animation: "wr-sweat 1.8s infinite" }} />
            <path d="M32 -74 q-3 6 0 9 q3 -3 0 -9z" style={{ animation: "wr-sweat 1.8s .7s infinite" }} />
          </g>
        )}
        <ellipse cx="-19" cy="-52" rx="5" ry="3" fill="#ff8a8a" opacity={mood === "ok" ? 0.35 : 0.15} /><ellipse cx="19" cy="-52" rx="5" ry="3" fill="#ff8a8a" opacity={mood === "ok" ? 0.35 : 0.15} />
      </g>
    </g>
  )
}

/* ---------------------------------------------------------------- body map */
const REG: Record<string, [number, number]> = { head: [50, 20], eye: [50, 18], ear: [64, 22], throat: [50, 40], chest: [50, 62], abdomen: [50, 94], pelvis: [50, 118], limb: [24, 98], skin: [50, 80], general: [50, 80] }

export function BodyMap({ region = "general" }: { region?: string }) {
  const [cx, cy] = REG[region] || REG.general
  return (
    <svg viewBox="0 0 100 170" className="h-full w-full" aria-label={"Affected region: " + region}>
      <g fill="#ffffff" fillOpacity=".92" stroke="#7c6fd6" strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round">
        <circle cx="50" cy="20" r="13" />
        <path d="M36 40 Q50 46 64 40 L74 48 L82 100 L74 102 L68 66 L66 124 L60 160 L52 160 L50 128 L48 160 L40 160 L34 124 L32 66 L26 102 L18 100 L26 48Z" />
      </g>
      {region === "general" || region === "skin" ? (
        <path d="M36 40 Q50 46 64 40 L74 48 L82 100 L74 102 L68 66 L66 124 L60 160 L52 160 L50 128 L48 160 L40 160 L34 124 L32 66 L26 102 L18 100 L26 48Z" fill="#ff5d73" opacity=".25" className="wr-glow" />
      ) : (
        <g>
          <circle cx={cx} cy={cy} r="15" fill="#ff5d73" opacity=".25" className="wr-glow" />
          <circle cx={cx} cy={cy} r="7" fill="#ff3b57" className="wr-blink" /><circle cx={cx} cy={cy} r="2.5" fill="#fff" />
        </g>
      )}
    </svg>
  )
}

/* ---------------------------------------------------------------- ECG */
function beatPath(kind: string, w: number, off: number) {
  const k = w / 60
  const p = (s: string) => s.replace(/(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g, (_, a, b) => `${(+a * k + off).toFixed(1)} ${b}`)
  if (kind === "st-elevation") return p("L6 0 Q9 -4 12 0 L16 0 L17 2 L19 -24 L21 -4 Q32 -20 46 -6 L60 0")
  if (kind === "af") return p("L3 -1 L6 1 L9 -1 L12 1 L16 0 L17 2 L19 -26 L21 8 L23 0 L27 -1 L31 1 L40 0 Q46 -6 52 0 L60 0")
  if (kind === "vt") return p("Q15 -30 30 0 Q45 30 60 0")
  return p("L6 0 Q9 -5 12 0 L16 0 L17 2 L19 -26 L21 8 L23 0 L30 0 Q36 -9 42 0 L60 0")
}
function trace(kind: string) {
  const widths = kind === "af" ? [48, 70, 55, 80, 44, 63] : kind === "vt" ? [40, 40, 40, 40, 40, 40, 40, 40, 40] : [60, 60, 60, 60, 60, 60]
  let d = "M0 0", x = 0
  for (const w of widths) { d += " " + beatPath(kind, w, x); x += w }
  return { widths, d }
}

export function VitalsMonitor({ vitals, rhythm = "sinus", stability, name }: { vitals: Vitals; rhythm?: string; stability: number; name?: string }) {
  const dead = stability <= 0
  const kind = dead ? "flat" : rhythm === "brady" || rhythm === "tachy" ? "sinus" : rhythm
  const { widths, d } = kind === "flat" ? { widths: [60, 60, 60, 60, 60, 60], d: "M0 0 L360 0" } : trace(kind)
  const dur = kind === "flat" ? 3 : Math.max(0.7, (widths.length * 60) / Math.max(30, vitals.hr))
  const sys = num(vitals.bp, 0)
  const bad = { hr: vitals.hr < 50 || vitals.hr > 110, spo2: vitals.spo2 < 92, bp: sys < 90 || sys > 180, rr: vitals.rr > 24 || vitals.rr < 10, temp: vitals.temp > 38.2 }
  const alarm = !dead && (stability < 40 || bad.spo2 || bad.bp)
  const val = (b: boolean, ok: string) => (b ? "text-[#ff5d6c] animate-pulse" : ok)
  return (
    <div className={`keep-dark rounded-2xl bg-[#0b1018] p-3 text-white shadow-lg ring-1 ${alarm ? "ring-[#ff5d6c]" : "ring-white/10"}`} style={alarm ? { animation: "wr-blink 1s infinite" } : undefined}>
      <div className="mb-1 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-white/50">
        <span>{name ? name.split(" ")[0] : "Patient"} · bedside monitor</span>
        <span className={dead ? "text-[#ff5d6c]" : alarm ? "text-[#ff5d6c]" : "text-[#35e08a]"}>{dead ? "● ASYSTOLE" : alarm ? "● ALARM" : "● LIVE"}</span>
      </div>
      <div className="relative overflow-hidden rounded-lg bg-black/50">
        <svg viewBox="0 0 360 64" className="block h-14 w-full" preserveAspectRatio="none">
          <g stroke="#10261c" strokeWidth=".6">{Array.from({ length: 12 }).map((_, i) => <line key={i} x1={i * 30} y1="0" x2={i * 30} y2="64" />)}</g>
          <g style={{ animation: `wr-ecg ${dur}s linear infinite` }}>
            <path d={d} transform="translate(0,44)" fill="none" stroke="#35e08a" strokeWidth="2" strokeLinejoin="round" />
            <path d={d} transform="translate(360,44)" fill="none" stroke="#35e08a" strokeWidth="2" strokeLinejoin="round" />
          </g>
        </svg>
      </div>
      <div className="mt-2 grid grid-cols-5 gap-1 text-center font-mono">
        <div><p className="text-[9px] text-white/40">HR</p><p className={`text-lg font-black leading-none ${val(bad.hr, "text-[#35e08a]")}`}>{dead ? "--" : vitals.hr}</p></div>
        <div><p className="text-[9px] text-white/40">BP</p><p className={`text-lg font-black leading-none ${val(bad.bp, "text-[#ffd95a]")}`}>{dead ? "--" : vitals.bp}</p></div>
        <div><p className="text-[9px] text-white/40">SpO₂</p><p className={`text-lg font-black leading-none ${val(bad.spo2, "text-[#6be3ff]")}`}>{dead ? "--" : vitals.spo2}</p></div>
        <div><p className="text-[9px] text-white/40">RR</p><p className={`text-lg font-black leading-none ${val(bad.rr, "text-white")}`}>{dead ? "--" : vitals.rr}</p></div>
        <div><p className="text-[9px] text-white/40">TEMP</p><p className={`text-lg font-black leading-none ${val(bad.temp, "text-[#ffb36b]")}`}>{vitals.temp.toFixed(1)}</p></div>
      </div>
    </div>
  )
}

/* ---------------------------------------------------------------- stability */
export function StabilityBar({ value }: { value: number }) {
  const v = Math.max(0, Math.min(100, value))
  const c = v > 66 ? "#2fbf71" : v > 33 ? "#f5a524" : "#ef4565"
  return (
    <div className="flex items-center gap-3">
      <Heart className="h-6 w-6 shrink-0" style={{ color: c, fill: c, animation: `wr-beat ${v > 0 ? 0.4 + v / 120 : 0}s infinite` }} />
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex justify-between text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground"><span>Patient stability</span><span style={{ color: c }}>{v}%</span></div>
        <div className="h-3 overflow-hidden rounded-full bg-black/10"><div className="h-full rounded-full transition-all duration-700" style={{ width: v + "%", background: `linear-gradient(90deg, ${c}, ${c}cc)` }} /></div>
      </div>
    </div>
  )
}
