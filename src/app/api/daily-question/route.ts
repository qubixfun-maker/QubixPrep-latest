export const dynamic = "force-dynamic"
import { NextResponse } from 'next/server'
import { getAdminFirestore } from '@/lib/firebase-admin'

// QBank lives in Firestore at subjects/{subjectId}/qbankQuestions/{id}.
// Pick one question per calendar day (IST) and cache it in memory for that day.
let cache: { day: string; question: any } | null = null

function istDay() {
  const ist = new Date(Date.now() + 5.5 * 3600 * 1000)
  return ist.toISOString().slice(0, 10)
}

export async function GET() {
  try {
    const day = istDay()
    if (cache && cache.day === day && cache.question) return NextResponse.json({ question: cache.question })

    const db = getAdminFirestore()
    const group = db.collectionGroup('qbankQuestions')
    const countSnap = await group.count().get()
    const total = countSnap.data().count || 0
    if (total === 0) return NextResponse.json({ question: null, error: 'No questions found in Firestore qbankQuestions' })

    const dayNum = Math.floor(new Date(day + 'T00:00:00Z').getTime() / 86400000)
    // Try a few consecutive offsets in case a doc lacks options.
    for (let i = 0; i < 5; i++) {
      const offset = (dayNum + i) % total
      const snap = await group.offset(offset).limit(1).get()
      const d = snap.docs[0]
      if (!d) continue
      const q = d.data() as any
      if (!q.question_text || !q.option1 || !q.option2) continue
      const question = {
        id: d.id,
        topic_title: q.topic_title || 'QBank',
        question_text: q.question_text,
        option1: q.option1,
        option2: q.option2,
        option3: q.option3 ?? null,
        option4: q.option4 ?? null,
        correct_answer_index: q.correct_answer_index,
        explanation: q.explanation || '',
      }
      cache = { day, question }
      return NextResponse.json({ question })
    }
    return NextResponse.json({ question: null })
  } catch (e: any) {
    return NextResponse.json({ question: null, error: e.message }, { status: 200 })
  }
}
