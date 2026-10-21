"use client"

import { useEffect, useId, useState } from "react"

export type Mood = "idle" | "happy" | "cheering" | "oops" | "sad" | "thinking" | "explaining" | "listening" | "sleep"

/* ---------- Jelly is ONE drawn character with moving parts (not a set of swapped pictures) ---------- */

type Arm = [number, number] // [upper arm, forearm] in degrees, positive = swing outward / upward
type Pose = { l: Arm; r: Arm; wave?: boolean; tablet?: boolean }

const POSES: Record<string, Pose> = {
  rest: { l: [16, 8], r: [16, 8] },
  tablet: { l: [34, -100], r: [16, 8], tablet: true },
  wave: { l: [16, 8], r: [140, 12], wave: true },
  cheer: { l: [160, 14], r: [160, 14] },
  point: { l: [36, -85], r: [88, -6] },
  palms: { l: [52, 62], r: [52, 62] },
  hip: { l: [42, -88], r: [42, -88] },
  think: { l: [16, 8], r: [-22, 222] },
  ear: { l: [16, 8], r: [100, 86] },
  oops: { l: [46, 126], r: [46, 126] },
  droop: { l: [6, 4], r: [6, 4] },
}

/** What each mood does by default, and the gestures it cycles through while speaking. */
const MOOD: Record<Mood, { pose: string; talk: string[]; amb: string[] }> = {
  idle: { pose: "tablet", talk: ["point", "palms", "tablet", "wave", "palms"], amb: ["wave", "point", "palms"] },
  happy: { pose: "rest", talk: ["palms", "wave", "cheer", "point"], amb: ["wave", "cheer"] },
  cheering: { pose: "cheer", talk: ["cheer", "wave", "cheer", "palms"], amb: ["wave", "cheer"] },
  explaining: { pose: "point", talk: ["point", "palms", "hip", "point", "palms", "wave"], amb: ["point", "palms"] },
  thinking: { pose: "think", talk: ["think", "palms", "think", "point"], amb: [] },
  oops: { pose: "oops", talk: ["oops", "palms", "oops"], amb: [] },
  sad: { pose: "droop", talk: ["droop", "palms", "droop"], amb: [] },
  listening: { pose: "ear", talk: ["ear", "palms", "ear"], amb: [] },
  sleep: { pose: "droop", talk: ["droop"], amb: [] },
}

type Eyes = "open" | "happy" | "sleep"
type Brow = { y: number; l: number; r: number } // vertical offset and tilt (deg) of each brow
const FACE: Record<Mood, { eyes: Eyes; brow: Brow; mouth: string; cheeks: number; gaze?: [number, number]; tilt: number; squash?: number }> = {
  idle: { eyes: "open", brow: { y: 0, l: 0, r: 0 }, mouth: "smile", cheeks: 0.35, tilt: 0 },
  happy: { eyes: "happy", brow: { y: -2, l: -4, r: 4 }, mouth: "grin", cheeks: 0.6, tilt: -2 },
  cheering: { eyes: "happy", brow: { y: -4, l: -6, r: 6 }, mouth: "wide", cheeks: 0.7, tilt: 0 },
  explaining: { eyes: "open", brow: { y: -3, l: -3, r: 3 }, mouth: "smile", cheeks: 0.35, tilt: 1 },
  thinking: { eyes: "open", brow: { y: -2, l: 8, r: -14 }, mouth: "flat", cheeks: 0.25, gaze: [4, -4], tilt: 4 },
  oops: { eyes: "open", brow: { y: -4, l: 16, r: -16 }, mouth: "o", cheeks: 0.3, gaze: [0, 1], tilt: -2 },
  sad: { eyes: "open", brow: { y: 1, l: 18, r: -18 }, mouth: "frown", cheeks: 0.15, gaze: [0, 3], tilt: -3, squash: 0.96 },
  listening: { eyes: "open", brow: { y: -3, l: -2, r: 2 }, mouth: "smile", cheeks: 0.35, gaze: [0, 0], tilt: 5 },
  sleep: { eyes: "sleep", brow: { y: 3, l: -6, r: 6 }, mouth: "tiny", cheeks: 0.3, tilt: 6, squash: 0.97 },
}

