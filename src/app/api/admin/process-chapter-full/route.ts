export const dynamic = "force-dynamic"
export const maxDuration = 300

import { NextRequest, NextResponse } from 'next/server'
import { getAdminFirestore } from '@/lib/firebase-admin'
import { getChapterKnowledge } from '@/ai/chapter-knowledge'
import { generateChapterNotes } from '@/ai/chapter-notes-generator'

/**
 * Full per-chapter pipeline for the bulk knowledge/notes rebuild. Auth: a shared secret
 * (ADMIN_BULK_SECRET) rather than a Firebase ID token, since a long run can outlast a
 * token's ~1hr lifetime. Set this once in Vercel env vars.
 *
 * Usage: POST { secret, textbookId, chapterId, subjectId, subjectName, useClaude?, useGeminiNative? }
 */
export async function POST(req: NextRequest) {
  try {
    const { secret, textbookId, chapterId, subjectId, subjectName, useClaude, useGeminiNative } = await req.json()

    const expectedSecret = process.env.ADMIN_BULK_SECRET
    if (!expectedSecret) {
      return NextResponse.json({ error: 'ADMIN_BULK_SECRET is not configured on the server.' }, { status: 500 })
    }
    if (secret !== expectedSecret) {
      return NextResponse.json({ error: 'Invalid secret.' }, { status: 403 })
    }
    if (!textbookId || !chapterId || !subjectId || !subjectName) {
      return NextResponse.json({ error: 'Missing textbookId, chapterId, subjectId, or subjectName.' }, { status: 400 })
    }

    const db = getAdminFirestore()

    const chapterDoc = await db.collection('textbooks').doc(textbookId).collection('chapters').doc(chapterId).get()
    if (!chapterDoc.exists) {
      return NextResponse.json({ error: `Chapter not found: textbooks/${textbookId}/chapters/${chapterId}` }, { status: 404 })
    }
    const chapterData = chapterDoc.data()!
    const textbookDoc = await db.collection('textbooks').doc(textbookId).get()
    const textbookTitle = textbookDoc.data()?.title || textbookId

    let knowledge: any
    let reusedExistingKnowledge = false
    const docKey = `${textbookId}__${chapterId}`
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
