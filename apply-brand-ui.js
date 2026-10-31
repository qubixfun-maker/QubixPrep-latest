#!/usr/bin/env node
// Puts the new shield logo in the sidebar, login, signup and the Terms/Privacy header. Checks first; changes nothing on a mismatch. Safe to run twice.
const fs = require('fs'), path = require('path')
const root = process.cwd()
const fail = (m) => { console.error('\nSTOPPED - nothing was changed.\n' + m + '\n'); process.exit(1) }
const P = (p) => path.join(root, p)
const rd = (p) => { if (!fs.existsSync(P(p))) fail('Missing ' + p + '. Run this from the QubixPrep-latest folder.'); const raw = fs.readFileSync(P(p), 'utf8'); return { crlf: raw.includes('\r\n'), s: raw.replace(/\r\n/g, '\n') } }
const wr = (p, o) => fs.writeFileSync(P(p), o.crlf ? o.s.replace(/\n/g, '\r\n') : o.s)
const count = (s, a) => s.split(a).length - 1
if (!fs.existsSync(P('public/brand/logo-mark-256.png'))) fail('public/brand/logo-mark-256.png is missing. Run install-brand.js (qubix-brand.zip) first.')
const comp = path.join(__dirname, 'brand-ui', 'brand-mark.tsx')
if (!fs.existsSync(comp)) fail('The brand-ui folder is missing. Unzip qubix-brand3.zip into the QubixPrep-latest folder first.')

const steps = []
const edit = (file, pairs, marker, post) => {
  const o = rd(file)
  if (o.s.includes(marker)) return
  for (const [a, b, n] of pairs) if (count(o.s, a) !== (n || 1)) fail(file + ': could not find the expected text (' + a.slice(0, 60).replace(/\n/g, ' ') + '...).')
  for (const [a, b] of pairs) o.s = o.s.split(a).join(b)
  if (post) o.s = post(o.s)
  steps.push(() => wr(file, o))
}

edit('src/components/layout/app-sidebar.tsx', [
  [`          <div className="flex h-[38px] w-[38px] items-center justify-center rounded-[13px] bg-primary text-white shadow-lg shadow-primary/25 shrink-0">
            <Plus className="h-5 w-5" strokeWidth={3} />
          </div>
          <span className="text-[22px] font-black tracking-tight text-primary truncate">QubixPrep</span>
`, `          <BrandLockup />
`],
], 'BrandLockup', (t) => t.replace(/^import /m, 'import { BrandLockup } from "@/components/brand-mark"\nimport '))
edit('src/app/login/page.tsx', [
  [`import { BrainCircuit, Loader2, Mail, Lock, Eye, EyeOff } from "lucide-react"`, `import { Loader2, Mail, Lock, Eye, EyeOff } from "lucide-react"\nimport { BrandMark } from "@/components/brand-mark"`],
  [`<BrainCircuit className="mx-auto h-12 w-12 text-primary" />`, `<BrandMark className="mx-auto h-20 w-auto" />`],
], 'BrandMark')
edit('src/app/signup/page.tsx', [
  [`import { BrainCircuit, Loader2, MessageCircle, CheckCircle2 } from "lucide-react"`, `import { Loader2, MessageCircle, CheckCircle2 } from "lucide-react"\nimport { BrandMark } from "@/components/brand-mark"`],
  [`<BrainCircuit className="mx-auto h-12 w-12 text-primary" />`, `<BrandMark className="mx-auto h-20 w-auto" />`, 2],
], 'BrandMark')
edit('src/components/legal/legal-page.tsx', [
  [`import { BrainCircuit } from "lucide-react"`, `import { BrandMark } from "@/components/brand-mark"`],
  [`<BrainCircuit className="h-4 w-4" /> Back to QubixPrep`, `<BrandMark className="h-6 w-auto" /> Back to QubixPrep`],
], 'BrandMark')
steps.push(() => fs.copyFileSync(comp, P('src/components/brand-mark.tsx')))
steps.forEach((f) => f())
console.log('DONE - the new logo is now in the sidebar, login, signup and legal pages.')
console.log('NEXT: rm -rf .next && npx tsc --noEmit, then commit and push.')
