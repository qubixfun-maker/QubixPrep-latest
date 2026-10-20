export const dynamic = "force-dynamic"
export const maxDuration = 60

import { NextRequest, NextResponse } from 'next/server'
import { verifyIdToken } from '@/lib/firebase-admin'
import { vivaTurn } from '@/ai/osce-engine'
import type { OsceBrief } from '@/lib/osce/shared'

export async function POST(req: NextRequest) {
  try {
    const { idToken, brief, plan, studentAnswer, questionNumber } = await req.json()
    if (!idToken || !brief || typeof questionNumber !== 'number') {
      return NextResponse.json({ error: 'Missing idToken, brief, or questionNumber' }, { status: 400 })
    }
    await verifyIdToken(idToken)
    const out = await vivaTurn(brief as OsceBrief, Array.isArray(plan) ? plan : undefined, questionNumber, typeof studentAnswer === 'string' ? studentAnswer : '')
    return NextResponse.json(out)
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to run viva turn' }, { status: 500 })
  }
}
