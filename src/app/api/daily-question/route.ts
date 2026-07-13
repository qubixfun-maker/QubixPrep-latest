export const dynamic = "force-dynamic"
import { NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

function getNeon() {
  const url = process.env.NEON_DATABASE_URL
  return url ? neon(url) : null
}

export async function GET() {
  try {
    const sql = getNeon()
    if (!sql) return NextResponse.json({ question: null })

    const countRows = await sql`SELECT COUNT(*)::int AS count FROM questions`
    const total = countRows[0]?.count || 0
    if (total === 0) return NextResponse.json({ question: null })

    const now = new Date()
    const startOfYear = new Date(now.getFullYear(), 0, 0)
    const dayOfYear = Math.floor((now.getTime() - startOfYear.getTime()) / 86400000)
    const offset = dayOfYear % total

    const rows = await sql`
      SELECT id, topic_title, question_text, option1, option2, option3, option4, correct_answer_index, explanation
      FROM questions
      ORDER BY id ASC
      LIMIT 1 OFFSET ${offset}
    `
    const q = rows[0]
    if (!q) return NextResponse.json({ question: null })

    return NextResponse.json({ question: q })
  } catch (e: any) {
    return NextResponse.json({ question: null, error: e.message }, { status: 200 })
  }
}