/** Mouth shapes centred on x=100, y~118. */
const MOUTH: Record<string, { d: string; fill?: boolean; tongue?: boolean; ellipse?: boolean }> = {
  smile: { d: "M89 114 Q100 126 111 114" },
  grin: { d: "M87 111 Q100 109 113 111 Q111 129 100 129 Q89 129 87 111 Z", fill: true, tongue: true },
  wide: { d: "M84 109 Q100 106 116 109 Q114 134 100 134 Q86 134 84 109 Z", fill: true, tongue: true },
  open: { d: "M92 112 Q100 110 108 112 Q107 123 100 123 Q93 123 92 112 Z", fill: true },
  o: { d: "", ellipse: true, fill: true },
  frown: { d: "M90 124 Q100 112 110 124" },
  flat: { d: "M92 118 Q96 121 100 118 Q104 115 108 118" },
  tiny: { d: "M95 116 Q100 120 105 116" },
  closed: { d: "M90 115 Q100 119 110 115" },
}
const VISEMES = ["open", "grin", "closed", "wide", "open", "o", "smile", "grin"]

const CSS = `
@keyframes jyFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
@keyframes jyBreathe{0%,100%{transform:scale(1,1)}50%{transform:scale(1.015,1.03)}}
@keyframes jySway{0%,100%{transform:rotate(-1.2deg)}50%{transform:rotate(1.2deg)}}
@keyframes jyTalk{0%,100%{transform:translateY(0) rotate(-1.6deg)}30%{transform:translateY(-2.5px) rotate(0deg)}60%{transform:translateY(0) rotate(1.6deg)}80%{transform:translateY(-1.5px) rotate(0deg)}}
@keyframes jyWave{0%,100%{transform:rotate(-24deg)}50%{transform:rotate(22deg)}}
@keyframes jyTent{0%,100%{transform:skewX(0deg)}50%{transform:skewX(3deg)}}
@keyframes jyPop{0%,100%{opacity:.25;transform:scale(.8)}50%{opacity:1;transform:scale(1.1)}}
@keyframes jyZ{0%{opacity:0;transform:translate(0,6px) scale(.7)}40%{opacity:1}100%{opacity:0;transform:translate(6px,-12px) scale(1.15)}}
@keyframes jyBounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}
.jy-wrap{position:relative;display:inline-block;flex-shrink:0}
.jy-float{animation:jyFloat 3.6s ease-in-out infinite}
.jy-svg{width:100%;height:100%;overflow:visible;display:block;user-select:none}
.jy-breathe{animation:jyBreathe 3.4s ease-in-out infinite;transform-origin:100px 190px}
.jy-breathe.jy-slow{animation-duration:5.2s}
.jy-talk{animation:jyTalk .55s ease-in-out infinite;transform-origin:100px 190px}
.jy-sway{animation:jySway 4.6s ease-in-out infinite;transform-origin:100px 190px}
.jy-bounce{animation:jyBounce .5s ease-in-out infinite}
.jy-wavefx{animation:jyWave .5s ease-in-out infinite;transform-origin:0 0}
.jy-pop{animation:jyPop 1s ease-in-out infinite;transform-box:fill-box;transform-origin:center}
.jy-z{animation:jyZ 2.4s ease-in-out infinite;transform-box:fill-box;transform-origin:center}
.jy-tent{animation:jyTent 3s ease-in-out infinite;transform-origin:100px 150px}
.jy-ease{transition:transform .55s cubic-bezier(.34,1.45,.64,1)}
.jy-fast{transition:transform .18s ease-out}
.jy-soft{transition:transform .35s ease-out,opacity .3s}
@media (prefers-reduced-motion: reduce){.jy-float,.jy-breathe,.jy-talk,.jy-sway,.jy-bounce,.jy-wavefx,.jy-pop,.jy-z,.jy-tent{animation:none}.jy-ease,.jy-fast,.jy-soft{transition:none}}
`

const DARK = "#1c1948"

