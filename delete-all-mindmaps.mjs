// Deletes every mindmap doc across every subject (subjects/{subjectId}/mindmaps/{mindmapId}).
// Dry run by default - shows what WOULD be deleted, per subject, with no writes.
// Run with --apply to actually delete.
//
// Usage:
//   node delete-all-mindmaps.mjs            (dry run - just lists what would be deleted)
//   node delete-all-mindmaps.mjs --apply    (actually deletes)

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

// collectionGroup catches the 'mindmaps' subcollection under every subject in one query,
// rather than looping subject-by-subject.
const allMindmaps = await db.collectionGroup('mindmaps').get();

console.log(`Mindmaps found across all subjects: ${allMindmaps.size}\n`);

const bySubject = new Map();
for (const doc of allMindmaps.docs) {
  const subjectId = doc.ref.parent.parent?.id || '(unknown subject)';
  if (!bySubject.has(subjectId)) bySubject.set(subjectId, []);
  bySubject.get(subjectId).push(doc);
}

for (const [subjectId, docs] of bySubject) {
  console.log(`  ${subjectId} — ${docs.length} mindmap(s)`);
  for (const doc of docs) {
    const title = doc.data().title || '(no title)';
    console.log(`      - ${doc.id} — "${title}"`);
  }
}

if (!DRY_RUN) {
  const BATCH_SIZE = 400;
  let deleted = 0;
  for (let i = 0; i < allMindmaps.docs.length; i += BATCH_SIZE) {
    const chunk = allMindmaps.docs.slice(i, i + BATCH_SIZE);
    const batch = db.batch();
    for (const doc of chunk) batch.delete(doc.ref);
    await batch.commit();
    deleted += chunk.length;
    console.log(`  ...deleted ${deleted}/${allMindmaps.size}`);
  }
}

console.log(`\nWould delete: ${allMindmaps.size} mindmap doc(s) across ${bySubject.size} subject(s)`);
console.log(DRY_RUN ? '\nDRY RUN - nothing deleted. Re-run with --apply to actually delete.' : '\nDone - all mindmaps deleted.');
