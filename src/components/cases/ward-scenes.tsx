"use client"

import { useId, type ReactNode } from "react"

export const SETTINGS: Record<string, { label: string; emoji: string; wall: [string, string]; floor: string; seat: "bed" | "couch" | "table" | "stool" | "cot" }> = {
  emergency: { label: "Emergency Room", emoji: "🚑", wall: ["#fdeaea", "#f7c6c6"], floor: "#d8c3c3", seat: "bed" },
  opd: { label: "OPD Clinic", emoji: "🩺", wall: ["#e8f6f2", "#c6e8df"], floor: "#cbd8d4", seat: "couch" },
  ward: { label: "Medical Ward", emoji: "🛏️", wall: ["#e9f1fc", "#c9dcf5"], floor: "#d1d9e6", seat: "bed" },
  icu: { label: "Intensive Care", emoji: "🫁", wall: ["#e1eaf8", "#b7cbec"], floor: "#c2cce0", seat: "bed" },
  ot: { label: "Operation Theatre", emoji: "🧑‍⚕️", wall: ["#d9f0e5", "#b0dcc7"], floor: "#bfd6ca", seat: "table" },
  labour: { label: "Labour Room", emoji: "🤰", wall: ["#fee8f2", "#f8cbe0"], floor: "#e2cdd8", seat: "bed" },
  community: { label: "Village Health Camp", emoji: "🏘️", wall: ["#bfe4ff", "#fff1cf"], floor: "#8fcb72", seat: "stool" },
  paeds: { label: "Paediatric Ward", emoji: "🧸", wall: ["#fff3cf", "#ffe1a0"], floor: "#ebd8aa", seat: "cot" },
  forensic: { label: "Forensic Lab", emoji: "🔬", wall: ["#e6e9f0", "#c8cfdc"], floor: "#b7bdcb", seat: "table" },
}

const Bed = ({ sheet = "#ffffff" }: { sheet?: string }) => (
  <g>
    <rect x="292" y="96" width="14" height="100" rx="6" fill="#7b8699" />
    <rect x="340" y="108" width="180" height="44" rx="20" fill="#ffffff" />
    <rect x="296" y="176" width="270" height="14" rx="6" fill="#8a94a6" />
    <rect x="304" y="190" width="7" height="24" fill="#5f6a7d" /><rect x="552" y="190" width="7" height="24" fill="#5f6a7d" />
    <circle cx="308" cy="218" r="7" fill="#3b4150" /><circle cx="556" cy="218" r="7" fill="#3b4150" />
    <rect x="296" y="172" width="270" height="10" rx="5" fill="#cfd6e4" />
    <g fill={sheet}><path d="M300 166 q130 -14 262 0 v18 h-262z" /></g>
  </g>
)
const BedFront = ({ sheet = "#ffffff", tint = "#dfe8f7" }: { sheet?: string; tint?: string }) => (
  <g>
    <path d="M298 152 Q430 140 566 152 L566 186 L298 186 Z" fill={sheet} />
    <path d="M298 160 Q430 148 566 160 L566 170 Q430 158 298 170Z" fill={tint} opacity=".8" />
    <path d="M360 150 q4 20 0 36 M440 146 q4 22 0 40 M510 150 q4 20 0 36" stroke="#b9c4d8" strokeWidth="2" fill="none" />
  </g>
)

function Furniture({ kind }: { kind: string }) {
  if (kind === "couch") return (
    <g>
      <rect x="310" y="104" width="22" height="86" rx="8" fill="#6aa89c" />
      <rect x="318" y="172" width="230" height="22" rx="9" fill="#6aa89c" /><rect x="318" y="168" width="230" height="8" rx="4" fill="#f4f8f7" />
      <rect x="338" y="194" width="8" height="26" fill="#5a6577" /><rect x="520" y="194" width="8" height="26" fill="#5a6577" />
    </g>)
  if (kind === "table") return (
    <g>
      <rect x="312" y="176" width="250" height="14" rx="6" fill="#aab4c3" />
      <rect x="418" y="190" width="38" height="30" fill="#8e99ab" /><rect x="388" y="218" width="98" height="8" rx="4" fill="#7a8598" />
    </g>)
  if (kind === "stool") return (
    <g><rect x="380" y="150" width="104" height="14" rx="6" fill="#b5834f" /><rect x="394" y="164" width="9" height="48" fill="#946a3d" /><rect x="462" y="164" width="9" height="48" fill="#946a3d" /></g>)
  if (kind === "cot") return (
    <g>
      <rect x="296" y="176" width="270" height="12" rx="5" fill="#f6b64a" />
      <rect x="304" y="188" width="7" height="30" fill="#d9952a" /><rect x="552" y="188" width="7" height="30" fill="#d9952a" />
      <rect x="338" y="116" width="170" height="34" rx="16" fill="#fff" />
    </g>)
  return <Bed />
}
function Cover({ kind }: { kind: string }) {
  if (kind === "bed") return <BedFront />
  if (kind === "cot") return (
    <g>
      <path d="M300 158 Q430 146 562 158 L562 178 L300 178Z" fill="#9ad0f5" />
      <g stroke="#e49a1c" strokeWidth="4">{Array.from({ length: 14 }).map((_, i) => <line key={i} x1={304 + i * 19.5} y1="110" x2={304 + i * 19.5} y2="178" />)}</g>
      <rect x="298" y="106" width="266" height="6" rx="3" fill="#e49a1c" />
    </g>)
  if (kind === "table") return <path d="M330 160 Q440 150 556 162 L556 178 L330 178Z" fill="#5fae8c" opacity=".92" />
  return null
}

