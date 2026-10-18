import fs from 'fs'
import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

const subjectName = (process.argv[2] || '').trim()
const apply = process.argv.includes('--apply')
if (!subjectName) { console.error('Usage: node delete-subject-long-answers.mjs "Anatomy" [--apply]'); process.exit(1) }

let raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
if (!raw && fs.existsSync('.env.local')) {
  for (const line of fs.readFileSync('.env.local', 'utf8').split('\n')) {
    const m = line.match(/^FIREBASE_SERVICE_ACCOUNT_JSON=(.*)$/)
    if (m) { raw = m[1].trim(); break }
  }
}
if (!raw) { console.error('FIREBASE_SERVICE_ACCOUNT_JSON not found in env or .env.local'); process.exit(1) }
raw = raw.replace(/^["']|["']$/g, '')
if (!raw.startsWith('{')) raw = Buffer.from(raw, 'base64').toString('utf8')
const creds = JSON.parse(raw)
initializeApp({ credential: cert(creds) })
const db = getFirestore()
console.log('Firebase project: ' + creds.project_id)

const subjects = await db.collection('subjects').get()
const target = subjectName.toLowerCase()
const exact = subjects.docs.filter((d) => String(d.data().name || '').trim().toLowerCase() === target)
if (exact.length !== 1) {
  console.error('Expected exactly 1 subject named "' + subjectName + '", found ' + exact.length + '.')
  const near = subjects.docs.filter((d) => String(d.data().name || '').toLowerCase().includes(target.slice(0, 4)))
  for (const d of near) console.error('  candidate: "' + d.data().name + '" (id ' + d.id + ')')
  process.exit(1)
}
const subject = exact[0]
console.log('Subject: "' + subject.data().name + '" (id ' + subject.id + ')')

const chaptersSnap = await db.collection('subjects').doc(subject.id).collection('essayChapters').get()
const backup = { subjectId: subject.id, subjectName: subject.data().name, chapters: [] }
let totalQuestions = 0
for (const ch of chaptersSnap.docs) {
  const entry = { id: ch.id, data: ch.data(), subcollections: {} }
  const subs = await ch.ref.listCollections()
  const parts = []
  for (const sub of subs) {
    const docs = await sub.get()
    entry.subcollections[sub.id] = docs.docs.map((d) => ({ id: d.id, data: d.data() }))
    for (const d of docs.docs) {
      const n = d.data().questionCount ?? (d.data().items ? d.data().items.length : 0)
      totalQuestions += n
      parts.push(sub.id + '/' + d.id + ': ' + n)
    }
  }
  backup.chapters.push(entry)
  console.log('  ' + (ch.data().title || ch.id) + '  [' + parts.join(', ') + ']')
}
console.log('Chapters: ' + chaptersSnap.size + ', questions/answers: ' + totalQuestions)

if (!apply) { console.log('\nPREVIEW ONLY - nothing deleted. Re-run with --apply to delete.'); process.exit(0) }

const backupFile = 'backup-long-answers-' + subject.id + '-' + Date.now() + '.json'
fs.writeFileSync(backupFile, JSON.stringify(backup))
console.log('\nBackup written: ' + backupFile)
for (const ch of chaptersSnap.docs) {
  await db.recursiveDelete(ch.ref)
}
const after = await db.collection('subjects').doc(subject.id).collection('essayChapters').get()
console.log('Deleted. Remaining chapters: ' + after.size)
