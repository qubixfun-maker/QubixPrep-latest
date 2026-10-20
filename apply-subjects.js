const fs = require('fs')
const D = 'src/lib/casepres/'
const rd = (f) => fs.readFileSync(D + f, 'utf8')
const wr = (f, s) => fs.writeFileSync(D + f, s)
let log = []

// types.ts
let t = rd('types.ts')
if (!t.includes("'psychiatry'")) {
  t = t.replace("'orthopaedics'", "'orthopaedics' | 'psychiatry' | 'dermatology' | 'ophthalmology' | 'anaesthesiology'")
  log.push('types: SubjectId extended')
}
if (!t.includes("id: 'psychiatry'")) {
  const lines = t.split('\n')
  const k = lines.findIndex((l) => l.includes("id: 'orthopaedics'"))
  if (k < 0) { console.log('!! orthopaedics subject entry not found in types.ts'); process.exit(1) }
  lines.splice(k + 1, 0,
    "  { id: 'psychiatry', name: 'Psychiatry', blurb: 'Depression, mania, psychosis, anxiety and OCD, alcohol and substance use, delirium and dementia' },",
    "  { id: 'dermatology', name: 'Dermatology', blurb: 'Scaly lesions, itchy rashes, blistering disorders, leprosy, pigmentation and skin growths' },",
    "  { id: 'ophthalmology', name: 'Ophthalmology', blurb: 'Red eye, gradual and sudden vision loss, eyelid and lacrimal disorders, squint and refraction' },",
    "  { id: 'anaesthesiology', name: 'Anaesthesiology', blurb: 'Pre-anaesthetic check-up, high-risk patients, airway, regional anaesthesia, critical care' },")
  t = lines.join('\n')
  log.push('types: 4 subjects added')
}
wr('types.ts', t)

// index.ts
let ix = rd('index.ts')
if (!ix.includes('PSYCH_CASES')) {
  ix = ix.replace(/(import \{ ORTHO_CASES \} from '\.\/cases-ortho'\n?)/, "$1import { PSYCH_CASES } from './cases-psych'\nimport { DERM_CASES } from './cases-derm'\nimport { EYE_CASES } from './cases-eye'\nimport { ANAES_CASES } from './cases-anaes'\n")
  ix = ix.replace('...ORTHO_CASES', '...ORTHO_CASES, ...PSYCH_CASES, ...DERM_CASES, ...EYE_CASES, ...ANAES_CASES')
  log.push('index: new cases wired')
}
wr('index.ts', ix)

// insights.ts
let ins = rd('insights.ts')
if (!ins.includes('INSIGHTS3')) {
  ins = ins.replace("import { INSIGHTS2 } from './insights-data2'", "import { INSIGHTS2 } from './insights-data2'\nimport { INSIGHTS3 } from './insights-data3'")
  ins = ins.replace('...INSIGHTS2 }', '...INSIGHTS2, ...INSIGHTS3 }')
  log.push('insights: INSIGHTS3 wired')
}
wr('insights.ts', ins)

// clinical.ts
let c = rd('clinical.ts')
if (!c.includes('KB3')) {
  c = c.replace(/(import \{ KB2 \} from '\.\/clinical2'\n?)/, "$1import { KB3 } from './clinical3'\n")
  c = c.replace(/return KB2\.find/, 'return KB3.find((k) => k.m.test(t)) || KB2.find')
  log.push('clinical: KB3 wired')
}
wr('clinical.ts', c)

console.log(log.length ? log.join('\n') : 'nothing to change (already applied)')
