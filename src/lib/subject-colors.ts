// Fixed accent color per subject for Long Answers (and reusable elsewhere).
// Uses fully-literal Tailwind class names (not template-constructed) so Tailwind's
// JIT scanner picks them up at build time.

export type SubjectColor = {
  bg: string        // soft background tint (card wash)
  bgSolid: string   // stronger solid tint (icon block)
  text: string      // accent text color
  border: string    // soft border tint
  glow: string       // radial glow background
}

const PALETTE: SubjectColor[] = [
  { bg: "bg-violet-500/10", bgSolid: "bg-violet-500/25", text: "text-violet-400", border: "border-violet-500/40", glow: "bg-violet-500" },
  { bg: "bg-amber-500/10", bgSolid: "bg-amber-500/25", text: "text-amber-400", border: "border-amber-500/40", glow: "bg-amber-500" },
  { bg: "bg-rose-500/10", bgSolid: "bg-rose-500/25", text: "text-rose-400", border: "border-rose-500/40", glow: "bg-rose-500" },
  { bg: "bg-pink-500/10", bgSolid: "bg-pink-500/25", text: "text-pink-400", border: "border-pink-500/40", glow: "bg-pink-500" },
  { bg: "bg-sky-500/10", bgSolid: "bg-sky-500/25", text: "text-sky-400", border: "border-sky-500/40", glow: "bg-sky-500" },
  { bg: "bg-emerald-500/10", bgSolid: "bg-emerald-500/25", text: "text-emerald-400", border: "border-emerald-500/40", glow: "bg-emerald-500" },
  { bg: "bg-orange-500/10", bgSolid: "bg-orange-500/25", text: "text-orange-400", border: "border-orange-500/40", glow: "bg-orange-500" },
  { bg: "bg-teal-500/10", bgSolid: "bg-teal-500/25", text: "text-teal-400", border: "border-teal-500/40", glow: "bg-teal-500" },
  { bg: "bg-fuchsia-500/10", bgSolid: "bg-fuchsia-500/25", text: "text-fuchsia-400", border: "border-fuchsia-500/40", glow: "bg-fuchsia-500" },
  { bg: "bg-indigo-500/10", bgSolid: "bg-indigo-500/25", text: "text-indigo-400", border: "border-indigo-500/40", glow: "bg-indigo-500" },
  { bg: "bg-lime-500/10", bgSolid: "bg-lime-500/25", text: "text-lime-400", border: "border-lime-500/40", glow: "bg-lime-500" },
  { bg: "bg-cyan-500/10", bgSolid: "bg-cyan-500/25", text: "text-cyan-400", border: "border-cyan-500/40", glow: "bg-cyan-500" },
]

const FIXED: Record<string, SubjectColor> = {
  "Anatomy": PALETTE[0],
  "Community Medicine": PALETTE[1],
  "Pathology": PALETTE[2],
  "Forensic Medicine": PALETTE[3],
}

function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

export function getSubjectColor(subjectName: string): SubjectColor {
  if (FIXED[subjectName]) return FIXED[subjectName]
  return PALETTE[hashString(subjectName) % PALETTE.length]
}
