export const dynamic = "force-dynamic"

import { NextResponse } from 'next/server'
import Razorpay from 'razorpay'

const PLAN_IDS: Record<string, string> = {
  basic: 'plan_T4BoMfXV9XSdrd',
  pro: 'plan_T4BpKr2lHqJuk9',
}

export async function POST(req: Request) {
  const { planId, userId, email } = await req.json()

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
      total_count: 120,
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
