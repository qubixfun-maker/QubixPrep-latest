import { initializeApp, cert, getApps } from "firebase-admin/app"
import { getFirestore } from "firebase-admin/firestore"
import { getStorage } from "firebase-admin/storage"
import { execSync } from "child_process"
import fs from "fs"
import dotenv from "dotenv"

dotenv.config({ path: ".env.local" })

const MIN_SIZE_MB = process.argv[2] ? parseFloat(process.argv[2]) : 15 // only compress files bigger than this

const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
if (!serviceAccountJson) {
  console.error("FIREBASE_SERVICE_ACCOUNT_JSON not found in .env.local")
  process.exit(1)
}

const app = getApps().length > 0 ? getApps()[0] : initializeApp({
  credential: cert(JSON.parse(serviceAccountJson)),
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
})

const db = getFirestore(app)
const bucket = getStorage(app).bucket()

console.log("Fetching all Notes Packs from Firestore...")
const snap = await db.collection("notePacks").get()

const packsWithFiles = snap.docs.filter(d => d.data().storagePath)
console.log("Found " + packsWithFiles.length + " packs with files (skipping " + (snap.docs.length - packsWithFiles.length) + " combo packs with no file of their own).\n")

let totalOriginal = 0
let totalCompressed = 0
let compressedCount = 0
let skippedCount = 0
let failedCount = 0

for (const docSnap of packsWithFiles) {
  const data = docSnap.data()
  const storagePath = data.storagePath
  const title = data.title || docSnap.id

  console.log("=== " + title + " (" + storagePath + ") ===")

  try {
    const file = bucket.file(storagePath)
    const [exists] = await file.exists()
    if (!exists) {
      console.log("  File not found in Storage, skipping.\n")
      skippedCount++
      continue
    }

    const [metadata] = await file.getMetadata()
    const originalSizeMB = parseInt(metadata.size) / 1024 / 1024

    if (originalSizeMB < MIN_SIZE_MB) {
      console.log("  " + originalSizeMB.toFixed(1) + " MB - already small enough, skipping.\n")
      skippedCount++
      continue
    }

    console.log("  Original: " + originalSizeMB.toFixed(1) + " MB. Downloading...")
    const localOriginal = "/tmp/batch_original.pdf"
    const localCompressed = "/tmp/batch_compressed.pdf"
    await file.download({ destination: localOriginal })

    console.log("  Compressing...")
    execSync(
      `gs -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dPDFSETTINGS=/ebook -dNOPAUSE -dQUIET -dBATCH -sOutputFile="${localCompressed}" "${localOriginal}"`,
      { stdio: "pipe" }
    )

    const compressedSizeMB = fs.statSync(localCompressed).size / 1024 / 1024

    if (compressedSizeMB >= originalSizeMB) {
      console.log("  Compression did not reduce size, leaving original untouched.\n")
      skippedCount++
      fs.unlinkSync(localOriginal)
      fs.unlinkSync(localCompressed)
      continue
    }

    console.log("  Compressed: " + compressedSizeMB.toFixed(1) + " MB (" + (100 - (compressedSizeMB / originalSizeMB * 100)).toFixed(1) + "% smaller). Uploading...")
    await bucket.upload(localCompressed, {
      destination: storagePath,
      metadata: { contentType: "application/pdf" },
    })

    totalOriginal += originalSizeMB
    totalCompressed += compressedSizeMB
    compressedCount++
    console.log("  Done.\n")

    fs.unlinkSync(localOriginal)
    fs.unlinkSync(localCompressed)
  } catch (e) {
    console.log("  FAILED: " + e.message + "\n")
    failedCount++
  }
}

console.log("=== Summary ===")
console.log("Compressed: " + compressedCount)
console.log("Skipped (already small or no file): " + skippedCount)
console.log("Failed: " + failedCount)
if (compressedCount > 0) {
  console.log("Total size before: " + totalOriginal.toFixed(1) + " MB")
  console.log("Total size after: " + totalCompressed.toFixed(1) + " MB")
  console.log("Total saved: " + (totalOriginal - totalCompressed).toFixed(1) + " MB")
}
