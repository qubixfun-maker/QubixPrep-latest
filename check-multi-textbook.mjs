import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const key = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
initializeApp({ credential: cert(key) });
const db = getFirestore();

const textbooks = await db.collection('textbooks').get();
const bySubject = {};

for (const tb of textbooks.docs) {
  const data = tb.data();
  const subjectGuess = data.subjectId || data.subject || '(unknown - check manually)';
  if (!bySubject[subjectGuess]) bySubject[subjectGuess] = [];
  bySubject[subjectGuess].push({ id: tb.id, title: data.title });
}

console.log('Textbooks grouped by subject:\n');
for (const [subject, books] of Object.entries(bySubject)) {
  console.log(`${subject}: ${books.length} textbook(s)`);
  books.forEach((b) => console.log(`  - ${b.title} (${b.id})`));
}

console.log(`\nTotal textbooks: ${textbooks.size}`);
