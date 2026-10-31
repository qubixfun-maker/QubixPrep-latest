// Run once from the project folder:  node apply-coral.js
// Paid members (Scholar / Clinician) hear Jelly in OpenAI's "Marin" voice (chill surfer style) (English and Hindi). Everyone else, and every other language, keeps the current Google voice.
// If the OpenAI key is missing or OpenAI fails, the current voice is used, so nothing breaks. Writes nothing if a file looks different from what is expected.
const fs = require('fs')
const problems = []; const writes = []
const rp = 'src/app/api/osce-stations/tts/route.ts'
const rawR = fs.readFileSync(rp, 'utf8'); const crR = rawR.includes('\r\n')
let s = rawR.replace(/\r\n/g, '\n')

if (s.includes('openaiSpeech')) console.log('route already patched, skipping')
else {
  const rep = (from, to, label) => {
    if (s.split(from).length !== 2) problems.push(`${rp}: expected 1 ${label}`)
    else s = s.replace(from, to)
  }
  rep("import { verifyIdToken } from '@/lib/firebase-admin'", "import { verifyIdToken, getAdminFirestore } from '@/lib/firebase-admin'", 'firebase-admin import')
  rep("const cache = new Map<string, Buffer>()\n", `const cache = new Map<string, Buffer>()

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
        headers: { Authorization: \`Bearer \${key}\`, 'Content-Type': 'application/json' },
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
`, 'cache line')
  rep("    await verifyIdToken(idToken)\n", "    const decoded: any = await verifyIdToken(idToken)\n", 'verifyIdToken call')
  rep("    let audio = cache.get(key)\n    if (!audio) {\n", `    let audio = cache.get(key)
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
`, 'cache lookup')
  writes.push([rp, crR ? s.replace(/\n/g, '\r\n') : s])
}

const yp = 'apphosting.yaml'
const rawY = fs.readFileSync(yp, 'utf8'); const crY = rawY.includes('\r\n')
let y = rawY.replace(/\r\n/g, '\n')
if (/variable: OPENAI_API_KEY/.test(y)) console.log('apphosting.yaml already has OPENAI_API_KEY, skipping')
else {
  const re = /( *)- variable: GEMINI_API_KEY\n\1  secret: GEMINI_API_KEY\n((?:\1  availability:\n(?:\1    - \w+\n)+)?)/
  const m = y.match(re)
  if (!m) problems.push('apphosting.yaml: GEMINI_API_KEY block not found')
  else { const out = y.replace(re, (blk) => blk + blk.replace(/GEMINI_API_KEY/g, 'OPENAI_API_KEY')); writes.push([yp, crY ? out.replace(/\n/g, '\r\n') : out]) }
}

if (problems.length) { console.error('NOTHING WAS CHANGED.\n- ' + problems.join('\n- ')); process.exit(1) }
writes.forEach(([p, c]) => fs.writeFileSync(p, c))
console.log('DONE. Now store the key:  firebase apphosting:secrets:set OPENAI_API_KEY   (then grant access when asked)')
