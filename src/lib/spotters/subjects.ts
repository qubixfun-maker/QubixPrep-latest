import type { Spot } from "./types"

/** Subjects in the order students expect to see them. Any other subject is added after these. */
export const SUBJECT_ORDER = ["Anatomy", "Pathology", "Medicine", "Surgery", "Obstetrics & Gynaecology", "Paediatrics", "Ophthalmology"]
const GROUP_ORDER = ["Instruments", "Clinical signs", "Gross specimens", "Pathology slides", "Histology slides", "X-rays", "Imaging", "Laboratory", "Drugs", "Drugs and nutrition", "Vaccines", "Contraceptives", "Sutures and dressings", "Charts and scores", "Charts and screening"]

export const subjectLabel = (s: string) => (s === "Obstetrics & Gynaecology" ? "OBG" : s)

/** Subjects that have at least one item, in display order, with counts. */
export function subjectsWithCounts(spots: Spot[]): { subject: string; count: number }[] {
  const m = new Map<string, number>()
  spots.forEach((s) => m.set(s.subject, (m.get(s.subject) || 0) + 1))
  const rank = (s: string) => { const i = SUBJECT_ORDER.indexOf(s); return i < 0 ? 999 : i }
  return Array.from(m.entries()).map(([subject, count]) => ({ subject, count })).sort((a, b) => rank(a.subject) - rank(b.subject) || a.subject.localeCompare(b.subject))
}

/** Groups inside one subject (all subjects when subject is "All"), in display order, with counts. */
export function groupsWithCounts(spots: Spot[], subject: string): { group: string; count: number }[] {
  const m = new Map<string, number>()
  spots.filter((s) => subject === "All" || s.subject === subject).forEach((s) => m.set(s.group, (m.get(s.group) || 0) + 1))
  const rank = (g: string) => { const i = GROUP_ORDER.indexOf(g); return i < 0 ? 999 : i }
  return Array.from(m.entries()).map(([group, count]) => ({ group, count })).sort((a, b) => rank(a.group) - rank(b.group) || a.group.localeCompare(b.group))
}
