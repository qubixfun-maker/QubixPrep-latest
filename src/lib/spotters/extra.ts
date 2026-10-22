import type { Spot, SpotMcq } from "./types"

/** Extra detail layered on top of the base items: the long description replaces the short one; the lists are added to. */
export type Extra = { about?: string; identify?: string[]; points?: string[]; viva?: string[]; mcq?: SpotMcq[] }

const uniq = (a: string[]) => Array.from(new Set(a))

export function applyExtra(base: Spot[], extra: Record<string, Extra>): Spot[] {
  return base.map((s) => {
    const x = extra[s.id]
    if (!x) return s
    const seen = new Set(s.mcq.map((m) => m[0]))
    return {
      ...s,
      about: x.about || s.about,
      identify: x.identify?.length ? uniq([...s.identify, ...x.identify]) : s.identify,
      points: uniq([...s.points, ...(x.points || [])]),
      viva: uniq([...s.viva, ...(x.viva || [])]),
      mcq: [...s.mcq, ...(x.mcq || []).filter((m) => !seen.has(m[0]))],
    }
  })
}
