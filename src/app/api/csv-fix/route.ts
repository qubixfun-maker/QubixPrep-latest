import { NextRequest, NextResponse } from 'next/server'
import { getGroqClient, GROQ_MODEL } from '@/ai/genkit'

export async function POST(req: NextRequest) {
  try {
    const { questions } = await req.json()
    if (!Array.isArray(questions) || questions.length === 0) return NextResponse.json({ fixed: [], log: [] })

    const groq = getGroqClient()
    const prompt = `You are a medical data validator.
Check these questions:
1. correct_answer_index must be 0-3.
2. Ensure a concise 2-sentence explanation.
3. IMPORTANT: You must return the "unit_title" and "topic_title" exactly as provided in the input.

Return ONLY a JSON array with these fields: unit_title, topic_title, question_text, option1, option2, option3, option4, correct_answer_index, explanation, _fixed (true/false).

Questions:
${JSON.stringify(questions)}`

    const response = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [{ role: 'user', content: prompt }],
    })

    const raw = response.choices[0]?.message?.content ?? '[]'
    const clean = raw.replace(/```json|```/g, '').trim()
    let fixed = JSON.parse(clean)

    return NextResponse.json({ fixed, log: [] })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
