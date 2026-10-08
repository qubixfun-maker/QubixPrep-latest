export const dynamic = "force-dynamic"
export const maxDuration = 60

import { NextRequest, NextResponse } from 'next/server'
import { verifyIdToken } from '@/lib/firebase-admin'
import { callGeminiNative } from '@/ai/genkit'

function tryParseJson(raw: string): any | null {
  const cleaned = raw.replace(/^```[a-zA-Z]*\n?/, '').replace(/```\s*$/, '').trim()
  try {
    return JSON.parse(cleaned)
  } catch {
    const start = cleaned.indexOf('{')
    const end = cleaned.lastIndexOf('}')
    if (start === -1 || end === -1 || end <= start) return null
    try {
      return JSON.parse(cleaned.slice(start, end + 1))
    } catch {
      return null
    }
  }
}

export async function POST(req: NextRequest) {
  try {
    const { idToken, question, markingPoints, transcript } = await req.json()
    if (!idToken || !question?.trim() || !Array.isArray(markingPoints) || !transcript?.trim()) {
      return NextResponse.json({ error: 'Missing idToken, question, markingPoints, or transcript' }, { status: 400 })
    }

    await verifyIdToken(idToken)

    const pointsList = markingPoints.map((p: string, i: number) => `${i + 1}. ${p}`).join('\n')
    const prompt = `An examiner asked a medical student this question in an OSCE/AMC-style clinical exam:

"${question.trim()}"

The ideal answer should cover these marking points:
${pointsList}

The student's spoken answer (transcribed, may have minor transcription errors) was:
"${transcript.trim()}"

Score this answer. Be fair but rigorous - give credit for the substance of what was said even if phrased differently, but don't give credit for marking points not actually addressed.

Return ONLY a JSON object, no commentary, no markdown fences, matching exactly:
{"score": <0-100 integer>, "pointsHit": [<the marking point strings, exactly as given above, that the answer adequately covered>], "feedback": "<one or two sentences of specific, constructive feedback>"}`

    const { content: raw } = await callGeminiNative([{ role: 'user', content: prompt }], 500, 0, 'gemini-2.5-flash')
    const parsed = tryParseJson(raw)

    if (!parsed || typeof parsed.score !== 'number') {
      return NextResponse.json({ error: 'Grading failed to produce a valid result' }, { status: 500 })
    }

    return NextResponse.json({
      score: Math.max(0, Math.min(100, Math.round(parsed.score))),
      pointsHit: Array.isArray(parsed.pointsHit) ? parsed.pointsHit : [],
      feedback: typeof parsed.feedback === 'string' ? parsed.feedback : '',
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Grading failed' }, { status: 500 })
  }
}
