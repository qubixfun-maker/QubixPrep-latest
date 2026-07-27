export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { getAdminFirestore } from '@/lib/firebase-admin'
import { FieldValue } from 'firebase-admin/firestore'

export async function POST(req: NextRequest) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, userId, packId } = await req.json()

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !userId || !packId) {
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

    const db = getAdminFirestore()

    await db.collection('users').doc(userId).set({
      purchasedNotePacks: FieldValue.arrayUnion(packId)
    }, { merge: true })

    await db.collection('notePackPurchases').doc(razorpay_payment_id).set({
      userId,
      packId,
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      createdAt: new Date().toISOString()
    })

    return NextResponse.json({ success: true })
  } catch (e: any) {
    console.error('[NOTEPACK-VERIFY] FAILED:', e.message, e.stack)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
