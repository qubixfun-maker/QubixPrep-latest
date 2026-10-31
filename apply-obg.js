// Rebuilds the Obstetrics & Gynaecology case presentations from the college proformas.
// Anchor-checked, idempotent, CRLF-safe. Changes nothing if an anchor is missing.
const fs = require('fs'), path = require('path')
const D = 'src/lib/casepres/'
const need = (f) => { if (!fs.existsSync(f)) { console.log('MISSING ' + f + ' (run from the repo root)'); process.exit(1) } }
;['types.ts', 'format.ts', 'insights.ts', 'cases-obg-ent.ts'].forEach((f) => need(D + f))
const rd = (f) => { const raw = fs.readFileSync(f, 'utf8'); const crlf = raw.includes('\r\n'); return { s: raw.replace(/\r\n/g, '\n'), crlf } }
const wr = (f, s, crlf) => fs.writeFileSync(f, crlf ? s.replace(/\n/g, '\r\n') : s)

const plan = []
// 1. cases-obg-ent.ts: drop the old gyn + antenatal definitions
{
  const f = D + 'cases-obg-ent.ts', { s, crlf } = rd(f)
  if (s.includes("export { OBG_CASES } from './cases-obg'")) plan.push({ f, note: 'already done' })
  else {
    const a = s.indexOf('const gyn: CaseDef = {'), b = s.indexOf('const ear: CaseDef = {')
    const e = "export const OBG_CASES: CaseDef[] = [gyn, antenatal]"
    if (a < 0 || b < 0 || b < a || !s.includes(e)) { console.log('ANCHOR NOT FOUND in cases-obg-ent.ts. Nothing changed.'); process.exit(1) }
    let n = s.slice(0, a) + s.slice(b)
    n = n.replace(e, "export { OBG_CASES } from './cases-obg'")
    plan.push({ f, s: n, crlf })
  }
}
// 2. insights.ts: merge the new OBG insights last
{
  const f = D + 'insights.ts', { s, crlf } = rd(f)
  if (s.includes('INSIGHTS_OBG')) plan.push({ f, note: 'already done' })
  else {
    const o = "const ALL = { ...INSIGHTS, ...INSIGHTS2, ...INSIGHTS3 }"
    if (!s.includes(o)) { console.log('ANCHOR NOT FOUND in insights.ts. Nothing changed.'); process.exit(1) }
    plan.push({ f, s: s.replace(o, "import { INSIGHTS_OBG } from './insights-obg'\nconst ALL = { ...INSIGHTS, ...INSIGHTS2, ...INSIGHTS3, ...INSIGHTS_OBG }"), crlf })
  }
}
// 3. format.ts: pronouns and opening line for OBG patients (the proformas have no sex field)
{
  const f = D + 'format.ts', { s, crlf } = rd(f)
  if (s.includes("c?.subject === 'obg'")) plan.push({ f, note: 'already done' })
  else {
    const o1 = "  if (c?.id === 'paed-newborn') return { Sub: 'The baby', sub: 'the baby' }\n"
    const o2 = "  const sex = arr(p.sex ?? ans.sex)[0]\n  const occ = get('occupation')"
    if (!s.includes(o1) || !s.includes(o2)) { console.log('ANCHOR NOT FOUND in format.ts. Nothing changed.'); process.exit(1) }
    let n = s.replace(o1, o1 + "  if (c?.subject === 'obg' && !sex) return { Sub: 'She', sub: 'she' }\n")
    n = n.replace(o2, "  const sex = arr(p.sex ?? ans.sex)[0] || (c.subject === 'obg' ? 'Female' : '')\n  const occ = get('occupation')")
    plan.push({ f, s: n, crlf })
  }
}
// 4. types.ts: subject blurb
{
  const f = D + 'types.ts', { s, crlf } = rd(f)
  const o = "blurb: 'Gynaecology and antenatal cases'"
  if (!s.includes(o)) plan.push({ f, note: s.includes('antenatal, labour') ? 'already done' : 'blurb not found, skipped' })
  else plan.push({ f, s: s.replace(o, "blurb: 'Gynaecology, antenatal, labour, postnatal, high-risk pregnancy, early pregnancy bleeding, prolapse and infertility'"), crlf })
}
// new files
const here = path.dirname(process.argv[1] || '.')
const src = (n) => { const p = path.join(here, 'obg-files', n); if (!fs.existsSync(p)) { console.log('MISSING ' + p); process.exit(1) } return fs.readFileSync(p, 'utf8') }
const newFiles = ['cases-obg.ts', 'insights-obg.ts'].map((n) => ({ f: D + n, s: src(n) }))
// write everything only after all anchors passed
for (const p of plan) { if (p.s !== undefined) { wr(p.f, p.s, p.crlf); console.log('updated ' + p.f) } else console.log(p.f + ': ' + p.note) }
for (const n of newFiles) { fs.writeFileSync(n.f, n.s); console.log('wrote ' + n.f) }
console.log('DONE. Now run: rm -rf .next && npx tsc --noEmit && echo TSC-OK')
