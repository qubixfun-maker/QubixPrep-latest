export const dynamic = "force-dynamic"
export const maxDuration = 60

import { NextRequest, NextResponse } from 'next/server'
import { verifyIdToken } from '@/lib/firebase-admin'
import { generateExaminerChatReply, type CaseBrief } from '@/ai/osce-live-case'

export async function POST(req: NextRequest) {
  try {
    const { idToken, brief, caseTranscript, studentPresentation, assessmentFeedback, chatTranscript, studentMessage, language } = await req.json()
    if (!idToken || !brief || !studentMessage?.trim()) {
      return NextResponse.json({ error: 'Missing idToken, brief, or studentMessage' }, { status: 400 })
    }

    await verifyIdToken(idToken)

    const { reply, error } = await generateExaminerChatReply(
      brief as CaseBrief,
      typeof caseTranscript === 'string' ? caseTranscript : '',
      typeof studentPresentation === 'string' ? studentPresentation : '',
      typeof assessmentFeedback === 'string' ? assessmentFeedback : '',
      typeof chatTranscript === 'string' ? chatTranscript : '',
      studentMessage.trim(),
      typeof language === 'string' && language.trim() ? language.trim() : 'English'
    )
    if (!reply) {
      return NextResponse.json({ error: error || 'Could not get a response right now. Please try again.' }, { status: 500 })
    }

    return NextResponse.json({ reply })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to get examiner response' }, { status: 500 })
  }
}
