"use client"

import { useEffect, useId, useMemo, useRef, useState } from "react"
import { CheckCircle2, XCircle } from "lucide-react"

/* Extra animations used by the expert Ward Round cases. Render <style>{EXTRA_CSS}</style> next to SCENE_CSS. */
export const EXTRA_CSS = `
@keyframes wr-siren{0%,100%{transform:rotate(-16deg)}50%{transform:rotate(16deg)}}
@keyframes wr-sweep{0%{transform:translateY(-10px);opacity:0}10%{opacity:.8}90%{opacity:.8}100%{transform:translateY(170px);opacity:0}}
@keyframes wr-ping{0%{transform:scale(.6);opacity:.9}100%{transform:scale(2.1);opacity:0}}
@keyframes wr-flash{0%,100%{box-shadow:0 0 0 0 rgba(239,69,101,.55)}50%{box-shadow:0 0 0 10px rgba(239,69,101,0)}}
.wr-siren{display:inline-block;transform-origin:50% 90%;animation:wr-siren .55s ease-in-out infinite}
.wr-flash{animation:wr-flash 1.1s ease-out infinite}
`

/* ------------------------------------------------------------------ labs */
export type Lab = { name: string; value: string; unit?: string; ref?: string; flag?: "H" | "L" | "N" | "C" }
export function LabReport({ labs }: { labs: Lab[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-dashed border-amber-400 bg-[#fffdf5] shadow-sm">
      <div className="flex items-center justify-between border-b border-amber-200 bg-amber-100/70 px-4 py-2">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-900">🧪 Laboratory report</p>
        <svg viewBox="0 0 60 14" className="h-3.5 w-16" aria-hidden>{Array.from({ length: 22 }).map((_, i) => <rect key={i} x={i * 2.7} y="0" width={(i * 7) % 3 === 0 ? 1.8 : 0.9} height="14" fill="#78350f" />)}</svg>
      </div>
      <div className="grid grid-cols-[1.4fr_1fr_.9fr] gap-x-3 px-4 py-1 text-[10px] font-extrabold uppercase tracking-wider text-amber-900/60"><span>Test</span><span>Result</span><span>Reference</span></div>
      <div className="divide-y divide-amber-100 px-4 pb-2">
        {labs.map((l, i) => {
          const f = l.flag || "N"
          const col = f === "C" ? "text-rose-700" : f === "H" ? "text-orange-600" : f === "L" ? "text-sky-700" : "text-slate-800"
          return (
            <div key={i} className={`grid grid-cols-[1.4fr_1fr_.9fr] items-center gap-x-3 py-1.5 text-[13px] ${f === "C" ? "bg-rose-50/70 -mx-4 px-4" : ""}`}>
              <span className="font-semibold text-slate-800">{l.name}</span>
              <span className={`font-mono font-black ${col} ${f === "C" ? "animate-pulse" : ""}`}>{l.value} <span className="text-[10px] font-semibold opacity-70">{l.unit}</span> {f === "H" ? "▲" : f === "L" ? "▼" : f === "C" ? "‼" : ""}</span>
              <span className="text-[11px] text-slate-500">{l.ref}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ scans */
export type Scan = { modality: string; title?: string; caption?: string; lesion?: { x: number; y: number; r: number } }

function rnd(seed: number) { let t = seed + 0x6d2b79f5; return () => { t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296 } }

function ecgPath(hint: string) {
  const h = hint.toLowerCase()
  const kind = /elevation|stemi/.test(h) ? "st" : /fibrillation|irregular/.test(h) ? "af" : /ventricular tachy|vt\b|wide/.test(h) ? "vt" : "sinus"
  const k = kind === "vt" ? 40 : 60
  const beat = (x: number) => {
    const s = (a: number) => (x + a * (k / 60)).toFixed(1)
    if (kind === "vt") return `Q${s(10)} -26 ${s(20)} 0 Q${s(30)} 26 ${s(40)} 0`
    if (kind === "st") return `L${s(6)} 0 Q${s(9)} -4 ${s(12)} 0 L${s(16)} 0 L${s(17)} 2 L${s(19)} -24 L${s(21)} -4 Q${s(32)} -20 ${s(46)} -6 L${s(60)} 0`
    if (kind === "af") return `L${s(3)} -1 L${s(6)} 1 L${s(9)} -1 L${s(12)} 1 L${s(16)} 0 L${s(17)} 2 L${s(19)} -26 L${s(21)} 8 L${s(23)} 0 L${s(27)} -1 L${s(31)} 1 L${s(40)} 0 Q${s(46)} -6 ${s(52)} 0 L${s(60)} 0`
    return `L${s(6)} 0 Q${s(9)} -5 ${s(12)} 0 L${s(16)} 0 L${s(17)} 2 L${s(19)} -26 L${s(21)} 8 L${s(23)} 0 L${s(30)} 0 Q${s(36)} -9 ${s(42)} 0 L${s(60)} 0`
  }
  let d = "M0 0", x = 0
  while (x < 190) { d += " " + beat(x); x += k }
  return d
}

export function ScanViewer({ scan }: { scan: Scan }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "")
  const m = (scan.modality || "xray").toLowerCase()
  const lz = scan.lesion
  const lx = lz ? (lz.x / 100) * 200 : 0, ly = lz ? (lz.y / 100) * 150 : 0, lr = lz ? lz.r * 1.1 : 0
  const dots = useMemo(() => { const r = rnd(7); return Array.from({ length: 170 }).map(() => ({ x: 30 + r() * 140, y: 10 + r() * 130, o: 0.08 + r() * 0.3, r: 0.6 + r() * 1.2 })) }, [])
  const label = (t: string, x: number, y: number, anchor: "start" | "end" = "start") => <text x={x} y={y} fill="#8fa3b8" fontSize="6.5" fontFamily="monospace" textAnchor={anchor}>{t}</text>
  const lesionFill = m === "usg" ? "#000" : "#fff"
  return (
    <div className="overflow-hidden rounded-2xl bg-[#04070b] shadow-lg ring-1 ring-black/20">
      <div className="flex items-center justify-between px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-widest text-sky-300/80">
        <span>{m === "xray" ? "🩻 X-ray" : m === "ct" ? "🧲 CT" : m === "usg" ? "📡 Ultrasound" : "📈 ECG"}</span><span>{scan.title}</span>
      </div>
      <div className="relative">
        <svg viewBox="0 0 200 150" className="block h-52 w-full" role="img" aria-label={scan.title || "Scan"}>
          <defs>
            <radialGradient id={uid + "l"}><stop offset="0" stopColor="#06090d" /><stop offset="1" stopColor="#2a343e" /></radialGradient>
            <radialGradient id={uid + "b"}><stop offset="0" stopColor="#9aa4ad" /><stop offset="1" stopColor="#4c555d" /></radialGradient>
            <radialGradient id={uid + "z"}><stop offset="0" stopColor={lesionFill} stopOpacity=".95" /><stop offset="1" stopColor={lesionFill} stopOpacity="0" /></radialGradient>
            <clipPath id={uid + "s"}><path d="M100 6 L170 128 A82 82 0 0 1 30 128Z" /></clipPath>
          </defs>
          {m === "xray" && (
            <g>
              <rect width="200" height="150" fill="#56626f" />
              <path d="M32 24 Q22 70 36 118 Q60 128 92 118 Q96 70 92 24 Q60 12 32 24Z" fill={`url(#${uid}l)`} />
              <path d="M168 24 Q178 70 164 118 Q140 128 108 118 Q104 70 108 24 Q140 12 168 24Z" fill={`url(#${uid}l)`} />
              {Array.from({ length: 6 }).map((_, i) => <g key={i} stroke="#dbe3eb" strokeOpacity=".4" strokeWidth="2.2" fill="none"><path d={`M96 ${26 + i * 14} Q55 ${22 + i * 14} 28 ${44 + i * 14}`} /><path d={`M104 ${26 + i * 14} Q145 ${22 + i * 14} 172 ${44 + i * 14}`} /></g>)}
              <rect x="96" y="14" width="8" height="112" fill="#c3ced9" opacity=".7" rx="3" />
              <ellipse cx="114" cy="92" rx="22" ry="28" fill="#b6c2ce" opacity=".75" />
              <path d="M20 22 Q60 6 98 20 M180 22 Q140 6 102 20" stroke="#e5ecf3" strokeOpacity=".7" strokeWidth="3" fill="none" />
              <path d="M26 122 Q60 112 94 124 M174 122 Q140 108 106 124" stroke="#e5ecf3" strokeOpacity=".5" strokeWidth="2" fill="none" />
              {label("R", 8, 14)}{label("L", 192, 14, "end")}
            </g>
          )}
          {m === "ct" && (
            <g>
              <circle cx="100" cy="75" r="64" fill="#e9eef3" opacity=".85" />
              <circle cx="100" cy="75" r="58" fill={`url(#${uid}b)`} />
              <path d="M100 30 Q86 36 88 52 Q94 62 100 56 Q106 62 112 52 Q114 36 100 30Z" fill="#0b0f13" opacity=".85" />
              <path d="M100 56 Q88 72 94 90 M100 56 Q112 72 106 90" stroke="#0b0f13" strokeOpacity=".7" strokeWidth="5" fill="none" strokeLinecap="round" />
              <line x1="100" y1="17" x2="100" y2="133" stroke="#2c343b" strokeOpacity=".6" />
              {label("AXIAL", 8, 14)}{label("R", 8, 78)}{label("L", 192, 78, "end")}
            </g>
          )}
          {m === "usg" && (
            <g>
              <path d="M100 6 L170 128 A82 82 0 0 1 30 128Z" fill="#101820" stroke="#35506b" strokeWidth="1" />
              <g clipPath={`url(#${uid}s)`}>{dots.map((d, i) => <circle key={i} cx={d.x} cy={d.y} r={d.r} fill="#c9d6e2" opacity={d.o} />)}<ellipse cx="100" cy="100" rx="60" ry="22" fill="#9fb3c6" opacity=".12" /></g>
              {label("USG", 8, 14)}
            </g>
          )}
          {m === "ecg" && (
            <g>
              <rect width="200" height="150" fill="#fff6f6" />
              {Array.from({ length: 41 }).map((_, i) => <line key={"v" + i} x1={i * 5} y1="0" x2={i * 5} y2="150" stroke="#f6b9b9" strokeWidth={i % 5 === 0 ? 0.7 : 0.25} />)}
              {Array.from({ length: 31 }).map((_, i) => <line key={"h" + i} x1="0" y1={i * 5} x2="200" y2={i * 5} stroke="#f6b9b9" strokeWidth={i % 5 === 0 ? 0.7 : 0.25} />)}
              <path d={ecgPath((scan.caption || "") + " " + (scan.title || ""))} transform="translate(4,50)" fill="none" stroke="#111" strokeWidth="1.3" strokeLinejoin="round" />
              <path d={ecgPath("sinus " + (scan.caption || ""))} transform="translate(4,110) scale(1,.8)" fill="none" stroke="#111" strokeWidth="1" strokeLinejoin="round" opacity=".7" />
              <text x="6" y="12" fontSize="7" fontFamily="monospace" fill="#7f1d1d">II · 25 mm/s · 10 mm/mV</text>
            </g>
          )}
          {lz && m !== "ecg" && (
            <g>
              <circle cx={lx} cy={ly} r={lr * 1.6} fill={`url(#${uid}z)`} />
              <circle cx={lx} cy={ly} r={lr} fill="none" stroke="#ffd95a" strokeWidth="1" strokeDasharray="3 2" style={{ transformOrigin: `${lx}px ${ly}px`, animation: "wr-ping 2.2s ease-out infinite" }} />
            </g>
          )}
          {m !== "ecg" && <rect x="0" y="0" width="200" height="6" fill="#7dd3fc" opacity=".25" style={{ animation: "wr-sweep 3.4s linear infinite" }} />}
        </svg>
      </div>
      {scan.caption && <p className="border-t border-white/10 bg-black/40 px-3 py-2 font-mono text-[12px] leading-relaxed text-sky-100">{scan.caption}</p>}
    </div>
  )
}

/* ------------------------------------------------------------------ alert banner */
export function AlertBanner({ alert }: { alert: { title: string; text: string } }) {
  return (
    <div className="wr-rise wr-flash flex items-start gap-3 overflow-hidden rounded-3xl border-2 border-rose-400 bg-gradient-to-r from-rose-600 to-red-500 p-4 text-white shadow-xl">
      <span className="wr-siren text-4xl" aria-hidden>🚨</span>
      <div><p className="text-[11px] font-black uppercase tracking-[0.25em] text-white/80">Complication!</p><p className="text-lg font-black leading-tight">{alert.title}</p><p className="mt-1 text-sm font-medium text-white/90">{alert.text}</p></div>
    </div>
  )
}

/* ------------------------------------------------------------------ timer */
export function TimerRing({ seconds, runKey, active, onExpire }: { seconds: number; runKey: string; active: boolean; onExpire: () => void }) {
  const [left, setLeft] = useState(seconds)
  const fired = useRef(false)
  const exp = useRef(onExpire)
  exp.current = onExpire
  useEffect(() => {
    fired.current = false
    setLeft(seconds)
    if (!active) return
    const start = Date.now()
    const id = setInterval(() => {
      const l = Math.max(0, seconds - (Date.now() - start) / 1000)
      setLeft(l)
      if (l <= 0 && !fired.current) { fired.current = true; clearInterval(id); exp.current() }
    }, 200)
    return () => clearInterval(id)
  }, [runKey, active, seconds])
  const c = 2 * Math.PI * 16
  const low = left <= seconds * 0.3
  return (
    <div className={`relative grid h-11 w-11 place-items-center ${low && active ? "wr-flash rounded-full" : ""}`} title="Decide fast!">
      <svg viewBox="0 0 40 40" className="absolute inset-0 -rotate-90">
        <circle cx="20" cy="20" r="16" fill="rgba(255,255,255,.2)" stroke="rgba(255,255,255,.3)" strokeWidth="3.5" />
        <circle cx="20" cy="20" r="16" fill="none" stroke={low ? "#fecaca" : "#fff"} strokeWidth="3.5" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - left / seconds)} />
      </svg>
      <span className="relative text-sm font-black tabular-nums">{Math.ceil(left)}</span>
    </div>
  )
}

/* ------------------------------------------------------------------ sequence procedure */
const ICONS: [RegExp, string][] = [
  [/consent|explain|counsel|inform/i, "��"], [/hand|glove|gown|steril|asepsis|aseptic|drape|scrub/i, "🧤"], [/position|lie|sit|lateral|supine|tilt|head/i, "🛏️"],
  [/landmark|palpat|identify|mark|locate|ultrasound/i, "✋"], [/anaesth|lignocaine|infiltrat|local/i, "💉"], [/insert|needle|puncture|cannula|advance|incise|pass/i, "🪡"],
  [/aspirat|withdraw|collect|sample|send|drain/i, "🧪"], [/confirm|check|verify|auscultat|position of|x-ray|capnograph/i, "✅"], [/dress|secure|suture|cover|fix|tape/i, "🩹"],
  [/monitor|observe|document|record|note|repeat|post/i, "📋"], [/oxygen|ventilat|bag|compress|shock|defib|airway/i, "🫁"], [/drug|adrenaline|give|inject|administer|infus/i, "💊"],
]
const iconFor = (s: string, i: number) => ICONS.find(([r]) => r.test(s))?.[1] || ["🔹", "🔸", "🔷", "🔶", "⭐", "🔻", "🔺", "▪️"][i % 8]

function shuffled(n: number, seed: string) {
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) { h ^= seed.charCodeAt(i); h = Math.imul(h, 16777619) }
  const r = rnd(h >>> 0)
  const a = Array.from({ length: n }, (_, i) => i)
  for (let i = n - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]] }
  if (a.every((v, i) => v === i)) a.push(a.shift() as number)
  return a
}

export function Tray() {
  return (
    <svg viewBox="0 0 320 70" className="h-16 w-full" aria-hidden>
      <rect x="6" y="40" width="308" height="22" rx="10" fill="#cfd8e3" /><rect x="12" y="36" width="296" height="18" rx="9" fill="#e9eef4" />
      <g className="wr-float"><rect x="40" y="14" width="46" height="9" rx="3" fill="#94a3b8" /><rect x="86" y="16" width="26" height="5" rx="2" fill="#475569" /><path d="M112 18 L130 18" stroke="#cbd5e1" strokeWidth="2" /></g>
      <g className="wr-float" style={{ animationDelay: ".6s" }}><path d="M150 40 L170 12 L178 16 L160 42Z" fill="#94a3b8" /><circle cx="176" cy="14" r="5" fill="none" stroke="#64748b" strokeWidth="2.5" /></g>
      <g className="wr-float" style={{ animationDelay: "1.2s" }}><rect x="210" y="22" width="14" height="22" rx="3" fill="#bae6fd" stroke="#38bdf8" /><rect x="214" y="12" width="6" height="10" fill="#64748b" /><rect x="226" y="30" width="30" height="3" fill="#94a3b8" /></g>
      <circle cx="280" cy="38" r="9" fill="#fecaca" stroke="#ef4565" strokeWidth="2" className="wr-glow" />
    </svg>
  )
}

export function SequenceBoard({ stageId, prompt, steps, done, onSubmit }: { stageId: string; prompt: string; steps: string[]; done: boolean; onSubmit: (correct: number, total: number) => void }) {
  const order = useMemo(() => shuffled(steps.length, stageId + steps.join("|")), [stageId, steps])
  const [placed, setPlaced] = useState<number[]>([])
  const pool = order.filter((i) => !placed.includes(i))
  const total = steps.length
  const correctN = placed.filter((v, i) => v === i).length
  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-gradient-to-r from-sky-50 to-blue-50 p-3"><Tray /><p className="text-center text-[11px] font-extrabold uppercase tracking-widest text-sky-700">Sterile procedure tray</p></div>
      <p className="text-sm font-semibold text-slate-700">Tap the steps in the order you would perform them. Tap a placed step to take it back.</p>
      <ol className="space-y-2">
        {Array.from({ length: total }).map((_, slot) => {
          const idx = placed[slot]
          const filled = idx !== undefined
          const ok = done && filled && idx === slot
          const bad = done && filled && idx !== slot
          return (
            <li key={slot}>
              <button disabled={done || !filled} onClick={() => setPlaced((p) => p.filter((_, k) => k !== slot))}
                className={`flex w-full items-center gap-3 rounded-2xl border-2 p-3 text-left transition-all ${ok ? "border-emerald-400 bg-emerald-50" : bad ? "border-rose-400 bg-rose-50" : filled ? "border-primary bg-primary/10" : "border-dashed border-black/15 bg-slate-50"}`}>
                <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-black ${ok ? "bg-emerald-500 text-white" : bad ? "bg-rose-500 text-white" : "bg-primary/15 text-primary"}`}>{slot + 1}</span>
                <span className="min-w-0 flex-1 text-sm font-semibold text-slate-800">{filled ? <><span className="mr-1.5">{iconFor(steps[idx], idx)}</span>{steps[idx]}</> : <span className="text-slate-400">Step {slot + 1}…</span>}</span>
                {ok && <CheckCircle2 className="h-5 w-5 text-emerald-600" />}{bad && <XCircle className="h-5 w-5 text-rose-600" />}
              </button>
              {bad && <p className="ml-11 mt-1 text-xs font-semibold text-emerald-700">Correct step {slot + 1}: {steps[slot]}</p>}
            </li>
          )
        })}
      </ol>
      {!done && (
        <>
          <div className="flex flex-wrap gap-2">
            {pool.map((i) => (
              <button key={i} onClick={() => setPlaced((p) => [...p, i])} className="flex items-center gap-1.5 rounded-xl border-2 border-black/10 bg-white px-3 py-2 text-left text-[13px] font-semibold text-slate-800 shadow-sm transition hover:-translate-y-0.5 hover:border-primary hover:shadow-md">
                <span>{iconFor(steps[i], i)}</span>{steps[i]}
              </button>
            ))}
          </div>
          <button disabled={placed.length < total} onClick={() => onSubmit(correctN, total)} className="h-12 w-full rounded-2xl bg-primary text-base font-black text-white shadow transition disabled:opacity-40">
            {placed.length < total ? `Place ${total - placed.length} more step${total - placed.length > 1 ? "s" : ""}` : "Perform the procedure"}
          </button>
        </>
      )}
      <span className="sr-only">{prompt}</span>
    </div>
  )
}
