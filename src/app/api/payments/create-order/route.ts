
import { NextResponse } from 'next/server'
import Razorpay from 'razorpay'

export async function POST(req: Request) {
  const { amount, planId, userId } = await req.json()

  if (!amount || !planId || !userId) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
  })

  const options = {
    amount,
    currency: 'INR',
    receipt: `receipt_${planId}_${userId}`,
    notes: {
      planId,
      userId
    }
  }

  try {
    const order = await razorpay.orders.create(options)
    return NextResponse.json({ orderId: order.id, currency: order.currency })
  } catch (error) {
    console.error("Razorpay order creation failed:", error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
