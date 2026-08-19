import { initializeApp, cert, getApps } from "firebase-admin/app"
import { getStorage } from "firebase-admin/storage"
import { execSync } from "child_process"
import fs from "fs"
import dotenv from "dotenv"

dotenv.config({ path: ".env.local" })

const STORAGE_PATH = process.argv[2]
if (!STORAGE_PATH) {
  console.error("Usage: node compress-notepack.mjs <storagePath>")
  console.error("Example: node compress-notepack.mjs notepacks-private/notepack-1785318319263.pdf")
  process.exit(1)
}

const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
if (!serviceAccountJson) {
  console.error("FIREBASE_SERVICE_ACCOUNT_JSON not found in .env.local")
  process.exit(1)
}

const app = getApps().length > 0 ? getApps()[0] : initializeApp({
  credential: cert(JSON.parse(serviceAccountJson)),
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
})

const bucket = getStorage(app).bucket()
const file = bucket.file(STORAGE_PATH)

const [exists] = await file.exists()
if (!exists) {
  console.error("File not found at path: " + STORAGE_PATH)
  process.exit(1)
}

const localOriginal = "/tmp/original.pdf"
const localCompressed = "/tmp/compressed.pdf"

console.log("Downloading original file from Storage...")
await file.download({ destination: localOriginal })

const originalSize = fs.statSync(localOriginal).size
console.log("Original size: " + (originalSize / 1024 / 1024).toFixed(1) + " MB")

console.log("Compressing with Ghostscript (this may take a few minutes for large scanned PDFs)...")
execSync(
  `gs -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dPDFSETTINGS=/ebook -dNOPAUSE -dQUIET -dBATCH -sOutputFile="${localCompressed}" "${localOriginal}"`,
  { stdio: "inherit" }
)

const compressedSize = fs.statSync(localCompressed).size
console.log("Compressed size: " + (compressedSize / 1024 / 1024).toFixed(1) + " MB")
console.log("Reduction: " + (100 - (compressedSize / originalSize * 100)).toFixed(1) + "%")

if (compressedSize >= originalSize) {
  console.log("Compressed file is not smaller than original - aborting upload, original left untouched.")
  process.exit(0)
}

console.log("Uploading compressed file back to Storage at same path...")
await bucket.upload(localCompressed, {
  destination: STORAGE_PATH,
  metadata: { contentType: "application/pdf" },
})

console.log("Done. File replaced at: " + STORAGE_PATH)
