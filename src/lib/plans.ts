// Single source of truth for what is sold. Prices are in paise (₹1 = 100 paise).
// The server trusts only this table, never an amount sent by the browser.

export type SkuId = 'basic' | 'pro' | 'upgrade'
export type Sku = { id: SkuId; plan: 'basic' | 'pro'; amount: number; label: string }

export const YEAR_MS = 365 * 24 * 60 * 60 * 1000
const DAY_MS = 24 * 60 * 60 * 1000

export const SKUS: Record<SkuId, Sku> = {
  basic: { id: 'basic', plan: 'basic', amount: 99900, label: 'Scholar - 1 year' },
  pro: { id: 'pro', plan: 'pro', amount: 149900, label: 'Clinician - 1 year' },
  upgrade: { id: 'upgrade', plan: 'pro', amount: 50000, label: 'Upgrade Scholar to Clinician' },
}

export type UserPlanInfo = { plan: string; role?: string; planExpiresAt?: number | null }

export function isActive(u: UserPlanInfo, now: number): boolean {
  return u.plan !== 'free' && (!u.planExpiresAt || u.planExpiresAt > now)
}

/** Returns a message if this user may not buy this item right now, otherwise null. */
export function checkCanBuy(u: UserPlanInfo, sku: Sku, now: number): string | null {
  if (u.role === 'admin') return 'Admin accounts already have full access.'
  const active = isActive(u, now)
  if (sku.id === 'upgrade') {
    return active && u.plan === 'basic' ? null : 'The upgrade is only for members with an active Scholar plan.'
  }
  if (!active) return null
  const daysLeft = u.planExpiresAt ? (u.planExpiresAt - now) / DAY_MS : Infinity
  if (daysLeft > 30) return 'You already have an active plan.'
  if (sku.id === 'basic' && u.plan === 'pro') return 'You already have the Clinician plan.'
  return null
}

/** What to write on the user after a successful payment. */
export function computeActivation(u: UserPlanInfo, sku: Sku, now: number): { plan: 'basic' | 'pro'; planExpiresAt?: number } {
  if (sku.id === 'upgrade') {
    return u.planExpiresAt ? { plan: 'pro', planExpiresAt: u.planExpiresAt } : { plan: 'pro' }
  }
  const base = u.planExpiresAt && u.planExpiresAt > now ? u.planExpiresAt : now
  return { plan: sku.plan, planExpiresAt: base + YEAR_MS }
}
