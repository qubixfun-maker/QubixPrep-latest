import { initializeApp, cert, getApps } from "firebase-admin/app"
import { getFirestore, FieldValue } from "firebase-admin/firestore"
import { getStorage } from "firebase-admin/storage"
import { execSync } from "child_process"
import fs from "fs"
import path from "path"
import dotenv from "dotenv"

dotenv.config({ path: ".env.local" })

const PDF_PATH = process.argv[2]
const TITLE = process.argv[3]
const AUTHOR = process.argv[4] || ""

if (!PDF_PATH || !TITLE) {
  console.error("Usage: node ingest-textbook.mjs <path-to-pdf> \"<Title>\" \"<Author>\"")
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
const db = getFirestore(app)
const bucket = getStorage(app).bucket()

// --- Step 0: auto-compress a copy of the PDF for archival storage ---
// (Text/image extraction below still uses the ORIGINAL file for best quality -
// this compressed copy is only what gets stored as the reference/download copy.)
console.log("Compressing a copy of the PDF for storage...")
const originalSizeMB = fs.statSync(PDF_PATH).size / 1024 / 1024
const compressedPath = "/tmp/textbook_compressed.pdf"
let uploadPath = PDF_PATH
try {
  execSync(
    `gs -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dPDFSETTINGS=/ebook -dNOPAUSE -dQUIET -dBATCH -sOutputFile="${compressedPath}" "${PDF_PATH}"`,
    { stdio: "pipe" }
  )
  const compressedSizeMB = fs.statSync(compressedPath).size / 1024 / 1024
  console.log("  Original: " + originalSizeMB.toFixed(1) + " MB -> Compressed: " + compressedSizeMB.toFixed(1) + " MB")
  if (compressedSizeMB < originalSizeMB) {
    uploadPath = compressedPath
  } else {
    console.log("  Compression didn't help, using original for storage.")
  }
} catch (e) {
  console.log("  Compression failed (gs not available?), using original for storage. Error: " + e.message)
}

// --- Step 1: read outline (bookmarks) using pdfjs-dist ---
const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs")
const rawData = new Uint8Array(fs.readFileSync(PDF_PATH))
const loadingTask = pdfjsLib.getDocument({ data: rawData })
const pdfDoc = await loadingTask.promise
const totalPages = pdfDoc.numPages

console.log("\nLoaded PDF: " + totalPages + " pages")

const outline = await pdfDoc.getOutline()
if (!outline) {
  console.error("No bookmarks/outline found in this PDF - cannot auto-detect chapters.")
  process.exit(1)
}

async function getPageNumber(dest) {
  if (!dest) return null
  let explicitDest = dest
  if (typeof dest === "string") {
    explicitDest = await pdfDoc.getDestination(dest)
  }
  if (!explicitDest) return null
  const pageIndex = await pdfDoc.getPageIndex(explicitDest[0])
  return pageIndex + 1
}

const flatEntries = []
async function walk(items) {
  for (const item of items) {
    const pageNum = await getPageNumber(item.dest)
    if (pageNum) flatEntries.push({ title: item.title.trim(), page: pageNum })
    if (item.items && item.items.length) await walk(item.items)
  }
}
await walk(outline)

const chapterEntries = flatEntries.filter(e => /^\d+\.\s/.test(e.title))
console.log("Detected " + chapterEntries.length + " chapters:")
chapterEntries.forEach(e => console.log("  " + e.title + " -> page " + e.page))

if (chapterEntries.length === 0) {
  console.error("No chapters matched the 'N. Title' pattern - aborting.")
  process.exit(1)
}

const chapters = chapterEntries.map((e, i) => ({
  title: e.title,
  startPage: e.page,
  endPage: i < chapterEntries.length - 1 ? chapterEntries[i + 1].page - 1 : totalPages,
}))

// --- Step 2: create textbook doc, upload (compressed) source PDF ---
const textbookId = TITLE.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") + "-" + Date.now()
const textbookRef = db.collection("textbooks").doc(textbookId)

console.log("\nUploading source PDF to Firebase Storage...")
const sourcePath = "textbooks/" + textbookId + "/source.pdf"
await bucket.upload(uploadPath, { destination: sourcePath, metadata: { contentType: "application/pdf" } })

await textbookRef.set({
  title: TITLE,
  author: AUTHOR,
  totalPages,
  storagePath: sourcePath,
  chapterCount: chapters.length,
  status: "processing",
  createdAt: FieldValue.serverTimestamp(),
})

console.log("Textbook doc created: " + textbookId)

// --- Step 3: process each chapter - extract text + images from ORIGINAL file ---
for (let i = 0; i < chapters.length; i++) {
  const ch = chapters[i]
  const chapterId = "ch-" + (i + 1).toString().padStart(2, "0")
  console.log("\n=== " + ch.title + " (pages " + ch.startPage + "-" + ch.endPage + ") ===")

  console.log("  Extracting text...")
  const text = execSync(
    `pdftotext -f ${ch.startPage} -l ${ch.endPage} -layout "${PDF_PATH}" -`,
    { maxBuffer: 1024 * 1024 * 20 }
  ).toString("utf8")
  console.log("  Text length: " + text.length + " chars")

  console.log("  Extracting images...")
  const tmpImgDir = "/tmp/textbook_extract_" + chapterId
  fs.mkdirSync(tmpImgDir, { recursive: true })
  const imgPrefix = tmpImgDir + "/img"
  try {
    execSync(`pdfimages -png -f ${ch.startPage} -l ${ch.endPage} "${PDF_PATH}" "${imgPrefix}"`, { stdio: "pipe" })
  } catch (e) {
    console.log("  (no images or extraction issue, continuing)")
  }

  const imgFiles = fs.existsSync(tmpImgDir) ? fs.readdirSync(tmpImgDir).filter(f => f.endsWith(".png")) : []
  console.log("  Found " + imgFiles.length + " embedded images")

  const images = []
  for (const imgFile of imgFiles) {
    const localPath = path.join(tmpImgDir, imgFile)
    const stat = fs.statSync(localPath)
    if (stat.size < 3000) continue

    const destPath = "textbooks/" + textbookId + "/images/" + chapterId + "/" + imgFile
    await bucket.upload(localPath, { destination: destPath, metadata: { contentType: "image/png" } })
    const file = bucket.file(destPath)
    await file.makePublic()
    const url = "https://storage.googleapis.com/" + bucket.name + "/" + destPath
    images.push({ filename: imgFile, storagePath: destPath, url, sizeBytes: stat.size })
  }

  fs.rmSync(tmpImgDir, { recursive: true, force: true })

  await textbookRef.collection("chapters").doc(chapterId).set({
    title: ch.title,
    startPage: ch.startPage,
    endPage: ch.endPage,
    text,
    images,
    imageCount: images.length,
  })

  console.log("  Saved chapter doc with " + images.length + " images.")
}

await textbookRef.update({ status: "ready" })
console.log("\n=== Done. Textbook ID: " + textbookId + " ===")
