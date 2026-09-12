import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const DRY_RUN = process.argv[2] !== '--apply';

const key = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
initializeApp({ credential: cert(key) });
const db = getFirestore();

const subjectRef = db.collection('subjects').doc('pathology');

async function deleteCollection(collectionName, hasSections) {
  const docs = await subjectRef.collection(collectionName).get();
  console.log(`\n${collectionName}: ${docs.size} doc(s)`);

  let sectionCount = 0;
  for (const doc of docs.docs) {
    if (hasSections) {
      const sections = await doc.ref.collection('sections').get();
      sectionCount += sections.size;
      if (!DRY_RUN) {
        for (const sec of sections.docs) await sec.ref.delete();
      }
    }
    if (!DRY_RUN) await doc.ref.delete();
  }
  if (hasSections) console.log(`  (+ ${sectionCount} section doc(s))`);
}

await deleteCollection('essayChapters', true);
await deleteCollection('flashcardDecks', false);
await deleteCollection('mindmaps', false);

console.log(DRY_RUN ? '\nDRY RUN - nothing deleted. Re-run with --apply to actually delete.' : '\nDone - all generated Pathology content deleted. Textbook source chapters untouched.');
