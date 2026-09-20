export const dynamic = "force-dynamic"
export const maxDuration = 280

import { NextRequest, NextResponse } from 'next/server'
import { verifyIdToken, getAdminFirestore } from '@/lib/firebase-admin'
import { continueTruncatedTopic } from '@/ai/notes-repair'

/**
 * Repairs ONE truncated topic within an existing AI Notes Generator chapter - asks the
 * model to continue exactly where the cut-off text stops (not regenerate from scratch),
 * then writes the merged, completed markdown back into the same topic slot. Up to a
 * few continuation rounds in case one pass still isn't enough for a very long topic.
 *
 * Usage: POST { idToken, subjectId, textbookId, chapterId, topicIndex }
 */
export async function POST(req: NextRequest) {
  try {
    const { idToken, subjectId, textbookId, chapterId, topicIndex } = await req.json()
    if (!idToken || !subjectId || !textbookId || !chapterId || topicIndex === undefined) {
      return NextResponse.json({ error: 'Missing idToken, subjectId, textbookId, chapterId, or topicIndex.' }, { status: 400 })
    }

    const decoded = await verifyIdToken(idToken)
    const db = getAdminFirestore()
    const userDoc = await db.collection('users').doc(decoded.uid).get()
    if (userDoc.data()?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const docKey = `${textbookId}__${chapterId}`
    const notesRef = db.collection('subjects').doc(subjectId).collection('textNotes').doc(docKey)
    const notesDoc = await notesRef.get()
    if (!notesDoc.exists) {
      return NextResponse.json({ error: 'Notes doc not found.' }, { status: 404 })
    }
    const notes = notesDoc.data() as any
    const topics = notes.topics || []
    const topic = topics[topicIndex]
    if (!topic) {
      return NextResponse.json({ error: 'Topic index out of range - the notes doc may have changed since this was scanned.' }, { status: 404 })
    }

    const subjectDoc = await db.collection('subjects').doc(subjectId).get()
    const subjectName = subjectDoc.data()?.name || subjectId
    const chapterTitle = notes.chapterTitle || chapterId

    let merged: string = topic.markdown || ''
    const originalLength = merged.length
    let stillTruncated = true
    const MAX_ROUNDS = 3
    let lastError: string | undefined

    for (let round = 0; round < MAX_ROUNDS && stillTruncated; round++) {
      const result = await continueTruncatedTopic(subjectName, chapterTitle, topic.name, merged)
      if (result.error && result.markdown === merged) {
        lastError = result.error
        break // this round made no progress at all - stop rather than loop uselessly
      }
      merged = result.markdown
      stillTruncated = result.stillTruncated
    }

    if (merged.length === originalLength) {
      return NextResponse.json({ error: lastError || 'Continuation made no progress on this topic.' }, { status: 500 })
    }

    const updatedTopics = [...topics]
    updatedTopics[topicIndex] = { ...topic, markdown: merged }
    await notesRef.update({ topics: updatedTopics })

    return NextResponse.json({
      success: true,
      stillTruncated,
      addedChars: merged.length - originalLength,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Repair failed', stack: e.stack }, { status: 500 })
  }
}
