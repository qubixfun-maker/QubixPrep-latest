import type { CaseDef, SubjectId } from './types'
import { MEDICINE_CASES } from './cases-medicine'
import { SURGERY_CASES } from './cases-surgery'
import { PAED_CASES } from './cases-paeds'
import { MEDICINE2_CASES } from './cases-medicine2'
import { ORTHO_CASES } from './cases-ortho'
import { OBG_CASES, ENT_CASES } from './cases-obg-ent'

export * from './types'
export const ALL_CASES: CaseDef[] = [...MEDICINE_CASES, ...MEDICINE2_CASES, ...SURGERY_CASES, ...PAED_CASES, ...OBG_CASES, ...ENT_CASES, ...ORTHO_CASES]
export const getCase = (id: string) => ALL_CASES.find((c) => c.id === id)
export const casesFor = (subject: SubjectId) => ALL_CASES.filter((c) => c.subject === subject)
