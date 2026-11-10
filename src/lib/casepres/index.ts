import type { CaseDef, Section, SubjectId } from './types'
import { MEDICINE_CASES } from './cases-medicine'
import { SUR_TOPIC_CASES } from './cases-sur-topics'
import { ORTHO_TOPIC_CASES } from './cases-ortho-topics'
import { PAED_TOPIC_CASES } from './cases-paed-topics'
import { ENT_TOPIC_CASES } from './cases-ent-topics'
import { EYE_TOPIC_CASES } from './cases-eye-topics'
import { PSYCH_TOPIC_CASES } from './cases-psych-topics'
import { DERM_TOPIC_CASES } from './cases-derm-topics'
import { MED_TOPIC_CASES } from './cases-med-topics'
import { SURGERY_CASES } from './cases-surgery'
import { PAED_CASES } from './cases-paeds'
import { ORTHO_CASES } from './cases-ortho'
import { PSYCH_CASES } from './cases-psych'
import { DERM_CASES } from './cases-derm'
import { EYE_CASES } from './cases-eye'
import { ANAES_CASES } from './cases-anaes'
import { ANAES_TOPIC_CASES } from './cases-anaes-topics'
import { OBG_CASES, ENT_CASES } from './cases-obg-ent'

export * from './types'
const RAW_CASES: CaseDef[] = [...MEDICINE_CASES, ...MED_TOPIC_CASES, ...SURGERY_CASES, ...SUR_TOPIC_CASES, ...PAED_CASES, ...PAED_TOPIC_CASES, ...OBG_CASES, ...ENT_CASES, ...ENT_TOPIC_CASES, ...ORTHO_CASES, ...ORTHO_TOPIC_CASES, ...PSYCH_CASES, ...PSYCH_TOPIC_CASES, ...DERM_CASES, ...DERM_TOPIC_CASES, ...EYE_CASES, ...EYE_TOPIC_CASES, ...ANAES_CASES, ...ANAES_TOPIC_CASES]
/**
 * Every case gets a "Summary after history" step, written by the app from what
 * has been entered so far (see historySummary in format.ts). OBG sheets already have one.
 */
const SUMMARY: Section = {
  id: 'histSumm',
  title: 'Summary after history',
  fields: [{ t: 'area', id: 'histS', label: 'Summary after history' }],
}
function withSummary(c: CaseDef): CaseDef {
  if (c.sections.some((s) => s.id === 'histSumm')) return c
  const at = c.sections.findIndex((s) => ['anthro', 'gpe', 'exam'].includes(s.id))
  if (at < 0) return c
  const sections = [...c.sections]
  sections.splice(at, 0, SUMMARY)
  return { ...c, sections }
}
const OBG_PROFORMAS = ['obg-gyn', 'obg-anc', 'obg-labour', 'obg-pnc']
/** Sample cases are the topic cases built from the shared case files; everything else is a proforma. */
const SAMPLE_IDS = new Set<string>([
  ...MED_TOPIC_CASES, ...SUR_TOPIC_CASES, ...PAED_TOPIC_CASES, ...ENT_TOPIC_CASES, ...EYE_TOPIC_CASES, ...ORTHO_TOPIC_CASES, ...PSYCH_TOPIC_CASES, ...DERM_TOPIC_CASES, ...ANAES_TOPIC_CASES,
  ...OBG_CASES.filter((c) => !OBG_PROFORMAS.includes(c.id)),
].map((c) => c.id))
export const ALL_CASES: CaseDef[] = RAW_CASES.map(withSummary).map((c) => ({ ...c, kind: SAMPLE_IDS.has(c.id) ? 'sample' : 'proforma' }))
export const getCase = (id: string) => ALL_CASES.find((c) => c.id === id)
export const casesFor = (subject: SubjectId, kind?: 'proforma' | 'sample') => ALL_CASES.filter((c) => c.subject === subject && (!kind || c.kind === kind))
