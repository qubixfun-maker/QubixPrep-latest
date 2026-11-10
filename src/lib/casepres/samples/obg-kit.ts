import type { Answers } from '../types'
import { F, merge } from './kit'

export const woman = (name: string, age: string, edu: string, occ: string, addr: string, parity: string, bg: string): Answers => ({ name, age, education: edu, occupation: occ, address: addr, doa: '2026-10-12', doe: '2026-10-13', parity, bloodGrp: bg })
export const persO = (diet = 'Mixed', appetite = 'Normal', sleep = 'Normal', bowel = 'Regular', bladder = 'Normal'): Answers => ({ diet: [diet], appetite: [appetite], sleep: [sleep], bowel: [bowel], bladder: [bladder], habits: F([], ['Smoking', 'Alcohol', 'Tobacco chewing', 'Other substance use']), persF: F(['Vaccination history complete'], ['High-risk behaviour', 'Allergy to any drug', 'Allergy to any food', 'Substance abuse']) })
export const envO = (ses = 'Lower middle'): Answers => ({ house: ['Pakka'], ventilation: ['Adequate'], cooking: ['LPG'], water: ['Tap / piped'], sanitation: ['Toilet in house'], people: '5', income: 'Rs 15,000 per month', ses: [ses] })
export const signsO = (p: string[] = []) => F(p, ['Pallor', 'Icterus', 'Cyanosis', 'Clubbing', 'Pedal oedema', 'Facial puffiness', 'Generalised lymphadenopathy', 'Thyroid enlargement', 'Koilonychia'].filter((x) => !p.includes(x)))
export const vit = (pulse: string, bp: string, rr: string, temp: string, weight: string, height = '') => ({ vitals: { pulse, bp, rr, temp, spo2: '98% on room air', weight, height } })
export const marital = (married: string, hOcc = 'Farmer', consang = 'Non-consanguineous', sexH = 'Normal sexual life, no dyspareunia.'): Answers => ({ married, consang: [consang], hOccup: hOcc, sexH })
export const mens = (menarche: string, lmp: string, cycle = '28 days', reg = 'Regular', flow = 'Normal', extra: Answers = {}): Answers => ({ menarche, lmp, pastCycle: '4 to 5 days / ' + cycle, pastReg: [reg], pastFlow: [flow], mF: F([], ['Dysmenorrhoea', 'Passage of clots', 'Premenstrual symptoms', 'Intermenstrual bleeding']), ...extra })
export const obstGyn = (p: string, l: string, a: string, d: string, e: string, ld: string, steril = 'Not done', contra = 'None'): Answers => ({ obsP: p, obsL: l, obsA: a, obsD: d, obsE: e, ld, steril: [steril], contra: [contra] })

export const gynNormal = (): Answers => ({
  shape: ['Flat'], inspF: F(['Umbilicus central', 'Symmetrical', 'Moves with respiration'], ['Umbilicus everted', 'Striae gravidarum', 'Scar (tubectomy / LSCS / other)', 'Sinus', 'Dilated veins', 'Visible mass']),
  palpSup: F([], ['Tenderness', 'Local rise of temperature', 'Guarding', 'Rigidity']), palpDeep: F([], ['Mass palpable', 'Lump arising from pelvis', 'Hepatomegaly', 'Splenomegaly', 'Renal angle tenderness', 'Free fluid']),
  percF: F(['Tympanic note'], ['Dull note over the swelling', 'Shifting dullness']), auscF: F(['Normal bowel sounds'], ['Sluggish bowel sounds', 'Absent bowel sounds']),
  vulvaF: F(['Appears healthy'], ['Ulceration', 'Swelling', 'Lesions', 'Abnormal discharge', 'Warts', 'Prolapse visible on straining']),
  vagina: F(['Healthy vaginal walls'], ['Abnormal discharge', 'Growth', 'Ulcer', 'Septum']), cervix: F(['Healthy'], ['Cervical growth', 'Cervical polyp', 'Cervix bleeds on touch', 'Abnormal discharge', 'Cervicitis']), fornF: F(['Healthy'], ['Bulging', 'Obliterated']),
  pelvFloor: F([], ['Cystocele', 'Rectocele', 'Enterocele', 'Uterine prolapse', 'Stress incontinence on cough']),
  pvCervix: F(['Healthy', 'Os closed'], ['Cervix hard', 'Cervix bleeds on touch', 'Cervical motion tenderness']), uterusPos: ['Anteverted'], uterusSize: 'Normal size', uterusF: F(['Uterus mobile', 'Uterus firm'], ['Uterus bulky', 'Uterus fixed', 'Uterine tenderness', 'Uterus soft', 'Uterus globular', 'Uterus irregular surface']),
  fornPV: F(['Fornices free'], ['Fornix fullness', 'Fornix tenderness', 'Adnexal mass (right)', 'Adnexal mass (left)', 'Pouch of Douglas fullness', 'Nodularity']),
  breast: F(['Normal on both sides'], ['Lump', 'Nipple retraction', 'Nipple discharge', 'Galactorrhoea', 'Axillary nodes']),
  sysF: F(['RS: bilateral normal vesicular breath sounds heard', 'CVS: S1 and S2 heard, no murmurs']), sysN: '',
})
export const gynBase = (...x: Answers[]) => merge(gynNormal(), ...x)
