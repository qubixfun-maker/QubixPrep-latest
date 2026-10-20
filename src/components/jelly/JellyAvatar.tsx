"use client"

import { useId } from "react"

export type Mood = "idle" | "happy" | "cheering" | "oops" | "sad" | "thinking" | "explaining" | "listening" | "sleep"

const INK = "#1b1850"
const LX = 70
const RX = 134
const EY = 82

const HEAD = "M10 106 C8 46 50 8 102 8 C154 8 196 46 194 106 C193 122 184 130 170 126 C160 134 146 136 136 128 C124 136 112 130 102 132 C92 130 80 136 68 128 C58 136 44 134 34 126 C20 130 11 122 10 106 Z"
const BODY = "M70 116 C64 146 62 172 68 196 C74 222 98 238 122 230 C146 222 138 204 140 184 C142 162 140 140 136 116 Z"

/** Jelly: a glossy blue-lavender jelly ghost with a wide dome head, big shiny eyes and a white doctor's coat. */
export function JellyAvatar({ mood = "idle", size = 80, talking = false, className = "", doctor = true }: { mood?: Mood; size?: number; talking?: boolean; className?: string; doctor?: boolean }) {
  const id = useId().replace(/:/g, "")
  const arcEyes = mood === "happy" || mood === "cheering"
  const sleepy = mood === "sleep"
  const worried = mood === "oops" || mood === "sad"
  const thinking = mood === "thinking"
  const px = thinking ? 6 : 0
  const py = thinking ? -5 : 0

  const eye = (cx: number) =>
    arcEyes ? <path d={`M${cx - 15} ${EY + 7} Q${cx} ${EY - 20} ${cx + 15} ${EY + 7}`} stroke={INK} strokeWidth="6.5" strokeLinecap="round" fill="none" />
    : sleepy ? <path d={`M${cx - 13} ${EY} Q${cx} ${EY + 11} ${cx + 13} ${EY}`} stroke={INK} strokeWidth="5" strokeLinecap="round" fill="none" />
    : (
      <g>
        <ellipse cx={cx + px} cy={EY + py} rx="18.5" ry="22.5" fill={INK} />
        <ellipse cx={cx + px} cy={EY + py + 10} rx="10" ry="8" fill="#5a4de0" opacity=".45" />
        <circle cx={cx + px + 6} cy={EY + py - 8} r="8" fill="#fff" />
        <circle cx={cx + px - 6} cy={EY + py + 9} r="3" fill="#fff" opacity=".9" />
        <circle cx={cx + px + 9} cy={EY + py + 5} r="1.6" fill="#fff" opacity=".8" />
      </g>
    )

  const openMouth = mood === "happy" || mood === "cheering" || mood === "explaining" || mood === "idle" || talking
  const mouth = openMouth ? (
    <g className={talking ? "jy-talk" : ""}>
      <path d="M88 97 Q102 132 116 97 Q102 104 88 97 Z" fill="#7d2a62" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
      <ellipse cx="102" cy="114" rx="8" ry="4.8" fill="#ff90c0" />
    </g>
  ) : mood === "sad" ? <path d="M92 114 Q102 100 112 114" stroke={INK} strokeWidth="4" strokeLinecap="round" fill="none" />
  : mood === "oops" ? <path d="M91 112 Q96.5 104 102 111 Q107.5 118 113 109" stroke={INK} strokeWidth="3.8" strokeLinecap="round" fill="none" />
  : thinking ? <ellipse cx="112" cy="110" rx="5" ry="4.5" fill={INK} />
  : <path d="M96 110 L108 110" stroke={INK} strokeWidth="3.8" strokeLinecap="round" />

  const brow = (x1: number, x2: number, flip: boolean, lift = 0, tilt = 0) => {
    const y = EY - 31 - lift
    const a = flip ? tilt : -tilt
    return <path d={`M${x1} ${y + 3 + a} Q${(x1 + x2) / 2} ${y - 8} ${x2} ${y + 3 - a}`} stroke={INK} strokeWidth="4" strokeLinecap="round" fill="none" />
  }

  return (
    <svg viewBox="-8 -10 220 258" width={size} height={size} className={`jy-float ${className}`} role="img" aria-label={`Jelly is ${mood}`} style={{ overflow: "visible" }}>
      <style>{`
        @keyframes jyFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}
        @keyframes jyBlink{0%,92%,100%{transform:scaleY(1)}95%{transform:scaleY(.1)}}
        @keyframes jyWave{0%,100%{transform:rotate(0)}50%{transform:rotate(-22deg)}}
        @keyframes jyTalk{0%,100%{transform:scaleY(1)}50%{transform:scaleY(.5)}}
        @keyframes jyPop{0%,100%{opacity:.25;transform:scale(.8)}50%{opacity:1;transform:scale(1.1)}}
        @keyframes jyTail{0%,100%{transform:rotate(-3deg)}50%{transform:rotate(4deg)}}
        .jy-float{animation:jyFloat 3.6s ease-in-out infinite}
        .jy-blink{animation:jyBlink 5s infinite;transform-box:fill-box;transform-origin:center}
        .jy-wave{animation:jyWave .7s ease-in-out infinite;transform-box:fill-box;transform-origin:bottom right}
        .jy-talk{animation:jyTalk .32s ease-in-out infinite;transform-box:fill-box;transform-origin:center top}
        .jy-pop{animation:jyPop 1s ease-in-out infinite;transform-box:fill-box;transform-origin:center}
        .jy-tail{animation:jyTail 3s ease-in-out infinite;transform-box:fill-box;transform-origin:top center}
        @media (prefers-reduced-motion: reduce){.jy-float,.jy-blink,.jy-wave,.jy-talk,.jy-pop,.jy-tail{animation:none}}
      `}</style>
      <defs>
        <linearGradient id={`b${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#d7e6ff" />
          <stop offset=".5" stopColor="#a8bcff" />
          <stop offset="1" stopColor="#c7b0ff" />
        </linearGradient>
        <linearGradient id={`t${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#b9ceff" />
          <stop offset="1" stopColor="#c9aaff" />
        </linearGradient>
        <clipPath id={`k${id}`}><path d={HEAD} /></clipPath>
        <radialGradient id={`g${id}`} cx=".3" cy=".25" r=".6">
          <stop offset="0" stopColor="#fff" stopOpacity=".95" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`c${id}`} cx=".5" cy=".5" r=".5">
          <stop offset="0" stopColor="#ff7fb8" stopOpacity=".8" />
          <stop offset="1" stopColor="#ff7fb8" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`m${id}`} cx=".35" cy=".3" r=".8">
          <stop offset="0" stopColor="#fff" />
          <stop offset="1" stopColor="#a9b3c6" />
        </radialGradient>
      </defs>

      <ellipse cx="108" cy="240" rx="52" ry="6" fill="#8b7dff" opacity=".2" />

      {/* tail and body */}
      <g className="jy-tail">
        <path d={BODY} fill={`url(#t${id})`} stroke="#e8edff" strokeWidth="3" />
        <ellipse cx="104" cy="214" rx="22" ry="12" fill="#fff" opacity=".22" />
      </g>

      {/* left arm (waves) */}
      <g className={mood === "cheering" || mood === "happy" ? "jy-wave" : ""}>
        {doctor && <ellipse cx="62" cy="152" rx="24" ry="12.5" fill="#fff" stroke="#d9e1ff" strokeWidth="2.5" transform="rotate(-38 62 152)" />}
        <ellipse cx="40" cy="132" rx="16" ry="15" fill={`url(#b${id})`} stroke="#e8edff" strokeWidth="2.5" />
      </g>
      {/* right arm */}
      <g className={mood === "cheering" ? "jy-wave" : ""}>
        {doctor && <ellipse cx="146" cy="166" rx="22" ry="12" fill="#fff" stroke="#d9e1ff" strokeWidth="2.5" transform="rotate(32 146 166)" />}
        <ellipse cx="164" cy="182" rx="15" ry="14" fill={`url(#b${id})`} stroke="#e8edff" strokeWidth="2.5" />
      </g>

      {/* white coat and stethoscope */}
      {doctor && (
        <g>
          <path d="M62 122 L100 136 L98 198 Q78 208 52 196 Q60 160 62 122 Z" fill="#fff" stroke="#d9e1ff" strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M144 122 L106 136 L108 198 Q130 208 156 196 Q148 160 144 122 Z" fill="#fff" stroke="#d9e1ff" strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M78 124 L100 138 L90 154 Z" fill="#f3f6ff" stroke="#d9e1ff" strokeWidth="2.2" strokeLinejoin="round" />
          <path d="M128 124 L106 138 L116 154 Z" fill="#f3f6ff" stroke="#d9e1ff" strokeWidth="2.2" strokeLinejoin="round" />
          <rect x="62" y="170" width="22" height="15" rx="4" fill="#f3f6ff" stroke="#d9e1ff" strokeWidth="2" />
          <path d="M70 170 L70 163 M76 170 L76 165" stroke="#ff7fb0" strokeWidth="2.6" strokeLinecap="round" />
          {/* big friendly stethoscope */}
          <path d="M84 126 C64 166 92 196 112 184" stroke="#1f6f80" strokeWidth="8.5" strokeLinecap="round" fill="none" />
          <path d="M124 126 C146 164 130 190 112 184" stroke="#1f6f80" strokeWidth="8.5" strokeLinecap="round" fill="none" />
          <path d="M84 126 C64 166 92 196 112 184" stroke="#4fc3d6" strokeWidth="5" strokeLinecap="round" fill="none" />
          <path d="M124 126 C146 164 130 190 112 184" stroke="#4fc3d6" strokeWidth="5" strokeLinecap="round" fill="none" />
          <path d="M80 140 C72 158 78 172 88 182" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" fill="none" opacity=".7" />
          <circle cx="84" cy="125" r="5.5" fill="#1f6f80" />
          <circle cx="124" cy="125" r="5.5" fill="#1f6f80" />
          <circle cx="84" cy="125" r="2.4" fill="#bfeff6" />
          <circle cx="124" cy="125" r="2.4" fill="#bfeff6" />
          <circle cx="112" cy="190" r="13.5" fill="#1f6f80" />
          <circle cx="112" cy="190" r="10.5" fill={`url(#m${id})`} />
          <path d="M112 196 C104 190 105 184 109 184 C111 184 112 185.5 112 186.5 C112 185.5 113 184 115 184 C119 184 120 190 112 196 Z" fill="#ff7fa8" />
        </g>
      )}

      {mood === "listening" && <path d="M14 84 C14 8 190 8 190 84" stroke={INK} strokeWidth="9" fill="none" strokeLinecap="round" />}

      {/* dome head */}
      <path d={HEAD} fill={`url(#b${id})`} stroke="#e8edff" strokeWidth="3" />
      <g clipPath={`url(#k${id})`}>
        <ellipse cx="66" cy="42" rx="48" ry="26" fill={`url(#g${id})`} />
      </g>
      <path d="M30 56 Q38 28 78 18" stroke="#fff" strokeWidth="6" strokeLinecap="round" fill="none" opacity=".75" />
      <path d="M150 116 Q176 112 186 94" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" fill="none" opacity=".4" />

      {mood === "listening" && (
        <>
          <rect x="2" y="62" width="20" height="44" rx="9" fill={INK} />
          <rect x="182" y="62" width="20" height="44" rx="9" fill={INK} />
        </>
      )}

      {/* rosy cheeks */}
      <ellipse cx="40" cy="104" rx="20" ry="12" fill={`url(#c${id})`} />
      <ellipse cx="164" cy="104" rx="20" ry="12" fill={`url(#c${id})`} />

      {/* brows */}
      {!arcEyes && !sleepy && (
        worried ? <g>{brow(LX - 16, LX + 16, false, 0, -7)}{brow(RX - 16, RX + 16, true, 0, -7)}</g>
        : thinking ? <g>{brow(LX - 16, LX + 16, false, -1)}{brow(RX - 16, RX + 16, true, 7)}</g>
        : <g>{brow(LX - 16, LX + 16, false, 0)}{brow(RX - 16, RX + 16, true, 0)}</g>
      )}

      {/* eyes */}
      <g className={arcEyes || sleepy ? "" : "jy-blink"}>
        {eye(LX)}
        {eye(RX)}
      </g>

      {mood === "explaining" && (
        <g stroke={INK} strokeWidth="3.4" fill="none">
          <circle cx={LX} cy={EY} r="25" />
          <circle cx={RX} cy={EY} r="25" />
          <path d="M95 80 Q102 74 109 80" />
        </g>
      )}

      {mouth}

      {thinking && <text x="172" y="30" fontSize="40" fontWeight="800" fill="#6d5efc" className="jy-pop">?</text>}
      {(mood === "cheering" || mood === "happy") && (
        <g stroke="#8ea2ff" strokeWidth="6" strokeLinecap="round" className="jy-pop">
          <path d="M170 8 L176 -4" />
          <path d="M184 22 L198 14" />
        </g>
      )}
      {mood === "cheering" && <text x="-4" y="30" fontSize="30" className="jy-pop" fill="#ff7fb0">♥</text>}
      {mood === "sleep" && <text x="168" y="24" fontSize="30" fontWeight="700" fill="#8b7dff" className="jy-pop">z</text>}
    </svg>
  )
}
