
import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { firestore } from '@/firebase/server-init'

export async function POST(req: Request) {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, userId, planId } = await req.json()

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !userId || !planId) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const body = razorpay_order_id + "|" + razorpay_payment_id
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
    .update(body.toString())
    .digest('hex')

  const isAuthentic = expectedSignature === razorpay_signature

  if (isAuthentic) {
    try {
      const userRef = doc(firestore, 'users', userId)
      await updateDoc(userRef, {
        plan: planId,
        subscriptionId: razorpay_payment_id, // Storing payment_id for reference
        planUpdatedAt: serverTimestamp(),
      })
      return NextResponse.json({ success: true })
    } catch (error) {
      console.error("Firestore update failed:", error)
      return NextResponse.json({ error: 'Failed to update user plan' }, { status: 500 })
    }
  } else {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }
}
