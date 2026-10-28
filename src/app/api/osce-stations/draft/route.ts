export const dynamic = "force-dynamic"
export const maxDuration = 60

import { NextRequest, NextResponse } from 'next/server'
import { verifyIdToken } from '@/lib/firebase-admin'
import { isClinician } from '@/lib/require-clinician'
import { osceCall } from '@/ai/osce-ai'

/** Writes the history and examination the student has gathered as a case presentation draft. It never adds a diagnosis. */
export async function POST(req: NextRequest) {
  try {
    const { idToken, transcript, demo } = await req.json()
    if (!idToken || typeof transcript !== 'string' || !transcript.trim()) return NextResponse.json({ error: 'Bad request' }, { status: 400 })
    const who = await verifyIdToken(idToken)
    if (!(await isClinician(who.uid))) return NextResponse.json({ error: 'Virtual Patient is part of the Clinician plan.', needsPlan: true }, { status: 403 })
    const convo = transcript.trim().slice(-9000)
    const d = typeof demo === 'string' ? demo.trim().slice(0, 300) : ''
    const prompt = `An Indian MBBS student has just taken a history and examined a virtual patient. Below is the full conversation.
Write the case presentation the student will give to the examiner, in simple English, in this order:
1. Patient details and chief complaints with duration (one opening sentence).
2. History of present illness (as a short story in time order).
3. Negative history, past history, family history, personal history (only the ones that were actually asked).
4. General physical examination and local / systemic examination findings (only what was actually examined).
Rules: use ONLY facts stated in the conversation. Do not invent or guess anything the student did not ask or examine. Do NOT write a diagnosis, differential diagnosis or management. Plain text only, with short headings followed by a colon. No markdown symbols, no bullet characters other than a dash.
Patient details given to the student: ${d || 'not given'}

CONVERSATION:
${convo}`
    const { content } = await osceCall([{ role: 'user', content: prompt }], 1200, 0, 'fast')
    let body = content.trim().replace(/\*\*/g, '').replace(/^#+\s*/gm, '')
    if (!body) return NextResponse.json({ error: 'Empty' }, { status: 502 })
    const draft = `${body}\n\nProvisional diagnosis: \n\nDifferential diagnosis: \n\nManagement plan: `
    return NextResponse.json({ draft })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Draft failed' }, { status: 500 })
  }
}
