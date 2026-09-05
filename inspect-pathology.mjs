import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const key = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
initializeApp({ credential: cert(key) });
const db = getFirestore();

const chapters = await db.collection('subjects').doc('pathology').collection('essayChapters').get();
console.log(`${chapters.size} Pathology essayChapters found.\n`);

for (const ch of chapters.docs) {
  const data = ch.data();
  const sections = await ch.ref.collection('sections').get();
  console.log(`Chapter: ${data.title || ch.id} (id: ${ch.id})`);
  console.log(`  sectionCounts field: ${JSON.stringify(data.sectionCounts || {})}`);
  console.log(`  actual sections subcollection: ${sections.size} docs`);
  sections.docs.forEach((s) => {
    const sd = s.data();
    console.log(`    ${s.id}: questionCount=${sd.questionCount ?? '?'}, htmlLength=${(sd.html || '').length}`);
  });
  console.log('');
}
