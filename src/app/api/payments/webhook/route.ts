export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { neon } from '@neondatabase/serverless'
import { setUserPlanFromSubscription } from '@/lib/firestore-rest'

const PLAN_COMMISSION: Record<string, number> = { basic: 29, pro: 59 }

async function creditReferralIfApplicable(userId: string, planId: string, paymentId: string) {
  try {
    const sql = neon(process.env.NEON_DATABASE_URL || "")
    const refs = await sql`SELECT id, affiliate_id, charge_count, charge_history, status FROM referrals WHERE referred_user_id = ${userId} AND status = 'pending'`
    if (refs.length === 0) return

    const ref = refs[0]
    const amount = PLAN_COMMISSION[planId] || 0
    if (amount === 0) return

    const history = Array.isArray(ref.charge_history) ? ref.charge_history : []
    history.push({ amount, planId, paymentId, chargedAt: new Date().toISOString() })
    const newCount = (ref.charge_count || 0) + 1

    if (newCount >= 2) {
      await sql`UPDATE referrals SET charge_count = ${newCount}, charge_history = ${JSON.stringify(history)}::jsonb, plan = ${planId}, amount = ${amount}, status = 'completed' WHERE id = ${ref.id}`
      await sql`UPDATE affiliates SET pending_amount = pending_amount + ${amount}, total_earned = total_earned + ${amount} WHERE id = ${ref.affiliate_id}`
      console.log('[WEBHOOK] Referral completed, credited', amount, 'to affiliate', ref.affiliate_id)
    } else {
      await sql`UPDATE referrals SET charge_count = ${newCount}, charge_history = ${JSON.stringify(history)}::jsonb, plan = ${planId}, amount = ${amount} WHERE id = ${ref.id}`
      console.log('[WEBHOOK] Referral charge', newCount, 'of 2 recorded for referral', ref.id)
    }
  } catch (e: any) {
    console.error('[WEBHOOK] Referral crediting failed:', e.message)
  }
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text()
    const signature = req.headers.get('x-razorpay-signature')

    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET!)
      .update(rawBody)
      .digest('hex')

    if (signature !== expectedSignature) {
      console.error('[WEBHOOK] Invalid signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    const event = JSON.parse(rawBody)
    console.log('[WEBHOOK] Event received:', event.event)

    const subscriptionEntity = event.payload?.subscription?.entity
    const paymentEntity = event.payload?.payment?.entity
    const userId = subscriptionEntity?.notes?.userId
    const planId = subscriptionEntity?.notes?.planId

    switch (event.event) {
      case 'subscription.activated':
      case 'subscription.charged':
        if (userId && planId) {
          await setUserPlanFromSubscription(userId, planId, subscriptionEntity.id, 'active')
          console.log('[WEBHOOK] Activated plan', planId, 'for user', userId)
        }
        if (event.event === 'subscription.charged' && userId && planId) {
          await creditReferralIfApplicable(userId, planId, paymentEntity?.id || subscriptionEntity.id)
        }
        break

      case 'subscription.cancelled':
      case 'subscription.completed':
        if (userId) {
          await setUserPlanFromSubscription(userId, 'free', subscriptionEntity?.id, 'cancelled')
          console.log('[WEBHOOK] Cancelled subscription for user', userId)
        }
        break

      case 'subscription.pending':
      case 'subscription.halted':
        if (userId) {
          await setUserPlanFromSubscription(userId, 'free', subscriptionEntity?.id, 'payment_failed')
          console.log('[WEBHOOK] Payment failed/halted for user', userId)
        }
        break

      case 'subscription.paused':
        if (userId) {
          await setUserPlanFromSubscription(userId, 'free', subscriptionEntity?.id, 'paused')
          console.log('[WEBHOOK] Subscription paused for user', userId)
        }
        break

      default:
        console.log('[WEBHOOK] Unhandled event type:', event.event)
    }

    return NextResponse.json({ success: true })
  } catch (e: any) {
    console.error('[WEBHOOK] FAILED:', e.message, e.stack)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
