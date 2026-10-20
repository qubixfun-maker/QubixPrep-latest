export const dynamic = "force-dynamic"
export const maxDuration = 30

import { NextRequest, NextResponse } from 'next/server'
import { verifyIdToken } from '@/lib/firebase-admin'
import { getVertexAccessToken } from '@/ai/genkit'

const LANGS = new Set(['en-IN', 'hi-IN', 'kn-IN', 'ta-IN', 'te-IN', 'ml-IN', 'mr-IN', 'bn-IN'])
const VOICE = { male: ['Orus', 'Charon', 'Fenrir'], female: ['Aoede', 'Leda', 'Kore'] } as const
const cache = new Map<string, Buffer>()

async function synth(token: string, text: string, lang: string, gender: 'male' | 'female', name?: string) {
  const voice: any = { languageCode: lang, ...(name ? { name } : { ssmlGender: gender.toUpperCase() }) }
  return fetch('https://texttospeech.googleapis.com/v1/text:synthesize', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ input: { text }, voice, audioConfig: { audioEncoding: 'MP3' } }),
  })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { idToken, text, lang, variant } = body
    const gender = body.gender as 'male' | 'female'
    if (!idToken || !text?.trim() || !LANGS.has(lang) || (gender !== 'male' && gender !== 'female')) {
      return NextResponse.json({ error: 'Bad request' }, { status: 400 })
    }
    await verifyIdToken(idToken)
    const clean = String(text).slice(0, 600)
    const v = Math.abs(Number(variant) || 0) % 3
    const key = `${lang}|${gender}|${v}|${clean}`
    let audio = cache.get(key)
    if (!audio) {
      const token = await getVertexAccessToken()
      if (!token) return NextResponse.json({ error: 'No Google token' }, { status: 503 })
      let res = await synth(token, clean, lang, gender, `${lang}-Chirp3-HD-${VOICE[gender][v]}`)
      if (!res.ok) res = await synth(token, clean, lang, gender)
      if (!res.ok) return NextResponse.json({ error: `TTS ${res.status}: ${(await res.text()).slice(0, 200)}` }, { status: 503 })
      audio = Buffer.from((await res.json()).audioContent, 'base64')
      if (cache.size > 300) cache.delete(cache.keys().next().value as string)
      cache.set(key, audio)
    }
    return new Response(new Uint8Array(audio), { headers: { 'Content-Type': 'audio/mpeg', 'Cache-Control': 'private, max-age=3600' } })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'TTS failed' }, { status: 500 })
  }
}
