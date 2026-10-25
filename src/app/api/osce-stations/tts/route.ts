export const dynamic = "force-dynamic"
export const maxDuration = 30

import { NextRequest, NextResponse } from 'next/server'
import { verifyIdToken, getAdminFirestore } from '@/lib/firebase-admin'
import { getVertexAccessToken } from '@/ai/genkit'

const LANGS = new Set(['en-IN', 'hi-IN', 'kn-IN', 'ta-IN', 'te-IN', 'ml-IN', 'mr-IN', 'bn-IN'])
const VOICE = { male: ['Orus', 'Charon', 'Fenrir'], female: ['Aoede', 'Leda', 'Kore'] } as const
// Playful kid-like voice: a bright standard voice per language, pitched up and slightly faster (Chirp voices cannot be pitched).
const KID: Record<string, string> = {
  'en-IN': 'en-IN-Neural2-A', 'hi-IN': 'hi-IN-Neural2-A', 'kn-IN': 'kn-IN-Wavenet-A', 'ta-IN': 'ta-IN-Wavenet-A',
  'te-IN': 'te-IN-Standard-A', 'ml-IN': 'ml-IN-Wavenet-A', 'mr-IN': 'mr-IN-Wavenet-A', 'bn-IN': 'bn-IN-Wavenet-A',
}
const cache = new Map<string, Buffer>()

// Jelly's OpenAI voice (Marin, chill style). Used only for paid members, English and Hindi, and only when the key is set.
const CORAL_LANGS = new Set(['en-IN', 'hi-IN'])
const CORAL_STYLE = 'Voice: laid-back, mellow and effortlessly cool, like a friendly surfer who is also a great study mentor. Tone: relaxed, warm, encouraging, never rushed. Pace: easy and flowing. Keep every medical term and number crisp and clearly pronounced. Speak in the same language as the text.'
async function openaiSpeech(text: string): Promise<Buffer | null> {
  const key = process.env.OPENAI_API_KEY
  if (!key) return null
  try {
    // Marin is Jelly's voice; if OpenAI does not accept it for this model, fall back to Coral.
    for (const voice of ['marin', 'coral']) {
      const r = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'gpt-4o-mini-tts', voice, input: text, instructions: CORAL_STYLE, response_format: 'mp3' }),
      })
      if (r.ok) return Buffer.from(await r.arrayBuffer())
      if (r.status !== 400 && r.status !== 422) return null
    }
    return null
  } catch { return null }
}
async function isPaid(decoded: any): Promise<boolean> {
  try {
    const uid = decoded?.uid || decoded?.user_id || decoded?.sub
    if (!uid) return false
    const u: any = (await getAdminFirestore().collection('users').doc(String(uid)).get()).data() || {}
    if (u.role === 'admin') return true
    return (u.plan === 'basic' || u.plan === 'pro') && (!u.planExpiresAt || Number(u.planExpiresAt) > Date.now())
  } catch { return false }
}

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
    const decoded: any = await verifyIdToken(idToken)
    const clean = tidy(String(text)).slice(0, 600)
    const v = Math.abs(Number(variant) || 0) % 3
    const key = `${lang}|${kid ? 'kid' : gender}|${v}|${clean}`
    let audio = cache.get(key)
    // Coral for paid members (Jelly only), English and Hindi
    if (!audio && kid && CORAL_LANGS.has(lang) && process.env.OPENAI_API_KEY && (await isPaid(decoded))) {
      const ck = 'coral|' + clean
      audio = cache.get(ck)
      if (!audio) {
        const a = await openaiSpeech(clean)
        if (a) { audio = a; if (cache.size > 300) cache.delete(cache.keys().next().value as string); cache.set(ck, a) }
      }
    }
    if (!audio) {
      const token = await getVertexAccessToken()
      if (!token) return NextResponse.json({ error: 'No Google token' }, { status: 503 })
      const tryVoice = async (name?: string, pitched = false) => {
        let r = await synth(token, clean, lang, kid ? 'female' : gender, name, kid, pitched)
        for (let i = 0; i < 2 && !r.ok && (r.status === 429 || r.status >= 500); i++) {
          await new Promise((ok) => setTimeout(ok, 350 * (i + 1)))
          r = await synth(token, clean, lang, kid ? 'female' : gender, name, kid, pitched)
        }
        return r
      }
      let res = kid ? await tryVoice(`${lang}-Chirp3-HD-Leda`) : await tryVoice(`${lang}-Chirp3-HD-${VOICE[gender][v]}`)
      if (!res.ok && kid) res = await tryVoice(KID[lang], true)
      if (!res.ok && kid) res = await tryVoice(undefined, true)
      if (!res.ok && !kid) res = await tryVoice()
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
