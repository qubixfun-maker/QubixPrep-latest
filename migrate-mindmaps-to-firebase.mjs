import { initializeApp, cert, getApps } from "firebase-admin/app"
import { getFirestore } from "firebase-admin/firestore"
import { getStorage } from "firebase-admin/storage"
import dotenv from "dotenv"

dotenv.config({ path: ".env.local" })

const DELETE_FROM_SUPABASE = process.argv[2] !== "--no-delete"

const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
if (!serviceAccountJson) {
  console.error("FIREBASE_SERVICE_ACCOUNT_JSON not found in .env.local")
  process.exit(1)
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY not found in .env.local")
  process.exit(1)
}

const app = getApps().length > 0 ? getApps()[0] : initializeApp({
  credential: cert(JSON.parse(serviceAccountJson)),
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
})

const db = getFirestore(app)
const bucket = getStorage(app).bucket()

console.log("Fetching all mindmaps from Firestore (across all subjects)...")
const snap = await db.collectionGroup("mindmaps").get()
console.log("Found " + snap.size + " mindmap documents.\n")

let migrated = 0
let skipped = 0
let failed = 0
let deletedFromSupabase = 0

for (const docSnap of snap.docs) {
  const data = docSnap.data()
  const title = data.title || docSnap.id
  const imageUrl = data.imageUrl
  const storagePath = data.storagePath

  if (!imageUrl || !storagePath) {
    console.log("SKIP (no imageUrl/storagePath): " + title)
    skipped++
    continue
  }

  if (data.storageProvider === "firebase") {
    console.log("SKIP (already migrated): " + title)
    skipped++
    continue
  }

  console.log("=== " + title + " (" + storagePath + ") ===")
  try {
    console.log("  Downloading from Supabase...")
    const res = await fetch(imageUrl)
    if (!res.ok) throw new Error("Fetch failed with status " + res.status)
    const arrayBuffer = await res.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const contentType = res.headers.get("content-type") || "image/jpeg"

    console.log("  Uploading to Firebase Storage (" + (buffer.length / 1024).toFixed(0) + " KB)...")
    const file = bucket.file(storagePath)
    await file.save(buffer, { metadata: { contentType } })
    await file.makePublic()

    const newUrl = "https://storage.googleapis.com/" + bucket.name + "/" + storagePath

    await docSnap.ref.update({
      imageUrl: newUrl,
      storageProvider: "firebase",
    })

    console.log("  Firestore doc updated with new URL.")

    if (DELETE_FROM_SUPABASE) {
      const deleteRes = await fetch(SUPABASE_URL + "/storage/v1/object/mindmaps/" + storagePath, {
        method: "DELETE",
        headers: { "Authorization": "Bearer " + SUPABASE_ANON_KEY },
      })
      if (deleteRes.ok) {
        console.log("  Deleted original from Supabase.")
        deletedFromSupabase++
      } else {
        console.log("  Could not delete from Supabase (status " + deleteRes.status + ") - file migrated but original left in place.")
      }
    }

    migrated++
    console.log("  Done.\n")
  } catch (e) {
    console.log("  FAILED: " + e.message + "\n")
    failed++
  }
}

console.log("=== Summary ===")
console.log("Migrated: " + migrated)
console.log("Skipped: " + skipped)
console.log("Failed: " + failed)
console.log("Deleted from Supabase: " + deletedFromSupabase)
