// Run once from the project folder:  node apply-notes-lock.js
// Adds the notesIndex rule and locks the note text (textNotes) to paid members, admins and free-sample chapters.
// Checks first and writes nothing if firestore.rules looks different from what is expected.
const fs = require('fs')
const p = 'firestore.rules'
let s = fs.readFileSync(p, 'utf8')
const problems = []

if (s.includes('match /notesIndex/')) console.log('notesIndex rule already present, skipping')
else {
  const anchor = '    match /top100/{topicId} {'
  if (s.split(anchor).length !== 2) problems.push(`expected 1 "${anchor.trim()}"`)
  else s = s.replace(anchor, `    // Light chapter index (titles and topic names only, no note text). Signed-in users read it; admins write it.
    match /notesIndex/{indexId} {
      allow read: if request.auth != null;
      allow write, delete: if request.auth != null &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
` + anchor)
}

if (s.includes('function isFreeSample()')) console.log('textNotes already locked, skipping')
else {
  const re = /( *)match \/textNotes\/\{noteId\} \{\s*\n\s*allow read: if true;[ \t]*\n/
  const m = s.match(re)
  if (!m) problems.push('could not find "match /textNotes/{noteId} { allow read: if true;"')
  else s = s.replace(re, `      match /textNotes/{noteId} {
        function me() {
          return get(/databases/$(database)/documents/users/$(request.auth.uid)).data;
        }
        function isAdminUser() {
          return 'role' in me() && me().role == 'admin';
        }
        function paidAndActive() {
          return 'plan' in me() && me().plan in ['basic', 'pro'] && (!('planExpiresAt' in me()) || me().planExpiresAt > request.time.toMillis());
        }
        function isFreeSample() {
          return exists(/databases/$(database)/documents/notesIndex/$(subjectId + '__' + noteId))
            && get(/databases/$(database)/documents/notesIndex/$(subjectId + '__' + noteId)).data.free == true;
        }
        // Note text: signed-in AND (free-sample chapter OR admin OR paid plan not expired)
        allow read: if request.auth != null && (isFreeSample() || isAdminUser() || paidAndActive());
`)
}

if (problems.length) { console.error('NOTHING WAS CHANGED.\n- ' + problems.join('\n- ')); process.exit(1) }
fs.writeFileSync(p, s)
console.log('DONE: rules updated.')