function Backdrop({ id, s }: { id: string; s: string }) {
  switch (s) {
    case "emergency": return (
      <g>
        <g transform="translate(70,38)"><rect width="74" height="74" rx="14" fill="#fff" /><rect x="29" y="14" width="16" height="46" rx="3" fill="#e5484d" /><rect x="14" y="29" width="46" height="16" rx="3" fill="#e5484d" /><rect width="74" height="74" rx="14" fill="none" stroke="#e5484d" strokeWidth="3" className="wr-glow" /></g>
        <rect x="60" y="136" width="130" height="58" rx="8" fill="#e5484d" /><rect x="60" y="136" width="130" height="10" rx="5" fill="#bf2e33" />
        {[0, 1, 2].map((i) => <rect key={i} x="70" y={150 + i * 14} width="110" height="10" rx="3" fill="#fff" opacity=".85" />)}
        <circle cx="75" cy="200" r="7" fill="#333" /><circle cx="175" cy="200" r="7" fill="#333" />
        <rect x="622" y="60" width="4" height="130" fill="#9aa5b8" /><rect x="606" y="60" width="38" height="5" rx="2" fill="#9aa5b8" />
        <rect x="610" y="68" width="30" height="40" rx="10" fill="#d4ecff" stroke="#8fc3ec" /><circle cx="625" cy="112" r="3" fill="#8fc3ec" className="wr-drip" />
        <rect x="672" y="40" width="96" height="64" rx="8" fill="#10151f" /><polyline points="680,76 696,76 702,58 710,92 718,76 740,76 746,66 752,76 762,76" fill="none" stroke="#35e08a" strokeWidth="2.4" className="wr-blink" />
      </g>)
    case "opd": return (
      <g>
        <rect x="62" y="30" width="78" height="96" rx="6" fill="#fff" stroke="#b6c9c4" strokeWidth="3" /><g fill="#2a3b40" fontFamily="sans-serif" fontWeight="800"><text x="101" y="58" fontSize="22" textAnchor="middle">E</text><text x="101" y="80" fontSize="16" textAnchor="middle">F P</text><text x="101" y="98" fontSize="11" textAnchor="middle">T O Z</text><text x="101" y="114" fontSize="8" textAnchor="middle">L P E D</text></g>
        <rect x="170" y="150" width="14" height="44" fill="#a9724a" /><ellipse cx="177" cy="146" rx="26" ry="14" fill="#4fa86d" /><ellipse cx="160" cy="132" rx="18" ry="10" fill="#3e9a5d" /><ellipse cx="196" cy="130" rx="16" ry="10" fill="#57b777" />
        <rect x="596" y="140" width="170" height="14" rx="5" fill="#b98a5b" /><rect x="606" y="154" width="10" height="56" fill="#9a6f46" /><rect x="746" y="154" width="10" height="56" fill="#9a6f46" />
        <rect x="640" y="88" width="84" height="52" rx="6" fill="#222c3c" /><rect x="646" y="94" width="72" height="40" rx="3" fill="#8fd0ff" /><rect x="672" y="140" width="20" height="6" fill="#222c3c" />
        <rect x="610" y="34" width="120" height="58" rx="6" fill="#fff" stroke="#c9b17e" strokeWidth="4" /><text x="670" y="68" fontSize="14" fontWeight="800" textAnchor="middle" fill="#8a6c2e" fontFamily="serif">M.B.B.S.</text>
      </g>)
    case "ward": return (
      <g>
        <g fill="#cfe0f7" stroke="#a8c2e6"><path d="M16 20 h210 v150 h-210z" opacity=".5" /></g>
        {Array.from({ length: 9 }).map((_, i) => <path key={i} d={`M${24 + i * 22} 22 q8 70 0 146`} stroke="#9bb8e3" strokeWidth="3" fill="none" />)}
        <rect x="610" y="30" width="150" height="100" rx="8" fill="#bfe2ff" stroke="#fff" strokeWidth="6" /><circle cx="720" cy="62" r="16" fill="#ffd95a" className="wr-glow" /><path d="M610 130 l50 -34 l40 26 l60 -40 v48z" fill="#8fcf7d" opacity=".8" /><line x1="685" y1="30" x2="685" y2="130" stroke="#fff" strokeWidth="5" />
        <rect x="598" y="150" width="76" height="44" rx="5" fill="#e4d4bd" /><rect x="598" y="150" width="76" height="8" fill="#cdb895" /><rect x="624" y="126" width="6" height="24" fill="#7fb77a" /><circle cx="627" cy="122" r="10" fill="#ff7aa2" /><circle cx="618" cy="128" r="7" fill="#ffb347" />
      </g>)
    case "icu": return (
      <g>
        <rect x="46" y="36" width="170" height="74" rx="8" fill="#0e1422" /><polyline points="56,84 80,84 88,56 98,108 108,84 140,84 150,70 160,84 206,84" fill="none" stroke="#38e8a0" strokeWidth="2.4" className="wr-blink" /><text x="60" y="54" fontSize="11" fill="#6be3ff" fontFamily="monospace">SpO2 94  HR 112</text>
        <rect x="610" y="100" width="100" height="92" rx="10" fill="#e9eef7" stroke="#b6c3da" strokeWidth="3" /><rect x="622" y="112" width="76" height="40" rx="5" fill="#0e1422" /><path d="M630 134 q10 -18 20 0 t20 0" stroke="#6be3ff" strokeWidth="2.5" fill="none" className="wr-blink" /><circle cx="636" cy="170" r="6" fill="#ff7a7a" /><circle cx="658" cy="170" r="6" fill="#ffd95a" />
        <path d="M610 130 Q570 130 570 160 T 510 154" stroke="#7fb4e8" strokeWidth="6" fill="none" strokeLinecap="round" />
        <rect x="726" y="40" width="4" height="150" fill="#9aa5b8" /><rect x="712" y="40" width="30" height="40" rx="9" fill="#ffe9a8" stroke="#e0c066" />
      </g>)
    case "ot": return (
      <g>
        {Array.from({ length: 7 }).map((_, i) => <line key={i} x1={i * 120} y1="0" x2={i * 120} y2="190" stroke="#9fcdb5" strokeWidth="1.5" opacity=".6" />)}
        <g className="wr-glow"><rect x="396" y="0" width="8" height="30" fill="#8a97a8" /><ellipse cx="400" cy="46" rx="88" ry="16" fill="#fdfdfd" stroke="#c7d0dc" strokeWidth="3" /><ellipse cx="400" cy="46" rx="60" ry="9" fill="#fff6b8" /></g>
        <rect x="56" y="140" width="150" height="14" rx="4" fill="#aab4c3" /><rect x="66" y="154" width="8" height="56" fill="#8c97a8" /><rect x="188" y="154" width="8" height="56" fill="#8c97a8" />
        {[0, 1, 2, 3, 4].map((i) => <rect key={i} x={72 + i * 26} y={124} width="6" height="16" rx="2" fill="#dfe6ef" transform={`rotate(${(i - 2) * 9} ${75 + i * 26} 140)`} />)}
        <rect x="620" y="86" width="104" height="104" rx="8" fill="#dde6f0" stroke="#aebbd0" strokeWidth="3" /><rect x="632" y="98" width="80" height="34" rx="4" fill="#0e1422" /><path d="M638 118 q8 -14 16 0 t16 0 t16 0" stroke="#38e8a0" strokeWidth="2.4" fill="none" className="wr-blink" /><circle cx="650" cy="160" r="10" fill="#f0b429" /><circle cx="684" cy="160" r="10" fill="#4ea0f0" />
      </g>)
    case "labour": return (
      <g>
        <circle cx="720" cy="66" r="34" fill="#fff" stroke="#e8a9c4" strokeWidth="5" /><line x1="720" y1="66" x2="720" y2="44" stroke="#8d3c61" strokeWidth="3" strokeLinecap="round" /><line x1="720" y1="66" x2="736" y2="74" stroke="#8d3c61" strokeWidth="3" strokeLinecap="round" />
        <rect x="64" y="130" width="130" height="64" rx="12" fill="#fff" stroke="#e8a9c4" strokeWidth="3" /><rect x="76" y="142" width="106" height="30" rx="14" fill="#ffd9e8" /><circle cx="130" cy="156" r="10" fill="#ffd1a8" /><rect x="64" y="96" width="130" height="8" rx="4" fill="#ffb3cf" /><rect x="100" y="104" width="6" height="26" fill="#d98aa9" /><rect x="152" y="104" width="6" height="26" fill="#d98aa9" />
        <rect x="600" y="150" width="140" height="44" rx="8" fill="#f5d6e3" /><circle cx="632" cy="140" r="12" fill="#ffc2d9" /><circle cx="662" cy="136" r="9" fill="#ffe08a" />
      </g>)
    case "community": return (
      <g>
        <circle cx="710" cy="56" r="30" fill="#ffd54a" className="wr-glow" />
        <path d="M0 150 Q120 70 250 140 T520 130 T800 120 V200 H0Z" fill="#7cc36a" opacity=".85" />
        {[[90, 120], [640, 118]].map(([x, y], i) => <g key={i}><rect x={x} y={y} width="86" height="62" fill="#d9a56b" /><path d={`M${x - 12} ${y} L${x + 43} ${y - 44} L${x + 98} ${y}Z`} fill="#b9852e" /><rect x={x + 32} y={y + 24} width="22" height="38" rx="4" fill="#7a4a24" /></g>)}
        <rect x="290" y="22" width="280" height="40" rx="10" fill="#e5484d" /><text x="430" y="49" fontSize="20" fontWeight="800" textAnchor="middle" fill="#fff" fontFamily="sans-serif">✚ HEALTH CAMP</text><line x1="296" y1="62" x2="296" y2="150" stroke="#8a5a30" strokeWidth="5" /><line x1="564" y1="62" x2="564" y2="150" stroke="#8a5a30" strokeWidth="5" />
        <rect x="236" y="100" width="12" height="60" fill="#8a5a30" /><circle cx="242" cy="90" r="30" fill="#3f9a56" /><circle cx="226" cy="104" r="20" fill="#4fb068" />
      </g>)
    case "paeds": return (
      <g>
        {["#ff6b6b", "#ffb347", "#ffe066", "#7bd88f", "#6bb5ff"].map((c, i) => <path key={i} d={`M${70 + i * 9} 128 a${60 - i * 9} ${60 - i * 9} 0 0 1 ${2 * (60 - i * 9)} 0`} stroke={c} strokeWidth="9" fill="none" />)}
        {[["#ff6b6b", 640], ["#6bb5ff", 680], ["#ffe066", 720]].map(([c, x], i) => <g key={i} className="wr-float" style={{ animationDelay: i * 0.5 + "s" }}><ellipse cx={Number(x)} cy={70 + (i % 2) * 14} rx="17" ry="21" fill={c as string} /><path d={`M${Number(x)} ${92 + (i % 2) * 14} q-6 30 4 62`} stroke="#9aa5b8" fill="none" /></g>)}
        <g transform="translate(90,150)"><circle cx="26" cy="30" r="26" fill="#c68e5a" /><circle cx="10" cy="8" r="10" fill="#c68e5a" /><circle cx="42" cy="8" r="10" fill="#c68e5a" /><circle cx="19" cy="26" r="3" fill="#2a1d12" /><circle cx="33" cy="26" r="3" fill="#2a1d12" /><ellipse cx="26" cy="38" rx="8" ry="6" fill="#e8c29a" /></g>
        <rect x="620" y="160" width="34" height="34" rx="4" fill="#ff6b6b" /><rect x="656" y="160" width="34" height="34" rx="4" fill="#6bb5ff" /><rect x="638" y="126" width="34" height="34" rx="4" fill="#ffe066" /><text x="655" y="150" fontSize="22" fontWeight="800" textAnchor="middle" fill="#8a6a00" fontFamily="sans-serif">A</text>
      </g>)
    case "forensic": return (
      <g>
        <rect x="46" y="30" width="190" height="120" rx="6" fill="#d9dde6" stroke="#9aa5b8" strokeWidth="4" />
        {[[62, 46], [128, 46], [62, 92]].map(([x, y], i) => <rect key={i} x={x} y={y} width="52" height="36" rx="3" fill={["#f4f6fa", "#fff7d6", "#eaf2ff"][i]} transform={`rotate(${(i - 1) * 4} ${x + 26} ${y + 18})`} />)}<path d="M120 100 L160 110 L190 70 L206 124" stroke="#e5484d" strokeWidth="2.5" fill="none" strokeDasharray="5 4" />
        <rect x="602" y="86" width="150" height="8" rx="3" fill="#8e99ab" /><rect x="602" y="124" width="150" height="8" rx="3" fill="#8e99ab" />
        {[0, 1, 2, 3].map((i) => <g key={i}><rect x={612 + i * 36} y={58} width="24" height="28" rx="5" fill={["#8fd6b0", "#f5c96a", "#9cc4f5", "#f09aa0"][i]} opacity=".85" /><rect x={612 + i * 36} y={96} width="24" height="28" rx="5" fill={["#f5c96a", "#9cc4f5", "#f09aa0", "#8fd6b0"][i]} opacity=".85" /></g>)}
        <rect x="660" y="150" width="40" height="44" rx="6" fill="#6f7b90" /><rect x="672" y="130" width="8" height="30" fill="#4f5a6d" /><circle cx="676" cy="126" r="8" fill="#2a3242" />
        <line x1="400" y1="0" x2="400" y2="46" stroke="#7b8699" strokeWidth="3" /><path d="M360 78 Q400 40 440 78Z" fill="#f5e6a6" /><path d="M370 78 L330 190 H470 L430 78Z" fill="#fff6c4" opacity=".16" className="wr-glow" />
      </g>)
    default: return null
  }
}

