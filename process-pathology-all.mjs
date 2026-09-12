import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const SITE_URL = 'https://qubixprep.com';
const SECRET = process.env.ADMIN_BULK_SECRET;
const SUBJECT_ID = 'pathology';
const SUBJECT_NAME = 'Textbook of pathology';
const FORCE = process.argv.includes('--force'); // reprocess even if already done

if (!SECRET) {
  console.error('ADMIN_BULK_SECRET not found in .env.local');
  process.exit(1);
}

const key = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
initializeApp({ credential: cert(key) });
const db = getFirestore();

const textbooks = await db.collection('textbooks').get();
const pathologyTb = textbooks.docs.find((t) => (t.data().title || '').toLowerCase().includes('pathology'));
if (!pathologyTb) {
  console.error('Could not find the Pathology textbook.');
  process.exit(1);
}
const textbookId = pathologyTb.id;
console.log(`Textbook: ${pathologyTb.data().title} (${textbookId})\n`);

const chapters = await pathologyTb.ref.collection('chapters').get();
const chapterDocs = chapters.docs.sort((a, b) => (a.data().title || '').localeCompare(b.data().title || ''));

console.log(`${chapterDocs.length} chapters found. Processing one at a time (using Gemini 3.8 Flash native)...\n`);

let succeeded = 0, failed = 0, skipped = 0;

for (let i = 0; i < chapterDocs.length; i++) {
  const ch = chapterDocs[i];
  const chapterId = ch.id;
  const chapterTitle = ch.data().title || chapterId;
  const label = `[${i + 1}/${chapterDocs.length}] ${chapterTitle}`;

  if (!FORCE) {
    const existing = await db.collection('subjects').doc(SUBJECT_ID).collection('chapterKnowledge').doc(chapterId).get();
    if (existing.exists) {
      console.log(`${label} - SKIPPED (already processed, use --force to redo)`);
      skipped++;
      continue;
    }
  }

  try {
    const res = await fetch(`${SITE_URL}/api/admin/process-chapter-full`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret: SECRET,
        textbookId,
        chapterId,
        subjectId: SUBJECT_ID,
        subjectName: SUBJECT_NAME,
        useGeminiNative: true,
      }),
    });
    const data = await res.json();

    if (data.success) {
      console.log(`${label} - OK (${data.topicCount} topics, ${data.factCount} facts, notes ${data.notesLength} chars)`);
      succeeded++;
    } else {
      console.log(`${label} - FAILED at stage "${data.stage || '?'}": ${data.error}`);
      failed++;
    }
  } catch (err) {
    console.log(`${label} - NETWORK ERROR: ${err.message}`);
    failed++;
  }

  // Gentle pause between chapters - courteous to the API and quota, matches
  // the same pacing pattern as the existing bulk-generation tools.
  await new Promise((r) => setTimeout(r, 8000));
}

console.log(`\nDone. ${succeeded} succeeded, ${failed} failed, ${skipped} skipped.`);
