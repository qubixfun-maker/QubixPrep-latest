import fs from 'fs'
import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

let raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
if (!raw && fs.existsSync('.env.local')) {
  for (const line of fs.readFileSync('.env.local', 'utf8').split('\n')) {
    const m = line.match(/^FIREBASE_SERVICE_ACCOUNT_JSON=(.*)$/)
    if (m) { raw = m[1].trim(); break }
  }
}
raw = raw.replace(/^["']|["']$/g, '')
if (!raw.startsWith('{')) raw = Buffer.from(raw, 'base64').toString('utf8')
initializeApp({ credential: cert(JSON.parse(raw)) })
const db = getFirestore()

const subjectName = process.argv[2] || 'Physiology'
const subjects = await db.collection('subjects').get()
const subject = subjects.docs.find(d => String(d.data().name||'').toLowerCase() === subjectName.toLowerCase())
if (!subject) { console.error('Subject not found'); process.exit(1) }

const chapters = await db.collection('subjects').doc(subject.id).collection('essayChapters').get()
const rows = []
for (const ch of chapters.docs) {
  const sections = await ch.ref.collection('sections').get()
  for (const s of sections.docs) {
    const d = s.data()
    const items = d.items?.length || 0
    const htmlBytes = Buffer.byteLength(d.html || '', 'utf8')
    rows.push({ chapter: d.chapterTitle || ch.id, section: s.id, items, htmlKB: (htmlBytes/1024).toFixed(1) })
  }
}
rows.sort((a,b) => b.items - a.items)
console.log('Top 15 largest chapter+section docs for', subject.data().name, ':')
for (const r of rows.slice(0, 15)) console.log('  ', r.chapter, '/', r.section, '- items:', r.items, '- size:', r.htmlKB, 'KB')
console.log('Total docs:', rows.length, '- total items:', rows.reduce((a,r)=>a+r.items,0))
