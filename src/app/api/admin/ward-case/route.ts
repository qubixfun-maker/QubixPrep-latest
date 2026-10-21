export const dynamic = "force-dynamic"
export const maxDuration = 120

import { NextRequest, NextResponse } from 'next/server'
import { verifyIdToken, getAdminFirestore } from '@/lib/firebase-admin'
import { generateClinicalCase } from '@/ai/flows/ai-case-generator'
import { CASE_TOPICS } from '@/ai/case-topics'

// Admin only: generates ONE of the 100 Ward Round cases and saves it to Firestore.
export async function POST(req: NextRequest) {
  try {
    const { idToken, topicId } = await req.json()
    if (!idToken || !topicId) return NextResponse.json({ error: 'Missing idToken or topicId' }, { status: 400 })
    const decoded = await verifyIdToken(idToken)
    const db = getAdminFirestore()
    const u = await db.collection('users').doc(decoded.uid).get()
    if (u.data()?.role !== 'admin') return NextResponse.json({ error: 'Admins only' }, { status: 403 })

    const t = CASE_TOPICS.find((x) => x.id === topicId)
    if (!t) return NextResponse.json({ error: 'Unknown topic' }, { status: 404 })
    const ref = db.collection('cases').doc(t.id)
    if ((await ref.get()).exists) return NextResponse.json({ ok: true, skipped: true })

    const n = parseInt(t.id.slice(5), 10)
    for (let attempt = 0; attempt < 2; attempt++) {
      const r = await generateClinicalCase({ subject: t.group, topic: t.topic, difficulty: t.difficulty, setting: t.setting })
      if (r.case && r.case.stages?.length === 5) {
        await ref.set({
          ...r.case, id: t.id, specialty: t.group, topic: t.topic,
          tier: n % 4 === 1 ? 'free' : 'paid', order: n, createdAt: new Date().toISOString(),
        })
        return NextResponse.json({ ok: true })
      }
    }
    return NextResponse.json({ error: 'Generation failed twice' }, { status: 502 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed' }, { status: 500 })
  }
}
