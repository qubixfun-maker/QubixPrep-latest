// Deletes every QBank question across every subject in Firestore
// (subjects/{subjectId}/qbankQuestions/{id} - where QBank now lives after the
// Neon/Supabase -> Firestore migration).
// Dry run by default - shows what WOULD be deleted, per subject, with no writes.
//
// Usage:
//   node delete-all-qbank-firestore.mjs            (dry run)
//   node delete-all-qbank-firestore.mjs --apply    (actually deletes)

import dotenv from "dotenv"
dotenv.config({ path: ".env.local" })

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const DRY_RUN = process.argv[2] !== '--apply';

const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
if (!serviceAccountJson) {
  console.error("FIREBASE_SERVICE_ACCOUNT_JSON not found in .env.local")
  process.exit(1)
}
const key = JSON.parse(serviceAccountJson);
initializeApp({ credential: cert(key) });
const db = getFirestore();

// collectionGroup catches the 'qbankQuestions' subcollection under every subject in
// one query, rather than looping subject-by-subject.
const allQuestions = await db.collectionGroup('qbankQuestions').get();

console.log(`QBank questions found across all subjects: ${allQuestions.size}\n`);

const bySubject = new Map();
for (const doc of allQuestions.docs) {
  const subjectId = doc.ref.parent.parent?.id || '(unknown subject)';
  bySubject.set(subjectId, (bySubject.get(subjectId) || 0) + 1);
}
for (const [subjectId, count] of bySubject) {
  console.log(`  ${subjectId} — ${count} question(s)`);
}

if (!DRY_RUN) {
  const BATCH_SIZE = 400;
  let deleted = 0;
  for (let i = 0; i < allQuestions.docs.length; i += BATCH_SIZE) {
    const chunk = allQuestions.docs.slice(i, i + BATCH_SIZE);
    const batch = db.batch();
    for (const doc of chunk) batch.delete(doc.ref);
    await batch.commit();
    deleted += chunk.length;
    console.log(`  ...deleted ${deleted}/${allQuestions.size}`);
  }
}

console.log(`\nWould delete: ${allQuestions.size} question(s) across ${bySubject.size} subject(s)`);
console.log(DRY_RUN ? '\nDRY RUN - nothing deleted. Re-run with --apply to actually delete.' : '\nDone - all QBank questions deleted from Firestore.');
