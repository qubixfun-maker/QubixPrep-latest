#!/usr/bin/env node
// Adds the admin "Free access" tool (/admin/free-access). Only adds new files; changes nothing that exists.
const fs = require('fs'), path = require('path')
const root = process.cwd(), SRC = path.join(root, 'free-files')
const fail = (m) => { console.error('\nSTOPPED - nothing was changed.\n' + m + '\n'); process.exit(1) }
const P = (...a) => path.join(root, ...a)
const FILES = ['lib/grant-server.ts', 'app/api/admin/free-access/route.ts', 'app/admin/free-access/page.tsx']

if (!fs.existsSync(SRC)) {
  if (fs.existsSync(P('src/lib/grant-server.ts'))) { console.log('Already applied. Nothing to do.'); process.exit(0) }
  fail('Folder "free-files" is missing. Run:  unzip -o qubix-free.zip   then run this script again.')
}
if (!fs.existsSync(P('src/app/page.tsx'))) fail('Run this from the QubixPrep-latest folder.')

const must = ['src/lib/api-auth.ts', 'src/lib/plan-server.ts', 'src/components/ui/button.tsx', 'src/components/ui/input.tsx', 'src/hooks/use-toast.ts']
const missing = must.filter((f) => !fs.existsSync(P(f)) && !fs.existsSync(P(f + 'x')))
if (missing.length) fail('These files were not found, so I will not continue:\n  ' + missing.join('\n  ') + '\n(The plans/affiliate update must be applied first.)')
const auth = fs.readFileSync(P('src/lib/api-auth.ts'), 'utf8')
if (!/export async function requireAdmin/.test(auth) || !/export function errorResponse/.test(auth) || !/class ApiError/.test(auth))
  fail('src/lib/api-auth.ts is not the version I expected (needs requireAdmin, errorResponse, ApiError).')
for (const f of FILES) if (fs.existsSync(P('src', f))) fail('This file already exists: src/' + f)

for (const f of FILES) {
  fs.mkdirSync(path.dirname(P('src', f)), { recursive: true })
  fs.writeFileSync(P('src', f), fs.readFileSync(path.join(SRC, f), 'utf8'))
}
fs.rmSync(SRC, { recursive: true, force: true })
console.log('DONE - added:\n  ' + FILES.map((f) => 'src/' + f).join('\n  '))
console.log('\nNEXT: rm -rf .next && npx tsc --noEmit   then commit and push. Open /admin/free-access after the deploy.')
