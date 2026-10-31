// Idempotent patch: adds Firestore rules for the new PYQ collections.
const fs = require('fs')
const f = 'firestore.rules'
let s = fs.readFileSync(f, 'utf8')
if (s.includes('pyqQuestions')) { console.log('rules already patched'); process.exit(0) }
const anchor = '    match /profpyq/{docId} {'
const i = s.indexOf(anchor)
if (i < 0) throw new Error('Could not find the profpyq rule to insert before')
const rule = (name) => String.raw`    match /${name}/{docId} {
      allow read: if request.auth != null;
      allow write, delete: if request.auth != null &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
`
s = s.slice(0, i) + rule('pyqQuestions') + rule('pyqImages') + rule('pyqMeta') + s.slice(i)
fs.writeFileSync(f, s)
console.log('rules patched')
