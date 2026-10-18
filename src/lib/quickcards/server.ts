// Server-only helpers for QuickCards. Import only from API routes.
import { verifyIdToken, getAdminFirestore, getAdminStorageBucket } from '@/lib/firebase-admin'
import { getFeature } from './cardFeatures'
import type { FeatureSettings, GateType } from '@/types/quickcards'

export interface QuickCardsUser {
  uid: string | null
  isAdmin: boolean
  plan: 'free' | 'basic' | 'pro'
  addons: string[]
}

const ANONYMOUS: QuickCardsUser = { uid: null, isAdmin: false, plan: 'free', addons: [] }

/** Verifies the token and loads role/plan/add-ons. Returns an anonymous user when no token is sent. */
export async function getQuickCardsUser(idToken?: string | null): Promise<QuickCardsUser> {
  if (!idToken) return ANONYMOUS
  const decoded = await verifyIdToken(idToken)
  const snap = await getAdminFirestore().collection('users').doc(decoded.uid).get()
  const data = snap.data() || {}
  const isAdmin = data.role === 'admin'
  const rawPlan = data.plan
  const plan: QuickCardsUser['plan'] = rawPlan === 'pro' ? 'pro' : rawPlan === 'basic' ? 'basic' : 'free'
  const addons: string[] = Array.isArray(data.quickCardAddons) ? data.quickCardAddons : []
  return { uid: decoded.uid, isAdmin, plan, addons }
}

/** Throws unless the token belongs to an admin. */
export async function requireQuickCardsAdmin(idToken?: string | null): Promise<string> {
  if (!idToken) throw new HttpError(401, 'Authentication required.')
  let user: QuickCardsUser
  try {
    user = await getQuickCardsUser(idToken)
  } catch {
    throw new HttpError(401, 'Invalid or expired session. Please sign in again.')
  }
  if (!user.isAdmin || !user.uid) throw new HttpError(403, 'Admin access required.')
  return user.uid
}

export class HttpError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

export function userMeetsGate(user: QuickCardsUser, gate: GateType, slug: string): boolean {
  if (user.isAdmin) return true
  switch (gate) {
    // QuickCards are subscriber-only: a stored 'free' gate counts as any paid plan.
    case 'free':
    case 'basic':
      return user.plan === 'basic' || user.plan === 'pro'
    case 'pro':
      return user.plan === 'pro'
    case 'addon':
      return user.addons.includes(slug)
  }
}

export async function getFeatureSettingsServer(slug: string): Promise<FeatureSettings> {
  const feature = getFeature(slug)
  const fallback: FeatureSettings = { visible: true, gate: feature?.defaultGate ?? 'basic' }
  const snap = await getAdminFirestore().collection('quickCardSettings').doc(slug).get()
  if (!snap.exists) return fallback
  const d = snap.data() || {}
  const gate: GateType = ['free', 'basic', 'pro', 'addon'].includes(d.gate) ? d.gate : fallback.gate
  return { visible: d.visible !== false, gate }
}

/**
 * Signed URLs expire at a day boundary (24-48h from now) instead of "now + N",
 * so the same card gets the same URL all day and the browser can cache the image.
 */
export async function signStoragePath(path: string): Promise<string> {
  const DAY = 24 * 60 * 60 * 1000
  const expires = (Math.floor(Date.now() / DAY) + 2) * DAY
  const [url] = await getAdminStorageBucket().file(path).getSignedUrl({
    action: 'read',
    expires,
    version: 'v4',
  })
  return url
}
