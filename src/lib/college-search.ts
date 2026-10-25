import { COLLEGES } from "./colleges"

export type CollegeHit = { name: string; city: string; state: string; label: string }

const STOP = new Set(["and", "of", "the", "for", "&"])
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim()

type Row = { name: string; city: string; state: string; label: string; hay: string; initials: string; nameN: string }

const ROWS: Row[] = COLLEGES.map(([name, city, state]) => {
  const words = norm(name).split(" ").filter((w) => w && !STOP.has(w))
  const initials = words.map((w) => w[0]).join("")
  return { name, city, state, label: `${name}, ${city}`, hay: norm(`${name} ${city} ${state}`), initials, nameN: norm(name) }
})

/** Finds colleges for what the student typed. Understands short forms like "gmc", "aiims", "kmc". */
export function searchColleges(query: string, limit = 40): CollegeHit[] {
  const q = norm(query)
  if (q.length < 2) return []
  const tokens = q.split(" ")
  const scored: { r: Row; s: number }[] = []
  for (const r of ROWS) {
    let ok = true
    let s = 0
    for (const t of tokens) {
      if (r.hay.includes(t)) s += r.nameN.startsWith(t) ? 3 : 1
      else if (t.length >= 2 && r.initials.includes(t)) s += 2
      else { ok = false; break }
    }
    if (!ok) continue
    if (r.nameN.startsWith(q)) s += 5
    if (r.initials.startsWith(q.replace(/ /g, ""))) s += 4
    scored.push({ r, s })
  }
  scored.sort((a, b) => b.s - a.s || a.r.name.localeCompare(b.r.name))
  return scored.slice(0, limit).map(({ r }) => ({ name: r.name, city: r.city, state: r.state, label: r.label }))
}
