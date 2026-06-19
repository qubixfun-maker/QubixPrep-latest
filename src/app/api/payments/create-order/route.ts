export const dynamic = "force-dynamic"

import { NextResponse } from 'next/server'
import Razorpay from 'razorpay'

export async function POST(req: Request) {
  const { amount, planId, userId } = await req.json()

  console.log('[CREATE-ORDER] Request:', { amount, planId, userId })

  if (!amount || !planId || !userId) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    console.error('[CREATE-ORDER] Missing Razorpay env vars', {
      hasKeyId: !!process.env.RAZORPAY_KEY_ID,
      hasKeySecret: !!process.env.RAZORPAY_KEY_SECRET
    })
    return NextResponse.json({ error: 'Razorpay credentials not configured on server' }, { status: 500 })
  }

  const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  })

  const options = {
    amount,
    currency: 'INR',
    receipt: `receipt_${planId}_${userId}`.slice(0, 40),
    payment_capture: 1,
    notes: {
      planId,
      userId
    }
  }

  try {
    const order = await razorpay.orders.create(options)
    console.log('[CREATE-ORDER] Order created:', order.id)
    return NextResponse.json({ orderId: order.id, currency: order.currency })
  } catch (error: any) {
    console.error('[CREATE-ORDER] Razorpay order creation failed:', error.message, error.error || error)
    return NextResponse.json({
      error: error.error?.description || error.message || 'Something went wrong'
    }, { status: 500 })
  }
}
