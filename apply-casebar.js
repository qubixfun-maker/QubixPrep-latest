#!/usr/bin/env node
// Case Presentation: lifts the Back / Next / Present case bar above the phone tab bar so it is no longer covered.
// Checks first; changes nothing on a mismatch. Safe to run twice.
const fs = require('fs'), path = require('path')
const file = path.join(process.cwd(), 'src/components/casepres/case-form.tsx')
const fail = (m) => { console.error('\nSTOPPED - nothing was changed.\n' + m + '\n'); process.exit(1) }
if (!fs.existsSync(file)) fail('Run this from the QubixPrep-latest folder.')
const raw = fs.readFileSync(file, 'utf8'), crlf = raw.includes('\r\n')
let s = raw.replace(/\r\n/g, '\n')
if (s.includes('bottom-[calc(54px')) { console.log('Already applied. Nothing to do.'); process.exit(0) }
const old = '      <div className="fixed bottom-0 inset-x-0 z-30 border-t border-white/10 bg-background/90 backdrop-blur">'
if (s.split(old).length - 1 !== 1) fail('Could not find the bottom bar line exactly once in case-form.tsx.')
const neu = `      {/* spacer, so the last fields are never hidden behind the bar */}
      <div className="h-24 md:h-20" aria-hidden />
      {/* on phones the bar sits above the tab bar (Home / Notes / QBank...); on bigger screens it sits at the very bottom */}
      <div className="fixed inset-x-0 bottom-[calc(54px+env(safe-area-inset-bottom,0px))] z-30 border-t border-white/10 bg-background/95 backdrop-blur md:bottom-0">`
s = s.replace(old, () => neu)
if (crlf) s = s.replace(/\n/g, '\r\n')
fs.writeFileSync(file, s)
console.log('DONE - the Case Presentation action bar now sits above the phone tab bar.')
console.log('NEXT: npx tsc --noEmit')
