// Run once from the project folder:  node apply-affiliate.js
// Connects the new commission to the payment code and removes the old monthly-plan commission.
// It checks every change first and writes nothing if any file looks different from what is expected.
const fs = require('fs')

const read = (p) => fs.readFileSync(p, 'utf8')
const problems = []
const writes = []

function replaceOnce(src, from, to, label) {
  const n = src.split(from).length - 1
  if (n !== 1) { problems.push(`${label}: expected 1 match, found ${n}`); return src }
  return src.replace(from, to)
}

// 1) Payment code: pay the commission when a plan is activated
{
  const p = 'src/lib/plan-server.ts'
  let s = read(p)
  if (s.includes('creditPlanReferral')) {
    console.log('plan-server.ts already patched, skipping')
  } else {
    s = replaceOnce(s, "import { SKUS, computeActivation", "import { creditPlanReferral } from '@/lib/affiliate-server'\nimport { SKUS, computeActivation", 'plan-server import')
    s = replaceOnce(
      s,
      "  if (!(await claimOrder(orderId, uid))) return { plan: sku.plan, already: true }",
      "  // Pays the affiliate who referred this student (once, and never for the upgrade). Never blocks the plan itself.\n" +
        "  const payCommission = async () => {\n" +
        "    if (sku.id === 'upgrade') return\n" +
        "    try { await creditPlanReferral(uid, sku.plan, orderId, paymentId) } catch (e: any) { console.error('[AFFILIATE] credit failed:', e?.message) }\n" +
        "  }\n\n" +
        "  if (!(await claimOrder(orderId, uid))) { await payCommission(); return { plan: sku.plan, already: true } }",
      'plan-server claim'
    )
    s = replaceOnce(
      s,
      "    await writePlan(uid, act.plan, act.planExpiresAt, orderId, paymentId)\n    return { plan: act.plan, already: false }",
      "    await writePlan(uid, act.plan, act.planExpiresAt, orderId, paymentId)\n    await payCommission()\n    return { plan: act.plan, already: false }",
      'plan-server write'
    )
    writes.push([p, s])
  }
}

// 2) Webhook: remove the old monthly commission (29 / 59 after two charges)
{
  const p = 'src/app/api/payments/webhook/route.ts'
  let s = read(p)
  if (s.includes('creditReferralIfApplicable')) {
    const fnRe = /const PLAN_COMMISSION[^\n]*\n+async function creditReferralIfApplicable[\s\S]*?\n}\n/
    if (!fnRe.test(s)) problems.push('webhook: could not find the old commission function')
    else s = s.replace(fnRe, '')
    const callRe = /^[ \t]*await creditReferralIfApplicable\([^\n]*\)[ \t]*;?\n/m
    if (!callRe.test(s)) problems.push('webhook: could not find the call to the old commission function')
    else s = s.replace(callRe, '')
    if (s.includes('creditReferralIfApplicable') || s.includes('PLAN_COMMISSION')) problems.push('webhook: old commission code still present after removal')
  } else {
    console.log('webhook old commission already removed')
  }
  // drop the database import if nothing else in the file uses it
  if (!/neon\(|sql`/.test(s)) s = s.replace(/^import \{ neon \} from ['"]@neondatabase\/serverless['"];?\n/m, '')
  if (s !== read(p)) writes.push([p, s])
}

// 3) Signup: send the student's login token so nobody can attach someone else's account
{
  const p = 'src/app/signup/page.tsx'
  let s = read(p)
  if (s.includes('idToken:')) {
    console.log('signup already patched, skipping')
  } else {
    s = replaceOnce(s, 'referredUserId: userCredential.user.uid,', 'idToken: await userCredential.user.getIdToken(),', 'signup (email)')
    s = replaceOnce(s, 'referredUserId: pendingGoogleUser.uid,', 'idToken: await pendingGoogleUser.getIdToken(),', 'signup (google)')
    writes.push([p, s])
  }
  // find the name of the link parameter the signup page already reads (usually ref)
  const m = s.match(/const\s+ref\s*=\s*[^;\n]*?\.get\(\s*['"]([^'"]+)['"]\s*\)/) || s.match(/\.get\(\s*['"]([^'"]+)['"]\s*\)/)
  global.REF_PARAM = m ? m[1] : 'ref'
}

// 4) Note packs no longer pay a commission
{
  const p = 'src/app/api/notepacks/verify/route.ts'
  let s = read(p)
  if (s.includes('PRODUCT_REFERRAL_COMMISSION <= 0')) {
    console.log('notepacks already patched, skipping')
  } else {
    s = replaceOnce(
      s,
      'async function creditProductReferralIfApplicable(userId: string, packId: string, packTitle: string, paymentId: string) {',
      'async function creditProductReferralIfApplicable(userId: string, packId: string, packTitle: string, paymentId: string) {\n  if (PRODUCT_REFERRAL_COMMISSION <= 0) return // affiliates earn only the flat plan commission',
      'notepacks'
    )
    writes.push([p, s])
  }
}

if (problems.length) {
  console.error('\nNOTHING WAS CHANGED. These did not match what I expected:')
  problems.forEach((x) => console.error(' -', x))
  console.error('\nPaste this output to Claude.')
  process.exit(1)
}

for (const [p, s] of writes) { fs.writeFileSync(p, s); console.log('updated', p) }
fs.writeFileSync('src/lib/affiliate-link.ts', `// Name of the link parameter the signup page reads, e.g. /signup?${global.REF_PARAM}=CODE\nexport const REF_PARAM = '${global.REF_PARAM}'\n`)
console.log('wrote src/lib/affiliate-link.ts (link parameter: ' + global.REF_PARAM + ')')
console.log('\nDONE.')
