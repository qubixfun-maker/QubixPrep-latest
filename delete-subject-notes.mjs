// Usage:
//   node delete-subject-notes.mjs "obg"            -> preview only, no changes
//   node delete-subject-notes.mjs "obg" --apply     -> backs up to JSON, then deletes
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";

const nameFilter = process.argv[2];
const apply = process.argv.includes("--apply");

if (!nameFilter) {
  console.error("Usage: node delete-subject-notes.mjs \"<subject name or partial match>\" [--apply]");
  process.exit(1);
}

function loadServiceAccount() {
  let raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw && fs.existsSync(".env.local")) {
    const envContent = fs.readFileSync(".env.local", "utf8");
    const match = envContent.match(/FIREBASE_SERVICE_ACCOUNT_JSON=(.*)/);
    if (match) raw = match[1].trim().replace(/^["']|["']$/g, "");
  }
  if (!raw) {
    console.error("Could not find FIREBASE_SERVICE_ACCOUNT_JSON in env or .env.local");
    process.exit(1);
  }
  try {
    return JSON.parse(raw);
  } catch {
    return JSON.parse(Buffer.from(raw, "base64").toString("utf8"));
  }
}

initializeApp({ credential: cert(loadServiceAccount()) });
const db = getFirestore();

async function main() {
  const subjectsSnap = await db.collection("subjects").get();
  const matches = subjectsSnap.docs.filter((d) =>
    (d.data().name || "").toLowerCase().includes(nameFilter.toLowerCase()) ||
    d.id.toLowerCase().includes(nameFilter.toLowerCase())
  );

  if (matches.length === 0) {
    console.log(`No subjects matched "${nameFilter}". Available subjects:`);
    subjectsSnap.docs.forEach((d) => console.log(`  - ${d.id} (${d.data().name})`));
    return;
  }

  for (const subjectDoc of matches) {
    const subjectId = subjectDoc.id;
    const subjectName = subjectDoc.data().name || subjectId;
    const notesSnap = await db.collection("subjects").doc(subjectId).collection("textNotes").get();

    console.log(`\nSubject: ${subjectName} (${subjectId}) - ${notesSnap.size} note document(s)`);

    if (notesSnap.size === 0) continue;

    if (!apply) {
      notesSnap.docs.slice(0, 10).forEach((d) => console.log(`  - ${d.id}: ${d.data().chapterTitle || "(untitled)"}`));
      if (notesSnap.size > 10) console.log(`  ...and ${notesSnap.size - 10} more`);
      continue;
    }

    // Backup before deleting
    const backup = notesSnap.docs.map((d) => ({ id: d.id, data: d.data() }));
    const backupFile = `backup-notes-${subjectId}-${Date.now()}.json`;
    fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2));
    console.log(`  Backed up ${backup.length} note doc(s) to ${backupFile}`);

    const batchSize = 400;
    const docs = notesSnap.docs;
    for (let i = 0; i < docs.length; i += batchSize) {
      const batch = db.batch();
      docs.slice(i, i + batchSize).forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }
    console.log(`  Deleted all ${docs.length} note doc(s) for ${subjectName}.`);
  }

  if (!apply) {
    console.log(`\nThis was a PREVIEW - nothing was deleted. Re-run with --apply to actually delete (a JSON backup will be written first).`);
  }
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
