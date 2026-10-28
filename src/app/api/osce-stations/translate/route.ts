export const dynamic = "force-dynamic"
export const maxDuration = 30

import { NextRequest, NextResponse } from 'next/server'
import { verifyIdToken } from '@/lib/firebase-admin'
import { isClinician } from '@/lib/require-clinician'
import { osceCall } from '@/ai/osce-ai'

const cache = new Map<string, string>()

/** Turns a line spoken in an Indian language into plain English, shown as a subtitle in Virtual Patient. */
export async function POST(req: NextRequest) {
  try {
    const { idToken, text, from } = await req.json()
    if (!idToken || typeof text !== 'string' || !text.trim()) return NextResponse.json({ error: 'Bad request' }, { status: 400 })
    const who = await verifyIdToken(idToken)
    if (!(await isClinician(who.uid))) return NextResponse.json({ error: 'Virtual Patient is part of the Clinician plan.', needsPlan: true }, { status: 403 })
    const src = text.trim().slice(0, 700)
    const lang = typeof from === 'string' ? from.slice(0, 20) : 'an Indian language'
    const key = `${lang}|${src}`
    let en = cache.get(key)
    if (!en) {
      const { content } = await osceCall(
        [{ role: 'user', content: `Translate this spoken ${lang} sentence from a doctor-patient conversation into simple, natural English. Keep medical meaning exact. Return ONLY the English translation, no quotes, no notes.\n\n${src}` }],
        300, 0, 'fast'
      )
      en = content.trim().replace(/^["']+|["']+$/g, '')
      if (en) { if (cache.size > 400) cache.delete(cache.keys().next().value as string); cache.set(key, en) }
    }
    if (!en) return NextResponse.json({ error: 'Empty' }, { status: 502 })
    return NextResponse.json({ en })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Translate failed' }, { status: 500 })
  }
}
