export const dynamic = "force-dynamic"
export const maxDuration = 30

import { NextRequest, NextResponse } from 'next/server'
import { verifyIdToken } from '@/lib/firebase-admin'
import { getVertexAccessToken } from '@/ai/genkit'

const LANGS = new Set(['en-IN', 'hi-IN', 'kn-IN', 'ta-IN', 'te-IN', 'ml-IN', 'mr-IN', 'bn-IN'])
const VOICE = { male: ['Orus', 'Charon', 'Fenrir'], female: ['Aoede', 'Leda', 'Kore'] } as const
// Playful kid-like voice: a bright standard voice per language, pitched up and slightly faster (Chirp voices cannot be pitched).
const KID: Record<string, string> = {
  'en-IN': 'en-IN-Neural2-A', 'hi-IN': 'hi-IN-Neural2-A', 'kn-IN': 'kn-IN-Wavenet-A', 'ta-IN': 'ta-IN-Wavenet-A',
  'te-IN': 'te-IN-Standard-A', 'ml-IN': 'ml-IN-Wavenet-A', 'mr-IN': 'mr-IN-Wavenet-A', 'bn-IN': 'bn-IN-Wavenet-A',
}
const cache = new Map<string, Buffer>()

const RATE = 1.12
function tidy(t: string) {
  return t.replace(/[*_#`~>|]/g, ' ').replace(/\(([^)]{1,40})\)/g, ', $1,').replace(/\s[-–—]\s/g, ', ').replace(/\s*\n+\s*/g, '. ').replace(/\s{2,}/g, ' ').trim()
}
async function synth(token: string, text: string, lang: string, gender: 'male' | 'female', name?: string, kid = false, pitched = false) {
  const voice: any = { languageCode: lang, ...(name ? { name } : { ssmlGender: gender.toUpperCase() }) }
  return fetch('https://texttospeech.googleapis.com/v1/text:synthesize', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ input: { text }, voice, audioConfig: { audioEncoding: 'MP3', speakingRate: kid ? 1.15 : RATE, ...(pitched ? { pitch: 5 } : {}) } }),
  })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { idToken, text, lang, variant } = body
    const kid = body.kid === true
    const gender = body.gender as 'male' | 'female'
    if (!idToken || !text?.trim() || !LANGS.has(lang) || (gender !== 'male' && gender !== 'female')) {
      return NextResponse.json({ error: 'Bad request' }, { status: 400 })
    }
    await verifyIdToken(idToken)
    const clean = tidy(String(text)).slice(0, 600)
    const v = Math.abs(Number(variant) || 0) % 3
    const key = `${lang}|${kid ? 'kid' : gender}|${v}|${clean}`
    let audio = cache.get(key)
    if (!audio) {
      const token = await getVertexAccessToken()
      if (!token) return NextResponse.json({ error: 'No Google token' }, { status: 503 })
      let res = kid
        ? await synth(token, clean, lang, 'female', `${lang}-Chirp3-HD-Leda`, true)
        : await synth(token, clean, lang, gender, `${lang}-Chirp3-HD-${VOICE[gender][v]}`)
      if (!res.ok && kid) res = await synth(token, clean, lang, 'female', KID[lang], true, true)
      if (!res.ok && kid) res = await synth(token, clean, lang, 'female', undefined, true, true)
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
