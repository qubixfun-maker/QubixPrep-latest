export const dynamic = "force-dynamic"
export const maxDuration = 60

import { NextRequest } from 'next/server'
import { verifyIdToken, getAdminFirestore } from '@/lib/firebase-admin'
import { jelly, cleanCtx, cleanMsgs } from '@/ai/jelly'
import type { Intent } from '@/lib/jelly/personas'

const INTENTS = new Set(['chat', 'explain', 'others', 'mnemonic', 'simple'])
const hits = new Map<string, number[]>()

export async function POST(req: NextRequest) {
  const enc = new TextEncoder()
  const fail = (m: string, s: number) => new Response(JSON.stringify({ error: m }), { status: s })
  try {
    const b = await req.json()
    if (!b.idToken) return fail('Missing idToken', 400)
    const decoded = await verifyIdToken(b.idToken)

    const u = (await getAdminFirestore().collection('users').doc(decoded.uid).get()).data()
    if (!(u?.role === 'admin' || u?.plan === 'basic' || u?.plan === 'pro')) return fail('Jelly is available with an active subscription.', 403)

    const now = Date.now()
    const recent = (hits.get(decoded.uid) || []).filter((t) => now - t < 10 * 60_000)
    if (recent.length >= 40) return fail('Easy there, Doctor. Give Jelly a few minutes to catch up.', 429)
    hits.set(decoded.uid, [...recent, now])

    const intent: Intent = INTENTS.has(b.intent) ? b.intent : 'chat'
    const ask = String(b.ask ?? '').slice(0, 800)
    if (intent === 'chat' && !ask.trim()) return fail('Empty question', 400)
    const gen = jelly({
      intent,
      persona: String(b.persona || 'jarvis'),
      name: String(b.name || 'Doctor').replace(/[^\p{L}\p{N} .'-]/gu, '').slice(0, 30) || 'Doctor',
      ctx: cleanCtx(b.ctx),
      messages: cleanMsgs(b.messages),
      ask,
    })
    const stream = new ReadableStream({
      async start(c) {
        try { for await (const e of gen) c.enqueue(enc.encode(JSON.stringify(e) + '\n')) }
        catch (e: any) { c.enqueue(enc.encode(JSON.stringify({ t: 'err', x: e.message || 'Failed' }) + '\n')) }
        c.close()
      },
    })
    return new Response(stream, { headers: { 'Content-Type': 'application/x-ndjson', 'Cache-Control': 'no-store' } })
  } catch (e: any) {
    return fail(e.message || 'Jelly could not respond', 500)
  }
}
