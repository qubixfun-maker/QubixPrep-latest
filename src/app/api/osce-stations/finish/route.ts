export const dynamic = "force-dynamic"
export const maxDuration = 120

import { NextRequest, NextResponse } from 'next/server'
import { verifyIdToken } from '@/lib/firebase-admin'
import { generateFinalAssessment, type CaseBrief } from '@/ai/osce-live-case'

export async function POST(req: NextRequest) {
  try {
    const { idToken, brief, transcript, studentPresentation, language } = await req.json()
    if (!idToken || !brief || !transcript?.trim()) {
      return NextResponse.json({ error: 'Missing idToken, brief, or transcript' }, { status: 400 })
    }

    await verifyIdToken(idToken)

    const { assessment, error } = await generateFinalAssessment(
      brief as CaseBrief,
      transcript.trim(),
      typeof studentPresentation === 'string' ? studentPresentation : '',
      typeof language === 'string' && language.trim() ? language.trim() : 'English'
    )
    if (!assessment) {
      return NextResponse.json({ error: error || 'Could not generate the final assessment. Please try again.' }, { status: 500 })
    }

    return NextResponse.json({ assessment })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to finish case' }, { status: 500 })
  }
}
