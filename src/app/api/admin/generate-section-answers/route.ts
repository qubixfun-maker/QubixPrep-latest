export const dynamic = "force-dynamic"
export const maxDuration = 60

import { NextRequest, NextResponse } from 'next/server'
import { getAdminFirestore } from '@/lib/firebase-admin'
import { generateGroundedAnswer, type SectionType } from '@/ai/grounded-answer-generator'
import { answerTextToHtml, rebuildQaHtml } from '@/ai/grounded-answer-utils'

/**
 * Generates a grounded answer for ONE real exam question at a time, using the chapter's
 * already-extracted knowledge. Deliberately one-at-a-time rather than a whole section in
 * one request - a batch of many questions (each its own AI call, some with retries) can
 * exceed the platform's real execution time limit, the same failure mode discovered with
 * the knowledge/notes pipeline. Each call appends to a plain "items" array stored
 * alongside the HTML, so no server-side HTML parsing is ever needed to resume - the next
 * call just reads that array, appends, and rebuilds the HTML from it.
 *
 * Stores results in the SAME format the existing long-answers admin page uses
 * (subjects/{subjectId}/essayChapters/{chapterId}/sections/{sectionType}), so answers
 * generated this way display correctly in the existing viewer with no changes there.
 *
 * Usage: POST { secret, subjectId, chapterId, chapterTitle, sectionType, question, useGeminiNative? }
 */
export async function POST(req: NextRequest) {
  try {
    const { secret, subjectId, chapterId, chapterTitle, sectionType, question, useGeminiNative, useClaude } = await req.json()

    const expectedSecret = process.env.ADMIN_BULK_SECRET
    if (!expectedSecret) {
      return NextResponse.json({ error: 'ADMIN_BULK_SECRET is not configured on the server.' }, { status: 500 })
    }
    if (secret !== expectedSecret) {
      return NextResponse.json({ error: 'Invalid secret.' }, { status: 403 })
    }
    if (!subjectId || !chapterId || !sectionType || !question) {
      return NextResponse.json({ error: 'Missing subjectId, chapterId, sectionType, or question.' }, { status: 400 })
    }
    if (!['long-essays', 'short-essays', 'short-answers'].includes(sectionType)) {
      return NextResponse.json({ error: `Invalid sectionType: ${sectionType}` }, { status: 400 })
    }

    const db = getAdminFirestore()

    const knowledgeDoc = await db.collection('subjects').doc(subjectId).collection('chapterKnowledge').doc(chapterId).get()
    if (!knowledgeDoc.exists) {
      return NextResponse.json({ error: `No chapterKnowledge found for ${subjectId}/${chapterId}. Run knowledge extraction first.` }, { status: 404 })
    }
    const knowledge = knowledgeDoc.data() as any

    const chapterRef = db.collection('subjects').doc(subjectId).collection('essayChapters').doc(chapterId)
    const sectionRef = chapterRef.collection('sections').doc(sectionType)

    // Skip if this exact question is already answered - makes a re-run of the same
    // question list safely resumable, same pattern as the knowledge/notes pipeline.
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

    await chapterRef.set({ title: chapterTitle || chapterId, subjectId, updatedAt: new Date().toISOString() }, { merge: true })
    await sectionRef.set({
      sectionType,
      html: finalHtml,
      items: newItems,
      questionCount: newItems.length,
      updatedAt: new Date().toISOString(),
    })
    await chapterRef.set({ [`sectionCounts.${sectionType}`]: newItems.length }, { merge: true })

    return NextResponse.json({
      success: true,
      questionCount: newItems.length,
      answerLength: result.answer.length,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Processing failed', stack: e.stack }, { status: 500 })
  }
}
