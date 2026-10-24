import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { verifyIdToken, fulfillOrder } from '@/lib/plan-server'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, idToken } = await req.json()
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !idToken) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    let uid: string
    try { uid = await verifyIdToken(idToken) } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 401 }) }

    const expected = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(razorpay_order_id + '|' + razorpay_payment_id)
      .digest('hex')
    if (expected !== razorpay_signature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    const done = await fulfillOrder(razorpay_order_id, razorpay_payment_id, uid)
    if (done.skipped) return NextResponse.json({ error: done.skipped }, { status: 400 })
    return NextResponse.json({ success: true, plan: done.plan })
  } catch (e: any) {
    console.error('[VERIFY] FAILED:', e?.message)
    return NextResponse.json({ error: e?.message || 'Verification failed' }, { status: 500 })
  }
}
