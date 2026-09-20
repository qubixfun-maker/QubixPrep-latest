export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from 'next/server'
import { getAdminFirestore } from '@/lib/firebase-admin'
import { FieldValue, Firestore, Query } from 'firebase-admin/firestore'

// QBank now lives entirely in Firestore, at subjects/{subjectId}/qbankQuestions/{id}.
// This route's request/response shape is kept byte-identical to the old Neon/Supabase
// version on purpose - every other consumer (student practice page, qbank-bulk-generator,
// notes-image-generator, etc.) calls this route rather than the database directly, so
// none of them need to change.

function questionsRef(db: Firestore, subjectId: string) {
  return db.collection('subjects').doc(subjectId).collection('qbankQuestions')
}

export async function GET(req: NextRequest) {
  try {
    const subjectId = req.nextUrl.searchParams.get('subject_id')
    if (!subjectId) return NextResponse.json({ data: [] })

    const db = getAdminFirestore()
    const snap = await questionsRef(db, subjectId).get()

    const rows = snap.docs.map((d) => {
      const data = d.data() as any
      return {
        id: d.id,
        subject_id: subjectId,
        unit_title: data.unit_title ?? null,
        unit_number: data.unit_number ?? null,
        topic_title: data.topic_title,
        question_text: data.question_text,
        option1: data.option1,
        option2: data.option2,
        option3: data.option3 ?? null,
        option4: data.option4 ?? null,
        correct_answer_index: data.correct_answer_index,
        explanation: data.explanation || '',
        created_at: data.createdAt?.toDate?.().toISOString() || null,
      }
    })

    // Same ordering as the old query (unit_number ascending, nulls last, then
    // created_at ascending) - done in-memory since Firestore can't express "nulls
    // last" the way Postgres can in a single orderBy.
    rows.sort((a, b) => {
      const an = a.unit_number ?? Infinity
      const bn = b.unit_number ?? Infinity
      if (an !== bn) return an - bn
      return (a.created_at || '').localeCompare(b.created_at || '')
    })

    return NextResponse.json({ data: rows })
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }) }
}

export async function POST(req: NextRequest) {
  try {
    const { questions } = await req.json()
    if (!questions || questions.length === 0) return NextResponse.json({ error: 'No questions' }, { status: 400 })

    const db = getAdminFirestore()
    // Firestore batched writes cap at 500 - chunk to stay safely under that.
    const BATCH_SIZE = 400
    let written = 0
    for (let i = 0; i < questions.length; i += BATCH_SIZE) {
      const chunk = questions.slice(i, i + BATCH_SIZE)
      const batch = db.batch()
      for (const q of chunk) {
        if (!q.subject_id) continue
        const ref = questionsRef(db, q.subject_id).doc()
        batch.set(ref, {
          unit_title: q.unit_title || null,
          unit_number: q.unit_number || null,
          topic_title: q.topic_title,
          question_text: q.question_text,
          option1: q.option1,
          option2: q.option2,
          option3: q.option3 || null,
          option4: q.option4 || null,
          correct_answer_index: q.correct_answer_index,
          explanation: q.explanation || '',
          createdAt: FieldValue.serverTimestamp(),
        })
        written++
      }
      await batch.commit()
    }
    return NextResponse.json({ success: true, count: written })
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }) }
}

export async function DELETE(req: NextRequest) {
  try {
    const { subject_id, question_id, topic_title, unit_title } = await req.json()
    if (!subject_id) return NextResponse.json({ error: 'subject_id required' }, { status: 400 })

    const db = getAdminFirestore()

    if (question_id) {
      await questionsRef(db, subject_id).doc(question_id).delete()
      return NextResponse.json({ success: true })
    }

    let query: Query = questionsRef(db, subject_id)
    if (topic_title) query = query.where('topic_title', '==', topic_title)
    else if (unit_title) query = query.where('unit_title', '==', unit_title)
    // else: no filter - deletes every question for this subject, matching the old
    // "subject_id alone" behavior.

    const snap = await query.get()
    const BATCH_SIZE = 400
    const docs = snap.docs
    for (let i = 0; i < docs.length; i += BATCH_SIZE) {
      const batch = db.batch()
      docs.slice(i, i + BATCH_SIZE).forEach((d) => batch.delete(d.ref))
      await batch.commit()
    }

    return NextResponse.json({ success: true })
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }) }
}
