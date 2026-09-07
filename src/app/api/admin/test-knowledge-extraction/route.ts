export const dynamic = "force-dynamic"
export const maxDuration = 300

import { NextRequest, NextResponse } from 'next/server'
import { verifyIdToken, getAdminFirestore } from '@/lib/firebase-admin'
import { getChapterKnowledge } from '@/ai/chapter-knowledge'

/**
 * ISOLATED TEST ROUTE - not wired into any student-facing or admin-facing feature.
 *
 * Exists to prove the knowledge extraction layer (and the Claude provider it can now use)
 * actually works against a real chapter in production, before it's connected to anything
 * that matters. If this breaks, nothing else breaks with it - that's the whole point.
 *
 * Usage: POST { idToken, textbookId, chapterId, subjectName, useClaude }
 */
export async function POST(req: NextRequest) {
  try {
    const { idToken, textbookId, chapterId, subjectName, useClaude } = await req.json()

    if (!idToken || !textbookId || !chapterId || !subjectName) {
      return NextResponse.json({ error: 'Missing idToken, textbookId, chapterId, or subjectName' }, { status: 400 })
    }

    const decoded = await verifyIdToken(idToken)
    const db = getAdminFirestore()

    const userDoc = await db.collection('users').doc(decoded.uid).get()
    if (userDoc.data()?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const chapterDoc = await db.collection('textbooks').doc(textbookId).collection('chapters').doc(chapterId).get()
    if (!chapterDoc.exists) {
      return NextResponse.json({ error: `Chapter not found: textbooks/${textbookId}/chapters/${chapterId}` }, { status: 404 })
    }
    const chapterData = chapterDoc.data()!
    const textbookDoc = await db.collection('textbooks').doc(textbookId).get()
    const textbookTitle = textbookDoc.data()?.title || textbookId

    const startedAt = Date.now()
    const result = await getChapterKnowledge({
      sources: [{
        textbookTitle,
        chapterTitle: chapterData.title || chapterId,
        text: chapterData.text || '',
      }],
      subjectName,
      useClaude: !!useClaude,
    })
    const elapsedMs = Date.now() - startedAt

    return NextResponse.json({
      elapsedMs,
      usedClaude: !!useClaude,
      chapterTitle: chapterData.title,
      sourceTextLength: (chapterData.text || '').length,
      result,
    })
  } catch (e: any) {
    // Surface the real error - this route exists specifically to diagnose failures,
    // so a generic message would defeat the purpose.
    return NextResponse.json({ error: e.message || 'Test extraction failed', stack: e.stack }, { status: 500 })
  }
}
