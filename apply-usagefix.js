// Idempotent: the usage page should count real student notes (textNotes), not "topics".
const fs = require('fs')
const f = 'src/app/admin/usage/page.tsx'
const s = fs.readFileSync(f, 'utf8')
if (!s.includes('c("topics")')) console.log('skip  ', f)
else { fs.writeFileSync(f, s.replace('c("topics")', 'c("textNotes")')); console.log('edited', f) }
