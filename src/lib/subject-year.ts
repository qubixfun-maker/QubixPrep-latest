// Fixed MBBS phase/year per subject (CBME curriculum), used for year-wise
// grouping on the flashcards subject listing page.

export type SubjectYear = { label: string; order: number }

const YEAR_MAP: Record<string, SubjectYear> = {
  "Anatomy": { label: "1st Year", order: 1 },
  "Physiology": { label: "1st Year", order: 1 },
  "Biochemistry": { label: "1st Year", order: 1 },

  "Pathology": { label: "2nd Year", order: 2 },
  "Pharmacology": { label: "2nd Year", order: 2 },
  "Microbiology": { label: "2nd Year", order: 2 },

  "Community Medicine": { label: "3rd Year", order: 3 },
  "Forensic Medicine": { label: "3rd Year", order: 3 },
  "ENT": { label: "3rd Year", order: 3 },
  "Ophthalmology": { label: "3rd Year", order: 3 },

  "Medicine": { label: "4th Year", order: 4 },
  "Surgery": { label: "4th Year", order: 4 },
  "Obstetrics & Gynaecology": { label: "4th Year", order: 4 },
  "Paediatrics": { label: "4th Year", order: 4 },
  "Orthopaedics": { label: "4th Year", order: 4 },
  "Anaesthesia": { label: "4th Year", order: 4 },
  "Radiology": { label: "4th Year", order: 4 },
  "Psychiatry": { label: "4th Year", order: 4 },
  "Dermatology": { label: "4th Year", order: 4 },
}

export function getSubjectYear(subjectName: string): SubjectYear {
  return YEAR_MAP[subjectName] || { label: "Other", order: 99 }
}

// The order every subject list in the app follows: year by year, and in this order inside each year.
const SEQUENCE: string[][] = [
  ["anatomy", "physiology", "biochemistry"],
  ["pathology", "pharmacology", "microbiology"],
  ["community", "forensic", "ent", "ophthal"],
  ["medicine", "surgery", "obstetric", "gynae", "paediatric", "pediatric", "orthop", "psychiatry", "dermat", "radiolog", "anaesth", "anesth"],
]

/** Lower comes first. Unknown subjects go last, A to Z. */
export function subjectRank(name: string): number {
  const n = (name || "").toLowerCase().replace(/[^a-z]/g, "")
  for (let y = 0; y < SEQUENCE.length; y++) {
    for (let i = 0; i < SEQUENCE[y].length; i++) {
      const k = SEQUENCE[y][i]
      // "ent" is too short to search inside names ("treatment"), so it only matches the whole name or its long forms
      const hit = k === "ent" ? n === "ent" || n.startsWith("entear") || n.startsWith("earnose") || n.includes("otorhino") : n.includes(k)
      if (hit) {
        // plain "medicine" must not swallow "community medicine" or "forensic medicine"
        if (k === "medicine" && (n.includes("community") || n.includes("forensic"))) continue
        return y * 100 + i
      }
    }
  }
  return 9999
}

export function compareSubjects(a: string, b: string): number {
  return subjectRank(a) - subjectRank(b) || String(a).localeCompare(String(b))
}
