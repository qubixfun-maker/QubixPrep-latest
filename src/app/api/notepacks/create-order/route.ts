export const dynamic = "force-dynamic"

import { NextResponse } from 'next/server'
import Razorpay from 'razorpay'
import { getAdminFirestore } from '@/lib/firebase-admin'

export async function POST(req: Request) {
  const { packId, userId } = await req.json()

  if (!packId || !userId) {
    return NextResponse.json({ error: 'Missing packId or userId' }, { status: 400 })
  }

  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    return NextResponse.json({ error: 'Razorpay credentials not configured' }, { status: 500 })
  }

  try {
    // Look up the price server-side so a client can never tamper with the amount charged.
    const db = getAdminFirestore()
    const packDoc = await db.collection('notePacks').doc(packId).get()
    if (!packDoc.exists) {
      return NextResponse.json({ error: 'Notes Pack not found' }, { status: 404 })
    }
    const pack = packDoc.data()!
    const amountPaise = Math.round((pack.price || 0) * 100)
    if (amountPaise <= 0) {
      return NextResponse.json({ error: 'Invalid price for this pack' }, { status: 400 })
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    })

    const order = await razorpay.orders.create({
      amount: amountPaise,
      currency: 'INR',
      receipt: `notepack_${packId}_${userId}`.slice(0, 40),
      payment_capture: true,
      notes: { type: 'notepack', packId, userId },
    })

    return NextResponse.json({ orderId: order.id, amount: amountPaise, title: pack.title })
  } catch (error: any) {
    console.error('[NOTEPACK-CREATE-ORDER] Failed:', error.message, error.error || error)
    return NextResponse.json({
      error: error.error?.description || error.message || 'Something went wrong'
    }, { status: 500 })
  }
}
