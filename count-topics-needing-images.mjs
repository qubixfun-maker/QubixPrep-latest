import { initializeApp, cert, getApps } from "firebase-admin/app"
import { getFirestore } from "firebase-admin/firestore"
import dotenv from "dotenv"

dotenv.config({ path: ".env.local" })

const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
if (!serviceAccountJson) {
  console.error("FIREBASE_SERVICE_ACCOUNT_JSON not found in .env.local")
  process.exit(1)
}
const app = getApps().length > 0 ? getApps()[0] : initializeApp({ credential: cert(JSON.parse(serviceAccountJson)) })
const db = getFirestore(app)

const subjectsSnap = await db.collection("subjects").get()
let totalTopics = 0
let withImage = 0
let withoutImage = 0
const bySubject = {}

for (const subjectDoc of subjectsSnap.docs) {
  const subjectName = (subjectDoc.data().name || subjectDoc.id).trim()
  const notesSnap = await db.collection("subjects").doc(subjectDoc.id).collection("textNotes").get()
  let subjTotal = 0, subjMissing = 0

  for (const noteDoc of notesSnap.docs) {
    const topics = noteDoc.data().topics || []
    for (const topic of topics) {
      totalTopics++
      subjTotal++
      const hasImage = /!\[[^\]]*\]\(/.test(topic.markdown || "")
      if (hasImage) withImage++
      else { withoutImage++; subjMissing++ }
    }
  }
  if (subjTotal > 0) bySubject[subjectName] = { total: subjTotal, missing: subjMissing }
}

console.log("--- Topics needing an image, by subject ---")
for (const [name, counts] of Object.entries(bySubject)) {
  console.log(`  ${name}: ${counts.missing} missing / ${counts.total} total`)
}
console.log("\n--- Overall ---")
console.log(`Total topics: ${totalTopics}`)
console.log(`Already have an image: ${withImage}`)
console.log(`Still need an image: ${withoutImage}`)
