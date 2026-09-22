// One-off script: deletes ALL generated long-answer content (long-essays/short-essays/
// short-answers sections and their parent essayChapters docs) across every subject.
// Does NOT touch notes, mindmaps, flashcards, qbank, or profpyq past-paper records.
//
// Run once from the project root:
//   node scripts/delete-all-long-answers.js
//
// Uses the same FIREBASE_SERVICE_ACCOUNT_JSON credentials your app already uses from
// .env.local - nothing extra to configure.

require('dotenv').config({ path: '.env.local' })
const { initializeApp, cert } = require('firebase-admin/app')
const { getFirestore } = require('firebase-admin/firestore')

const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
if (!serviceAccountJson) {
  console.error('FIREBASE_SERVICE_ACCOUNT_JSON not found in .env.local')
  process.exit(1)
}

const app = initializeApp({ credential: cert(JSON.parse(serviceAccountJson)) })
const db = getFirestore(app)

async function deleteAllInCollectionGroup(name) {
  let totalDeleted = 0
  while (true) {
    const snap = await db.collectionGroup(name).limit(400).get()
    if (snap.empty) break
    const batch = db.batch()
    snap.docs.forEach((d) => batch.delete(d.ref))
    await batch.commit()
    totalDeleted += snap.size
    console.log(`  deleted ${snap.size} '${name}' docs (running total: ${totalDeleted})`)
    if (snap.size < 400) break
  }
  return totalDeleted
}

async function main() {
  console.log('Deleting all long-answer sections...')
  const sectionsDeleted = await deleteAllInCollectionGroup('sections')

  console.log('Deleting all essayChapters containers...')
  const chaptersDeleted = await deleteAllInCollectionGroup('essayChapters')

  console.log('\nDone.')
  console.log(`  sections deleted: ${sectionsDeleted}`)
  console.log(`  essayChapters deleted: ${chaptersDeleted}`)
  process.exit(0)
}

main().catch((err) => {
  console.error('Failed:', err)
  process.exit(1)
})
