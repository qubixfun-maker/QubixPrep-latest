const fs = require('fs')
const msg = "Virtual Patient is part of the Clinician plan. Upgrade to continue."
let f = 'src/app/api/osce-stations/tts/route.ts'
let s = fs.readFileSync(f, 'utf8')
s = s.replace('const decoded: any = const __who = await verifyIdToken(idToken)', 'const decoded: any = await verifyIdToken(idToken)').replace('isClinician(__who.uid)', 'isClinician(decoded.uid)')
fs.writeFileSync(f, s)
f = 'src/app/api/osce-stations/respond/route.ts'
s = fs.readFileSync(f, 'utf8')
if (!s.includes('isClinician')) {
  const a = 'await verifyIdToken(idToken)'
  if (s.split(a).length !== 2) { console.log('respond: unexpected shape, nothing changed there'); process.exit(1) }
  s = s.replace(a, 'const __who = await verifyIdToken(idToken)\n    if (!(await isClinician(__who.uid))) return new Response(JSON.stringify({ error: "' + msg + '", needsPlan: true }), { status: 403, headers: { "Content-Type": "application/json" } })')
  s = s.replace(/^import /m, "import { isClinician } from '@/lib/require-clinician'\nimport ")
  fs.writeFileSync(f, s)
}
console.log('fixed tts and respond')
