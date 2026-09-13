export const dynamic = "force-dynamic"
export const maxDuration = 300

import { NextRequest, NextResponse } from 'next/server'
import { verifyIdToken, getAdminFirestore } from '@/lib/firebase-admin'
import { getChapterKnowledge } from '@/ai/chapter-knowledge'
import { generateChapterNotes } from '@/ai/chapter-notes-generator'

/**
 * Admin-UI-triggered version of the knowledge+notes pipeline - same underlying logic as
 * process-chapter-full, but authenticated with the logged-in admin's own Firebase ID
 * token instead of a shared secret, since this is called directly from a browser
 * session rather than a long-running background script.
 *
 * Storage keys are scoped by textbookId + chapterId (not chapterId alone), since a
 * single subject can draw from multiple textbooks whose chapter IDs could otherwise
 * collide and silently overwrite each other.
 *
 * Usage: POST { idToken, textbookId, chapterId, subjectId, subjectName, useGeminiNative? }
 */
export async function POST(req: NextRequest) {
  try {
    const { idToken, textbookId, chapterId, subjectId, subjectName, useGeminiNative, useClaude } = await req.json()

    if (!idToken || !textbookId || !chapterId || !subjectId || !subjectName) {
      return NextResponse.json({ error: 'Missing idToken, textbookId, chapterId, subjectId, or subjectName.' }, { status: 400 })
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

    const docKey = `${textbookId}__${chapterId}`

    let knowledge: any
    let reusedExistingKnowledge = false
    const existingKnowledgeDoc = await db.collection('subjects').doc(subjectId).collection('chapterKnowledge').doc(docKey).get()

    if (existingKnowledgeDoc.exists) {
      knowledge = existingKnowledgeDoc.data()
      reusedExistingKnowledge = true
    } else {
      const knowledgeResult = await getChapterKnowledge({
        sources: [{
          textbookTitle,
          chapterTitle: chapterData.title || chapterId,
          text: chapterData.text || '',
        }],
        subjectName,
        useClaude: !!useClaude,
        useGeminiNative: !!useGeminiNative,
      })

      if (knowledgeResult.error || !knowledgeResult.knowledge) {
        return NextResponse.json({ stage: 'knowledge', error: knowledgeResult.error || 'Unknown extraction error' }, { status: 500 })
      }
      knowledge = knowledgeResult.knowledge

      await db.collection('subjects').doc(subjectId).collection('chapterKnowledge').doc(docKey).set({
        ...knowledge,
        textbookId,
        chapterId,
        updatedAt: new Date().toISOString(),
      })
    }

    const notesResult = await generateChapterNotes(knowledge, !useClaude, !!useGeminiNative)
    if (notesResult.error || !notesResult.topics) {
      return NextResponse.json({
        stage: 'notes',
        error: notesResult.error || 'Unknown notes generation error',
        knowledgeStored: true,
      }, { status: 500 })
    }

    await db.collection('subjects').doc(subjectId).collection('textNotes').doc(docKey).set({
      chapterId,
      textbookId,
      chapterTitle: chapterData.title || chapterId,
      subjectId,
      topics: notesResult.topics,
      topicCount: knowledge.topics.length,
      updatedAt: new Date().toISOString(),
    })

    return NextResponse.json({
      success: true,
      chapterTitle: chapterData.title,
      topicCount: knowledge.topics.length,
      factCount: knowledge.topics.reduce((sum: number, t: any) => sum + (t.facts?.length || 0), 0),
      notesLength: notesResult.topics.reduce((sum: number, t: any) => sum + t.markdown.length, 0),
      reusedExistingKnowledge,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Processing failed', stack: e.stack }, { status: 500 })
  }
}
