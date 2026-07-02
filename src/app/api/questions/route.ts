export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'
import { createClient } from '@supabase/supabase-js'

function getNeon() {
  const url = process.env.NEON_DATABASE_URL
  if (!url) return null
  return neon(url)
}

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

export async function GET(req: NextRequest) {
  const subjectId = req.nextUrl.searchParams.get('subject_id')
  if (!subjectId) return NextResponse.json({ error: 'subject_id required' }, { status: 400 })

  try {
    const results: any[] = []

    // Query Neon (new questions)
    const sql = getNeon()
    if (sql) {
      try {
        const neonRows = await sql`
          SELECT * FROM questions
          WHERE subject_id = ${subjectId}
          ORDER BY unit_number ASC NULLS LAST, created_at ASC
        `
        results.push(...neonRows)
      } catch (e) {
        console.warn('Neon query failed:', e)
      }
    }

    // Query Supabase (old questions)
    const supabase = getSupabase()
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('questions')
          .select('*')
          .eq('subject_id', subjectId)
          .order('unit_number', { ascending: true })

        if (!error && data) {
          results.push(...data)
        }
      } catch (e) {
        console.warn('Supabase query failed:', e)
      }
    }

    // Deduplicate by question_text in case same question exists in both
    const seen = new Set<string>()
    const deduped = results.filter(q => {
      const key = q.question_text?.trim().toLowerCase().slice(0, 50)
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })

    return NextResponse.json({ data: deduped })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const sql = getNeon()
    if (!sql) throw new Error('NEON_DATABASE_URL not set')
    const { questions } = await req.json()
    if (!questions?.length) return NextResponse.json({ error: 'No questions' }, { status: 400 })
    for (const q of questions) {
      await sql`
        INSERT INTO questions (subject_id, unit_title, unit_number, topic_title, question_text, option1, option2, option3, option4, correct_answer_index, explanation)
        VALUES (
          ${q.subject_id}, ${q.unit_title || null}, ${q.unit_number || null},
          ${q.topic_title}, ${q.question_text},
          ${q.option1}, ${q.option2}, ${q.option3 || null}, ${q.option4 || null},
          ${q.correct_answer_index}, ${q.explanation || ''}
        )
      `
    }
    return NextResponse.json({ success: true, count: questions.length })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const sql = getNeon()
    if (!sql) throw new Error('NEON_DATABASE_URL not set')
    const { subject_id, topic_title } = await req.json()
    if (topic_title) {
      await sql`DELETE FROM questions WHERE subject_id = ${subject_id} AND topic_title = ${topic_title}`
    } else {
      await sql`DELETE FROM questions WHERE subject_id = ${subject_id}`
    }
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
