export const dynamic = "force-dynamic"
export const maxDuration = 30

import { NextRequest, NextResponse } from 'next/server'
import { verifyIdToken } from '@/lib/firebase-admin'
import { isClinician } from '@/lib/require-clinician'

// Speech to text for phones whose browser cannot recognise speech in Indian languages (e.g. iPhone Safari).
// The app records a short clip and sends it here; OpenAI turns it into text.
const LANGS = new Set(['en', 'hi', 'kn', 'ta', 'te', 'ml', 'mr', 'bn', 'auto'])

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData()
    const idToken = String(form.get('idToken') || '')
    const lang = String(form.get('lang') || 'en-IN').split('-')[0].toLowerCase()
    const audio = form.get('audio') as File | null
    if (!idToken || !audio || typeof (audio as any).arrayBuffer !== 'function' || !LANGS.has(lang)) {
      return NextResponse.json({ error: 'Bad request' }, { status: 400 })
    }
    if (audio.size > 8 * 1024 * 1024) return NextResponse.json({ error: 'Recording too long. Please speak in shorter parts.' }, { status: 413 })

    const decoded: any = await verifyIdToken(idToken)
    if (!(await isClinician(decoded.uid))) {
      return NextResponse.json({ error: 'Voice is part of the Clinician plan. Upgrade to continue.', needsPlan: true }, { status: 403 })
    }
    const key = process.env.OPENAI_API_KEY
    if (!key || process.env.OPENAI_LLM === 'off') return NextResponse.json({ error: 'Voice input is temporarily unavailable. Please type instead.' }, { status: 503 })

    const models = Array.from(new Set([process.env.OPENAI_STT_MODEL || (lang === 'en' ? 'gpt-4o-mini-transcribe' : 'gpt-4o-transcribe'), 'whisper-1']))
    let lastStatus = 0
    for (const model of models) {
      const fd = new FormData()
      fd.append('file', audio, (audio as any).name || 'speech.m4a')
      fd.append('model', model)
      // "auto" = the student mixes languages (e.g. Kannada or Hindi with English medical words), so the model decides by itself
      if (lang !== 'auto') fd.append('language', lang)
      fd.append('response_format', 'json')
      fd.append('prompt', lang === 'auto' ? 'A medical student in India taking a clinical history and examining a patient. They freely mix Hindi, Kannada, Tamil, Telugu, Marathi, Bengali or Malayalam with English. Write every English or medical word (blood pressure, pulse, chest pain, fever, cough, breathlessness, ECG, X-ray, ultrasound, tablet, diabetes, jaundice, vomiting, bowel, urine) in English letters, and the other words in their own language script.' : 'A doctor and a patient talking in India. Medical terms may be said in English. Write English medical words (blood pressure, pulse, X-ray, ECG) in English letters.')
      const r = await fetch('https://api.openai.com/v1/audio/transcriptions', { method: 'POST', headers: { Authorization: `Bearer ${key}` }, body: fd })
      if (r.ok) {
        const j: any = await r.json()
        return NextResponse.json({ text: String(j?.text || '').trim() })
      }
      lastStatus = r.status
      if (r.status !== 400 && r.status !== 404) break // a model OpenAI does not accept is skipped; limits or an outage are not retried
    }
    return NextResponse.json({ error: `Could not understand the audio (${lastStatus}). Please try again or type.` }, { status: 502 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Transcription failed' }, { status: 500 })
  }
}
