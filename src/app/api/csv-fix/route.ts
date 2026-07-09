export const dynamic = "force-dynamic"
export const maxDuration = 60

import { NextRequest, NextResponse } from 'next/server'
import { getGroqClient, GROQ_MODEL } from '@/ai/genkit'

export async function POST(req: NextRequest) {
  try {
    const { questions } = await req.json()

    if (!Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json({ fixed: [], log: [] })
    }

    const groq = getGroqClient()

    const prompt = `You are a medical education data validator for MBBS/NEET-PG exam questions.

For each question object below, check:
1. correct_answer_index must be an integer 0-3 matching which option (0=option1, 1=option2, 2=option3, 3=option4) is actually correct based on the explanation and medical knowledge. If it's wrong or missing, fix it.
2. If explanation is empty or missing, write a concise 2-3 sentence high-yield explanation suitable for NEET-PG prep.
3. Do not change unit_title, unit_number, unit_title, unit_number, topic_title, question_text, option1-4 unless they contain obvious formatting garbage.

Return ONLY a valid JSON array, same length and order as input, with fields: topic_title, question_text, option1, option2, option3, option4, correct_answer_index (integer), explanation, _fixed (true if you changed anything, false otherwise).

No markdown, no code fences, no extra text - just the raw JSON array.

Questions:
${JSON.stringify(questions)}`

    const response = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [{ role: 'user', content: prompt }],
    })

    const raw = response.choices[0]?.message?.content ?? '[]'
    const clean = raw.replace(/```json|```/g, '').trim()

    let fixed
    try {
      fixed = JSON.parse(clean)
    } catch {
      fixed = questions.map((q: any) => ({ ...q, _fixed: false }))
    }

    const log: any[] = []
    fixed.forEach((q: any, i: number) => {
      const orig = questions[i]
      if (q._fixed && orig) {
        if (q.correct_answer_index !== orig.correct_answer_index) {
          log.push({ row: i + 1, field: 'correct_answer_index', before: String(orig.correct_answer_index), after: String(q.correct_answer_index) })
        }
        if (q.explanation !== orig.explanation) {
          log.push({ row: i + 1, field: 'explanation', before: (orig.explanation || '(empty)').slice(0, 40), after: (q.explanation || '').slice(0, 40) })
        }
      }
      delete q._fixed
    })

    return NextResponse.json({ fixed, log })
  } catch (error: any) {
    console.error('csv-fix error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
