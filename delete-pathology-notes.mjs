import { initializeApp, cert, getApps } from "firebase-admin/app"
import { getFirestore } from "firebase-admin/firestore"
import dotenv from "dotenv"

dotenv.config({ path: ".env.local" })

const CONFIRM = process.argv[2] === "--confirm"

const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
if (!serviceAccountJson) {
  console.error("FIREBASE_SERVICE_ACCOUNT_JSON not found in .env.local")
  process.exit(1)
}

const app = getApps().length > 0 ? getApps()[0] : initializeApp({
  credential: cert(JSON.parse(serviceAccountJson)),
})
const db = getFirestore(app)

const TARGET_SUBJECT_NAME = "pathology"

console.log(`Looking for subject matching "${TARGET_SUBJECT_NAME}"...\n`)

const subjectsSnap = await db.collection("subjects").get()
const match = subjectsSnap.docs.find(
  (d) => (d.data().name || "").trim().toLowerCase() === TARGET_SUBJECT_NAME
)

if (!match) {
  console.error(`No subject found with name "${TARGET_SUBJECT_NAME}". Subjects that exist:`)
  subjectsSnap.docs.forEach((d) => console.error(`  - ${d.data().name} (id: ${d.id})`))
  process.exit(1)
}

console.log(`Found subject: "${match.data().name}" (id: ${match.id})\n`)

const notesSnap = await db.collection("subjects").doc(match.id).collection("textNotes").get()

if (notesSnap.empty) {
  console.log("No notes documents found for this subject. Nothing to delete.")
  process.exit(0)
}

console.log(`Found ${notesSnap.size} notes document(s):\n`)
notesSnap.docs.forEach((d) => {
  const data = d.data()
  const topicCount = data.topics?.length ?? 0
  console.log(`  - ${d.id}  (chapter: "${data.chapterTitle || "?"}", ${topicCount} topic${topicCount === 1 ? "" : "s"})`)
})

if (!CONFIRM) {
  console.log(`\nDRY RUN — nothing was deleted. Re-run as:\n  node delete-pathology-notes.mjs --confirm\nto actually delete the ${notesSnap.size} document(s) listed above.`)
  process.exit(0)
}

console.log(`\n--confirm passed — deleting ${notesSnap.size} document(s)...`)
const batchSize = 400
for (let i = 0; i < notesSnap.docs.length; i += batchSize) {
  const batch = db.batch()
  notesSnap.docs.slice(i, i + batchSize).forEach((d) => batch.delete(d.ref))
  await batch.commit()
}
console.log(`Done. Deleted ${notesSnap.size} notes document(s) for "${match.data().name}".`)
