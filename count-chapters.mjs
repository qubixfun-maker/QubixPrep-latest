import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const key = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
initializeApp({ credential: cert(key) });
const db = getFirestore();

const subjects = await db.collection('subjects').get();
let total = 0;

for (const subj of subjects.docs) {
  const chapters = await db.collection('subjects').doc(subj.id).collection('essayChapters').get();
  if (chapters.size > 0) {
    console.log(`${subj.data().name || subj.id}: ${chapters.size}`);
    total += chapters.size;
  }
}

console.log(`\nTOTAL essayChapters across all subjects: ${total}`);
