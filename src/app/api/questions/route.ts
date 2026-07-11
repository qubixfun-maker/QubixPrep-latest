export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

function getNeon() {
  const url = process.env.NEON_DATABASE_URL
  return url ? neon(url) : null
}

export async function GET(req: NextRequest) {
  try {
    const subjectId = req.nextUrl.searchParams.get('subject_id')
    const sql = getNeon()
    if (!sql || !subjectId) return NextResponse.json({ data: [] })
    const data = await sql`SELECT * FROM questions WHERE (subject_id = ${subjectId} OR subject_id = ${subjectId.toLowerCase()}) ORDER BY unit_number ASC NULLS LAST, created_at ASC`
    return NextResponse.json({ data })
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }) }
}

export async function POST(req: NextRequest) {
  try {
    const sql = getNeon()
    if (!sql) throw new Error('NEON_DATABASE_URL not set')
    const { questions } = await req.json()
    if (!questions || questions.length === 0) return NextResponse.json({ error: 'No questions' }, { status: 400 })
    await sql.transaction(t => questions.map((q: any) => t`
      INSERT INTO questions (subject_id, unit_title, unit_number, topic_title, question_text, option1, option2, option3, option4, correct_answer_index, explanation)
      VALUES (${q.subject_id}, ${q.unit_title || null}, ${q.unit_number || null}, ${q.topic_title}, ${q.question_text}, ${q.option1}, ${q.option2}, ${q.option3 || null}, ${q.option4 || null}, ${q.correct_answer_index}, ${q.explanation || ''})
    `))
    return NextResponse.json({ success: true, count: questions.length })
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }) }
}

export async function DELETE(req: NextRequest) {
  try {
    const sql = getNeon()
    if (!sql) throw new Error('NEON_DATABASE_URL not set')
    const { subject_id, question_id, topic_title, unit_title } = await req.json()
    if (question_id) {
      await sql`DELETE FROM questions WHERE id = ${parseInt(question_id)}`
    } else if (subject_id && topic_title) {
      await sql`DELETE FROM questions WHERE (subject_id = ${subject_id} OR subject_id = ${subject_id.toLowerCase()}) AND topic_title = ${topic_title}`
    } else if (subject_id && unit_title) {
      await sql`DELETE FROM questions WHERE (subject_id = ${subject_id} OR subject_id = ${subject_id.toLowerCase()}) AND unit_title = ${unit_title}`
    } else if (subject_id) {
      await sql`DELETE FROM questions WHERE (subject_id = ${subject_id} OR subject_id = ${subject_id.toLowerCase()})`
    }
    return NextResponse.json({ success: true })
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }) }
}
