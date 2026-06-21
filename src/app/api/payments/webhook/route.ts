export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { setUserPlanFromSubscription } from '@/lib/firestore-rest'

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
    const userId = subscriptionEntity?.notes?.userId
    const planId = subscriptionEntity?.notes?.planId

    switch (event.event) {
      case 'subscription.activated':
      case 'subscription.charged':
        if (userId && planId) {
          await setUserPlanFromSubscription(userId, planId, subscriptionEntity.id, 'active')
          console.log('[WEBHOOK] Activated plan', planId, 'for user', userId)
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

      default:
        console.log('[WEBHOOK] Unhandled event type:', event.event)
    }

    return NextResponse.json({ success: true })
  } catch (e: any) {
    console.error('[WEBHOOK] FAILED:', e.message, e.stack)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
