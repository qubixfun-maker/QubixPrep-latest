export const dynamic = "force-dynamic"
export const maxDuration = 60

import { isClinician } from '@/lib/require-clinician'
import { NextRequest, NextResponse } from 'next/server'
import { verifyIdToken } from '@/lib/firebase-admin'
import { generateVivaResult, type CaseBrief } from '@/ai/osce-live-case'

export async function POST(req: NextRequest) {
  try {
    const { idToken, brief, vivaTranscript, language } = await req.json()
    if (!idToken || !brief || !vivaTranscript?.trim()) {
      return NextResponse.json({ error: 'Missing idToken, brief, or vivaTranscript' }, { status: 400 })
    }

    const __who = await verifyIdToken(idToken)
    if (!(await isClinician(__who.uid))) return NextResponse.json({ error: 'Virtual Patient is part of the Clinician plan. Upgrade to continue.', needsPlan: true }, { status: 403 })

    const { assessment, error } = await generateVivaResult(
      brief as CaseBrief,
      vivaTranscript.trim(),
      typeof language === 'string' && language.trim() ? language.trim() : 'English'
    )
    if (!assessment) {
      return NextResponse.json({ error: error || 'Could not grade the viva. Please try again.' }, { status: 500 })
    }

    return NextResponse.json({ assessment })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to grade viva' }, { status: 500 })
  }
}
