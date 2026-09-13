export const dynamic = "force-dynamic"
export const maxDuration = 280

import { NextRequest, NextResponse } from 'next/server'
import { verifyIdToken, getAdminFirestore } from '@/lib/firebase-admin'
import { extractChapterKnowledgeResumable } from '@/ai/resumable-chapter-extraction'

/**
 * Knowledge-extraction ONLY - deliberately does not generate notes, mindmaps,
 * flashcards, or anything else. This is the single "master read" pass over a chapter,
 * producing the structured JSON record that every other feature (built as separate
 * admin pages, reading from this stored record instead of raw text) derives from.
 *
 * Uses the RESUMABLE extraction path - a very large chapter needing several chunks can
 * time out mid-way through one request; progress is saved after every chunk, so a
 * retry (via the admin page's "Retry Failed") resumes from the next unprocessed chunk
 * instead of restarting the whole chapter from scratch.
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

    const existingKnowledgeDoc = await db.collection('subjects').doc(subjectId).collection('chapterKnowledge').doc(docKey).get()
    if (existingKnowledgeDoc.exists) {
      const knowledge = existingKnowledgeDoc.data()!
      return NextResponse.json({
        success: true,
        reused: true,
        chapterTitle: chapterData.title,
        topicCount: knowledge.topics?.length || 0,
        factCount: (knowledge.topics || []).reduce((sum: number, t: any) => sum + (t.facts?.length || 0), 0),
      })
    }

    const progressRef = db.collection('subjects').doc(subjectId).collection('chapterKnowledgeProgress').doc(docKey)

    const knowledgeResult = await extractChapterKnowledgeResumable({
      sources: [{
        textbookTitle,
        chapterTitle: chapterData.title || chapterId,
        text: chapterData.text || '',
      }],
      subjectName,
      useClaude: !!useClaude,
      useGeminiNative: !!useGeminiNative,
    }, progressRef)

    if (knowledgeResult.error || !knowledgeResult.knowledge) {
      const progressNote = knowledgeResult.chunksCompleted
        ? ` (${knowledgeResult.chunksCompleted}/${knowledgeResult.totalChunks} chunks saved - retry will resume from here)`
        : ''
      return NextResponse.json({ error: (knowledgeResult.error || 'Unknown extraction error') + progressNote }, { status: 500 })
    }
    const knowledge = knowledgeResult.knowledge

    await db.collection('subjects').doc(subjectId).collection('chapterKnowledge').doc(docKey).set({
      ...knowledge,
      textbookId,
      chapterId,
      updatedAt: new Date().toISOString(),
    })
    // Extraction fully succeeded - clean up the now-unneeded progress record so a
    // future re-run of this same chapter (e.g. after a "Reset Job") starts fresh
    // rather than reading stale partial progress.
    await progressRef.delete().catch(() => {})

    return NextResponse.json({
      success: true,
      reused: false,
      chapterTitle: chapterData.title,
      topicCount: knowledge.topics.length,
      factCount: knowledge.topics.reduce((sum: number, t: any) => sum + (t.facts?.length || 0), 0),
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Processing failed', stack: e.stack }, { status: 500 })
  }
}
