import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const key = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
initializeApp({ credential: cert(key) });
const db = getFirestore();

const knowledgeDoc = await db.collection('subjects').doc('pathology').collection('chapterKnowledge').doc('ch-06').get();
const topics = knowledgeDoc.data()?.topics || [];

console.log(`Total topics extracted: ${topics.length}\n`);
topics.forEach((t, i) => console.log(`${i + 1}. ${t.name} (${t.facts?.length || 0} facts)`));

// Also check the raw source text length to see if it hit the truncation cap
const textbookDoc = await db.collection('textbooks').doc('textbook-of-pathology-1787116046851').collection('chapters').doc('ch-06').get();
console.log(`\nRaw chapter text length: ${(textbookDoc.data()?.text || '').length} characters`);
