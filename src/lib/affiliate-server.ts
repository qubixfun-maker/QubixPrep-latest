// Server-only. Pays the flat affiliate commission when a referred student buys a yearly plan.
import { neon } from '@neondatabase/serverless'
import { PLAN_COMMISSION } from '@/lib/affiliate'

/**
 * Credits the affiliate who referred this student. Safe to call any number of times:
 * the referral row flips from 'pending' to 'completed' in the same statement that adds
 * the money, so a student can only ever earn their affiliate one commission.
 * Returns true only when money was actually added.
 */
export async function creditPlanReferral(uid: string, plan: string, orderId: string, paymentId: string): Promise<boolean> {
  const sql = neon(process.env.NEON_DATABASE_URL || '')
  const rows = await sql`
    WITH r AS (
      UPDATE referrals
         SET status = 'completed', amount = ${PLAN_COMMISSION}, plan = ${plan},
             order_id = ${orderId}, payment_id = ${paymentId}, credited_at = now()
       WHERE referred_user_id = ${uid} AND status = 'pending'
   RETURNING affiliate_id
    )
    UPDATE affiliates a
       SET pending_amount = a.pending_amount + ${PLAN_COMMISSION},
           total_earned   = a.total_earned   + ${PLAN_COMMISSION}
      FROM r
     WHERE a.id = r.affiliate_id
 RETURNING a.id`
  if (rows.length > 0) console.log('[AFFILIATE] Credited', PLAN_COMMISSION, 'to affiliate', rows[0].id, 'for order', orderId)
  return rows.length > 0
}
