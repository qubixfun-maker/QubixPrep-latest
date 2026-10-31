#!/usr/bin/env node
// Locks Virtual Patient and Jelly to the Clinician plan, on the server and on the page. Checks first; changes nothing on a mismatch. Safe to run twice.
const fs = require('fs'), path = require('path')
const root = process.cwd(), here = path.join(__dirname, 'cl-files')
const fail = (m) => { console.error('\nSTOPPED - nothing was changed.\n' + m + '\n'); process.exit(1) }
const P = (p) => path.join(root, p)
const rd = (p) => { if (!fs.existsSync(P(p))) return null; const raw = fs.readFileSync(P(p), 'utf8'); return { crlf: raw.includes('\r\n'), s: raw.replace(/\r\n/g, '\n') } }
const wr = (p, o) => fs.writeFileSync(P(p), o.crlf ? o.s.replace(/\n/g, '\r\n') : o.s)
const count = (s, a) => s.split(a).length - 1
if (!fs.existsSync(here)) fail('The cl-files folder is missing. Unzip qubix-clinician.zip into the QubixPrep-latest folder first.')
if (!fs.existsSync(P('src/lib/firebase-admin.ts'))) fail('Run this from the QubixPrep-latest folder (src/lib/firebase-admin.ts not found).')
const steps = [], report = []

// Jelly
const jr = rd('src/app/api/jelly/route.ts')
if (!jr) fail('src/app/api/jelly/route.ts not found.')
if (!jr.s.includes("Jelly is part of the Clinician plan")) {
  const a = "    const plan = await planOf(uid)\n"
  if (count(jr.s, a) !== 1) fail('Jelly route: could not find the plan line exactly once.')
  jr.s = jr.s.replace(a, "    if (!(await isClinician(uid))) return fail('Jelly is part of the Clinician plan. Upgrade to chat with Jelly.', 403)\n" + a)
  jr.s = jr.s.replace(/^import /m, "import { isClinician } from '@/lib/require-clinician'\nimport ")
  steps.push(() => wr('src/app/api/jelly/route.ts', jr)); report.push('Jelly chat: Clinician only')
}

// Virtual Patient routes
const routes = ['start-case', 'respond', 'viva-turn', 'examiner-chat', 'tts', 'finish', 'viva-result']
const line = 'await verifyIdToken(idToken)'
for (const r of routes) {
  const f = `src/app/api/osce-stations/${r}/route.ts`
  const o = rd(f)
  if (!o) { report.push(`SKIPPED ${r}: file not found`); continue }
  if (o.s.includes('isClinician')) continue
  if (count(o.s, line) !== 1 || !/NextResponse/.test(o.s)) { report.push(`SKIPPED ${r}: not in the expected shape`); continue }
  o.s = o.s.replace(line, `const __who = await verifyIdToken(idToken)\n    if (!(await isClinician(__who.uid))) return NextResponse.json({ error: 'Virtual Patient is part of the Clinician plan. Upgrade to continue.', needsPlan: true }, { status: 403 })`)
  o.s = o.s.replace(/^import /m, "import { isClinician } from '@/lib/require-clinician'\nimport ")
  steps.push(() => wr(f, o)); report.push(`Virtual Patient ${r}: Clinician only`)
}

// Page gate
const lay = 'src/app/virtual-patient/layout.tsx'
if (fs.existsSync(P('src/app/virtual-patient'))) {
  if (fs.existsSync(P(lay))) { if (!rd(lay).s.includes('ClinicianGate')) fail('src/app/virtual-patient/layout.tsx already exists. Send it to me and I will merge the gate in.') }
  else steps.push(() => fs.copyFileSync(path.join(here, 'vp-layout.tsx'), P(lay)))
  report.push('Virtual Patient page: upgrade screen for non-Clinician accounts')
} else fail('src/app/virtual-patient folder not found.')
steps.push(() => { fs.copyFileSync(path.join(here, 'require-clinician.ts'), P('src/lib/require-clinician.ts')); fs.mkdirSync(P('src/components'), { recursive: true }); fs.copyFileSync(path.join(here, 'clinician-gate.tsx'), P('src/components/clinician-gate.tsx')) })

steps.forEach((f) => f())
console.log('DONE:\n - ' + report.join('\n - '))
console.log('NEXT: rm -rf .next && npx tsc --noEmit, then commit and push.')
