import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const key = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
initializeApp({ credential: cert(key) });
const db = getFirestore();

const subjects = await db.collection('subjects').get();
console.log(`${subjects.size} subjects found.\n`);

for (const s of subjects.docs) {
  const data = s.data();
  console.log(`Subject: ${s.id} (name: ${data.name})`);
  console.log(`  Fields: ${Object.keys(data).join(', ')}`);
  if (data.textbookIds) console.log(`  textbookIds: ${JSON.stringify(data.textbookIds)}`);
  if (data.textbookId) console.log(`  textbookId: ${data.textbookId}`);
}
