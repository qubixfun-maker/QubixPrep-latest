import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, userId, planId } = await req.json()

    console.log('[VERIFY] Incoming request', { razorpay_order_id, razorpay_payment_id, userId, planId })

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !userId || !planId) {
      console.error('[VERIFY] Missing fields', { razorpay_order_id, razorpay_payment_id, razorpay_signature: !!razorpay_signature, userId, planId })
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const body = razorpay_order_id + "|" + razorpay_payment_id
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(body)
      .digest('hex')

    if (expectedSignature !== razorpay_signature) {
      console.error('[VERIFY] Signature mismatch', { expectedSignature, razorpay_signature })
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    console.log('[VERIFY] Signature OK, initializing firebase-admin')

    const { getAdminDb } = await import('@/lib/firebase-admin')
    const adminDb = getAdminDb()

    console.log('[VERIFY] Firebase admin initialized, updating user', userId)

    await adminDb.doc(`users/${userId}`).update({
      plan: planId,
      planActivatedAt: new Date().toISOString(),
      razorpayPaymentId: razorpay_payment_id
    })

    console.log('[VERIFY] Successfully updated plan for', userId)

    return NextResponse.json({ success: true })
  } catch (e: any) {
    console.error('[VERIFY] FAILED:', e.message, e.stack)
    return NextResponse.json({ error: e.message, stack: e.stack }, { status: 500 })
  }
}
