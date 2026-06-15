import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

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

    const { getAdminDb } = await import('@/lib/firebase-admin')
    const adminDb = getAdminDb()
    await adminDb.doc(`users/${userId}`).update({
      plan: planId,
      planActivatedAt: new Date().toISOString(),
      razorpayPaymentId: razorpay_payment_id
    })

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
