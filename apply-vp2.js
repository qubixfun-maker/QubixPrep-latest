// Virtual Patient: mic no longer repeats, and the presentation step opens pre-filled.
const fs = require('fs'), path = require('path')
const spec = JSON.parse(fs.readFileSync(path.join(__dirname, 'vp2-edits.json'), 'utf8'))
const root = process.cwd()
const plan = []
let bad = 0
for (const [file, edits] of Object.entries(spec.edits)) {
  const p = path.join(root, file)
  if (!fs.existsSync(p)) { console.log('MISSING FILE:', file); bad++; continue }
  const raw = fs.readFileSync(p, 'utf8'), crlf = raw.includes('\r\n')
  let s = raw.replace(/\r\n/g, '\n'), changed = 0
  edits.forEach(([o, n], i) => {
    if (s.includes(n)) return            // already applied
    const c = s.split(o).length - 1
    if (c !== 1) { console.log(`ANCHOR PROBLEM in ${file}, edit ${i + 1}: found ${c} times`); bad++; return }
    s = s.replace(o, () => n); changed++
  })
  plan.push({ p, s: crlf ? s.replace(/\n/g, '\r\n') : s, changed, file })
}
for (const [file, content] of Object.entries(spec.newFiles)) {
  const p = path.join(root, file)
  plan.push({ p, s: content, changed: fs.existsSync(p) && fs.readFileSync(p, 'utf8') === content ? 0 : 1, file, isNew: true })
}
if (bad) { console.log('\nNothing was changed. Send me this output.'); process.exit(1) }
for (const x of plan) {
  if (!x.changed) { console.log('already done:', x.file); continue }
  fs.mkdirSync(path.dirname(x.p), { recursive: true }); fs.writeFileSync(x.p, x.s); console.log(x.isNew ? 'created:' : 'updated:', x.file, x.isNew ? '' : `(${x.changed} edits)`)
}
console.log('\nDone.')
