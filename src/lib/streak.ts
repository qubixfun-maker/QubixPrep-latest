import { dayKey } from "@/lib/study"

type Days = Record<string, { q?: number; f?: number }> | undefined

const active = (days: Days, k: string) => { const x = (days || {})[k]; return !!x && ((x.q || 0) + (x.f || 0)) > 0 }

/** Consecutive study days ending today (or yesterday, if today is not done yet). */
export function streakOf(days: Days) {
  let n = 0
  const d = new Date()
  if (!active(days, dayKey(d))) d.setDate(d.getDate() - 1)
  while (active(days, dayKey(d))) { n++; d.setDate(d.getDate() - 1) }
  return n
}

export const doneToday = (days: Days) => active(days, dayKey())
