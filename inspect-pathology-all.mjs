import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const key = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
initializeApp({ credential: cert(key) });
const db = getFirestore();

console.log('=== subjects/pathology/essayChapters (long answers) ===');
const essayChapters = await db.collection('subjects').doc('pathology').collection('essayChapters').get();
console.log(`${essayChapters.size} chapter(s)`);

console.log('\n=== subjects/pathology/flashcardDecks ===');
const decks = await db.collection('subjects').doc('pathology').collection('flashcardDecks').get();
console.log(`${decks.size} deck(s)`);
decks.docs.slice(0, 5).forEach((d) => console.log(`  - ${d.id}: ${d.data().title || d.data().chapterName || '(no title)'}`));

console.log('\n=== subjects/pathology/mindmaps ===');
const mindmaps = await db.collection('subjects').doc('pathology').collection('mindmaps').get();
console.log(`${mindmaps.size} mindmap(s)`);

console.log('\n=== subjects/pathology/notes (if this collection exists) ===');
try {
  const notes = await db.collection('subjects').doc('pathology').collection('notes').get();
  console.log(`${notes.size} note doc(s)`);
} catch (e) {
  console.log('(collection does not exist or error: ' + e.message + ')');
}

console.log('\n=== subjects/pathology/qbank (if this collection exists) ===');
try {
  const qbank = await db.collection('subjects').doc('pathology').collection('qbank').get();
  console.log(`${qbank.size} qbank doc(s)`);
} catch (e) {
  console.log('(collection does not exist or error: ' + e.message + ')');
}

console.log('\n=== textbooks (finding pathology textbook - NOT touching this) ===');
const textbooks = await db.collection('textbooks').get();
const pathologyTb = textbooks.docs.find((t) => (t.data().title || '').toLowerCase().includes('pathology'));
if (pathologyTb) {
  const chapters = await pathologyTb.ref.collection('chapters').get();
  console.log(`Found textbook "${pathologyTb.data().title}" (id: ${pathologyTb.id}) with ${chapters.size} chapters - this will NOT be touched.`);
} else {
  console.log('No textbook found with "pathology" in the title.');
}
