export const dynamic = "force-dynamic"
export const maxDuration = 60

import { NextRequest, NextResponse } from 'next/server'
import { verifyIdToken } from '@/lib/firebase-admin'
import { generateInCharacterReply, type CaseBrief } from '@/ai/osce-live-case'

export async function POST(req: NextRequest) {
  try {
    const { idToken, brief, transcript, utterance, language } = await req.json()
    if (!idToken || !brief || !utterance?.trim()) {
      return NextResponse.json({ error: 'Missing idToken, brief, or utterance' }, { status: 400 })
    }

    await verifyIdToken(idToken)

    const { reply, error } = await generateInCharacterReply(
      brief as CaseBrief,
      typeof transcript === 'string' ? transcript : '',
      utterance.trim(),
      typeof language === 'string' && language.trim() ? language.trim() : 'English'
    )
    if (!reply) {
      return NextResponse.json({ error: error || 'Could not get a response right now. Please try again.' }, { status: 500 })
    }

    return NextResponse.json({ reply })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to get response' }, { status: 500 })
  }
}
