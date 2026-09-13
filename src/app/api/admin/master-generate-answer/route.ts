export const dynamic = "force-dynamic"
export const maxDuration = 60

import { NextRequest, NextResponse } from 'next/server'
import { verifyIdToken, getAdminFirestore } from '@/lib/firebase-admin'
import { generateGroundedAnswer, type SectionType } from '@/ai/grounded-answer-generator'
import { answerTextToHtml, rebuildQaHtml } from '@/ai/grounded-answer-utils'

/**
 * Firebase-auth version of generate-section-answers (which uses a shared secret, meant
 * for scripts) - this one is for the admin UI, called directly from a logged-in admin's
 * browser. Processes ONE question at a time (same reasoning as the original: a batch of
 * many questions can exceed the platform's real execution time limit).
 *
 * Usage: POST { idToken, subjectId, textbookId, chapterId, chapterTitle, sectionType, question, useGeminiNative? }
 */
export async function POST(req: NextRequest) {
  try {
    const { idToken, subjectId, textbookId, chapterId, chapterTitle, sectionType, question, useGeminiNative, useClaude } = await req.json()

    if (!idToken || !subjectId || !textbookId || !chapterId || !sectionType || !question) {
      return NextResponse.json({ error: 'Missing idToken, subjectId, textbookId, chapterId, sectionType, or question.' }, { status: 400 })
    }
    if (!['long-essays', 'short-essays', 'short-answers'].includes(sectionType)) {
      return NextResponse.json({ error: `Invalid sectionType: ${sectionType}` }, { status: 400 })
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
      return NextResponse.json({ error: `No chapterKnowledge found for this chapter. Run knowledge extraction first.` }, { status: 404 })
    }
    const knowledge = knowledgeDoc.data() as any

    // essayChapters keeps its existing (bare chapterId) key format, matching the
    // student-facing viewer's URL structure, which was already live before this pipeline.
    const chapterRef = db.collection('subjects').doc(subjectId).collection('essayChapters').doc(chapterId)
    const sectionRef = chapterRef.collection('sections').doc(sectionType)

    const existingSectionDoc = await sectionRef.get()
    const existingItems: { questionHtml: string; answerHtml: string }[] = existingSectionDoc.exists
      ? (existingSectionDoc.data()?.items || [])
      : []
    if (existingItems.some((it) => it.questionHtml === question)) {
      return NextResponse.json({ success: true, skipped: true, reason: 'Already answered' })
    }

    const result = await generateGroundedAnswer(question, sectionType as SectionType, knowledge, { useGeminiNative: !!useGeminiNative, useClaude: !!useClaude })
    if (result.error || !result.answer) {
      return NextResponse.json({ error: result.error || 'Answer generation failed' }, { status: 500 })
    }

    const newItems = [...existingItems, { questionHtml: question, answerHtml: answerTextToHtml(result.answer) }]
    const finalHtml = rebuildQaHtml(newItems)

    await chapterRef.set({ title: chapterTitle || knowledge.chapterTitle, subjectId, updatedAt: new Date().toISOString() }, { merge: true })
    await sectionRef.set({
      sectionType,
      html: finalHtml,
      items: newItems,
      questionCount: newItems.length,
      updatedAt: new Date().toISOString(),
    })
    await chapterRef.set({ [`sectionCounts.${sectionType}`]: newItems.length }, { merge: true })

    return NextResponse.json({ success: true, questionCount: newItems.length, answerLength: result.answer.length })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Processing failed', stack: e.stack }, { status: 500 })
  }
}
