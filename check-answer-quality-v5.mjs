import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const key = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
initializeApp({ credential: cert(key) });
const db = getFirestore();

const sectionDoc = await db.collection('subjects').doc('pathology').collection('essayChapters').doc('ch-06').collection('sections').doc('long-essays').get();
const items = sectionDoc.data()?.items || [];
const last = items[items.length - 1];

console.log('Q:', last?.questionHtml);
console.log('\nA (HTML):');
console.log(last?.answerHtml);
