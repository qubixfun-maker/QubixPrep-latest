"use client"

import { useId } from "react"

export type Mood = "idle" | "happy" | "cheering" | "oops" | "sad" | "thinking" | "explaining" | "listening" | "sleep"

const INK = "#1d1b4b"

/** Jelly: a glowing blue-lavender jelly ghost. The face changes with the mood. */
export function JellyAvatar({ mood = "idle", size = 80, talking = false, className = "" }: { mood?: Mood; size?: number; talking?: boolean; className?: string }) {
  const id = useId().replace(/:/g, "")
  const arcEyes = mood === "happy" || mood === "cheering"
  const sleepy = mood === "sleep"
  const worried = mood === "oops" || mood === "sad"
  const thinking = mood === "thinking"
  const px = thinking ? 5 : 0
  const py = thinking ? -5 : 0

  const eye = (cx: number) =>
    arcEyes ? <path d={`M${cx - 10} 106 Q${cx} 88 ${cx + 10} 106`} stroke={INK} strokeWidth="5" strokeLinecap="round" fill="none" />
    : sleepy ? <path d={`M${cx - 9} 100 Q${cx} 108 ${cx + 9} 100`} stroke={INK} strokeWidth="4" strokeLinecap="round" fill="none" />
    : (
      <g>
        <ellipse cx={cx + px} cy={100 + py} rx="9" ry="11.5" fill={INK} />
        <circle cx={cx + px + 3} cy={95 + py} r="3.4" fill="#fff" />
        <circle cx={cx + px - 3} cy={105 + py} r="1.6" fill="#fff" opacity=".8" />
      </g>
    )

  const openMouth = mood === "happy" || mood === "cheering" || mood === "explaining" || talking
  const mouth = openMouth ? (
    <g className={talking ? "jy-talk" : ""}>
      <path d="M88 122 Q102 148 116 122 Z" fill="#7a2a5a" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
      <ellipse cx="102" cy="132" rx="6" ry="3.5" fill="#f07db0" />
    </g>
  ) : mood === "sad" ? <path d="M90 136 Q102 124 114 136" stroke={INK} strokeWidth="4" strokeLinecap="round" fill="none" />
  : mood === "oops" ? <path d="M91 134 Q96.5 128 102 133 Q107.5 138 113 132" stroke={INK} strokeWidth="3.5" strokeLinecap="round" fill="none" />
  : thinking ? <ellipse cx="108" cy="133" rx="5" ry="4" fill={INK} />
  : sleepy ? <path d="M96 132 L108 132" stroke={INK} strokeWidth="3.5" strokeLinecap="round" />
  : <path d="M90 127 Q102 139 114 127" stroke={INK} strokeWidth="4" strokeLinecap="round" fill="none" />

  return (
    <svg viewBox="0 0 205 215" width={size} height={size} className={`jy-float ${className}`} role="img" aria-label={`Jelly is ${mood}`} style={{ overflow: "visible" }}>
      <style>{`
        @keyframes jyFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
        @keyframes jyBlink{0%,92%,100%{transform:scaleY(1)}95%{transform:scaleY(.1)}}
        @keyframes jyWave{0%,100%{transform:rotate(0)}50%{transform:rotate(-24deg)}}
        @keyframes jyTalk{0%,100%{transform:scaleY(1)}50%{transform:scaleY(.45)}}
        @keyframes jyPop{0%,100%{opacity:.25;transform:scale(.8)}50%{opacity:1;transform:scale(1.1)}}
        .jy-float{animation:jyFloat 3.6s ease-in-out infinite}
        .jy-blink{animation:jyBlink 5s infinite;transform-box:fill-box;transform-origin:center}
        .jy-wave{animation:jyWave .7s ease-in-out infinite;transform-box:fill-box;transform-origin:bottom center}
        .jy-talk{animation:jyTalk .32s ease-in-out infinite;transform-box:fill-box;transform-origin:center}
        .jy-pop{animation:jyPop 1s ease-in-out infinite;transform-box:fill-box;transform-origin:center}
        @media (prefers-reduced-motion: reduce){.jy-float,.jy-blink,.jy-wave,.jy-talk,.jy-pop{animation:none}}
      `}</style>
      <defs>
        <linearGradient id={`b${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#c9d6ff" />
          <stop offset=".55" stopColor="#97aaff" />
          <stop offset="1" stopColor="#c3b3ff" />
        </linearGradient>
        <radialGradient id={`g${id}`} cx=".3" cy=".25" r=".6">
          <stop offset="0" stopColor="#fff" stopOpacity=".9" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
      </defs>

      <ellipse cx="102" cy="206" rx="46" ry="6" fill="#8b7dff" opacity=".18" />

      {mood === "listening" && <path d="M38 92 Q40 22 102 20 Q164 22 166 92" stroke={INK} strokeWidth="8" fill="none" strokeLinecap="round" />}

      {/* hands */}
      <ellipse cx="30" cy="150" rx="14" ry="12" fill={`url(#b${id})`} className={mood === "cheering" || mood === "happy" ? "jy-wave" : ""} />
      <ellipse cx="176" cy="150" rx="14" ry="12" fill={`url(#b${id})`} className={mood === "cheering" ? "jy-wave" : ""} />

      {/* body */}
      <path d="M30 110 C30 50 68 14 103 14 C140 14 176 50 176 110 C176 140 171 166 160 186 C150 206 130 200 120 190 C110 206 95 206 85 192 C72 206 52 200 45 183 C34 162 30 138 30 110 Z"
        fill={`url(#b${id})`} stroke="#e4eaff" strokeWidth="3" />
      <ellipse cx="78" cy="52" rx="38" ry="26" fill={`url(#g${id})`} />
      <path d="M52 40 Q68 24 92 22" stroke="#fff" strokeWidth="5" strokeLinecap="round" fill="none" opacity=".7" />

      {mood === "listening" && (
        <>
          <rect x="24" y="86" width="18" height="36" rx="8" fill={INK} />
          <rect x="164" y="86" width="18" height="36" rx="8" fill={INK} />
        </>
      )}

      {/* cheeks */}
      <ellipse cx="58" cy="120" rx="12" ry="7" fill="#ff9ec8" opacity=".5" />
      <ellipse cx="148" cy="120" rx="12" ry="7" fill="#ff9ec8" opacity=".5" />

      {/* brows */}
      {worried && (
        <g stroke={INK} strokeWidth="3.5" strokeLinecap="round" fill="none">
          <path d="M62 84 L88 76" />
          <path d="M118 76 L144 84" />
        </g>
      )}
      {thinking && <path d="M118 76 Q130 69 144 77" stroke={INK} strokeWidth="3.5" strokeLinecap="round" fill="none" />}

      {/* eyes */}
      <g className={arcEyes || sleepy ? "" : "jy-blink"}>
        {eye(76)}
        {eye(128)}
      </g>

      {mood === "explaining" && (
        <g stroke={INK} strokeWidth="3" fill="none">
          <circle cx="76" cy="100" r="17" />
          <circle cx="128" cy="100" r="17" />
          <path d="M93 98 Q102 93 111 98" />
        </g>
      )}

      {mouth}

      {thinking && <text x="160" y="46" fontSize="38" fontWeight="800" fill="#6d5efc" className="jy-pop">?</text>}
      {(mood === "cheering" || mood === "happy") && (
        <g stroke="#ffd34d" strokeWidth="5" strokeLinecap="round" className="jy-pop">
          <path d="M160 24 L168 12" />
          <path d="M172 34 L186 28" />
          <path d="M150 14 L152 2" />
        </g>
      )}
      {mood === "sleep" && <text x="150" y="40" fontSize="28" fontWeight="700" fill="#8b7dff" className="jy-pop">z</text>}
    </svg>
  )
}
