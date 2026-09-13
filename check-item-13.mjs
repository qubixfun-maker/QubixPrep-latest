import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const key = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
initializeApp({ credential: cert(key) });
const db = getFirestore();

const sectionDoc = await db.collection('subjects').doc('pathology').collection('essayChapters').doc('ch-06').collection('sections').doc('long-essays').get();
const items = sectionDoc.data()?.items || [];

console.log(`Total items: ${items.length}\n`);
const item13 = items[12]; // 0-indexed, so item 13 is index 12

console.log('Q:', item13?.questionHtml);
console.log('\nA (raw HTML, full):');
console.log(item13?.answerHtml);
