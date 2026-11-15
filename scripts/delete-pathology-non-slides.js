require('dotenv').config({ path: '.env.local' })
const { initializeApp, cert } = require('firebase-admin/app')
const { getFirestore } = require('firebase-admin/firestore')
const { getStorage } = require('firebase-admin/storage')

const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
if (!json) { console.error('FIREBASE_SERVICE_ACCOUNT_JSON not found in .env.local'); process.exit(1) }
const app = initializeApp({ credential: cert(JSON.parse(json)), storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET })
const db = getFirestore(app)
const bucket = getStorage(app).bucket()
const KEEP = 'Pathology slides'
const really = process.argv.includes('--yes')

async function main() {
  const snap = await db.collection('spotters').where('subject', '==', 'Pathology').get()
  const keep = snap.docs.filter((d) => d.data().group === KEEP)
  const drop = snap.docs.filter((d) => d.data().group !== KEEP)
  console.log(`Pathology items found: ${snap.size}`)
  console.log(`  keeping (${KEEP}): ${keep.length}`)
  console.log(`  to delete: ${drop.length}`)
  const byGroup = {}
  drop.forEach((d) => { const g = d.data().group || '?'; byGroup[g] = (byGroup[g] || 0) + 1 })
  console.log('  ', byGroup)
  if (!really) { console.log('\nPreview only. Run again with --yes to delete.'); return }
  let n = 0
  for (const d of drop) {
    for (const p of d.data().paths || []) { try { await bucket.file(p).delete() } catch (e) {} }
    await d.ref.delete()
    n++
  }
  console.log(`\nDeleted ${n} items. Hard-refresh the Spotters page.`)
}
main().then(() => process.exit(0)).catch((e) => { console.error('Failed:', e); process.exit(1) })
