import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const key = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
initializeApp({ credential: cert(key) });
const db = getFirestore();

const textbooks = await db.collection('textbooks').limit(1).get();
const tb = textbooks.docs[0];
const chapters = await tb.ref.collection('chapters').limit(1).get();
const ch = chapters.docs[0];

console.log(`textbookId: ${tb.id}`);
console.log(`textbookTitle: ${tb.data().title}`);
console.log(`chapterId: ${ch.id}`);
console.log(`chapterTitle: ${ch.data().title}`);
