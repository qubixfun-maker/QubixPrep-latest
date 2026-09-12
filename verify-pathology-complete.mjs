import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const key = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
initializeApp({ credential: cert(key) });
const db = getFirestore();

const knowledgeDocs = await db.collection('subjects').doc('pathology').collection('chapterKnowledge').get();
const notesDocs = await db.collection('subjects').doc('pathology').collection('textNotes').get();

console.log(`chapterKnowledge: ${knowledgeDocs.size} docs`);
console.log(`textNotes: ${notesDocs.size} docs\n`);

const knowledgeIds = new Set(knowledgeDocs.docs.map(d => d.id));
const notesIds = new Set(notesDocs.docs.map(d => d.id));

const missingNotes = [...knowledgeIds].filter(id => !notesIds.has(id));
const missingKnowledge = [...notesIds].filter(id => !knowledgeIds.has(id));

if (missingNotes.length) {
  console.log(`Chapters with knowledge but NO notes: ${missingNotes.length}`);
  missingNotes.forEach(id => console.log(`  - ${id}`));
} else {
  console.log('Every chapter with knowledge also has notes. Good.');
}

if (missingKnowledge.length) {
  console.log(`\nChapters with notes but NO knowledge (shouldn't happen): ${missingKnowledge.length}`);
  missingKnowledge.forEach(id => console.log(`  - ${id}`));
}

// Spot check the 3 previously-uncertain ones specifically
console.log('\n--- Spot check on the 3 previously-uncertain chapters ---');
for (const ch of knowledgeDocs.docs) {
  if ((ch.data().chapterTitle || '').match(/Eye, ENT|Techniques for the Study|Male Reproductive/)) {
    const notesDoc = await db.collection('subjects').doc('pathology').collection('textNotes').doc(ch.id).get();
    console.log(`${ch.data().chapterTitle}:`);
    console.log(`  knowledge topics: ${ch.data().topics?.length || 0}`);
    console.log(`  notes exists: ${notesDoc.exists}, notes length: ${notesDoc.data()?.markdown?.length || 0}`);
  }
}
