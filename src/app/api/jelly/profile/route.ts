export const dynamic = "force-dynamic"
export const maxDuration = 30

import { NextRequest, NextResponse } from 'next/server'
import { verifyIdToken } from '@/lib/firebase-admin'
import { planOf, limitFor, getProfile, saveProfile, trackAnswers, forgetAll, usageToday, saveFeedback } from '@/ai/jelly-profile'

export async function POST(req: NextRequest) {
  try {
    const b = await req.json()
    if (!b.idToken) return NextResponse.json({ error: 'Missing idToken' }, { status: 400 })
    const uid = (await verifyIdToken(b.idToken)).uid

    switch (b.action) {
      case 'get': {
        const plan = await planOf(uid)
        const limit = limitFor(plan)
        return NextResponse.json({ profile: await getProfile(uid), usage: { used: await usageToday(uid), limit } })
      }
      case 'save':
        await saveProfile(uid, b.patch || {})
        return NextResponse.json({ profile: await getProfile(uid) })
      case 'track':
        if (Array.isArray(b.items)) await trackAnswers(uid, b.items.map((x: any) => ({ topic: String(x?.topic || ''), correct: !!x?.correct })))
        return NextResponse.json({ ok: true })
      case 'feedback':
        await saveFeedback(uid, { rating: String(b.rating), q: String(b.q || ''), a: String(b.a || ''), persona: String(b.persona || '') })
        return NextResponse.json({ ok: true })
      case 'forget':
        await forgetAll(uid)
        return NextResponse.json({ profile: await getProfile(uid) })
      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
    }
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Profile request failed' }, { status: 500 })
  }
}
