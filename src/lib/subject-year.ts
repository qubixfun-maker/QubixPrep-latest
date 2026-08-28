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
  "Forensic Medicine": { label: "2nd Year", order: 2 },

  "Community Medicine": { label: "3rd Year", order: 3 },
  "ENT": { label: "3rd Year", order: 3 },
  "Ophthalmology": { label: "3rd Year", order: 3 },

  "Medicine": { label: "Final Year", order: 4 },
  "Surgery": { label: "Final Year", order: 4 },
  "Obstetrics & Gynaecology": { label: "Final Year", order: 4 },
  "Paediatrics": { label: "Final Year", order: 4 },
  "Orthopaedics": { label: "Final Year", order: 4 },
  "Anaesthesia": { label: "Final Year", order: 4 },
  "Radiology": { label: "Final Year", order: 4 },
  "Psychiatry": { label: "Final Year", order: 4 },
  "Dermatology": { label: "Final Year", order: 4 },
}

export function getSubjectYear(subjectName: string): SubjectYear {
  return YEAR_MAP[subjectName] || { label: "Other", order: 99 }
}
