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

export const GROUPS: Practical["group"][] = ["Heart & circulation", "Special senses", "Lungs", "Nerve & muscle"]

export const PRACTICALS: Practical[] = [
  { id: "ecg", title: "Recording & Interpretation of ECG", short: "ECG", emoji: "📈", tint: "#e6f0ff", group: "Heart & circulation", desc: "Connect the electrodes, record a 12-lead ECG, then read rate, rhythm and axis.", mins: 12 },
  { id: "ecg-lesson", title: "Understand the ECG", short: "ECG lesson", emoji: "💓", tint: "#fde4de", group: "Heart & circulation", desc: "Animated guide to conduction, rate measuring and axis. Do this before the ECG practical.", mins: 10 },
  { id: "ett", title: "Exercise Tolerance Test", short: "ETT", emoji: "🏃", tint: "#ffe9d6", group: "Heart & circulation", desc: "Screen the patient, run the Bruce protocol on a treadmill and report the response.", mins: 12 },
  { id: "posture", title: "Effect of Posture on BP & Pulse", short: "Posture BP", emoji: "🩺", tint: "#d9f1f8", group: "Heart & circulation", desc: "Mercury sphygmomanometer, Korotkoff sounds, lying, sitting and standing readings.", mins: 12 },
  { id: "cold-pressor", title: "Cold Pressor Test", short: "Cold pressor", emoji: "🧊", tint: "#dcf5ea", group: "Heart & circulation", desc: "Hand in ice water, BP chart over time, classify normo- or hyper-reactor.", mins: 8 },
  { id: "harvard-step", title: "Harvard Step Test", short: "Harvard step", emoji: "🪜", tint: "#fff1c9", group: "Heart & circulation", desc: "Five minutes of stepping, three recovery pulse counts, fitness index.", mins: 8 },
  { id: "visual-acuity", title: "Visual Acuity", short: "Visual acuity", emoji: "👁️", tint: "#efe6ff", group: "Special senses", desc: "Snellen chart for each eye, then a pinhole to tell refractive from organic loss.", mins: 8 },
  { id: "colour-vision", title: "Colour Vision (Ishihara)", short: "Colour vision", emoji: "🎨", tint: "#ffe3ee", group: "Special senses", desc: "Show the plates, mark the answers, and decide if there is a red-green defect.", mins: 6 },
  { id: "perimetry", title: "Perimetry", short: "Perimetry", emoji: "🎯", tint: "#e4efda", group: "Special senses", desc: "Plot the visual field of each eye and spot hemianopia or constriction.", mins: 10 },
  { id: "auditory", title: "Auditory Tests: Rinne & Weber", short: "Rinne & Weber", emoji: "👂", tint: "#fde8e0", group: "Special senses", desc: "512 Hz tuning fork: separate conductive from sensorineural deafness.", mins: 6 },
  { id: "spirometry", title: "Spirometry & Lung Volumes", short: "Spirometry", emoji: "🫁", tint: "#e8f0dc", group: "Lungs", desc: "Record a spirogram, read volumes, then FVC, FEV1 and the pattern.", mins: 10 },
  { id: "reaction-time", title: "Reaction Time", short: "Reaction time", emoji: "⚡", tint: "#f0e3ff", group: "Nerve & muscle", desc: "Visual, auditory and choice reaction times, with a marked report.", mins: 6 },
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
