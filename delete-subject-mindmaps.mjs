// Usage:
//   node delete-subject-mindmaps.mjs "obstetrics-and-gynecology"            -> preview only
//   node delete-subject-mindmaps.mjs "obstetrics-and-gynecology" --apply     -> backs up to JSON, then deletes
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";

const subjectArg = process.argv[2];
const apply = process.argv.includes("--apply");

if (!subjectArg) {
  console.error("Usage: node delete-subject-mindmaps.mjs \"<subjectId>\" [--apply]");
  process.exit(1);
}

function loadServiceAccount() {
  let raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw && fs.existsSync(".env.local")) {
    const envContent = fs.readFileSync(".env.local", "utf8");
    const match = envContent.match(/FIREBASE_SERVICE_ACCOUNT_JSON=(.*)/);
    if (match) raw = match[1].trim().replace(/^["']|["']$/g, "");
  }
  if (!raw) { console.error("Could not find FIREBASE_SERVICE_ACCOUNT_JSON"); process.exit(1); }
  try { return JSON.parse(raw); } catch { return JSON.parse(Buffer.from(raw, "base64").toString("utf8")); }
}

initializeApp({ credential: cert(loadServiceAccount()) });
const db = getFirestore();

async function main() {
  const subjectDoc = await db.collection("subjects").doc(subjectArg).get();
  if (!subjectDoc.exists) {
    console.log(`No subject found with id "${subjectArg}". Available subjects:`);
    const allSubjects = await db.collection("subjects").get();
    allSubjects.docs.forEach((d) => console.log(`  - ${d.id} (${d.data().name})`));
    return;
  }

  const subjectName = subjectDoc.data().name || subjectArg;
  const mindmapsSnap = await db.collection("subjects").doc(subjectArg).collection("mindmaps").get();

  console.log(`Subject: ${subjectName} (${subjectArg}) - ${mindmapsSnap.size} mindmap document(s)`);

  if (mindmapsSnap.size === 0) return;

  if (!apply) {
    mindmapsSnap.docs.slice(0, 15).forEach((d) => console.log(`  - ${d.id}: ${d.data().title || d.data().chapterTitle || "(untitled)"}`));
    if (mindmapsSnap.size > 15) console.log(`  ...and ${mindmapsSnap.size - 15} more`);
    console.log(`\nThis was a PREVIEW - nothing was deleted. Re-run with --apply to actually delete (a JSON backup will be written first).`);
    return;
  }

  const backup = mindmapsSnap.docs.map((d) => ({ id: d.id, data: d.data() }));
  const backupFile = `backup-mindmaps-${subjectArg}-${Date.now()}.json`;
  fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2));
  console.log(`Backed up ${backup.length} mindmap doc(s) to ${backupFile}`);

  const batchSize = 400;
  const docs = mindmapsSnap.docs;
  for (let i = 0; i < docs.length; i += batchSize) {
    const batch = db.batch();
    docs.slice(i, i + batchSize).forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }
  console.log(`Deleted all ${docs.length} mindmap doc(s) for ${subjectName}.`);
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
