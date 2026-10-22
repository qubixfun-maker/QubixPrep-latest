import type { Spot } from "./types"
import { applyExtra } from "./extra"
import { EXTRA_SURGERY } from "./extra-surgery"
import { EXTRA_OBG } from "./extra-obg"
import { EXTRA_OPHTHAL } from "./extra-ophthal"
import { EXTRA_SPECIMENS } from "./extra-specimens"
import { EXTRA_PATHOLOGY } from "./extra-pathology"
import { EXTRA_HISTOLOGY } from "./extra-histology"
import { HISTOLOGY } from "./data-histology"
import { PATHOLOGY_SLIDES } from "./data-pathology-slides"
import { SPECIMENS } from "./data-specimens"
import { OPHTHAL } from "./data-ophthal"
import { SURGERY } from "./data-surgery"
import { OBG_INSTRUMENTS } from "./data-obg-instruments"

export type { Spot, SpotMcq, SpotImage } from "./types"

const EXTRA = { ...EXTRA_SURGERY, ...EXTRA_OBG, ...EXTRA_OPHTHAL, ...EXTRA_SPECIMENS, ...EXTRA_PATHOLOGY, ...EXTRA_HISTOLOGY }

export const SPOTS: Spot[] = applyExtra([...SURGERY, ...OBG_INSTRUMENTS, ...OPHTHAL, ...SPECIMENS, ...PATHOLOGY_SLIDES, ...HISTOLOGY], EXTRA)

export const SPOT_BY_ID: Record<string, Spot> = Object.fromEntries(SPOTS.map((s) => [s.id, s]))

export const KNOWN_GROUPS: string[] = ["Instruments", "Gross specimens", "Pathology slides", "Histology slides"]
export const GROUPS = KNOWN_GROUPS

/** Display-time shuffle so the correct option is not always in the same place. */
export function shuffled<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]] }
  return a
}