export function Scene({ setting, children, className, flat }: { setting?: string; children?: ReactNode; className?: string; flat?: boolean }) {
  const key = (setting && SETTINGS[setting]) ? setting : "ward"
  const t = SETTINGS[key]
  const id = "sc" + useId().replace(/[^a-zA-Z0-9]/g, "")
  return (
    <svg viewBox="0 0 800 240" preserveAspectRatio="xMidYMid slice" className={className || "w-full h-full"} role="img" aria-label={t.label}>
      <defs>
        <linearGradient id={id + "w"} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={t.wall[0]} /><stop offset="1" stopColor={t.wall[1]} /></linearGradient>
        <linearGradient id={id + "f"} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={t.floor} /><stop offset="1" stopColor={t.floor} stopOpacity=".7" /></linearGradient>
      </defs>
      <rect width="800" height="240" fill={`url(#${id}w)`} />
      <rect y="196" width="800" height="44" fill={`url(#${id}f)`} />
      <rect y="194" width="800" height="4" fill="#000" opacity=".06" />
      <Backdrop id={id} s={key} />
      {!flat && <Furniture kind={t.seat === "bed" ? "bed" : t.seat} />}
      {children}
      {!flat && <Cover kind={t.seat} />}
    </svg>
  )
}

export const SCENE_CSS = `
@keyframes wr-glow{0%,100%{opacity:.55}50%{opacity:1}}
@keyframes wr-blink{0%,100%{opacity:1}50%{opacity:.35}}
@keyframes wr-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-9px)}}
@keyframes wr-drip{0%{transform:translateY(0);opacity:1}100%{transform:translateY(22px);opacity:0}}
@keyframes wr-breathe{0%,100%{transform:scale(1,1)}50%{transform:scale(1.03,1.05)}}
@keyframes wr-blinkeye{0%,92%,100%{transform:scaleY(1)}96%{transform:scaleY(.1)}}
@keyframes wr-sweat{0%{transform:translateY(0);opacity:0}20%{opacity:1}100%{transform:translateY(16px);opacity:0}}
@keyframes wr-ecg{to{transform:translateX(-360px)}}
@keyframes wr-beat{0%,100%{transform:scale(1)}20%{transform:scale(1.25)}40%{transform:scale(1)}}
@keyframes wr-pop{0%{transform:translateY(10px) scale(.6);opacity:0}30%{opacity:1}100%{transform:translateY(-38px) scale(1.1);opacity:0}}
@keyframes wr-confetti{0%{transform:translateY(-20px) rotate(0);opacity:1}100%{transform:translateY(420px) rotate(540deg);opacity:0}}
@keyframes wr-shake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-5px)}40%,80%{transform:translateX(5px)}}
@keyframes wr-rise{from{transform:translateY(14px);opacity:0}to{transform:none;opacity:1}}
.wr-glow{animation:wr-glow 3.2s ease-in-out infinite}.wr-blink{animation:wr-blink 1.6s ease-in-out infinite}
.wr-float{animation:wr-float 3.6s ease-in-out infinite}.wr-drip{animation:wr-drip 2.2s linear infinite}
.wr-rise{animation:wr-rise .45s ease-out both}.wr-shake{animation:wr-shake .5s}
`
