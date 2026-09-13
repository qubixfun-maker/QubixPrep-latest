import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const key = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
initializeApp({ credential: cert(key) });
const db = getFirestore();

const textbookId = 'textbook-of-pathology-1787116046851';
const chapters = await db.collection('textbooks').doc(textbookId).collection('chapters').get();

const results = [];
for (const ch of chapters.docs) {
  const text = ch.data().text || '';
  results.push({ id: ch.id, title: ch.data().title, length: text.length, overCap: text.length > 60000 });
}

results.sort((a, b) => b.length - a.length);

const overCapCount = results.filter((r) => r.overCap).length;
console.log(`${overCapCount} of ${results.length} chapters exceed the 60,000-character cap:\n`);

results.forEach((r) => {
  console.log(`${r.overCap ? 'OVER CAP' : '   ok   '}  ${String(r.length).padStart(7)} chars  -  ${r.title}`);
});
