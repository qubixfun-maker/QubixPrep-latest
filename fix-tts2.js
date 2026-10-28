const fs = require('fs')
const f = 'src/app/api/osce-stations/tts/route.ts'
let s = fs.readFileSync(f, 'utf8')
const a = "const out = await openaiSpeech(clean, voices, (kid ? JELLY_STYLE : CASE_STYLE) + extra)"
const b = "const out = await openaiSpeech(clean, voices, (kid ? JELLY_STYLE : CASE_STYLE + (ACCENT[lang] || '') + (gender === 'male' ? ' You are a man: use a natural male, deeper tone.' : ' You are a woman: use a natural female tone.')) + extra)"
const c = "const CASE_STYLE ="
const acc = "const ACCENT: Record<string, string> = {\n  'kn-IN': ' Speak as a native Kannada speaker from Karnataka, with a natural local Kannada accent and rhythm, not an English or Hindi accent. Pronounce Kannada words as a native would.',\n  'hi-IN': ' Speak as a native Hindi speaker from India, with a natural Hindi accent and rhythm, not an English accent. Pronounce Hindi words as a native would.',\n  'ta-IN': ' Speak as a native Tamil speaker with a natural Tamil accent, not an English accent.',\n  'te-IN': ' Speak as a native Telugu speaker with a natural Telugu accent, not an English accent.',\n  'ml-IN': ' Speak as a native Malayalam speaker with a natural Malayalam accent, not an English accent.',\n  'mr-IN': ' Speak as a native Marathi speaker with a natural Marathi accent, not an English accent.',\n  'bn-IN': ' Speak as a native Bengali speaker with a natural Bengali accent, not an English accent.',\n}\n"
if (s.includes('const ACCENT:')) { console.log('already done'); process.exit(0) }
if (!s.includes(a) || !s.includes(c)) { console.log('ANCHOR NOT FOUND - nothing changed'); process.exit(1) }
s = s.replace(c, () => acc + c).replace(a, () => b)
fs.writeFileSync(f, s)
console.log('done: accent and gender hints added')
