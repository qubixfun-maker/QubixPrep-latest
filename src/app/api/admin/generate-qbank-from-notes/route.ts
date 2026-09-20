export const dynamic = "force-dynamic"
export const maxDuration = 280

import { NextRequest, NextResponse } from 'next/server'
import { verifyIdToken, getAdminFirestore } from '@/lib/firebase-admin'
import { FieldValue } from 'firebase-admin/firestore'
import { generateQBankFromNotes } from '@/ai/qbank-from-notes'

/**
 * Generates a mastery-oriented MCQ set (one per chapter) by reading a chapter's
 * already-generated NOTES directly, the same way generate-flashcards-from-notes and
 * master-generate-mindmap do - so it works for AI Notes Generator chapters that have
 * no source textbook excerpt at all. Saved to Firestore at
 * subjects/{subjectId}/qbankQuestions/{id} - the same store /api/questions reads from -
 * so it shows up in the app exactly like any other chapter's question set.
 *
 * Usage: POST { idToken, subjectId, textbookId, chapterId, chapterTitle, numQuestions }
 */
export async function POST(req: NextRequest) {
  try {
    const { idToken, subjectId, textbookId, chapterId, chapterTitle, numQuestions } = await req.json()

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
    const notesDoc = await db.collection('subjects').doc(subjectId).collection('textNotes').doc(docKey).get()
    if (!notesDoc.exists) {
      return NextResponse.json({ error: 'No notes found for this chapter. Generate its notes first.' }, { status: 404 })
    }
    const notes = notesDoc.data() as any

    const subjectDoc = await db.collection('subjects').doc(subjectId).get()
    const subjectName = subjectDoc.data()?.name || subjectId

    // Best-effort - some notes-only chapters (AI Notes Generator, no source textbook)
    // have no backing textbook/chapters doc at all, so a missing unit name is fine.
    let unitName: string | undefined
    try {
      const chapterDoc = await db.collection('textbooks').doc(textbookId).collection('chapters').doc(chapterId).get()
      unitName = chapterDoc.data()?.unitName || undefined
    } catch { /* optional */ }

    const title = chapterTitle || notes.chapterTitle || docKey
    const count = Math.min(Math.max(parseInt(numQuestions) || 15, 5), 40)

    const result = await generateQBankFromNotes({
      subject: subjectName,
      unitName,
      chapterTitle: title,
      notesTopics: (notes.topics || []).map((t: any) => ({ name: t.name, markdown: t.markdown })),
      numQuestions: count,
    })

    if (result.error || result.questions.length === 0) {
      return NextResponse.json({ error: result.error || 'No questions generated' }, { status: 500 })
    }

    const questionsRef = db.collection('subjects').doc(subjectId).collection('qbankQuestions')

    // Clear any previously generated set for this chapter before inserting the fresh
    // one, so regenerating a chapter replaces rather than piles onto its old questions.
    const existingSnap = await questionsRef.where('topic_title', '==', title).get()
    if (!existingSnap.empty) {
      const deleteBatch = db.batch()
      existingSnap.docs.forEach((d) => deleteBatch.delete(d.ref))
      await deleteBatch.commit()
    }

    const insertBatch = db.batch()
    for (const q of result.questions) {
      const ref = questionsRef.doc()
      insertBatch.set(ref, {
        unit_title: unitName || null,
        topic_title: title,
        question_text: q.question_text,
        option1: q.option1,
        option2: q.option2,
        option3: q.option3 || null,
        option4: q.option4 || null,
        correct_answer_index: q.correct_answer_index,
        explanation: q.explanation || '',
        createdAt: FieldValue.serverTimestamp(),
      })
    }
    await insertBatch.commit()

    return NextResponse.json({ success: true, count: result.questions.length })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'QBank generation failed', stack: e.stack }, { status: 500 })
  }
}
