export const dynamic = "force-dynamic"

import { NextResponse } from 'next/server'
import Razorpay from 'razorpay'
import { SKUS, checkCanBuy } from '@/lib/plans'
import { verifyIdToken, readUserPlan } from '@/lib/plan-server'

// The price always comes from our own table in src/lib/plans.ts. The browser only says which item it wants.
export async function POST(req: Request) {
  try {
    const { sku: skuId, idToken } = await req.json()
    const sku = (SKUS as any)[skuId]
    if (!sku || !idToken) return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })

    let uid: string
    try { uid = await verifyIdToken(idToken) } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 401 }) }

    const problem = checkCanBuy(await readUserPlan(uid), sku, Date.now())
    if (problem) return NextResponse.json({ error: problem }, { status: 400 })

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return NextResponse.json({ error: 'Razorpay credentials not configured on server' }, { status: 500 })
    }
    const razorpay = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET })
    const order: any = await (razorpay.orders as any).create({
      amount: sku.amount,
      currency: 'INR',
      receipt: `q_${Date.now()}_${uid.slice(0, 8)}`.slice(0, 40),
      payment_capture: 1,
      notes: { userId: uid, sku: sku.id },
    })
    return NextResponse.json({ orderId: order.id, amount: order.amount, currency: order.currency })
  } catch (e: any) {
    console.error('[CREATE-ORDER] failed:', e?.message, e?.error || '')
    return NextResponse.json({ error: e?.error?.description || e?.message || 'Something went wrong' }, { status: 500 })
  }
}
