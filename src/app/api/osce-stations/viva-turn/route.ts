export const dynamic = "force-dynamic"
export const maxDuration = 60

import { NextRequest, NextResponse } from 'next/server'
import { verifyIdToken } from '@/lib/firebase-admin'
import { generateVivaTurn, type CaseBrief } from '@/ai/osce-live-case'

export async function POST(req: NextRequest) {
  try {
    const { idToken, brief, caseTranscript, studentPresentation, vivaTranscript, studentAnswer, questionNumber, language } = await req.json()
    if (!idToken || !brief || typeof questionNumber !== 'number') {
      return NextResponse.json({ error: 'Missing idToken, brief, or questionNumber' }, { status: 400 })
    }

    await verifyIdToken(idToken)

    const { message, error } = await generateVivaTurn(
      brief as CaseBrief,
      typeof caseTranscript === 'string' ? caseTranscript : '',
      typeof studentPresentation === 'string' ? studentPresentation : '',
      typeof vivaTranscript === 'string' ? vivaTranscript : '',
      typeof studentAnswer === 'string' ? studentAnswer : '',
      questionNumber,
      typeof language === 'string' && language.trim() ? language.trim() : 'English'
    )
    if (!message) {
      return NextResponse.json({ error: error || 'Could not get the next viva question. Please try again.' }, { status: 500 })
    }

    return NextResponse.json({ message })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to run viva turn' }, { status: 500 })
  }
}
