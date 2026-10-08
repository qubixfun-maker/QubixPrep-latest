export const dynamic = "force-dynamic"
export const maxDuration = 60

import { NextRequest, NextResponse } from 'next/server'
import { verifyIdToken, getAdminFirestore } from '@/lib/firebase-admin'
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
    const { idToken, stationId, transcript } = await req.json()
    if (!idToken || !stationId || !transcript?.trim()) {
      return NextResponse.json({ error: 'Missing idToken, stationId, or transcript' }, { status: 400 })
    }

    // Any signed-in user may call this - it's a student-facing study feature, not admin-only.
    await verifyIdToken(idToken)

    const db = getAdminFirestore()
    const stationDoc = await db.collection('osceStations').doc(stationId).get()
    if (!stationDoc.exists) {
      return NextResponse.json({ error: 'Station not found' }, { status: 404 })
    }
    const station = stationDoc.data() as any
    const bank: { triggerQuestion: string; answer: string }[] = station.historyQABank || []
    if (bank.length === 0) {
      return NextResponse.json({ matched: false })
    }

    const listText = bank.map((q, i) => `${i}: ${q.triggerQuestion}`).join('\n')
    const prompt = `A medical student is interviewing a simulated patient and just asked this question (it may be phrased casually or differently from the list below, possibly transcribed from speech with minor errors):

"${transcript.trim()}"

Here is the pre-written list of history questions this patient has answers for, each with an index:
${listText}

Which indexed question is this closest in MEANING to (even if worded very differently)? If none of them are a reasonable match for what's being asked (e.g. it's actually a request to examine the patient or order a test, not a history question), say so.

Return ONLY a JSON object, no commentary, no markdown fences: {"index": <number or -1>}`

    const { content: raw } = await callGeminiNative([{ role: 'user', content: prompt }], 200, 0, 'gemini-2.5-flash')
    const parsed = tryParseJson(raw)
    const index = typeof parsed?.index === 'number' ? parsed.index : -1

    if (index >= 0 && index < bank.length) {
      return NextResponse.json({ matched: true, answer: bank[index].answer, triggerQuestion: bank[index].triggerQuestion })
    }
    return NextResponse.json({ matched: false })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Matching failed' }, { status: 500 })
  }
}
