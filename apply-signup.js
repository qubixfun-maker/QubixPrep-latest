#!/usr/bin/env node
// Adds: all-India college picker, /terms and /privacy pages, sign-up consent popup (+ optional WhatsApp consent),
// and replaces src/app/signup/page.tsx. Checks everything first and writes NOTHING if anything looks different.
const fs = require('fs'), path = require('path')
const root = process.cwd()
const SRC = path.join(root, 'signup-files')
const rd = (p) => fs.readFileSync(p, 'utf8')
const norm = (s) => s.replace(/\r\n/g, '\n')
const fail = (m) => { console.error('\nSTOPPED - nothing was changed.\n' + m + '\n'); process.exit(1) }

if (!fs.existsSync(SRC)) {
  if (fs.existsSync(path.join(root, 'src/components/college-picker.tsx')) && fs.existsSync(path.join(root, 'src/app/terms/page.tsx')))
    { console.log('Already applied (signup-files folder is gone and the new files exist). Nothing to do.'); process.exit(0) }
  fail('The folder "signup-files" is missing. Run:  unzip -o qubix-signup.zip   and then run this script again.')
}
if (!fs.existsSync(path.join(root, 'src/app/signup/page.tsx'))) fail('Run this from the QubixPrep-latest folder (src/app/signup/page.tsx not found).')

// 1) things the new code relies on must exist
const need = ['src/components/ui/button.tsx', 'src/components/ui/input.tsx', 'src/components/ui/card.tsx', 'src/components/ui/select.tsx', 'src/hooks/use-toast.ts']
const missing = need.filter((f) => !fs.existsSync(path.join(root, f)) && !fs.existsSync(path.join(root, f + 'x')))
if (missing.length) fail('These files were not found, so I will not continue:\n  ' + missing.join('\n  '))
const btn = rd(path.join(root, 'src/components/ui/button.tsx'))
if (!/asChild/.test(btn)) fail('Your Button component has no "asChild" support. Tell Claude - one line needs changing.')

// 2) the current signup page must be the one I built this on
const signupPath = path.join(root, 'src/app/signup/page.tsx')
const cur = norm(rd(signupPath))
const already = /CollegePicker/.test(cur) && /ConsentDialog/.test(cur)
if (!already) {
  const anchors = [
    'createUserWithEmailAndPassword(auth, formData.email, formData.password)',
    "fetch('/api/affiliate/track-referral'",
    'function handleCompleteGoogleProfile',
    'Finish Sign Up',
  ]
  for (const a of anchors) if (!cur.includes(a)) fail('Your signup page is different from the one I saw (missing: ' + a + '). Paste it to Claude.')
  if ((cur.match(/placeholder="College Name"/g) || []).length !== 2) fail('Expected two "College Name" boxes in the signup page, found a different number. Paste the file to Claude.')
}

// 3) new files must not collide with different existing files
const plan = []
const walk = (d, rel = '') => fs.readdirSync(d, { withFileTypes: true }).forEach((e) => {
  const r = path.posix.join(rel, e.name)
  if (e.isDirectory()) walk(path.join(d, e.name), r); else plan.push(r)
})
walk(SRC)
const target = (r) => (r === 'app-signup-page.tsx' ? 'src/app/signup/page.tsx' : 'src/' + r)
for (const r of plan) {
  const t = path.join(root, target(r))
  if (r === 'app-signup-page.tsx') continue
  if (fs.existsSync(t) && norm(rd(t)) !== norm(rd(path.join(SRC, r)))) {
    const isMine = /College|Terms|Privacy|consent|legal|colleges/i.test(r)
    if (!isMine) fail('A different file already exists at ' + target(r))
  }
}
if (fs.existsSync(path.join(root, 'src/app/terms/page.tsx')) && !/TermsContent/.test(rd(path.join(root, 'src/app/terms/page.tsx'))))
  fail('You already have your own /terms page (src/app/terms/page.tsx). Tell Claude before replacing it.')
if (fs.existsSync(path.join(root, 'src/app/privacy/page.tsx')) && !/PrivacyContent/.test(rd(path.join(root, 'src/app/privacy/page.tsx'))))
  fail('You already have your own /privacy page (src/app/privacy/page.tsx). Tell Claude before replacing it.')

// 4) write
let n = 0
for (const r of plan) {
  const t = path.join(root, target(r))
  fs.mkdirSync(path.dirname(t), { recursive: true })
  fs.writeFileSync(t, rd(path.join(SRC, r)))
  n++
}
fs.rmSync(SRC, { recursive: true, force: true })
console.log('DONE - wrote ' + n + ' files:')
for (const r of plan) console.log('  ' + target(r))
console.log('\nNEXT:')
console.log('  1) open src/lib/legal.ts and set CONTACT_EMAIL, JURISDICTION_CITY and WHATSAPP_GROUP_URL')
console.log('  2) npx tsc --noEmit')
