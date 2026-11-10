import type { Answers } from '../types'
import { SAMPLES_CVS_RS } from './med-cvs-rs'
import { SAMPLES_CNS_GIT } from './med-cns-git'
import { SAMPLES_SUR_A } from './sur-a'
import { SAMPLES_SUR_B } from './sur-b'
import { SAMPLES_SUR_C } from './sur-c'
import { SAMPLES_ORTHO } from './ortho'
import { SAMPLES_ENT } from './ent'
import { SAMPLES_EYE } from './eye'
import { SAMPLES_PAED_A } from './paed-a'
import { SAMPLES_PAED_B } from './paed-b'
import { SAMPLES_PAED_C } from './paed-c'
import { SAMPLES_PAED_D } from './paed-d'
import { SAMPLES_OBG_A } from './obg-a'
import { SAMPLES_OBG_B } from './obg-b'
import { SAMPLES_OBG_C } from './obg-c'
import { SAMPLES_PSYCH } from './psych'
import { SAMPLES_DERM } from './derm'
import { SAMPLES_ANAES } from './anaes'

/** Complete, filled-in sample cases, keyed by case id. A sample opens already filled in. */
export const SAMPLE_ANSWERS: Record<string, Answers> = {
  ...SAMPLES_CVS_RS,
  ...SAMPLES_CNS_GIT,
  ...SAMPLES_SUR_A,
  ...SAMPLES_SUR_B,
  ...SAMPLES_SUR_C,
  ...SAMPLES_ORTHO,
  ...SAMPLES_ENT,
  ...SAMPLES_EYE,
  ...SAMPLES_PAED_A,
  ...SAMPLES_PAED_B,
  ...SAMPLES_PAED_C,
  ...SAMPLES_PAED_D,
  ...SAMPLES_OBG_A,
  ...SAMPLES_OBG_B,
  ...SAMPLES_OBG_C,
  ...SAMPLES_PSYCH,
  ...SAMPLES_DERM,
  ...SAMPLES_ANAES,
}
