import { initializeApp, cert, getApps } from "firebase-admin/app"
import { getFirestore } from "firebase-admin/firestore"
import dotenv from "dotenv"

dotenv.config({ path: ".env.local" })

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

const subjectsSnap = await db.collection("subjects").get()
const match = subjectsSnap.docs.find(
  (d) => (d.data().name || "").trim().toLowerCase() === TARGET_SUBJECT_NAME
)

if (!match) {
  console.error(`No subject found with name "${TARGET_SUBJECT_NAME}".`)
  process.exit(1)
}

const jobRef = db.collection("subjects").doc(match.id).collection("notesGenerationJob").doc("current")
const jobSnap = await jobRef.get()

if (!jobSnap.exists) {
  console.log(`No notesGenerationJob/current doc exists for "${match.data().name}". Nothing to delete.`)
  process.exit(0)
}

const data = jobSnap.data()
console.log(`Found job doc for "${match.data().name}": status=${data.status}, ${data.chapters?.length || 0} chapters tracked.`)
await jobRef.delete()
console.log("Deleted notesGenerationJob/current.")
