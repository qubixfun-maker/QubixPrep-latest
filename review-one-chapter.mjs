import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const key = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
initializeApp({ credential: cert(key) });
const db = getFirestore();

const CHAPTER_ID = 'ch-06'; // "Inflammation and Healing" - the one that had the original ligature corruption problem

const knowledge = await db.collection('subjects').doc('pathology').collection('chapterKnowledge').doc(CHAPTER_ID).get();
const notes = await db.collection('subjects').doc('pathology').collection('textNotes').doc(CHAPTER_ID).get();

console.log('=== KNOWLEDGE (first topic only) ===');
console.log(JSON.stringify(knowledge.data()?.topics?.[0], null, 2));

console.log('\n\n=== NOTES (first 3000 chars) ===');
console.log((notes.data()?.markdown || '').slice(0, 3000));
