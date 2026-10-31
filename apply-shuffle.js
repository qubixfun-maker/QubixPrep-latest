// Idempotent: Ward Round answer options are shuffled every play, so the best option lands in A, B, C or D about 25% each.
const fs = require('fs')
const f = 'src/app/cases/[caseId]/page.tsx'
let s = fs.readFileSync(f, 'utf8')
if (s.includes('shuffleOptions')) { console.log('skip  ', f) } else {
  const a = '  const stages: CaseStage[] = c.stages || []\n'
  if (!s.includes(a)) { console.log('MISSING anchor', f); process.exitCode = 1 } else {
    const b = `  // Fisher-Yates shuffle once per case load, so the best answer is not always option A.
  const shuffleOptions = <T,>(arr: T[]): T[] => { const x = [...arr]; for (let i = x.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [x[i], x[j]] = [x[j], x[i]] } return x }
  const stages: CaseStage[] = useMemo(
    () => ((c.stages || []) as CaseStage[]).map((st) => (st.kind === "sequence" || !Array.isArray(st.options) ? st : { ...st, options: shuffleOptions(st.options) })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [caseData],
  )
`
    s = s.replace(a, b)
    if (!/import \{[^}]*\buseMemo\b[^}]*\} from ["']react["']/.test(s)) s = s.replace(/import \{([^}]*)\} from (["'])react\2/, (m, g, q) => `import {${g.replace(/\s+$/, '')}, useMemo } from ${q}react${q}`)
    fs.writeFileSync(f, s); console.log('edited', f)
  }
}
