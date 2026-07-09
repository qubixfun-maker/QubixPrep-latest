export function generateAffiliateCode(userId: string): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = 'QBX'
  for (let i = 0; i < 5; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

export const AFFILIATE_COMMISSION = {
  basic: 29,
  pro: 59,
}

export const MIN_PAYOUT = 500
