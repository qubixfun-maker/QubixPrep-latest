import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const key = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
initializeApp({ credential: cert(key) });
const db = getFirestore();

// Find the Pharmacology subject id
const subjects = await db.collection('subjects').get();
const pharma = subjects.docs.find((s) => (s.data().name || '').toLowerCase().includes('pharma'));
if (!pharma) {
  console.log('No subject with "pharma" in the name found. Subject names:', subjects.docs.map(s => s.data().name));
  process.exit(0);
}
console.log(`Subject: ${pharma.data().name} (id: ${pharma.id})\n`);

const chapters = await db.collection('subjects').doc(pharma.id).collection('essayChapters').get();
console.log(`${chapters.size} essayChapters found.\n`);

for (const ch of chapters.docs) {
  const data = ch.data();
  const sections = await ch.ref.collection('sections').get();
  const sectionInfo = sections.docs.map((s) => {
    const sd = s.data();
    const htmlLen = (sd.html || '').length;
    return `${s.id}: questionCount=${sd.questionCount ?? '?'}, htmlLength=${htmlLen}`;
  });
  console.log(`Chapter: ${data.title || ch.id} (id: ${ch.id})`);
  console.log(`  sectionCounts field on chapter doc: ${JSON.stringify(data.sectionCounts || {})}`);
  console.log(`  actual sections subcollection: ${sections.size} docs`);
  sectionInfo.forEach((line) => console.log(`    ${line}`));
  console.log('');
}
