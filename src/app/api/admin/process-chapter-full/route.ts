export const dynamic = "force-dynamic"
export const maxDuration = 300

import { NextRequest, NextResponse } from 'next/server'
import { getAdminFirestore } from '@/lib/firebase-admin'
import { getChapterKnowledge } from '@/ai/chapter-knowledge'
import { generateChapterNotes } from '@/ai/chapter-notes-generator'

/**
 * Full per-chapter pipeline for the bulk knowledge/notes rebuild:
 *   1. Read the chapter's raw text from textbooks/{textbookId}/chapters/{chapterId}
 *   2. Extract structured knowledge (getChapterKnowledge) - now runs on whichever
 *      provider is currently configured (Vertex, using the upgraded Gemini 3.8 Flash
 *      by default, unless useClaude is passed)
 *   3. Store that knowledge at subjects/{subjectId}/chapterKnowledge/{chapterId}
 *   4. Generate text notes from the (already-verified) knowledge - never re-reads
 *      raw text, so it can't reintroduce misreadings at this stage
 *   5. Store those notes at subjects/{subjectId}/textNotes/{chapterId}
 *
 * Auth: a shared secret (ADMIN_BULK_SECRET) rather than a Firebase ID token, since a
 * 30-chapter run can outlast a token's ~1hr lifetime. Set this once in Vercel env vars.
 *
 * Usage: POST { secret, textbookId, chapterId, subjectId, subjectName, useClaude? }
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

    // Step 1-2: extract knowledge
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

    // Step 3: store knowledge
    await db.collection('subjects').doc(subjectId).collection('chapterKnowledge').doc(chapterId).set({
      ...knowledgeResult.knowledge,
      textbookId,
      updatedAt: new Date().toISOString(),
    })

    // Step 4: generate notes from the already-verified knowledge
    const notesResult = await generateChapterNotes(knowledgeResult.knowledge, !useClaude, !!useGeminiNative)

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
      topicCount: knowledgeResult.knowledge.topics.length,
      updatedAt: new Date().toISOString(),
    })

    return NextResponse.json({
      success: true,
      chapterTitle: chapterData.title,
      topicCount: knowledgeResult.knowledge.topics.length,
      factCount: knowledgeResult.knowledge.topics.reduce((sum: number, t: any) => sum + (t.facts?.length || 0), 0),
      notesLength: notesResult.markdown.length,
      knowledgeCached: !!knowledgeResult.cached,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Processing failed', stack: e.stack }, { status: 500 })
  }
}
