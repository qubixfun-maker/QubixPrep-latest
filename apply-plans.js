// Idempotent patch for yearly plans: plan expiry, order.paid webhook, locked-down user rules.
const fs = require('fs')

function patch(file, label, edits) {
  let s = fs.readFileSync(file, 'utf8')
  if (edits.done(s)) { console.log(label + ': already patched'); return }
  for (const [a, b] of edits.pairs) {
    const i = s.indexOf(a)
    if (i < 0 || s.indexOf(a, i + 1) >= 0) throw new Error(label + ': could not find exactly one match for: ' + a.slice(0, 70))
    s = s.replace(a, () => b)
  }
  fs.writeFileSync(file, s)
  console.log(label + ': patched')
}

patch('src/hooks/use-plan.ts', 'use-plan', {
  done: (s) => s.includes('planExpiresAt'),
  pairs: [
    [String.raw`  const plan: Plan = isAdmin ? 'pro' : ((profile as any)?.plan || 'free')`,
     String.raw`  const rawPlan: Plan = (profile as any)?.plan || 'free'
  const planExpiresAt = (profile as any)?.planExpiresAt
  const expired = typeof planExpiresAt === 'number' && planExpiresAt < Date.now()
  const plan: Plan = isAdmin ? 'pro' : (expired ? 'free' : rawPlan)`],
    [String.raw`    plan,
    loading,
`,
     String.raw`    plan,
    expiresAt: typeof planExpiresAt === 'number' ? planExpiresAt : null,
    loading,
`],
  ],
})

patch('src/lib/check-plan.ts', 'check-plan', {
  done: (s) => s.includes('planExpiresAt'),
  pairs: [
    [String.raw`  if (role === 'admin') return
  if (plan !== 'pro') {`,
     String.raw`  if (role === 'admin') return
  const expiresAt = Number(fields.planExpiresAt?.integerValue ?? 0)
  if (expiresAt && expiresAt < Date.now()) {
    throw new Error('Your plan has expired. Please renew to continue.')
  }
  if (plan !== 'pro') {`],
  ],
})

patch('src/app/api/payments/webhook/route.ts', 'webhook', {
  done: (s) => s.includes('order.paid'),
  pairs: [
    [String.raw`import { setUserPlanFromSubscription } from '@/lib/firestore-rest'`,
     String.raw`import { setUserPlanFromSubscription } from '@/lib/firestore-rest'
import { fulfillOrder } from '@/lib/plan-server'`],
    [String.raw`    const subscriptionEntity = event.payload?.subscription?.entity`,
     String.raw`    // Yearly plans are paid as one-time orders. This is the safety net if the browser closed after paying.
    if (event.event === 'order.paid') {
      const orderId = event.payload?.order?.entity?.id
      const payId = event.payload?.payment?.entity?.id
      if (orderId && payId) {
        const done = await fulfillOrder(orderId, payId)
        console.log('[WEBHOOK] order.paid', orderId, done.skipped ? 'skipped: ' + done.skipped : done.already ? '(already done)' : '(plan given)')
      }
      return NextResponse.json({ success: true })
    }

    const subscriptionEntity = event.payload?.subscription?.entity`],
  ],
})

// Firestore rules: students must not be able to write their own plan or role.
{
  const f = 'firestore.rules'
  let s = fs.readFileSync(f, 'utf8')
  if (s.includes("'planOrderId'")) {
    console.log('rules: already patched')
  } else {
    const head = s.indexOf('match /users/{userId} {')
    if (head < 0) throw new Error('rules: could not find the users rule')
    const line = '      allow write: if request.auth != null && request.auth.uid == userId;\n'
    const at = s.indexOf(line, head)
    if (at < 0) throw new Error('rules: could not find the users write rule')
    const next = s.indexOf('match /', head + 10)
    if (next >= 0 && at > next) throw new Error('rules: the write rule is not directly inside the users rule')
    const repl = String.raw`      // Plan fields are written only by the server after a verified payment.
      allow create: if request.auth != null && request.auth.uid == userId
        && (!('plan' in request.resource.data) || request.resource.data.plan == 'free')
        && (!('role' in request.resource.data) || request.resource.data.role != 'admin');
      allow update: if request.auth != null && (
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == "admin" ||
        (request.auth.uid == userId
          && !request.resource.data.diff(resource.data).affectedKeys().hasAny(['plan', 'role', 'planExpiresAt', 'planOrderId', 'planPaymentId', 'planUpdatedAt']))
      );
      allow delete: if request.auth != null && (
        request.auth.uid == userId ||
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == "admin"
      );
`
    s = s.slice(0, at) + repl + s.slice(at + line.length)
    fs.writeFileSync(f, s)
    console.log('rules: patched')
  }
}

// The old subscription checkout is no longer sold.
try {
  fs.unlinkSync('src/app/api/payments/create-subscription/route.ts')
  fs.rmdirSync('src/app/api/payments/create-subscription')
  console.log('create-subscription: removed')
} catch (e) { console.log('create-subscription: already removed') }
