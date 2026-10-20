export const dynamic = "force-dynamic"
export const maxDuration = 60

import { NextRequest } from 'next/server'
import { verifyIdToken } from '@/lib/firebase-admin'
import { answer } from '@/ai/osce-engine'
import type { OsceBrief } from '@/lib/osce/shared'

export async function POST(req: NextRequest) {
  const enc = new TextEncoder()
  try {
    const { idToken, brief, history, utterance, language } = await req.json()
    if (!idToken || !brief || !utterance?.trim()) {
      return new Response(JSON.stringify({ error: 'Missing idToken, brief, or utterance' }), { status: 400 })
    }
    await verifyIdToken(idToken)
    const gen = answer(brief as OsceBrief, typeof history === 'string' ? history : '', utterance.trim(), typeof language === 'string' && language.trim() ? language.trim() : 'English')
    const stream = new ReadableStream({
      async start(c) {
        try { for await (const e of gen) c.enqueue(enc.encode(JSON.stringify(e) + '\n')) }
        catch (e: any) { c.enqueue(enc.encode(JSON.stringify({ t: 'err', x: e.message || 'Failed' }) + '\n')) }
        c.close()
      },
    })
    return new Response(stream, { headers: { 'Content-Type': 'application/x-ndjson', 'Cache-Control': 'no-store' } })
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message || 'Failed to get response' }), { status: 500 })
  }
}
