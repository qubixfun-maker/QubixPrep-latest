// Server-only helpers for yearly plan purchases. Never import this from a client component.
import Razorpay from 'razorpay'
import { SKUS, computeActivation, type SkuId, type UserPlanInfo } from '@/lib/plans'

function serviceAccount() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
  if (!raw) throw new Error('Server configuration error.')
  return JSON.parse(raw)
}

let cached: { token: string; exp: number } | null = null

async function accessToken(): Promise<string> {
  if (cached && cached.exp > Date.now() + 60_000) return cached.token
  const { SignJWT, importPKCS8 } = await import('jose')
  const sa = serviceAccount()
  const now = Math.floor(Date.now() / 1000)
  const key = await importPKCS8(sa.private_key, 'RS256')
  const jwt = await new SignJWT({ scope: 'https://www.googleapis.com/auth/datastore' })
    .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
    .setIssuedAt(now)
    .setExpirationTime(now + 3600)
    .setIssuer(sa.client_email)
    .setSubject(sa.client_email)
    .setAudience('https://oauth2.googleapis.com/token')
    .sign(key)
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: jwt }),
  })
  const data = await res.json()
  if (!data.access_token) throw new Error('Could not authorise with Firestore.')
  cached = { token: data.access_token, exp: Date.now() + 3300_000 }
  return data.access_token
}

const docsBase = () => `https://firestore.googleapis.com/v1/projects/${serviceAccount().project_id}/databases/(default)/documents`

let jwks: any = null

/** Checks a Firebase login token and returns the user id it belongs to. */
export async function verifyIdToken(idToken: string): Promise<string> {
  const { createRemoteJWKSet, jwtVerify } = await import('jose')
  if (!jwks) jwks = createRemoteJWKSet(new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'))
  const pid = serviceAccount().project_id
  try {
    const { payload } = await jwtVerify(idToken, jwks, { issuer: `https://securetoken.google.com/${pid}`, audience: pid })
    if (!payload.sub) throw new Error('no subject')
    return payload.sub
  } catch {
    throw new Error('Please sign in again.')
  }
}

export async function readUserPlan(uid: string): Promise<UserPlanInfo> {
  const res = await fetch(`${docsBase()}/users/${encodeURIComponent(uid)}`, { headers: { Authorization: `Bearer ${await accessToken()}` } })
  if (res.status === 404) return { plan: 'free' }
  if (!res.ok) throw new Error('Could not read your account. Please try again.')
  const f = (await res.json()).fields || {}
  const exp = f.planExpiresAt?.integerValue ?? f.planExpiresAt?.doubleValue
  return { plan: f.plan?.stringValue || 'free', role: f.role?.stringValue, planExpiresAt: exp ? Number(exp) : null }
}

/** Marks an order as handled. Returns false if it was already handled (so we never give the plan twice). */
async function claimOrder(orderId: string, uid: string): Promise<boolean> {
  const res = await fetch(`${docsBase()}/paymentOrders?documentId=${encodeURIComponent(orderId)}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${await accessToken()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields: { userId: { stringValue: uid }, claimedAt: { integerValue: String(Date.now()) } } }),
  })
  if (res.status === 409) return false
  if (!res.ok) throw new Error('Could not record the payment. Please contact support.')
  return true
}

async function releaseOrder(orderId: string) {
  try {
    await fetch(`${docsBase()}/paymentOrders/${encodeURIComponent(orderId)}`, { method: 'DELETE', headers: { Authorization: `Bearer ${await accessToken()}` } })
  } catch {}
}

async function writePlan(uid: string, plan: string, expiresAt: number | undefined, orderId: string, paymentId: string) {
  const fields: Record<string, any> = {
    plan: { stringValue: plan },
    planOrderId: { stringValue: orderId },
    planPaymentId: { stringValue: paymentId },
    planUpdatedAt: { integerValue: String(Date.now()) },
  }
  const mask = ['plan', 'planOrderId', 'planPaymentId', 'planUpdatedAt']
  if (expiresAt) { fields.planExpiresAt = { integerValue: String(expiresAt) }; mask.push('planExpiresAt') }
  const qs = mask.map((m) => 'updateMask.fieldPaths=' + m).join('&')
  const res = await fetch(`${docsBase()}/users/${encodeURIComponent(uid)}?${qs}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${await accessToken()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields }),
  })
  if (!res.ok) throw new Error('Could not activate your plan. Please contact support.')
}

/**
 * Gives the plan for a paid Razorpay order. Returns skipped (with a reason) when the order is not a valid plan purchase. Safe to call twice (browser and webhook both do):
 * the price is checked against our own table and each order is honoured only once.
 */
export async function fulfillOrder(orderId: string, paymentId: string, expectUid?: string): Promise<{ plan: string; already: boolean; skipped?: string }> {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) throw new Error('Razorpay credentials not configured on server')
  const rz = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET })
  const order: any = await rz.orders.fetch(orderId)
  const payment: any = await rz.payments.fetch(paymentId)

  if (payment.order_id !== orderId) return { plan: '', already: false, skipped: 'This payment does not belong to this order.' }
  if (payment.status !== 'captured' && payment.status !== 'authorized') throw new Error('The payment is not complete yet.')

  const sku = (SKUS as any)[order.notes?.sku as SkuId]
  const uid: string | undefined = order.notes?.userId
  // Orders that are not yearly plans (for example note packs) are left alone; so are mismatches, which must never retry forever.
  if (!sku || !uid) return { plan: '', already: false, skipped: 'Not a plan order.' }
  if (order.amount !== sku.amount || payment.amount !== sku.amount) return { plan: '', already: false, skipped: 'The amount paid does not match the plan price.' }
  if (expectUid && expectUid !== uid) return { plan: '', already: false, skipped: 'This order belongs to a different account.' }

  if (!(await claimOrder(orderId, uid))) return { plan: sku.plan, already: true }
  try {
    const user = await readUserPlan(uid)
    const act = computeActivation(user, sku, Date.now())
    await writePlan(uid, act.plan, act.planExpiresAt, orderId, paymentId)
    return { plan: act.plan, already: false }
  } catch (e) {
    await releaseOrder(orderId)
    throw e
  }
}