/** One arm: sleeve (upper arm) + forearm and hand, each with its own joint, so the arm bends like a real one. */
function ArmPart({ side, a, wave, tablet, id }: { side: "l" | "r"; a: Arm; wave?: boolean; tablet?: boolean; id: string }) {
  const s = side === "l" ? 1 : -1
  const sx = side === "l" ? 54 : 146
  return (
    <g className="jy-ease" style={{ transform: `translate(${sx}px,126px) rotate(${s * a[0]}deg)` }}>
      <path d="M-8 -3 C-11 8 -10 20 -7 26 Q0 32 7 26 C10 20 11 8 8 -3 Z" fill="#f8faff" stroke="#cdd7f5" strokeWidth="1" />
      <g className="jy-ease" style={{ transform: `translate(0px,26px) rotate(${s * a[1]}deg)` }}>
        <g className={wave ? "jy-wavefx" : undefined}>
          <path d="M-6.5 -1 C-8 8 -7 17 -4 22 L4 22 C7 17 8 8 6.5 -1 Z" fill={`url(#${id}b)`} stroke="#fff" strokeOpacity=".6" strokeWidth="1" />
          <circle cx="0" cy="24" r="8.2" fill={`url(#${id}b)`} stroke="#fff" strokeOpacity=".7" strokeWidth="1" />
          <ellipse cx="-2.6" cy="21" rx="2.6" ry="1.8" fill="#fff" opacity=".7" />
          {tablet && (
            <g transform={`translate(${s * -4},14) rotate(${s * -8})`}>
              <rect x={-17} y={-13} width="34" height="42" rx="4" fill="#2b2f4f" stroke="#454a75" strokeWidth="1.2" />
              <text x="0" y="12" textAnchor="middle" fontSize="8" fontWeight="700" fill="#cfd6ff" fontFamily="system-ui,sans-serif" transform={`scale(${s},1)`}>Jelly</text>
              <circle cx="0" cy="-8" r="1.4" fill="#454a75" />
              <circle cx={s * 8} cy="21" r="8.2" fill={`url(#${id}b)`} stroke="#fff" strokeOpacity=".7" strokeWidth="1" />
            </g>
          )}
        </g>
      </g>
    </g>
  )
}

