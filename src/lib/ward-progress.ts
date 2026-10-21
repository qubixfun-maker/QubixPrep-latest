// Ward Round progress lives in this browser (localStorage) so it works without any server setup.
export type WardResult = { stars: number; percent: number; at: number }
export type WardProgress = { xp: number; done: Record<string, WardResult> }

const KEY = "qp-ward-progress-v1"

export const RANKS = [
  { name: "Intern", emoji: "🩹", min: 0 },
  { name: "House Surgeon", emoji: "🩺", min: 150 },
  { name: "Resident", emoji: "💉", min: 400 },
  { name: "Senior Resident", emoji: "🧬", min: 800 },
  { name: "Registrar", emoji: "🏥", min: 1400 },
  { name: "Consultant", emoji: "👑", min: 2200 },
]

export function rankFor(xp: number) {
  let i = 0
  RANKS.forEach((r, k) => { if (xp >= r.min) i = k })
  const cur = RANKS[i], next = RANKS[i + 1]
  const pct = next ? Math.round(((xp - cur.min) / (next.min - cur.min)) * 100) : 100
  return { cur, next, pct, toNext: next ? next.min - xp : 0 }
}

export function loadProgress(): WardProgress {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) { const p = JSON.parse(raw); return { xp: Number(p.xp) || 0, done: p.done || {} } }
  } catch {}
  return { xp: 0, done: {} }
}

export function saveResult(caseId: string, stars: number, percent: number, xpGain: number) {
  const p = loadProgress()
  const prev = p.done[caseId]
  // XP is only awarded for improving on a previous run, so replaying can't be farmed.
  const gain = prev ? Math.max(0, xpGain - Math.round((prev.percent / 100) * 100)) : xpGain
  p.xp += gain
  if (!prev || percent >= prev.percent) p.done[caseId] = { stars, percent, at: Date.now() }
  try { localStorage.setItem(KEY, JSON.stringify(p)) } catch {}
  return { gain, progress: p }
}
