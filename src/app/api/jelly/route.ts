export const dynamic = "force-dynamic"
export const maxDuration = 60

import { NextRequest } from 'next/server'
import { verifyIdToken } from '@/lib/firebase-admin'
import { jelly, cleanCtx, cleanMsgs } from '@/ai/jelly'
import { planOf, limitFor, getProfile, bumpUsage, learnFromChat } from '@/ai/jelly-profile'
import type { Intent } from '@/lib/jelly/personas'
import type { Mode } from '@/lib/jelly/profile'

const INTENTS = new Set(['chat', 'explain', 'others', 'mnemonic', 'simple'])
const MODES = new Set(['doubt', 'topic', 'quiz', 'viva', 'cards', 'plan'])
const hits = new Map<string, number[]>()

export async function POST(req: NextRequest) {
  const enc = new TextEncoder()
  const fail = (m: string, s: number) => new Response(JSON.stringify({ error: m }), { status: s })
  try {
    const b = await req.json()
    if (!b.idToken) return fail('Missing idToken', 400)
    const decoded = await verifyIdToken(b.idToken)
    const uid = decoded.uid

    const plan = await planOf(uid)
    const limit = limitFor(plan)
    if (limit < 0) return fail('Jelly is available with an active subscription.', 403)

    const now = Date.now()
    const recent = (hits.get(uid) || []).filter((t) => now - t < 10 * 60_000)
    if (recent.length >= 60) return fail('Easy there. Give Jelly a minute to catch up.', 429)
    hits.set(uid, [...recent, now])

    const intent: Intent = INTENTS.has(b.intent) ? b.intent : 'chat'
    const mode: Mode = MODES.has(b.mode) ? b.mode : 'doubt'
    const ask = String(b.ask ?? '').slice(0, 800)
    if (intent === 'chat' && !ask.trim()) return fail('Empty question', 400)

    const profile = await getProfile(uid)
    if (intent === 'chat') learnFromChat(uid, ask).catch(() => {})

    const gen = jelly({
      intent, mode,
      persona: String(b.persona || profile.persona || 'jarvis'),
      name: String(b.name || 'Doctor').replace(/[^\p{L}\p{N} .'-]/gu, '').slice(0, 30) || 'Doctor',
      ctx: cleanCtx(b.ctx),
      messages: cleanMsgs(b.messages),
      ask, profile,
      beforeAi: () => bumpUsage(uid, limit),
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
