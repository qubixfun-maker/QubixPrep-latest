// Run once from the project folder:  node apply-speed.js
// Makes Jelly's voice start sooner and sound brisker, like a normal person talking:
//  - plays Jelly's voice about 15% faster (the pitch stays natural)
//  - starts speaking after the first short phrase instead of waiting for a long sentence
//  - trims the little gap between sentences
//  - tells the OpenAI voice to talk at a brisk, natural pace
//  - remembers "is this member paid" for a minute, so each sentence does not wait on a database check
// Checks everything first and writes nothing if a file looks different from what is expected.
const fs = require('fs')
const problems = []; const writes = []
const read = (p) => { const raw = fs.readFileSync(p, 'utf8'); return { cr: raw.includes('\r\n'), s: raw.replace(/\r\n/g, '\n') } }
const queue = (p, cr, s) => writes.push([p, cr ? s.replace(/\n/g, '\r\n') : s])
const once = (s, from, to, label, p) => { const n = s.split(from).length - 1; if (n !== 1) { problems.push(`${p}: expected 1 "${label}", found ${n}`); return s } return s.replace(from, () => to) }

{
  const p = 'src/components/osce/voice.tsx'
  const { cr, s: s0 } = read(p)
  if (s0.includes('defaultPlaybackRate')) console.log('voice.tsx already patched, skipping')
  else {
    let s = once(s0, '    a.src = url\n    live.add(a)\n', '    a.src = url\n    const rate = o.kid ? 1.15 : 1 // Jelly talks a little faster, like a normal person\n    a.defaultPlaybackRate = rate; a.playbackRate = rate\n    try { (a as any).preservesPitch = true } catch {}\n    live.add(a)\n', 'audio src lines (apply-jellystop.js must be applied first)', p)
    s = once(s, 'a.duration - a.currentTime < 0.12', 'a.duration - a.currentTime < 0.2', 'end-of-clip check', p)
    s = once(s, 'if (cut < 0 && first && buf.length > 80) { const c = buf.lastIndexOf(", "); if (c > 30) cut = c + 1 }', 'if (cut < 0 && first && buf.length > 50) { const c = buf.lastIndexOf(", "); if (c > 22) cut = c + 1 }', 'first phrase rule', p)
    s = once(s, 'if (cut > (first ? 20 : 40))', 'if (cut > (first ? 14 : 40))', 'cut length rule', p)
    queue(p, cr, s)
  }
}
{
  const p = 'src/app/api/osce-stations/tts/route.ts'
  const { cr, s: s0 } = read(p)
  if (s0.includes('isPaidFresh')) console.log('tts route already patched, skipping')
  else {
    let s = once(s0, 'async function isPaid(decoded: any): Promise<boolean> {\n', `const paidCache = new Map<string, { at: number; v: boolean }>()
async function isPaid(decoded: any): Promise<boolean> {
  const uid = String(decoded?.uid || decoded?.user_id || decoded?.sub || '')
  const hit = uid ? paidCache.get(uid) : undefined
  if (hit && Date.now() - hit.at < 60_000) return hit.v
  const v = await isPaidFresh(decoded)
  if (uid) { if (paidCache.size > 500) paidCache.clear(); paidCache.set(uid, { at: Date.now(), v }) }
  return v
}
async function isPaidFresh(decoded: any): Promise<boolean> {
`, 'isPaid function (apply-luna.js must be applied first)', p)
    const re = /^const JELLY_STYLE = .*$/m
    if (!re.test(s)) problems.push(p + ': JELLY_STYLE line not found')
    else s = s.replace(re, () => "const JELLY_STYLE = 'Voice: bright, bubbly and cheerful, like a fun older sibling who loves teaching. Tone: playful, a smile in every sentence, lots of friendly energy. Pace: brisk and natural, like a quick-talking friend in a normal conversation, never slow or drawn out, with no long pauses between sentences. Keep every medical term and number crisp and clearly pronounced. Speak in the same language as the text.'")
    queue(p, cr, s)
  }
}
if (problems.length) { console.error('NOTHING WAS CHANGED.\n- ' + problems.join('\n- ')); process.exit(1) }
writes.forEach(([p, c]) => fs.writeFileSync(p, c))
console.log('DONE. Files updated: ' + (writes.map((w) => w[0]).join(', ') || 'none'))
