import type { CaseInsight } from './insights-data'
import { INSIGHTS_PSYCH } from './insights-psych'
import { INSIGHTS_DERM } from './insights-derm'
import { INSIGHTS_EYE } from './insights-eye'
import { INSIGHTS_ANAES } from './insights-anaes'

/** Hints, must-do checklist and viva for psychiatry, dermatology, ophthalmology and anaesthesiology. */
export const INSIGHTS3: Record<string, CaseInsight> = { ...INSIGHTS_PSYCH, ...INSIGHTS_DERM, ...INSIGHTS_EYE, ...INSIGHTS_ANAES }
