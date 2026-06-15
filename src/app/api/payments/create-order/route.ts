import { NextRequest, NextResponse } from 'next/server'
import Razorpay from 'razorpay'

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
})

export async function POST(req: NextRequest) {
  try {
    const { amount, userId, planId } = await req.json()
    const order = await razorpay.orders.create({
      amount,
      currency: 'INR',
      receipt: `receipt_${userId}_${planId}_${Date.now()}`,
      notes: { userId, planId }
    })
    return NextResponse.json({ orderId: order.id, currency: order.currency })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