export function JellyAvatar({ mood = "idle", size = 80, talking = false, className = "" }: { mood?: Mood; size?: number; talking?: boolean; className?: string; doctor?: boolean }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "")
  const id = "jy" + uid
  const M = MOOD[mood], F = FACE[mood]

  // gesture: cycles while speaking; occasional spontaneous gesture while idle
  const [gest, setGest] = useState<string | null>(null)
  useEffect(() => {
    let t: any, o: any, n = 0
    if (talking) {
      const tick = () => { setGest(M.talk[n++ % M.talk.length]); t = setTimeout(tick, 1100 + Math.random() * 900) }
      t = setTimeout(tick, 250)
    } else {
      setGest(null)
      if (M.amb.length) {
        const loop = () => { t = setTimeout(() => { setGest(M.amb[Math.floor(Math.random() * M.amb.length)]); o = setTimeout(() => { setGest(null); loop() }, 1700) }, 4500 + Math.random() * 4000) }
        loop()
      }
    }
    return () => { clearTimeout(t); clearTimeout(o) }
  }, [talking, mood])
  const pose = POSES[gest || M.pose] || POSES.rest

  // blink
  const [blink, setBlink] = useState(false)
  useEffect(() => {
    if (F.eyes !== "open") return
    let t: any, o: any
    const loop = () => {
      t = setTimeout(() => {
        setBlink(true)
        o = setTimeout(() => {
          setBlink(false)
          if (Math.random() < 0.25) { o = setTimeout(() => { setBlink(true); o = setTimeout(() => setBlink(false), 110) }, 160) }
          loop()
        }, 120)
      }, 1800 + Math.random() * 3200)
    }
    loop()
    return () => { clearTimeout(t); clearTimeout(o) }
  }, [F.eyes])

  // gaze: eyes wander like a person's
  const [gaze, setGaze] = useState<[number, number]>([0, 0])
  useEffect(() => {
    if (F.gaze) { setGaze(F.gaze); return }
    if (F.eyes !== "open") { setGaze([0, 0]); return }
    let t: any
    const loop = () => { t = setTimeout(() => { setGaze([Math.round((Math.random() * 2 - 1) * 3.5), Math.round((Math.random() * 2 - 1) * 2.5)]); loop() }, 1400 + Math.random() * 2400) }
    loop()
    return () => clearTimeout(t)
  }, [mood])

  // mouth: lip-sync while speaking
  const [vi, setVi] = useState(0)
  useEffect(() => {
    if (!talking || mood === "sleep") return
    const t = setInterval(() => setVi((v) => (v + 1 + Math.floor(Math.random() * 2)) % VISEMES.length), 130)
    return () => clearInterval(t)
  }, [talking, mood])
  const mouth = MOUTH[talking && mood !== "sleep" ? VISEMES[vi] : F.mouth]

  const brows = { y: F.brow.y + (talking ? (vi % 3 === 0 ? -2 : 0) : 0), l: F.brow.l, r: F.brow.r }
  const tilt = F.tilt
  const open = F.eyes === "open"

  return (
    <div className={`jy-wrap ${className}`} style={{ width: size, height: size }} role="img" aria-label={`Jelly is ${mood}`}>
      <style>{CSS}</style>
      <div className="jy-float" style={{ width: "100%", height: "100%" }}>
        <svg className="jy-svg" viewBox="0 0 200 200" aria-hidden="true">
          <defs>
            <radialGradient id={id + "a"} cx="38%" cy="28%" r="85%">
              <stop offset="0" stopColor="#f1f4ff" /><stop offset=".45" stopColor="#c3cdff" /><stop offset="1" stopColor="#9d9cf2" />
            </radialGradient>
            <linearGradient id={id + "b"} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#e6ebff" /><stop offset="1" stopColor="#aab4f7" />
            </linearGradient>
            <radialGradient id={id + "g"} cx="50%" cy="50%" r="50%"><stop offset="0" stopColor="#b9a9ff" stopOpacity=".55" /><stop offset="1" stopColor="#b9a9ff" stopOpacity="0" /></radialGradient>
          </defs>
          <ellipse cx="100" cy="196" rx="44" ry="5" fill="#6d68c9" opacity=".16" />

          <g className={talking ? "jy-talk" : mood === "listening" || mood === "thinking" ? "" : "jy-sway"}>
          <g className={`jy-breathe ${mood === "sleep" ? "jy-slow" : ""} ${talking && (mood === "cheering") ? "jy-bounce" : ""}`}
            style={F.squash ? { transform: `scaleY(${F.squash})`, transformOrigin: "100px 190px" } : undefined}>
            <g className="jy-ease" style={{ transform: `rotate(${tilt}deg)`, transformOrigin: "100px 190px" }}>
              {/* soft aura */}
              <ellipse cx="100" cy="110" rx="86" ry="90" fill={`url(#${id}g)`} />

              {/* body */}
              <g className="jy-tent">
                <path d="M38 108 C38 52 66 14 100 14 C134 14 162 52 162 108 C162 134 167 156 160 176 C153 190 146 176 138 188 C130 199 122 182 112 194 C102 204 94 184 84 194 C74 201 68 183 60 189 C50 194 44 178 41 162 C38 146 38 128 38 108 Z"
                  fill={`url(#${id}a)`} stroke="#fff" strokeOpacity=".7" strokeWidth="1.6" />
              </g>
              <ellipse cx="72" cy="40" rx="24" ry="13" fill="#fff" opacity=".6" transform="rotate(-24 72 40)" />
              <circle cx="52" cy="66" r="3.4" fill="#fff" opacity=".7" />
              <ellipse cx="128" cy="170" rx="22" ry="8" fill="#fff" opacity=".22" />

              {/* white coat + stethoscope */}
              <path d="M46 136 C58 142 80 146 100 146 C120 146 142 142 154 136 L160 176 C152 190 128 188 100 188 C72 188 48 190 40 176 Z" fill="#f8faff" stroke="#cdd7f5" strokeWidth="1.2" />
              <path d="M84 143 L100 170 L116 143" fill="none" stroke="#c9d2f0" strokeWidth="1.8" strokeLinejoin="round" />
              <path d="M82 142 C76 160 90 174 100 170 C110 174 124 160 118 142" fill="none" stroke="#3a3f66" strokeWidth="2.4" strokeLinecap="round" />
              <circle cx="100" cy="171" r="5.2" fill="#7d84ad" stroke="#3a3f66" strokeWidth="1.6" />

              {/* face */}
              <g>
                {([-1, 1] as const).map((k) => (
                  <ellipse key={"c" + k} className="jy-soft" cx={100 + k * 36} cy="102" rx="9" ry="5.5" fill="#ff8fc0" style={{ opacity: F.cheeks + (talking ? 0.05 : 0) }} />
                ))}
                {/* eyebrows */}
                {([-1, 1] as const).map((k) => (
                  <g key={"b" + k} className="jy-ease" style={{ transform: `translate(${100 + k * 20}px,${70 + brows.y}px) rotate(${k < 0 ? brows.l : brows.r}deg)` }}>
                    <path d="M-8 1 Q0 -4 8 1" fill="none" stroke="#5a52b3" strokeWidth="2.4" strokeLinecap="round" opacity={mood === "sleep" ? 0.5 : 0.85} />
                  </g>
                ))}
                {/* eyes */}
                {([-1, 1] as const).map((k) => (
                  <g key={"e" + k} transform={`translate(${100 + k * 20},90)`}>
                    {open ? (
                      <g className="jy-fast" style={{ transform: `scaleY(${blink ? 0.08 : 1})`, transformBox: "fill-box", transformOrigin: "center" }}>
                        <g className="jy-fast" style={{ transform: `translate(${gaze[0]}px,${gaze[1]}px)` }}>
                          <ellipse cx="0" cy="0" rx="10.5" ry="12.5" fill={DARK} />
                          <ellipse cx="0" cy="3" rx="7" ry="7" fill="#3b3590" opacity=".6" />
                          <circle cx="-3.4" cy="-4.4" r="3.6" fill="#fff" />
                          <circle cx="3.6" cy="4.4" r="1.7" fill="#fff" opacity=".9" />
                        </g>
                      </g>
                    ) : F.eyes === "happy" ? (
                      <path d="M-10 4 Q0 -10 10 4" fill="none" stroke={DARK} strokeWidth="4" strokeLinecap="round" />
                    ) : (
                      <path d="M-10 -1 Q0 9 10 -1" fill="none" stroke={DARK} strokeWidth="3.6" strokeLinecap="round" />
                    )}
                  </g>
                ))}
                {/* glasses (explaining) */}
                {mood === "explaining" && (
                  <g fill="none" stroke="#2a2a55" strokeWidth="2.6">
                    <circle cx="80" cy="90" r="15" /><circle cx="120" cy="90" r="15" /><path d="M95 89 Q100 85 105 89" />
                  </g>
                )}
                {/* mouth */}
                <g transform="translate(0,0)">
                  {mouth.ellipse ? (
                    <ellipse cx="100" cy="118" rx="5.2" ry="6.6" fill="#4a1740" />
                  ) : mouth.fill ? (
                    <g>
                      <path d={mouth.d} fill="#4a1740" stroke="#2a1458" strokeWidth="1.6" strokeLinejoin="round" />
                      {mouth.tongue && <path d="M92 124 Q100 117 108 124 Q100 131 92 124 Z" fill="#ff8aa8" />}
                    </g>
                  ) : (
                    <path d={mouth.d} fill="none" stroke="#2a1458" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
                  )}
                </g>
              </g>

              {/* headphones (listening) */}
              {mood === "listening" && (
                <g>
                  <path d="M42 86 C40 30 160 30 158 86" fill="none" stroke="#1e1e30" strokeWidth="7" strokeLinecap="round" />
                  <rect x="31" y="74" width="16" height="38" rx="8" fill="#1e1e30" /><rect x="153" y="74" width="16" height="38" rx="8" fill="#1e1e30" />
                  <rect x="35" y="80" width="5" height="26" rx="2.5" fill="#3a3a58" /><rect x="160" y="80" width="5" height="26" rx="2.5" fill="#3a3a58" />
                </g>
              )}

              {/* arms (drawn last so they pass in front of the coat) */}
              <ArmPart side="l" a={pose.l} tablet={pose.tablet} id={id} />
              <ArmPart side="r" a={pose.r} wave={pose.wave} id={id} />

              {/* mood effects */}
              {mood === "oops" && <path className="jy-pop" d="M158 52 C163 60 165 65 158 71 C151 65 153 60 158 52 Z" fill="#7fc4ff" stroke="#fff" strokeWidth="1.2" />}
              {mood === "sad" && <path className="jy-pop" d="M70 104 C74 111 76 115 70 121 C64 115 66 111 70 104 Z" fill="#7fc4ff" stroke="#fff" strokeWidth="1.2" />}
              {mood === "thinking" && <text className="jy-pop" x="156" y="40" fontSize="30" fontWeight="800" fill="#8e86ff">?</text>}
              {mood === "sleep" && <text className="jy-z" x="150" y="44" fontSize="26" fontWeight="800" fill="#8e86ff">z</text>}
              {(mood === "happy" || mood === "cheering") && (
                <g className="jy-pop" stroke="#8ea2ff" strokeWidth="3.4" strokeLinecap="round">
                  <path d="M168 30 L174 18" /><path d="M178 46 L190 40" /><path d="M24 34 L18 22" />
                </g>
              )}
              {mood === "cheering" && <text className="jy-pop" x="14" y="62" fontSize="22" fill="#ff7fb0">♥</text>}
            </g>
          </g>
          </g>
        </svg>
      </div>
    </div>
  )
}
