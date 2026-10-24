// Affiliate rules. One structure only: a flat commission for the first yearly plan a referred student buys.
// Safe to import from both browser and server code (constants only).

export const PLAN_COMMISSION = 200 // rupees, same for Scholar (999) and Clinician (1,499)

// Kept so older imports keep compiling. Both plans pay the same flat amount.
export const AFFILIATE_COMMISSION = { basic: PLAN_COMMISSION, pro: PLAN_COMMISSION }

// Note-pack sales no longer pay a commission.
export const PRODUCT_REFERRAL_COMMISSION = 0

export const MIN_PAYOUT = 500

export function generateAffiliateCode(userId: string): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = 'QBX'
  for (let i = 0; i < 5; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}
