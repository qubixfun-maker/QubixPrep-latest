import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";

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
  const subjectsSnap = await db.collection("subjects").get();
  for (const s of subjectsSnap.docs) {
    const mmSnap = await db.collection("subjects").doc(s.id).collection("mindmaps").get();
    console.log(`${s.id} (${s.data().name}): ${mmSnap.size} mindmap(s)`);
  }
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
