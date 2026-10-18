// Deletes all QBank questions for ONE subject (subjects/{subjectId}/qbankQuestions/*),
// matched by the subject's "name" field (case-insensitive).
// Dry run by default - shows count + a few sample questions, no writes.
//
// Usage:
//   node delete-subject-qbank-questions.mjs "Anesthesiology"            (dry run)
//   node delete-subject-qbank-questions.mjs "Anesthesiology" --apply    (actually deletes)

import dotenv from "dotenv"
dotenv.config({ path: ".env.local" })

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const subjectNameArg = process.argv[2]
const DRY_RUN = process.argv[3] !== '--apply';

if (!subjectNameArg) {
  console.error('Usage: node delete-subject-qbank-questions.mjs "<Subject Name>" [--apply]')
  process.exit(1)
}

const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
if (!serviceAccountJson) {
  console.error("FIREBASE_SERVICE_ACCOUNT_JSON not found in .env.local")
  process.exit(1)
}
const key = JSON.parse(serviceAccountJson);
initializeApp({ credential: cert(key) });
const db = getFirestore();

const subjectsSnap = await db.collection('subjects').get();
const matches = subjectsSnap.docs.filter(
  d => (d.data().name || '').toLowerCase() === subjectNameArg.toLowerCase()
);

if (matches.length === 0) {
  console.log(`No subject found with name "${subjectNameArg}". Subjects available:`);
  for (const d of subjectsSnap.docs) console.log(`  - ${d.id} — "${d.data().name}"`);
  process.exit(1);
}
if (matches.length > 1) {
  console.log(`Multiple subjects matched "${subjectNameArg}" - refusing to guess:`);
  for (const d of matches) console.log(`  - ${d.id} — "${d.data().name}"`);
  process.exit(1);
}

const subjectDoc = matches[0];
console.log(`Subject: ${subjectDoc.id} — "${subjectDoc.data().name}"\n`);

const questionsSnap = await db.collection('subjects').doc(subjectDoc.id).collection('qbankQuestions').get();
console.log(`QBank questions found for this subject: ${questionsSnap.size}`);
console.log('Sample (first 10):');
for (const doc of questionsSnap.docs.slice(0, 10)) {
  const d = doc.data();
  console.log(`  - [${d.topic_title || '(no topic)'}] ${(d.question_text || '').slice(0, 80)}`);
}

if (!DRY_RUN) {
  const BATCH_SIZE = 400;
  const docs = questionsSnap.docs;
  let deleted = 0;
  for (let i = 0; i < docs.length; i += BATCH_SIZE) {
    const chunk = docs.slice(i, i + BATCH_SIZE);
    const batch = db.batch();
    for (const doc of chunk) batch.delete(doc.ref);
    await batch.commit();
    deleted += chunk.length;
    console.log(`  ...deleted ${deleted}/${docs.length}`);
  }
}

console.log(DRY_RUN
  ? '\nDRY RUN - nothing deleted. Re-run with --apply to actually delete.'
  : '\nDone - all QBank questions for this subject deleted.');
