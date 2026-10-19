export type SubjectId = 'medicine' | 'surgery' | 'paediatrics' | 'obg' | 'ent'

export type AttrDef = {
  key: string
  label: string
  options?: string[]
  multi?: boolean
}
export type AttrRef = string | AttrDef

export type Field =
  | { t: 'text'; id: string; label: string; placeholder?: string; half?: boolean }
  | { t: 'date'; id: string; label: string; half?: boolean }
  | { t: 'area'; id: string; label: string; placeholder?: string }
  /** Pick from options (single or multiple) and/or type your own. */
  | { t: 'choice'; id: string; label: string; options: string[]; multi?: boolean }
  /** Each option can be marked present / absent / left blank. */
  | { t: 'findings'; id: string; label: string; options: string[] }
  /** Chief complaints: tick the ones present and type a duration. */
  | { t: 'complaints'; id: string; label: string; options: string[] }
  /** A symptom with present/absent and a set of attributes (onset, duration, ...). */
  | { t: 'symptom'; id: string; label: string; attrs: AttrRef[] }
  | { t: 'vitals'; id: string; label: string; paeds?: boolean }

export type Section = {
  id: string
  title: string
  hint?: string
  fields: Field[]
}

export type CaseDef = {
  id: string
  subject: SubjectId
  title: string
  blurb: string
  sections: Section[]
}

export type SymptomAnswer = { s?: 'p' | 'a'; a?: Record<string, string | string[]> }
export type Answers = Record<string, any>

export const SUBJECTS: { id: SubjectId; name: string; blurb: string }[] = [
  { id: 'medicine', name: 'Medicine', blurb: 'GIT, CNS, Respiratory, Cardiovascular' },
  { id: 'surgery', name: 'Surgery', blurb: 'Varicose veins, hernia, thyroid, breast, ulcer and more' },
  { id: 'paediatrics', name: 'Paediatrics', blurb: 'GI, nutrition, newborn, CNS, respiratory, CVS' },
  { id: 'obg', name: 'Obstetrics & Gynaecology', blurb: 'Gynaecology and antenatal cases' },
  { id: 'ent', name: 'ENT', blurb: 'Ear, nose and throat' },
]
