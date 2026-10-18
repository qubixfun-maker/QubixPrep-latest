import dotenv from "dotenv"
dotenv.config({ path: ".env.local" })
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const subjectNameArg = process.argv[2]
if (!subjectNameArg) { console.error('Usage: node inspect-mindmap.mjs "<Subject Name>"'); process.exit(1) }

const key = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
initializeApp({ credential: cert(key) });
const db = getFirestore();

const subjectsSnap = await db.collection('subjects').get();
const subjectDoc = subjectsSnap.docs.find(d => (d.data().name || '').toLowerCase() === subjectNameArg.toLowerCase());
if (!subjectDoc) { console.log('No match. Available:'); for (const d of subjectsSnap.docs) console.log(`  - "${d.data().name}"`); process.exit(1); }

function stats(node, depth = 1) {
  let maxDepth = depth, count = 1;
  for (const b of node.branches || []) { const s = stats(b, depth + 1); maxDepth = Math.max(maxDepth, s.maxDepth); count += s.count; }
  return { maxDepth, count };
}

const mindmapsSnap = await db.collection('subjects').doc(subjectDoc.id).collection('mindmaps').get();
console.log(`Stats for "${subjectDoc.data().name}":\n`);
for (const doc of mindmapsSnap.docs) {
  const data = doc.data();
  if (!data.data) { console.log(`  "${data.title}" — NO DATA FIELD`); continue; }
  const s = stats(data.data);
  console.log(`  "${data.title}" — createdAt: ${data.createdAt} — nodes: ${s.count}, depth: ${s.maxDepth} — providers: ${JSON.stringify(data.debugProviders || 'none saved')}`);
}
