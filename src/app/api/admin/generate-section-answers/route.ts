export const dynamic = "force-dynamic"
export const maxDuration = 300

import { NextRequest, NextResponse } from 'next/server'
import { getAdminFirestore } from '@/lib/firebase-admin'
import { generateGroundedAnswer, type SectionType } from '@/ai/grounded-answer-generator'
import { answerTextToHtml, rebuildQaHtml } from '@/ai/grounded-answer-utils'

/**
 * Generates grounded answers for a batch of real exam questions belonging to one
 * chapter+section, using that chapter's already-extracted knowledge (from
 * subjects/{subjectId}/chapterKnowledge/{chapterId}) as the only source of truth.
 *
 * Stores results in the SAME format the existing long-answers admin page uses
 * (subjects/{subjectId}/essayChapters/{chapterId}/sections/{sectionType}), so answers
 * generated this way display correctly in the existing viewer with no changes there.
 *
 * Usage: POST { secret, subjectId, chapterId, chapterTitle, sectionType, questions: string[], useGeminiNative? }
 */
export async function POST(req: NextRequest) {
  try {
    const { secret, subjectId, chapterId, chapterTitle, sectionType, questions, useGeminiNative, useClaude } = await req.json()

    const expectedSecret = process.env.ADMIN_BULK_SECRET
    if (!expectedSecret) {
      return NextResponse.json({ error: 'ADMIN_BULK_SECRET is not configured on the server.' }, { status: 500 })
    }
    if (secret !== expectedSecret) {
      return NextResponse.json({ error: 'Invalid secret.' }, { status: 403 })
    }
    if (!subjectId || !chapterId || !sectionType || !Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json({ error: 'Missing subjectId, chapterId, sectionType, or questions[].' }, { status: 400 })
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

    const results: { question: string; ok: boolean; error?: string }[] = []
    const items: { questionHtml: string; answerHtml: string }[] = []

    for (const question of questions as string[]) {
      const result = await generateGroundedAnswer(question, sectionType as SectionType, knowledge, { useGeminiNative: !!useGeminiNative, useClaude: !!useClaude })
      if (result.error || !result.answer) {
        results.push({ question, ok: false, error: result.error })
        continue
      }
      items.push({ questionHtml: question, answerHtml: answerTextToHtml(result.answer) })
      results.push({ question, ok: true })
    }

    if (items.length === 0) {
      return NextResponse.json({ error: 'All questions failed to generate an answer.', results }, { status: 500 })
    }

    const finalHtml = rebuildQaHtml(items)
    const chapterRef = db.collection('subjects').doc(subjectId).collection('essayChapters').doc(chapterId)
    const sectionRef = chapterRef.collection('sections').doc(sectionType)

    await chapterRef.set({ title: chapterTitle || chapterId, subjectId, updatedAt: new Date().toISOString() }, { merge: true })
    await sectionRef.set({
      sectionType,
      html: finalHtml,
      questionCount: items.length,
      updatedAt: new Date().toISOString(),
    })
    await chapterRef.set({ [`sectionCounts.${sectionType}`]: items.length }, { merge: true })

    return NextResponse.json({
      success: true,
      totalQuestions: questions.length,
      answered: items.length,
      failed: questions.length - items.length,
      results,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Processing failed', stack: e.stack }, { status: 500 })
  }
}
