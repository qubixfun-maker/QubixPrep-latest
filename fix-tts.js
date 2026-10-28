const fs = require('fs')
const f = 'src/app/api/osce-stations/tts/route.ts'
let s = fs.readFileSync(f, 'utf8')
const a = "const OPENAI_LANGS = new Set(['en-IN', 'hi-IN'])"
const b = "const OPENAI_LANGS = LANGS // OpenAI voices for every language"
if (s.includes(b)) { console.log('already done'); process.exit(0) }
if (!s.includes(a)) { console.log('ANCHOR NOT FOUND - nothing changed'); process.exit(1) }
fs.writeFileSync(f, s.replace(a, b))
console.log('done: OpenAI voice now used for all languages')
