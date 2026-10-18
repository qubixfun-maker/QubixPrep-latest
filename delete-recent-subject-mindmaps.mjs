// Deletes mindmap docs for ONE subject that were created within the last N minutes
// (matched by the subject's "name" field, case-insensitive, and each doc's createdAt).
// Dry run by default - shows what WOULD be deleted, no writes.
//
// Usage:
//   node delete-recent-subject-mindmaps.mjs "Anatomy" 60            (dry run - last 60 min)
//   node delete-recent-subject-mindmaps.mjs "Anatomy" 60 --apply    (actually deletes)

import dotenv from "dotenv"
dotenv.config({ path: ".env.local" })

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const subjectNameArg = process.argv[2]
const minutesArg = process.argv[3]
const DRY_RUN = process.argv[4] !== '--apply';

if (!subjectNameArg || !minutesArg) {
  console.error('Usage: node delete-recent-subject-mindmaps.mjs "<Subject Name>" <minutes> [--apply]')
  process.exit(1)
}
const minutes = Number(minutesArg);
if (!Number.isFinite(minutes) || minutes <= 0) {
  console.error('minutes must be a positive number')
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

const cutoff = Date.now() - minutes * 60 * 1000;

const mindmapsSnap = await db.collection('subjects').doc(subjectDoc.id).collection('mindmaps').get();
const all = mindmapsSnap.docs.map(doc => {
  const data = doc.data();
  const createdAtMs = data.createdAt ? new Date(data.createdAt).getTime() : NaN;
  return { doc, title: data.title || '(no title)', createdAt: data.createdAt || '(none)', createdAtMs };
});

console.log(`All mindmaps for this subject (${all.length} total):`);
for (const m of all) {
  console.log(`  - ${m.doc.id} — "${m.title}" — createdAt: ${m.createdAt}`);
}

const recent = all.filter(m => Number.isFinite(m.createdAtMs) && m.createdAtMs >= cutoff);

console.log(`\nMindmaps created in the last ${minutes} minute(s): ${recent.length}`);
for (const m of recent) {
  console.log(`  - ${m.doc.id} — "${m.title}" — createdAt: ${m.createdAt}`);
}

if (!DRY_RUN) {
  const BATCH_SIZE = 400;
  let deleted = 0;
  for (let i = 0; i < recent.length; i += BATCH_SIZE) {
    const chunk = recent.slice(i, i + BATCH_SIZE);
    const batch = db.batch();
    for (const m of chunk) batch.delete(m.doc.ref);
    await batch.commit();
    deleted += chunk.length;
    console.log(`  ...deleted ${deleted}/${recent.length}`);
  }
}

console.log(DRY_RUN
  ? '\nDRY RUN - nothing deleted. Re-run with --apply to actually delete.'
  : '\nDone - deleted the recent mindmaps listed above.');
