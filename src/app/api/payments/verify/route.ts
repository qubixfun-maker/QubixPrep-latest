import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { updateUserPlan } from '@/lib/firestore-rest'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, userId, planId } = await req.json()

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !userId || !planId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const body = razorpay_order_id + "|" + razorpay_payment_id
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(body)
      .digest('hex')

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    await updateUserPlan(userId, planId, razorpay_payment_id)

    return NextResponse.json({ success: true })
  } catch (e: any) {
    console.error('[VERIFY] FAILED:', e.message, e.stack)
    return NextResponse.json({ error: e.message, stack: e.stack }, { status: 500 })
  }
}
