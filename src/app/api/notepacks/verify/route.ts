export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { getAdminFirestore } from '@/lib/firebase-admin'
import { FieldValue } from 'firebase-admin/firestore'
import { neon } from '@neondatabase/serverless'
import { PRODUCT_REFERRAL_COMMISSION } from '@/lib/affiliate'

async function creditProductReferralIfApplicable(userId: string, packId: string, packTitle: string, paymentId: string) {
  try {
    const sql = neon(process.env.NEON_DATABASE_URL || "")
    const refs = await sql`SELECT affiliate_id FROM referrals WHERE referred_user_id = ${userId} LIMIT 1`
    if (refs.length === 0) return

    const affiliateId = refs[0].affiliate_id

    await sql`INSERT INTO product_referrals (affiliate_id, referred_user_id, pack_id, pack_title, amount, payment_id)
      VALUES (${affiliateId}, ${userId}, ${packId}, ${packTitle}, ${PRODUCT_REFERRAL_COMMISSION}, ${paymentId})
      ON CONFLICT (payment_id) DO NOTHING`

    await sql`UPDATE affiliates SET pending_amount = pending_amount + ${PRODUCT_REFERRAL_COMMISSION}, total_earned = total_earned + ${PRODUCT_REFERRAL_COMMISSION} WHERE id = ${affiliateId}`
  } catch (e: any) {
    console.error('[NOTEPACK-VERIFY] Product referral crediting failed:', e.message)
  }
}

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

    // If this is a combo pack, unlock every pack bundled inside it too
    const packDoc = await db.collection('notePacks').doc(packId).get()
    const packData = packDoc.data()
    const idsToUnlock = packData?.packType === 'combo' && Array.isArray(packData.includedPackIds)
      ? [packId, ...packData.includedPackIds]
      : [packId]

    await db.collection('users').doc(userId).set({
      purchasedNotePacks: FieldValue.arrayUnion(...idsToUnlock)
    }, { merge: true })

    await db.collection('notePackPurchases').doc(razorpay_payment_id).set({
      userId,
      packId,
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      createdAt: new Date().toISOString()
    })

    await creditProductReferralIfApplicable(userId, packId, packData?.title || '', razorpay_payment_id)

    return NextResponse.json({ success: true })
  } catch (e: any) {
    console.error('[NOTEPACK-VERIFY] FAILED:', e.message, e.stack)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
