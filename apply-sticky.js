#!/usr/bin/env node
// 1) Grand Test timer/Submit bar no longer hides behind the site's top bar.
// 2) PYQ + Custom Quiz side cards only stay pinned on large screens (not floating over content on phones).
// Checks everything first; changes nothing on a mismatch. Safe to run twice.
const fs = require('fs'), path = require('path')
const root = process.cwd()
const fail = (m) => { console.error('\nSTOPPED - nothing was changed.\n' + m + '\n'); process.exit(1) }
const EDITS = [
  { file: 'src/app/grand-test/page.tsx',
    old: 'className="sticky top-0 z-20 -mx-3 mb-4 flex items-center justify-between gap-3',
    neu: 'className="sticky top-[66px] z-20 -mx-3 mb-4 flex items-center justify-between gap-3' },
  { file: 'src/app/pyq/page.tsx', old: '<Card className="glass border-none sticky top-24">', neu: '<Card className="glass border-none lg:sticky lg:top-24">' },
  { file: 'src/app/test-series/page.tsx', old: '<Card className="glass border-none sticky top-24">', neu: '<Card className="glass border-none lg:sticky lg:top-24">' },
]
const todo = []
for (const e of EDITS) {
  const p = path.join(root, e.file)
  if (!fs.existsSync(p)) fail('Run this from the QubixPrep-latest folder (missing ' + e.file + ').')
  const raw = fs.readFileSync(p, 'utf8')
  if (raw.includes(e.neu)) continue
  const n = raw.split(e.old).length - 1
  if (n !== 1) fail('Expected to find exactly one match in ' + e.file + ', found ' + n + '.')
  todo.push({ p, raw, e })
}
if (todo.length === 0) { console.log('Already applied. Nothing to do.'); process.exit(0) }
for (const t of todo) { fs.writeFileSync(t.p, t.raw.replace(t.e.old, () => t.e.neu)); console.log('updated ' + path.relative(root, t.p)) }
console.log('\nDONE. NEXT: npx tsc --noEmit')
