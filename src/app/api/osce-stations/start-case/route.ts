export const dynamic = "force-dynamic"
export const maxDuration = 120

import { isClinician } from '@/lib/require-clinician'
import { NextRequest, NextResponse } from 'next/server'
import { verifyIdToken } from '@/lib/firebase-admin'
import { generateCaseBrief } from '@/ai/osce-live-case'

export async function POST(req: NextRequest) {
  try {
    const { idToken, specialty, topic } = await req.json()
    if (!idToken || !specialty?.trim() || !topic?.trim()) {
      return NextResponse.json({ error: 'Missing idToken, specialty, or topic' }, { status: 400 })
    }

    // Any signed-in user may call this - it's a student-facing study feature, not admin-only.
    const __who = await verifyIdToken(idToken)
    if (!(await isClinician(__who.uid))) return NextResponse.json({ error: 'Virtual Patient is part of the Clinician plan. Upgrade to continue.', needsPlan: true }, { status: 403 })

    const { brief, error } = await generateCaseBrief(specialty.trim(), topic.trim())
    if (!brief) {
      return NextResponse.json({ error: error || 'Could not generate a case right now. Please try again.' }, { status: 500 })
    }

    return NextResponse.json({ brief })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to start case' }, { status: 500 })
  }
}
