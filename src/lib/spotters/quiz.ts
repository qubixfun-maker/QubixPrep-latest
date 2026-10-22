import { SPOTS, shuffled, type Spot } from "./index"

export type SpotQ = {
  spot: Spot
  kind: "image" | "text"
  prompt: string
  options: string[]
  correct: number
  why: string
  /** A text-only version of the question, for the Daily Review (which cannot show the photo). */
  srsQuestion: string
}

const SINGULAR: Record<string, string> = { Instruments: "instrument", "Gross specimens": "specimen", "Pathology slides": "slide", "Histology slides": "slide" }
export const singular = (g: string) => SINGULAR[g] || "item"

/** "Name this ..." question that uses the photo. Wrong options come from similar items. */
export function nameQuestion(spot: Spot, pool: Spot[], all: Spot[] = SPOTS): SpotQ {
  const cand = (list: Spot[]) => list.filter((s) => s.id !== spot.id && s.name !== spot.name)
  const sameSubject = cand(pool.filter((s) => s.group === spot.group && s.subject === spot.subject))
  const sameGroup = cand(pool.filter((s) => s.group === spot.group))
  const any = cand(all.filter((s) => s.group === spot.group))
  const wrong: string[] = []
  for (const list of [shuffled(sameSubject), shuffled(sameGroup), shuffled(any)]) {
    for (const s of list) { if (wrong.length < 3 && !wrong.includes(s.name)) wrong.push(s.name) }
    if (wrong.length >= 3) break
  }
  const options = shuffled([spot.name, ...wrong])
  const what = singular(spot.group)
  return {
    spot, kind: "image", prompt: `Identify this ${what}.`, options, correct: options.indexOf(spot.name),
    why: `${spot.name}. ${spot.identify.slice(0, 3).join(". ")}.`,
    srsQuestion: `Spotter: ${spot.identify.slice(0, 2).join("; ")}. Name this ${what}.`,
  }
}

/** One of the item's written MCQs, with the options shuffled. */
export function textQuestion(spot: Spot): SpotQ {
  const m = spot.mcq[Math.floor(Math.random() * spot.mcq.length)]
  const options = shuffled([m[1], m[2], m[3], m[4]])
  return { spot, kind: "text", prompt: m[0], options, correct: options.indexOf(m[1]), why: m[5], srsQuestion: m[0] }
}

/** Photo questions for photos that do not carry their own label, written MCQs for the rest. */
export function buildQuestions(pool: Spot[], count: number, all: Spot[] = SPOTS): SpotQ[] {
  const out: SpotQ[] = []
  for (const s of shuffled(pool)) {
    if (out.length >= count) break
    const wantText = s.labelled || !s.imgs.length
    if (wantText && s.mcq.length) out.push(textQuestion(s))
    else if (s.imgs.length) out.push(nameQuestion(s, pool, all))
  }
  return out
}
