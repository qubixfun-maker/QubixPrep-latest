import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const DRY_RUN = process.argv[2] !== '--apply';

const key = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
initializeApp({ credential: cert(key) });
const db = getFirestore();

const chaptersRef = db.collection('subjects').doc('pathology').collection('essayChapters');
const chapters = await chaptersRef.get();

console.log(`Pathology essayChapters found: ${chapters.size}\n`);

let totalSections = 0;
for (const ch of chapters.docs) {
  const sections = await ch.ref.collection('sections').get();
  console.log(`  ${ch.id} — "${ch.data().title || '(no title)'}" — ${sections.size} section(s)`);
  totalSections += sections.size;

  if (!DRY_RUN) {
    for (const sec of sections.docs) {
      await sec.ref.delete();
    }
    await ch.ref.delete();
  }
}

console.log(`\nWould delete: ${chapters.size} chapter doc(s) + ${totalSections} section doc(s)`);
console.log(DRY_RUN ? '\nDRY RUN — nothing deleted. Re-run with --apply to actually delete.' : '\nDone — all Pathology essayChapters deleted.');
