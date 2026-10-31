#!/usr/bin/env node
// 1) "More ways to study" -> big illustrated cards.  2) OSCE Stations -> "Virtual Patient" (name + web address /virtual-patient,
//    old /osce-stations links redirect).  Checks everything first; writes NOTHING if something looks different.
const fs = require('fs'), path = require('path')
const root = process.cwd()
const SRC = path.join(root, 'vp-files')
const fail = (m) => { console.error('\nSTOPPED - nothing was changed.\n' + m + '\n'); process.exit(1) }
const read = (p) => fs.readFileSync(p, 'utf8')
const P = (...a) => path.join(root, ...a)

const dashDone = fs.existsSync(P('src/components/dashboard/more-ways.tsx'))
const renamed = fs.existsSync(P('src/app/virtual-patient/page.tsx')) && !fs.existsSync(P('src/app/osce-stations'))
if (!fs.existsSync(SRC) && dashDone && renamed) { console.log('Already applied. Nothing to do.'); process.exit(0) }
if (!fs.existsSync(SRC)) fail('Folder "vp-files" is missing. Run:  unzip -o qubix-vp.zip   then run this script again.')
if (!fs.existsSync(P('src/app/page.tsx'))) fail('Run this from the QubixPrep-latest folder.')

// ---- checks ----
const page = read(P('src/app/page.tsx'))
const crlf = /\r\n/.test(page)
const pageN = page.replace(/\r\n/g, '\n')
const startMark = '{/* More ways to study */}', endMark = '{/* QuickCards */}'
if (!dashDone) {
  for (const a of [startMark, endMark, 'const MORE_WAYS = [', 'import { QuickDeckCard } from "@/components/quickcards/QuickDeckCard"'])
    if (!pageN.includes(a)) fail('Dashboard page is different from the one I saw (missing: ' + a + ').')
  if (pageN.indexOf(startMark) > pageN.indexOf(endMark)) fail('Dashboard sections are in a different order than expected.')
}
if (!renamed) {
  if (!fs.existsSync(P('src/app/osce-stations/page.tsx'))) fail('src/app/osce-stations/page.tsx not found.')
  if (fs.existsSync(P('src/app/virtual-patient'))) fail('src/app/virtual-patient already exists - tell Claude.')
}
const cfgName = ['next.config.ts', 'next.config.mjs', 'next.config.js'].find((f) => fs.existsSync(P(f)))
if (!cfgName) fail('next.config file not found.')
const cfg = read(P(cfgName))
const hasRedirect = /osce-stations/.test(cfg)
if (!hasRedirect && !cfg.includes("serverExternalPackages: ['google-auth-library'],")) fail('next.config looks different from the one I saw.')

// ---- helpers ----
const walk = (d, out = []) => {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const f = path.join(d, e.name)
    if (e.isDirectory()) { if (e.name !== 'node_modules') walk(f, out) } else if (/\.(ts|tsx)$/.test(e.name)) out.push(f)
  }
  return out
}
const rel = (f) => path.relative(root, f).split(path.sep).join('/')
const linkRe = /(["'`])\/osce-stations(?=["'`\/?#])/g
const userFacing = (r) => !/^src\/app\/(admin|api)\//.test(r) && !/^src\/(ai|lib)\//.test(r)
const TEXT = [
  [/OSCE Stations/g, 'Virtual Patient'],
  [/Search OSCE cases…/g, 'Search virtual patient cases…'],
  [/unlimited QBank, OSCE and your Jelly AI/g, 'unlimited QBank, Virtual Patient and your Jelly AI'],
  [/Jelly, OSCE simulations/g, 'Jelly, Virtual Patient simulations'],
]

// ---- write ----
const changed = []
// 1) rename folder first, so links point at the new place
if (!renamed) { fs.renameSync(P('src/app/osce-stations'), P('src/app/virtual-patient')); changed.push('moved src/app/osce-stations -> src/app/virtual-patient') }
for (const f of walk(P('src'))) {
  const r = rel(f)
  if (r === 'src/components/dashboard/more-ways.tsx') continue
  let s = read(f), o = s
  s = s.replace(linkRe, '$1/virtual-patient')
  if (userFacing(r)) for (const [re, to] of TEXT) s = s.replace(re, to)
  if (s !== o) { fs.writeFileSync(f, s); changed.push('updated ' + r) }
}
// 2) redirects for old links
if (!hasRedirect) {
  const add = "serverExternalPackages: ['google-auth-library'],\n  async redirects() {\n    return [\n      { source: '/osce-stations', destination: '/virtual-patient', permanent: false },\n      { source: '/osce-stations/:path*', destination: '/virtual-patient', permanent: false },\n    ]\n  },"
  fs.writeFileSync(P(cfgName), cfg.replace("serverExternalPackages: ['google-auth-library'],", add)); changed.push('updated ' + cfgName)
}
// 3) big cards
if (!dashDone) {
  fs.mkdirSync(P('src/components/dashboard'), { recursive: true })
  fs.writeFileSync(P('src/components/dashboard/more-ways.tsx'), read(path.join(SRC, 'components/dashboard/more-ways.tsx')))
  let p = read(P('src/app/page.tsx')).replace(/\r\n/g, '\n')
  const a = p.indexOf(startMark), b = p.indexOf(endMark)
  p = p.slice(0, a) + '{/* More ways to study */}\n      <MoreWays loggedIn={!!user} />\n\n      ' + p.slice(b)
  p = p.replace(/const MORE_WAYS = \[[\s\S]*?\n\]\n\n/, '')
  p = p.replace('import { QuickDeckCard } from "@/components/quickcards/QuickDeckCard"', 'import { QuickDeckCard } from "@/components/quickcards/QuickDeckCard"\nimport { MoreWays } from "@/components/dashboard/more-ways"')
  if (crlf) p = p.replace(/\n/g, '\r\n')
  fs.writeFileSync(P('src/app/page.tsx'), p); changed.push('updated src/app/page.tsx (big cards)', 'added src/components/dashboard/more-ways.tsx')
}
fs.rmSync(SRC, { recursive: true, force: true })
console.log('DONE:\n  ' + [...new Set(changed)].join('\n  '))
console.log('\nNEXT: npx tsc --noEmit')
