import type { Answers } from '../types'
import { F, who, merge } from './kit'

export const child = (name: string, age: string, sex: 'Male' | 'Female', informant: string, order: string, address = 'Hubballi, Karnataka'): Answers =>
  merge(who(name, age, sex, 'Child', address), { informant, reliability: ['Reliable'], birthOrder: order })

export const birthH = (term = 'Term', bw = '2.9 kg', mode = 'Normal vaginal'): Answers => ({
  motherAge: '25 years', anc: ['Registered, regular ANC'],
  ancF: F(['TT 2 doses taken', 'IFA / calcium taken'], ['Fever with rash', 'Drug intake', 'Radiation exposure', 'Hypertension / pre-eclampsia', 'Gestational diabetes', 'Bleeding per vagina', 'Major illness']),
  mode: [mode], place: ['Hospital'], term: [term], bw,
  natal: F(['Cried immediately', 'Breast fed within 1 hour', 'Meconium passed within 24 h'], ['Delayed cry', 'Needed resuscitation', 'NICU stay', 'Neonatal jaundice', 'Neonatal sepsis', 'Seizures', 'Congenital anomaly']),
  post: ['Uneventful'], birthN: 'Uneventful perinatal period.',
})
export const immH = (full = true): Answers => ({
  imm: [full ? 'Fully immunised for age' : 'Partially immunised'],
  immF: full ? F(['BCG scar present', 'OPV', 'Pentavalent / DPT', 'Rotavirus', 'Measles / MR', 'Immunisation card available']) : F(['BCG scar present', 'OPV', 'Pentavalent / DPT'], ['Measles / MR', 'Vitamin A given', 'Immunisation card available']),
  immN: full ? 'Immunised as per the national schedule, card seen.' : 'Missed the measles vaccine; no card available.',
  gm: ['As per age'], fm: ['As per age'], lang: ['As per age'], soc: ['As per age'], school: 'Anganwadi', devN: 'Developmental milestones appropriate for age.',
})
export const nutH = (bfLong = true): Answers => ({
  bf: [bfLong ? 'Exclusive for 6 months' : 'Not exclusive'],
  bfF: F(bfLong ? ['Complementary feeding started at 6 months'] : ['Top feed / formula', 'Cow / buffalo milk', 'Complementary feeding delayed'], bfLong ? ['Pre-lacteal feed given'] : []),
  bfDur: bfLong ? '2 years' : '4 months', cfStart: bfLong ? '6 months' : '9 months',
  preDiet: bfLong ? 'Home-cooked family diet with dal, rice, vegetables, milk and egg; about 3 meals and 2 snacks.' : 'Mostly diluted cow milk and rice gruel, little protein or green vegetables.',
  illDiet: 'Continued breast feeds with oral fluids and soft foods.', dailyKcal: bfLong ? 'About 1000 kcal per day' : 'About 500 kcal per day',
})
export const famH = (cons = false): Answers => ({
  consang: [cons ? 'Consanguineous' : 'Non-consanguineous'], father: '30 years, farmer, healthy', mother: '26 years, homemaker, healthy', sibs: 'One elder sibling, healthy',
  famHx: F([], ['Similar illness', 'Tuberculosis', 'Epilepsy', 'Genetic / congenital disease']), famN: 'No similar illness in the family.',
})
export const envH = (ses = 'Lower middle', house = 'Pakka', sanitation = 'Toilet in house'): Answers => ({
  house: [house], ventilation: [house === 'Kutcha' ? 'Inadequate' : 'Adequate'], cooking: [house === 'Kutcha' ? 'Firewood' : 'LPG'], water: ['Tap / piped'], sanitation: [sanitation], people: '5', income: 'Rs 12,000 per month', ses: [ses],
})
export const anthro = (wt: string, ht: string, hc: string, mac: string, bmi: string, growth: string, growthN = ''): Answers => ({ wt, ht, hc, chestC: '', mac, bmi, growth: [growth], growthN })
export const gpe = (act: string, nourish: string, signs: Record<string, 'p' | 'a'>, pulse: string, bp: string, rr: string, temp: string, spo2 = '98% on room air', gpeN = ''): Answers => ({
  act: [act], nourish: [nourish], signs, gpeN, vitals: { pulse, bp, rr, temp, spo2 },
})
export const cleanSigns = (present: string[] = []) => F(present, ['Pallor', 'Icterus', 'Cyanosis', 'Clubbing', 'Oedema (pedal / facial)', 'Lymphadenopathy', 'Dehydration'].filter((x) => !present.includes(x)))
