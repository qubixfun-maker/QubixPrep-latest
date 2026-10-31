#!/usr/bin/env node
// Installs the Grand Test papers feature. Checks everything first; changes nothing if any check fails. Safe to run twice.
const fs = require('fs'), path = require('path')
const root = process.cwd()
const fail = (m) => { console.error('\nSTOPPED - nothing was changed.\n' + m + '\n'); process.exit(1) }
const P = (p) => path.join(root, p)
const read = (p) => { const raw = fs.readFileSync(P(p), 'utf8'); return { crlf: raw.includes('\r\n'), s: raw.replace(/\r\n/g, '\n') } }
const write = (p, o) => fs.writeFileSync(P(p), o.crlf ? o.s.replace(/\n/g, '\r\n') : o.s)
const once = (s, a) => s.split(a).length - 1 === 1

const here = path.join(__dirname, 'gt-files')
if (!fs.existsSync(here)) fail('The gt-files folder is missing. Unzip qubix-grand.zip into the QubixPrep-latest folder first.')
for (const f of ['src/app/grand-test/page.tsx', 'src/lib/grand.ts', 'src/app/admin/page.tsx', 'firestore.rules']) if (!fs.existsSync(P(f))) fail('Run this from the QubixPrep-latest folder. Missing ' + f)
if (!fs.existsSync(P('node_modules/jszip'))) fail('The jszip package is not installed. Run:  npm i jszip   and then run this again.')

const plan = []

// 1. lib/grand.ts types
{
  const g = read('src/lib/grand.ts')
  if (!g.s.includes('GCredit')) {
    const a1 = 'topic: string; question: string; options: string[]; correct: number; explanation: string }'
    const a2 = 'negative: boolean; i: number }'
    const a3 = 'scaled: number; subjects: Record<string, { n: string; a: number; c: number }> }'
    for (const a of [a1, a2, a3]) if (!once(g.s, a)) fail('src/lib/grand.ts does not look as expected (could not find: ' + a.slice(0, 50) + '...).')
    g.s = g.s.replace(a1, 'topic: string; question: string; options: string[]; correct: number; explanation: string; qimgs?: string[]; eimgs?: string[] }\nexport type GCredit = { n: number; img: string; title: string; authors: string; journal: string; year: string; pmcid: string; licence: string; url: string }')
    g.s = g.s.replace(a2, 'negative: boolean; i: number; paperId?: string; paperTitle?: string; credits?: GCredit[] }')
    g.s = g.s.replace(a3, 'scaled: number; subjects: Record<string, { n: string; a: number; c: number }>; paperId?: string; paperTitle?: string }')
    plan.push(() => write('src/lib/grand.ts', g))
  }
}

// 2. security rules
{
  const r = read('firestore.rules')
  if (!r.s.includes('grandPaperQs')) {
    const anchor = '    match /profpyq/{docId} {'
    if (!once(r.s, anchor)) fail('firestore.rules: could not find the profpyq rule to insert before.')
    const block = fs.readFileSync(path.join(here, 'rules-block.txt'), 'utf8')
    r.s = r.s.replace(anchor, block + anchor)
    plan.push(() => write('firestore.rules', r))
  }
}

// 3. admin button
{
  const a = read('src/app/admin/page.tsx')
  if (!a.s.includes('href="/admin/grand-test-import"')) {
    const anchor = `          <Link href="/admin/affiliates">
            <Button variant="outline" className="rounded-xl gap-2 glass border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10">
              <Gift className="h-4 w-4" /> Manage Affiliates
            </Button>
          </Link>
`
    if (!once(a.s, anchor)) fail('Admin page: could not find the "Manage Affiliates" button exactly once.')
    if (!/import[\s\S]{0,800}\bGift\b[\s\S]{0,800}from ["']lucide-react["']/.test(a.s)) fail('Admin page: the Gift icon is not imported.')
    const add = `          <Link href="/admin/grand-test-import">
            <Button variant="outline" className="rounded-xl gap-2 glass border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/10">
              <Gift className="h-4 w-4" /> Grand Test Papers
            </Button>
          </Link>
`
    a.s = a.s.replace(anchor, anchor + add)
    plan.push(() => write('src/app/admin/page.tsx', a))
  }
}

// 4. student page (only replaced if it is still the old one)
{
  const p = read('src/app/grand-test/page.tsx')
  if (!p.s.includes('grandPapers')) {
    if (!p.s.includes('const KEY = "qp-grand-v1"') || !p.s.includes('estimateRank')) fail('src/app/grand-test/page.tsx is not the version I expected. Send me the file and I will adjust.')
    plan.push(() => { const n = fs.readFileSync(path.join(here, 'app/grand-test/page.tsx'), 'utf8'); write('src/app/grand-test/page.tsx', { crlf: p.crlf, s: n }) })
  }
}

// 5. new files
const news = [['lib/grand-import.ts', 'src/lib/grand-import.ts'], ['lib/grand-papers.ts', 'src/lib/grand-papers.ts'], ['components/grand/grand-images.tsx', 'src/components/grand/grand-images.tsx'], ['app/admin/grand-test-import/page.tsx', 'src/app/admin/grand-test-import/page.tsx']]
for (const [from, to] of news) plan.push(() => { fs.mkdirSync(path.dirname(P(to)), { recursive: true }); fs.copyFileSync(path.join(here, from), P(to)) })

plan.forEach((f) => f())
console.log('DONE - Grand Test papers installed.')
console.log('NEXT: rm -rf .next && npx tsc --noEmit ; firebase deploy --only firestore:rules ; then commit and push.')
