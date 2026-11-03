import type { Spot } from "./types"
import { applyExtra } from "./extra"
import { EXTRA_HISTOLOGY } from "./extra-histology"
import { HISTOLOGY } from "./data-histology"

export type { Spot, SpotMcq, SpotImage } from "./types"

// Only the histology slides (Anatomy) are built in. Every other subject comes from Admin > Spotters uploads.
const EXTRA = { ...EXTRA_HISTOLOGY }

export const SPOTS: Spot[] = applyExtra([...HISTOLOGY], EXTRA)

export const SPOT_BY_ID: Record<string, Spot> = Object.fromEntries(SPOTS.map((s) => [s.id, s]))

export const KNOWN_GROUPS: string[] = ["Instruments", "Gross specimens", "Pathology slides", "Histology slides"]
export const GROUPS = KNOWN_GROUPS

/** Display-time shuffle so the correct option is not always in the same place. */
export function shuffled<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]] }
  return a
}
