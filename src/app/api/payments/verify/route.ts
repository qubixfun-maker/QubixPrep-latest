import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { initializeFirebase } from '@/firebase/client-provider'
import { getFirestore, doc, updateDoc } from 'firebase/firestore'

export async function POST(req: NextRequest) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, userId, planId } = await req.json()

    const body = razorpay_order_id + "|" + razorpay_payment_id
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(body)
      .digest('hex')

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    // Update user plan in Firestore
    const { db } = initializeFirebase()
    await updateDoc(doc(db, 'users', userId), {
      plan: planId,
      planActivatedAt: new Date().toISOString(),
      razorpayPaymentId: razorpay_payment_id
    })

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
