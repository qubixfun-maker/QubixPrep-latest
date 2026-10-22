export type SpotImage = { f: string; cap?: string }

/** [question, correct answer, wrong1, wrong2, wrong3, explanation] */
export type SpotMcq = [string, string, string, string, string, string]

export type Spot = {
  id: string
  subject: string // Surgery | Pathology | Anatomy | Obstetrics & Gynaecology | Ophthalmology
  group: string // e.g. Instruments | Gross specimens | Pathology slides | Histology slides (new groups are allowed)
  topic: string // sub-heading inside the group, e.g. "Forceps", "GIT", "Eye"
  name: string
  aka?: string
  imgs: SpotImage[]
  /** true when the answer is written on the photo itself, so it is hidden until the student has answered */
  labelled?: boolean
  identify: string[] // the points a student writes in the spotter answer
  about: string
  points: string[] // uses / features / clinical points
  viva: string[] // "Question? — Answer" strings
  mcq: SpotMcq[]
}
