export type Practical = {
  id: string
  title: string
  short: string
  emoji: string
  tint: string
  group: "Heart & circulation" | "Special senses" | "Lungs" | "Nerve & muscle"
  desc: string
  mins: number
}

export const GROUPS: Practical["group"][] = ["Heart & circulation"]

export const PRACTICALS: Practical[] = [
  { id: "ecg", title: "Recording & Interpretation of ECG", short: "ECG", emoji: "📈", tint: "#e6f0ff", group: "Heart & circulation", desc: "Connect the electrodes, record a 12-lead ECG, then read rate, rhythm and axis.", mins: 12 },
]

export const byId = (id: string) => PRACTICALS.find((p) => p.id === id)

// best score per practical, kept on this device
const KEY = "qp-physiology-best"
export type Best = Record<string, { tot: number; max: number; tries: number }>
export function loadBest(): Best {
  try { return JSON.parse(localStorage.getItem(KEY) || "{}") } catch { return {} }
}
export function saveScore(id: string, tot: number, max: number) {
  try {
    const b = loadBest()
    const old = b[id]
    const better = !old || tot / max > old.tot / old.max
    b[id] = { tot: better ? tot : old.tot, max: better ? max : old.max, tries: (old?.tries || 0) + 1 }
    localStorage.setItem(KEY, JSON.stringify(b))
  } catch {}
}
