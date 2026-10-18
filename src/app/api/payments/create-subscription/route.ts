export const dynamic = "force-dynamic"

import { NextResponse } from 'next/server'
import Razorpay from 'razorpay'

// The only plan on sale: Scholar, Rs 999 per year. Create a plan in the Razorpay
// dashboard (Billing period: Yearly, every 1 year, Rs 999) and put its ID in the
// RAZORPAY_YEARLY_PLAN_ID environment variable. Old monthly plans are no longer sold.
function getPlanIds(): Record<string, string> {
  const yearly = process.env.RAZORPAY_YEARLY_PLAN_ID
  return yearly ? { basic: yearly } : {}
}

export async function POST(req: Request) {
  const { planId, userId, email } = await req.json()

  const PLAN_IDS = getPlanIds()
  if (!process.env.RAZORPAY_YEARLY_PLAN_ID) {
    return NextResponse.json({ error: 'The yearly plan is not set up yet. Please try again later.' }, { status: 503 })
  }
  if (!planId || !userId || !PLAN_IDS[planId]) {
    return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
  }

  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    return NextResponse.json({ error: 'Razorpay credentials not configured' }, { status: 500 })
  }

  const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  })

  try {
    const subscription = await razorpay.subscriptions.create({
      plan_id: PLAN_IDS[planId],
      customer_notify: 1,
      total_count: 10, // 10 yearly renewals (Razorpay requires a count)
      notes: {
        userId,
        planId,
      },
    })

    return NextResponse.json({
      subscriptionId: subscription.id,
    })
  } catch (error: any) {
    console.error('[CREATE-SUBSCRIPTION] Failed:', error.message, error.error || error)
    return NextResponse.json({
      error: error.error?.description || error.message || 'Something went wrong'
    }, { status: 500 })
  }
}
