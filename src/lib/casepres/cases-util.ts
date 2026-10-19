import type { CaseDef, Field, Section, SubjectId } from './types'
import { cc, sec } from './dsl'
import { particulars, pastHistory, familyHistory, personalHistory, menstrualHistory, gpe, closing } from './blocks'

/**
 * Builds a full case from the shared blocks so each new case only lists what is specific to it.
 * Order: particulars, complaints, HPI, [middle sections], past, personal, family, menstrual, GPE, exam sections, closing.
 */
export function mk(o: {
  id: string
  subject: SubjectId
  title: string
  blurb: string
  complaints: string[]
  hpi: Field[]
  hpiHint?: string
  middle?: Section[]
  pastExtra?: string[]
  familyExtra?: string[]
  gpeExtra?: string[]
  exam: Section[]
  noMenstrual?: boolean
  medicineClosing?: boolean
}): CaseDef {
  return {
    id: o.id, subject: o.subject, title: o.title, blurb: o.blurb,
    sections: [
      particulars(),
      sec('complaints', 'Chief complaints', [cc('cc', 'Select the complaints and give the duration', o.complaints)]),
      sec('hpi', 'History of present illness', o.hpi, o.hpiHint || 'Mark each symptom Present or Absent; for present ones, choose the details.'),
      ...(o.middle || []),
      pastHistory(o.pastExtra),
      personalHistory(),
      familyHistory(o.familyExtra),
      ...(o.noMenstrual ? [] : [menstrualHistory()]),
      gpe(o.gpeExtra),
      ...o.exam,
      closing({ medicine: o.medicineClosing }),
    ],
  }
}
