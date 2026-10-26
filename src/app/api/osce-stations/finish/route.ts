export const dynamic = "force-dynamic"
export const maxDuration = 120

import { isClinician } from '@/lib/require-clinician'
import { NextRequest, NextResponse } from 'next/server'
import { verifyIdToken } from '@/lib/firebase-admin'
import { generateFinalAssessment, type CaseBrief } from '@/ai/osce-live-case'

export async function POST(req: NextRequest) {
  try {
    const { idToken, brief, transcript, studentPresentation, language } = await req.json()
    if (!idToken || !brief || !transcript?.trim()) {
      return NextResponse.json({ error: 'Missing idToken, brief, or transcript' }, { status: 400 })
    }

    const __who = await verifyIdToken(idToken)
    if (!(await isClinician(__who.uid))) return NextResponse.json({ error: 'Virtual Patient is part of the Clinician plan. Upgrade to continue.', needsPlan: true }, { status: 403 })

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
