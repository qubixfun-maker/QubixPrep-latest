export const dynamic = "force-dynamic"
export const maxDuration = 800

import { NextRequest, NextResponse } from 'next/server'
import { verifyIdToken, getAdminFirestore } from '@/lib/firebase-admin'
import { generateChapterNotes } from '@/ai/chapter-notes-generator'

export async function POST(req: NextRequest) {
  try {
    const { idToken, subjectId, textbookId, chapterId, chapterTitle, useGeminiNative } = await req.json()

    if (!idToken || !subjectId || !textbookId || !chapterId) {
      return NextResponse.json({ error: 'Missing idToken, subjectId, textbookId, or chapterId.' }, { status: 400 })
    }

    const decoded = await verifyIdToken(idToken)
    const db = getAdminFirestore()
    const userDoc = await db.collection('users').doc(decoded.uid).get()
    if (userDoc.data()?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const docKey = `${textbookId}__${chapterId}`
    const knowledgeDoc = await db.collection('subjects').doc(subjectId).collection('chapterKnowledge').doc(docKey).get()
    if (!knowledgeDoc.exists) {
      return NextResponse.json({ error: 'No chapterKnowledge found for this chapter. Run Master Knowledge Extraction first.' }, { status: 404 })
    }
    const knowledge = knowledgeDoc.data() as any

    const notesResult = await generateChapterNotes(knowledge, true, !!useGeminiNative)
    if (notesResult.error || !notesResult.topics) {
      return NextResponse.json({ error: notesResult.error || 'Notes generation failed' }, { status: 500 })
    }

    await db.collection('subjects').doc(subjectId).collection('textNotes').doc(docKey).set({
      chapterId,
      textbookId,
      chapterTitle: chapterTitle || knowledge.chapterTitle,
      subjectId,
      topics: notesResult.topics,
      topicCount: knowledge.topics.length,
      updatedAt: new Date().toISOString(),
    })

    return NextResponse.json({ success: true, topicCount: notesResult.topics.length })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Notes generation failed', stack: e.stack }, { status: 500 })
  }
}
