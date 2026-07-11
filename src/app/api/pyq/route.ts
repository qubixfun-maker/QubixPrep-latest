export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

function getNeon() {
  const url = process.env.NEON_DATABASE_URL
  return url ? neon(url) : null
}

export async function GET(req: NextRequest) {
  try {
    const sql = getNeon()
    if (!sql) return NextResponse.json({ data: [] })

    const examType = req.nextUrl.searchParams.get('exam_type')
    const yearsParam = req.nextUrl.searchParams.get('years')
    const subjectsParam = req.nextUrl.searchParams.get('subjects')
    const countOnly = req.nextUrl.searchParams.get('count_only') === 'true'

    let rows = await sql`SELECT * FROM pyq_questions ORDER BY year DESC, created_at ASC` as any[]

    if (examType) rows = rows.filter(r => r.exam_type === examType)

    if (yearsParam) {
      const years = yearsParam.split(',').map(y => parseInt(y))
      const realYears = years.filter(y => y !== 0)
      const includesRandom = years.includes(0)
      rows = rows.filter(r =>
        (realYears.length > 0 && realYears.includes(r.year)) ||
        (includesRandom && r.year == null)
      )
    }

    if (subjectsParam) {
      const subjects = subjectsParam.split(',')
      rows = rows.filter(r => subjects.includes(r.subject))
    }

    if (countOnly) return NextResponse.json({ count: rows.length })
    return NextResponse.json({ data: rows })
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }) }
}

export async function POST(req: NextRequest) {
  try {
    const sql = getNeon()
    if (!sql) throw new Error('NEON_DATABASE_URL not set')
    const { questions } = await req.json()
    if (!questions || questions.length === 0) return NextResponse.json({ error: 'No questions' }, { status: 400 })
    await sql.transaction(t => questions.map((q: any) => t`
      INSERT INTO pyq_questions (exam_type, year, subject, question_text, option1, option2, option3, option4, correct_answer_index, explanation)
      VALUES (${q.exam_type}, ${q.year}, ${q.subject || null}, ${q.question_text}, ${q.option1}, ${q.option2}, ${q.option3 || null}, ${q.option4 || null}, ${q.correct_answer_index}, ${q.explanation || null})
    `))
    return NextResponse.json({ success: true, count: questions.length })
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }) }
}

export async function PUT(req: NextRequest) {
  try {
    const sql = getNeon()
    if (!sql) throw new Error('NEON_DATABASE_URL not set')
    const body = await req.json()
    const { id } = body
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
    await sql`UPDATE pyq_questions SET
      exam_type = ${body.exam_type},
      year = ${body.year},
      subject = ${body.subject || null},
      question_text = ${body.question_text},
      option1 = ${body.option1},
      option2 = ${body.option2},
      option3 = ${body.option3 || null},
      option4 = ${body.option4 || null},
      correct_answer_index = ${body.correct_answer_index},
      explanation = ${body.explanation || null}
      WHERE id = ${id}`
    return NextResponse.json({ success: true })
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }) }
}

export async function DELETE(req: NextRequest) {
  try {
    const sql = getNeon()
    if (!sql) throw new Error('NEON_DATABASE_URL not set')
    const { id } = await req.json()
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
    await sql`DELETE FROM pyq_questions WHERE id = ${id}`
    return NextResponse.json({ success: true })
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }) }
}
