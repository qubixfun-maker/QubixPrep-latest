export const dynamic = "force-dynamic"

import { NextResponse } from 'next/server'
import Razorpay from 'razorpay'

export async function POST(req: Request) {
  const { subscriptionId } = await req.json()

  if (!subscriptionId) {
    return NextResponse.json({ error: 'Missing subscriptionId' }, { status: 400 })
  }

  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    return NextResponse.json({ error: 'Razorpay credentials not configured' }, { status: 500 })
  }

  const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  })

  try {
    // cancel_at_cycle_end = true: user keeps access until the current paid period ends,
    // Razorpay fires 'subscription.cancelled' when that period actually completes,
    // at which point the webhook downgrades them to the free plan.
    await razorpay.subscriptions.cancel(subscriptionId, true)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[CANCEL-SUBSCRIPTION] Failed:', error.message, error.error || error)
    return NextResponse.json({
      error: error.error?.description || error.message || 'Something went wrong'
    }, { status: 500 })
  }
}
