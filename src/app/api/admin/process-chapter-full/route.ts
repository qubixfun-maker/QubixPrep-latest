export const dynamic = "force-dynamic"
export const maxDuration = 300

import { NextRequest, NextResponse } from 'next/server'
import { getAdminFirestore } from '@/lib/firebase-admin'
import { getChapterKnowledge } from '@/ai/chapter-knowledge'
import { generateChapterNotes } from '@/ai/chapter-notes-generator'

/**
 * Full per-chapter pipeline for the bulk knowledge/notes rebuild:
 *   1. Read the chapter's raw text from textbooks/{textbookId}/chapters/{chapterId}
 *   2. Extract structured knowledge (getChapterKnowledge) - UNLESS a knowledge record
 *      already exists for this chapter, in which case it's reused as-is. This matters
 *      most for chapters with many topics: a retry after a timeout skips straight to
 *      notes generation, leaving the full time budget for that step alone instead of
 *      re-spending it on an extraction that already succeeded last time.
 *   3. Store that knowledge at subjects/{subjectId}/chapterKnowledge/{chapterId}
 *   4. Generate text notes from the (already-verified) knowledge - never re-reads
 *      raw text, so it can't reintroduce misreadings at this stage
 *   5. Store those notes at subjects/{subjectId}/textNotes/{chapterId}
 *
 * Auth: a shared secret (ADMIN_BULK_SECRET) rather than a Firebase ID token, since a
 * 30-chapter run can outlast a token's ~1hr lifetime. Set this once in Vercel env vars.
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

    // Step 1-3: extract knowledge, or reuse an already-saved extraction if one exists.
    let knowledge: any
    let reusedExistingKnowledge = false
    const existingKnowledgeDoc = await db.collection('subjects').doc(subjectId).collection('chapterKnowledge').doc(chapterId).get()

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

      await db.collection('subjects').doc(subjectId).collection('chapterKnowledge').doc(chapterId).set({
        ...knowledge,
        textbookId,
        updatedAt: new Date().toISOString(),
      })
    }

    // Step 4: generate notes from the already-verified knowledge
    const notesResult = await generateChapterNotes(knowledge, !useClaude, !!useGeminiNative)

    if (notesResult.error || !notesResult.markdown) {
      return NextResponse.json({
        stage: 'notes',
        error: notesResult.error || 'Unknown notes generation error',
        knowledgeStored: true,
      }, { status: 500 })
    }

    // Step 5: store notes
    await db.collection('subjects').doc(subjectId).collection('textNotes').doc(chapterId).set({
      chapterId,
      chapterTitle: chapterData.title || chapterId,
      subjectId,
      markdown: notesResult.markdown,
      topicCount: knowledge.topics.length,
      updatedAt: new Date().toISOString(),
    })

    return NextResponse.json({
      success: true,
      chapterTitle: chapterData.title,
      topicCount: knowledge.topics.length,
      factCount: knowledge.topics.reduce((sum: number, t: any) => sum + (t.facts?.length || 0), 0),
      notesLength: notesResult.markdown.length,
      reusedExistingKnowledge,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Processing failed', stack: e.stack }, { status: 500 })
  }
}
