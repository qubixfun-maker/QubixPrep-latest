import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const key = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
initializeApp({ credential: cert(key) });
const db = getFirestore();

const sectionRef = db.collection('subjects').doc('pathology').collection('essayChapters').doc('ch-06').collection('sections').doc('long-essays');
const doc = await sectionRef.get();

if (!doc.exists) {
  console.log('Nothing to delete - section does not exist.');
} else {
  console.log(`Deleting section with ${doc.data()?.items?.length || 0} items...`);
  await sectionRef.delete();
  console.log('Deleted. Ready for a clean regeneration.');
}
