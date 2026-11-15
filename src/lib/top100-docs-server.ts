// Server-only helpers for the Top 100 sheets (HTML files kept in Storage, list kept in Firestore `top100Docs`).
import { verifyIdToken, getAdminFirestore } from '@/lib/firebase-admin'

export class DocError extends Error { constructor(public status: number, msg: string) { super(msg) } }

/** Signed-in member: admin, or on a paid plan that has not expired. */
export async function getMember(idToken?: string | null): Promise<{ uid: string; isAdmin: boolean; paid: boolean; email?: string }> {
  if (!idToken) throw new DocError(401, 'Please sign in.')
  let uid: string
  try { uid = (await verifyIdToken(idToken)).uid } catch { throw new DocError(401, 'Please sign in again.') }
  const x = (await getAdminFirestore().collection('users').doc(uid).get()).data() || {}
  const isAdmin = x.role === 'admin'
  const paidPlan = x.plan === 'basic' || x.plan === 'pro'
  const expiry = Number(x.planExpiresAt)
  const live = !x.planExpiresAt || !Number.isFinite(expiry) || expiry > Date.now()
  return { uid, isAdmin, paid: isAdmin || (paidPlan && live), email: x.email }
}

export const slugify = (s: string) => s.toLowerCase().replace(/\.html?$/i, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80)
