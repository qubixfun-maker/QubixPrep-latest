export const dynamic = "force-dynamic"
export const maxDuration = 300

import { NextRequest, NextResponse } from 'next/server'
import { verifyIdToken, getAdminFirestore } from '@/lib/firebase-admin'
import { generateChapterNotesFromKnowledge } from '@/ai/chapter-notes-from-knowledge'

// Notes generated this way have no source textbook, so they're filed under a fixed
// synthetic textbookId ("ai-generated") - this keeps them compatible with the existing
// /notes/{subjectId}/{textbookId}/{chapterId} viewer routes and textNotes doc-key
// convention (${textbookId}__${chapterId}) without any changes to that viewer.
const AI_GENERATED_TEXTBOOK_ID = 'ai-generated'

function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'chapter'
}

export async function POST(req: NextRequest) {
  try {
    const { idToken, subjectId, chapterTitle } = await req.json()
    if (!idToken || !subjectId || !chapterTitle?.trim()) {
      return NextResponse.json({ error: 'Missing idToken, subjectId, or chapterTitle' }, { status: 400 })
    }

    const decoded = await verifyIdToken(idToken)
    const db = getAdminFirestore()
    const userDoc = await db.collection('users').doc(decoded.uid).get()
    if (userDoc.data()?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const subjectDoc = await db.collection('subjects').doc(subjectId).get()
    const subjectName = subjectDoc.exists ? (subjectDoc.data() as any)?.name || subjectId : subjectId

    const result = await generateChapterNotesFromKnowledge(subjectName, chapterTitle.trim())
    if (result.error || !result.topics) {
      return NextResponse.json({ error: result.error || 'Notes generation failed' }, { status: 500 })
    }

    const chapterId = slugify(chapterTitle.trim())
    const jobKey = `${AI_GENERATED_TEXTBOOK_ID}__${chapterId}`

    await db.collection('subjects').doc(subjectId).collection('textNotes').doc(jobKey).set({
      chapterId,
      textbookId: AI_GENERATED_TEXTBOOK_ID,
      chapterTitle: chapterTitle.trim(),
      subjectId,
      topics: result.topics,
      topicCount: result.topics.length,
      updatedAt: new Date().toISOString(),
    })

    return NextResponse.json({ success: true, topicCount: result.topics.length, textbookId: AI_GENERATED_TEXTBOOK_ID, chapterId })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Notes generation failed', stack: e.stack }, { status: 500 })
  }
}
