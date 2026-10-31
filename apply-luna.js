// Run once from the project folder:  node apply-luna.js
// 1) Jelly and the OSCE stations use OpenAI's gpt-6-luna first, with the current Gemini models as the automatic fallback.
// 2) Voices: Jelly = Marin (chill style); OSCE stations = a different OpenAI voice per case (gender and variant). Paid members and admins, English and Hindi. Everyone else keeps the Google voices.
// Admin tools are not touched. Checks both files first and writes nothing if either looks different from what is expected.
const fs = require('fs')
const ensureKey = () => {
  const p = 'apphosting.yaml'
  let y = fs.readFileSync(p, 'utf8')
  if (/variable: OPENAI_API_KEY/.test(y)) return null
  const cr = y.includes('\r\n'); y = y.replace(/\r\n/g, '\n')
  const re = /( *)- variable: GEMINI_API_KEY\n\1  secret: GEMINI_API_KEY\n((?:\1  availability:\n(?:\1    - \w+\n)+)?)/
  if (!re.test(y)) throw new Error('apphosting.yaml: GEMINI_API_KEY block not found')
  y = y.replace(re, (b) => b + b.replace(/GEMINI_API_KEY/g, 'OPENAI_API_KEY'))
  return [p, cr ? y.replace(/\n/g, '\r\n') : y]
}
const problems = []; const writes = []
const targets = [
  ['src/ai/osce-ai.ts', 'luna-files/ai/osce-ai.ts', ['const CHAIN: Record<Tier', 'export async function* osceStream', 'export function parseJson'], 'const LUNA'],
  ['src/app/api/osce-stations/tts/route.ts', 'luna-files/tts/route.ts', ['export async function POST', 'getVertexAccessToken', "const VOICE = { male: ['Orus'"], 'OPENAI_VOICE'],
]
for (const [dest, src, must, done] of targets) {
  try {
    const cur = fs.readFileSync(dest, 'utf8')
    if (cur.includes(done)) { console.log(dest + ' already updated, skipping'); continue }
    const miss = must.filter((m) => !cur.includes(m))
    if (miss.length) problems.push(`${dest}: does not look like the expected file (missing: ${miss.join(' | ')})`)
    else { const n = fs.readFileSync(src, 'utf8'); writes.push([dest, cur.includes('\r\n') ? n.replace(/\r?\n/g, '\r\n') : n]) }
  } catch (e) { problems.push(`${dest}: ${e.message}`) }
}
try { const k = ensureKey(); if (k) writes.push(k) } catch (e) { problems.push(e.message) }
if (problems.length) { console.error('NOTHING WAS CHANGED.\n- ' + problems.join('\n- ')); process.exit(1) }
writes.forEach(([p, c]) => fs.writeFileSync(p, c))
console.log('DONE. Files updated: ' + (writes.map((w) => w[0]).join(', ') || 'none'))
