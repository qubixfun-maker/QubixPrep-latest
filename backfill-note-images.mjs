import { initializeApp, cert, getApps } from "firebase-admin/app"
import { getFirestore } from "firebase-admin/firestore"
import dotenv from "dotenv"

dotenv.config({ path: ".env.local" })

const CONFIRM = process.argv.includes("--confirm")
const SUBJECT_FILTER = (process.argv.find((a) => a.startsWith("--subject=")) || "").split("=")[1]?.trim().toLowerCase()

const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
if (!serviceAccountJson) {
  console.error("FIREBASE_SERVICE_ACCOUNT_JSON not found in .env.local")
  process.exit(1)
}

const app = getApps().length > 0 ? getApps()[0] : initializeApp({
  credential: cert(JSON.parse(serviceAccountJson)),
})
const db = getFirestore(app)

// ---- Same Wikimedia Commons search logic as src/ai/wikimedia-images.ts, inlined here
// so this can run as a plain standalone script without going through the Next.js build. ----

const USER_AGENT = "QubixPrep-NotesGenerator/1.0 (https://qubixprep.com; educational notes image search)"
const ACCEPTABLE_LICENSE_PATTERN = /(cc0|public domain|cc[\s-]?by(?!.*nc)(-sa)?)/i
const REJECT_LICENSE_PATTERN = /nc|noncommercial|non-commercial/i

async function searchWikimediaImage(query) {
  try {
    const params = new URLSearchParams({
      action: "query",
      generator: "search",
      gsrsearch: query,
      gsrnamespace: "6",
      gsrlimit: "6",
      prop: "imageinfo",
      iiprop: "url|extmetadata|mime",
      iiurlwidth: "900",
      format: "json",
    })
    const url = `https://commons.wikimedia.org/w/api.php?${params.toString()}`
    const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } })
    if (!res.ok) return null
    const data = await res.json()
    const pages = data?.query?.pages
    if (!pages) return null

    for (const page of Object.values(pages)) {
      const info = page?.imageinfo?.[0]
      if (!info) continue
      if (!info.mime?.startsWith("image/")) continue

      const meta = info.extmetadata || {}
      const licenseShort = meta.LicenseShortName?.value || ""
      if (!licenseShort) continue
      if (REJECT_LICENSE_PATTERN.test(licenseShort)) continue
      if (!ACCEPTABLE_LICENSE_PATTERN.test(licenseShort)) continue

      const isPublicDomainLike = /cc0|public domain/i.test(licenseShort)
      const artistRaw = meta.Artist?.value || ""
      const artist = artistRaw ? artistRaw.replace(/<[^>]*>/g, "").trim() : null

      return {
        url: info.thumburl || info.url,
        title: (page.title || "").replace(/^File:/, ""),
        license: licenseShort,
        artist: artist || null,
        needsAttribution: !isPublicDomainLike,
      }
    }
    return null
  } catch {
    return null
  }
}

function buildImageMarkdown(image) {
  const altText = image.title.replace(/[_.](jpg|jpeg|png|svg|gif)$/i, "").replace(/_/g, " ")
  const imageLine = `![${altText}](${image.url})`
  if (!image.needsAttribution) return `${imageLine}\n`
  const credit = image.artist || "Wikimedia Commons"
  return `${imageLine}\n*Image: ${credit}, ${image.license}, via Wikimedia Commons*\n`
}

function insertImageAfterFirstHeading(markdown, imageMarkdown) {
  const lines = markdown.split("\n")
  const headingIndex = lines.findIndex((l) => /^#{1,3}\s/.test(l))
  if (headingIndex === -1) return `${imageMarkdown}\n${markdown}`
  lines.splice(headingIndex + 1, 0, "", imageMarkdown)
  return lines.join("\n")
}

function shortenQuery(topicName) {
  let q = topicName
  const colonIdx = q.indexOf(":")
  if (colonIdx !== -1) q = q.slice(0, colonIdx)
  q = q.replace(/\([^)]*\)/g, "")
  q = q.split("&")[0]
  q = q.trim()
  const words = q.split(/\s+/)
  if (words.length > 6) q = words.slice(0, 6).join(" ")
  return q.trim()
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// ---- Main backfill ----

async function main() {
  console.log(CONFIRM ? "Running in LIVE mode (will write changes).\n" : "Running in DRY RUN mode - no changes will be written.\n")
  if (SUBJECT_FILTER) console.log(`Filtering to subject: "${SUBJECT_FILTER}"\n`)

  const subjectsSnap = await db.collection("subjects").get()
  let totalTopicsChecked = 0
  let totalImagesAdded = 0
  let totalDocsUpdated = 0

  for (const subjectDoc of subjectsSnap.docs) {
    const subjectName = (subjectDoc.data().name || "").trim()
    if (SUBJECT_FILTER && subjectName.toLowerCase() !== SUBJECT_FILTER) continue

    const notesSnap = await db.collection("subjects").doc(subjectDoc.id).collection("textNotes").get()
    if (notesSnap.empty) continue

    for (const noteDoc of notesSnap.docs) {
      const data = noteDoc.data()
      const topics = data.topics || []
      if (topics.length === 0) continue

      let changed = false
      const newTopics = []

      for (const topic of topics) {
        totalTopicsChecked++
        const alreadyHasImage = /!\[[^\]]*\]\(/.test(topic.markdown || "")

        if (alreadyHasImage) {
          newTopics.push(topic)
          continue
        }

        const shortQuery = shortenQuery(topic.name)
        process.stdout.write(`  Searching image for: "${topic.name}" (query: "${shortQuery}") (${subjectName} / ${data.chapterTitle || noteDoc.id})... `)
        let image = await searchWikimediaImage(shortQuery)
        await sleep(300) // be polite to Wikimedia's API

        // If the shortened query found nothing and it actually differs from the full
        // name, try the full name too before giving up - the short query is usually
        // better, but occasionally the long form has a more exact match on Commons.
        if (!image && shortQuery !== topic.name) {
          image = await searchWikimediaImage(topic.name)
          await sleep(300)
        }

        if (!image) {
          console.log("no suitable image found.")
          newTopics.push(topic)
          continue
        }

        console.log(`found (${image.license}): ${image.url}`)
        totalImagesAdded++
        changed = true
        newTopics.push({
          ...topic,
          markdown: insertImageAfterFirstHeading(topic.markdown, buildImageMarkdown(image)),
        })
      }

      if (changed) {
        totalDocsUpdated++
        console.log(`  -> ${CONFIRM ? "Updating" : "[DRY RUN] Would update"}: ${subjectName} / ${data.chapterTitle || noteDoc.id}\n`)
        if (CONFIRM) {
          await db.collection("subjects").doc(subjectDoc.id).collection("textNotes").doc(noteDoc.id).update({ topics: newTopics })
        }
      }
    }
  }

  console.log("\n--- Summary ---")
  console.log(`Topics checked: ${totalTopicsChecked}`)
  console.log(`Images found/added: ${totalImagesAdded}`)
  console.log(`Chapter docs ${CONFIRM ? "updated" : "that would be updated"}: ${totalDocsUpdated}`)
  if (!CONFIRM) {
    console.log(`\nThis was a dry run - nothing was saved. Re-run with --confirm to actually write these changes:`)
    console.log(`  node backfill-note-images.mjs --confirm${SUBJECT_FILTER ? ` --subject=${SUBJECT_FILTER}` : ""}`)
  }
}

main().catch((err) => {
  console.error("Fatal error:", err)
  process.exit(1)
})
