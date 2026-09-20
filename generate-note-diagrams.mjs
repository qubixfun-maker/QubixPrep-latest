import { initializeApp, cert, getApps } from "firebase-admin/app"
import { getFirestore } from "firebase-admin/firestore"
import { getStorage } from "firebase-admin/storage"
import { GoogleAuth } from "google-auth-library"
import dotenv from "dotenv"

dotenv.config({ path: ".env.local" })

const CONFIRM = process.argv.includes("--confirm")
const REPLACE_EXISTING = process.argv.includes("--replace")
const SUBJECT_FILTER = (process.argv.find((a) => a.startsWith("--subject=")) || "").split("=")[1]?.trim().toLowerCase()
const LIMIT = parseInt((process.argv.find((a) => a.startsWith("--limit=")) || "").split("=")[1] || "5", 10)

// ---- Firebase (Firestore + Storage) ----
const firebaseKey = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
if (!firebaseKey) {
  console.error("FIREBASE_SERVICE_ACCOUNT_JSON not found in .env.local")
  process.exit(1)
}
if (!process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET) {
  console.error("NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET not found in .env.local")
  process.exit(1)
}
const app = getApps().length > 0 ? getApps()[0] : initializeApp({
  credential: cert(JSON.parse(firebaseKey)),
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
})
const db = getFirestore(app)
const bucket = getStorage(app).bucket()

// ---- Vertex AI ----
const vertexProjectId = process.env.GOOGLE_CLOUD_PROJECT_ID
const vertexServiceKeyB64 = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_B64
const vertexServiceKey = vertexServiceKeyB64
  ? Buffer.from(vertexServiceKeyB64, "base64").toString("utf8")
  : process.env.GOOGLE_SERVICE_ACCOUNT_KEY
if (!vertexProjectId || !vertexServiceKey) {
  console.error("GOOGLE_CLOUD_PROJECT_ID and/or GOOGLE_SERVICE_ACCOUNT_KEY not found in .env.local")
  process.exit(1)
}
const vertexLocation = process.env.GOOGLE_CLOUD_LOCATION || "us-central1"
const TEXT_MODEL_CANDIDATES = process.env.GEMINI_NATIVE_MODEL
  ? [process.env.GEMINI_NATIVE_MODEL, "gemini-2.5-pro", "gemini-2.5-flash"]
  : ["gemini-2.5-pro", "gemini-2.5-flash", "gemini-3.1-pro-preview"]
const IMAGE_MODEL_CANDIDATES = process.env.GOOGLE_VERTEX_IMAGE_MODEL
  ? [process.env.GOOGLE_VERTEX_IMAGE_MODEL, "gemini-3-pro-image-preview", "gemini-2.5-flash-image"]
  : ["gemini-3-pro-image-preview", "gemini-2.5-flash-image"]

let cachedToken = null
async function getVertexToken() {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.token
  const credentials = JSON.parse(vertexServiceKey)
  const auth = new GoogleAuth({ credentials, scopes: ["https://www.googleapis.com/auth/cloud-platform"] })
  const client = await auth.getClient()
  const tokenResponse = await client.getAccessToken()
  cachedToken = { token: tokenResponse.token, expiresAt: Date.now() + 50 * 60_000 }
  return tokenResponse.token
}

async function vertexGenerateContent(model, contents, generationConfig) {
  const token = await getVertexToken()
  const url = `https://${vertexLocation}-aiplatform.googleapis.com/v1/projects/${vertexProjectId}/locations/${vertexLocation}/publishers/google/models/${model}:generateContent`
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ contents, ...(generationConfig ? { generationConfig } : {}) }),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`Vertex generateContent failed (${res.status}): ${text.slice(0, 500)}`)
  }
  return res.json()
}

async function vertexGenerateContentWithFallback(candidates, contents, generationConfig) {
  let lastError = ""
  for (const model of candidates) {
    // One retry on the same model for a 429, with a short backoff, before moving on -
    // catches a transient burst without immediately burning through the whole chain.
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const data = await vertexGenerateContent(model, contents, generationConfig)
        return { data, model }
      } catch (err) {
        lastError = err.message
        const statusMatch = lastError.match(/failed \((\d+)\)/)
        const status = statusMatch ? parseInt(statusMatch[1], 10) : 0

        if (status === 429) {
          if (attempt === 1) {
            await sleep(8000) // give the per-minute quota a real chance to reset
            continue // retry the same model once
          }
          break // still exhausted after retry - move to the next model (separate quota bucket)
        }
        if (status === 403 || status === 404) break // not accessible on this account - move to the next model
        throw err // any other error - not fixed by retrying or switching models
      }
    }
  }
  throw new Error(`All model candidates failed. Last error: ${lastError}`)
}

// ============ Step 1: condense the topic's existing markdown into the fixed short
// page-content format the proven handwritten template below expects (title + short
// bullets/table + optional mnemonic/clinical/high-yield sections, under 150 words) ============

async function condensePageContent(topicMarkdown, topicName, chapterTitle) {
  const prompt = `You are condensing an existing study note into ONE page of exam-focused handwritten-style study notes for a medical student, in a fixed template style. The overall chapter is "${chapterTitle}". You are writing ONLY this one page: "${topicName}"

EXISTING NOTE CONTENT (this is the source - do not invent facts beyond what's here):
${topicMarkdown.slice(0, 6000)}

TASK: Condense the above into this exact structure - skip any section that doesn't genuinely apply, never pad a section just to fill it:

1. TITLE line - the topic name only.
2. MAIN CONTENT - the core facts. If this topic is naturally a comparison between two or more things, format it as a TABLE with a header row and short row labels (max 6 rows). Otherwise, a short bulleted list of definitions/causes/features (max 6 bullets, each one short line).
3. (Optional, only if a genuine one exists in the source) A section headed exactly "MNEMONIC" with one short mnemonic line.
4. (Optional, only if genuinely present in the source) A section headed exactly "CLINICAL CORRELATION" with 2-3 short bullet lines.
5. (Optional, only if genuinely present in the source) A section headed exactly "HIGH-YIELD POINTS" with 2-3 short exam-tip bullet lines.

HARD LIMITS - these matter more than completeness:
- The ENTIRE page must total under 150 words including the title. A shorter, cleaner page beats a dense one - cut detail rather than exceed this.
- Do NOT describe a multi-step flowchart, pathway diagram, or cell/organelle illustration - this format is table-and-bullet only, no diagrams.
- Every fact must come from the existing note content above - never invent.
- Every word MUST be in English only.

Output ONLY the plain page text (headers as plain text, no markdown formatting, no JSON, no commentary, no preamble).`

  const { data } = await vertexGenerateContentWithFallback(TEXT_MODEL_CANDIDATES, [{ role: "user", parts: [{ text: prompt }] }], { maxOutputTokens: 800, thinkingConfig: { thinkingBudget: 1024 } })
  const text = (data.candidates?.[0]?.content?.parts || []).map((p) => p.text || "").join("").trim()
  if (!text) throw new Error("Empty response condensing page content")
  return text
}

// ============ Step 2: render that condensed content as a handwritten-style page image,
// using the exact proven template layout from the app's own notes-image-generator ============

function buildNoteImagePrompt(pageContent, topicName, chapterTitle) {
  return `Create a single clean handwritten-style exam study notes page image, following this EXACT template layout (this is a fixed brand template, not free-form):

LAYOUT (top to bottom, with GENEROUS white space between every section - do not fill the page edge to edge, leave clear margins all around):
1. Page title ONLY may use bold colorful decorative hand-lettered display text, at the very top, centered, with two small decorative asterisk/star marks flanking it.
2. The main content directly below, in PLAIN CLEAR PRINT LETTERING (block capitals or simple clean handwriting, NOT cursive, NOT stylized, NOT decorative) - legibility matters more than style here, since this is the part a student actually has to read and get right: if the given text contains a table, draw it as a clean rectangular table with a distinct header row and thin black grid lines. Otherwise render it as a simple bulleted list with generous line spacing. Use only 3-4 ink colors total (black, blue, dark red, dark green) to color-code headings and key terms - the way students color-code notes.
3. Below that, ONLY for each optional section actually present in the given text (skip entirely if not present): draw it as its own small rounded rectangle box with a colored border and the section's heading in bold at the top of its box - "MNEMONIC" gets a purple border, "CLINICAL CORRELATION" gets a blue border, "HIGH-YIELD POINTS" gets a pink border. Each box should be compact, uncluttered, with clear space around it, using the same plain clear print lettering as the main content.

Do not draw any flowchart, pathway diagram, arrows-between-boxes, or cell/organelle illustration - this template is title + table/bullets + small colored callout boxes only.

RENDER THIS EXACT TEXT ON THE PAGE (do not add, omit, or reword anything; distribute it into the layout above based on its own section headers):
Chapter: ${chapterTitle}

${pageContent}

Reproduce every word above exactly as written, spelled correctly, letter for letter - a misspelled or garbled word is a failure even if the overall page looks clean. Do not invent additional facts, headings, or sections beyond what's given. Prioritize spelling accuracy and legibility over decorative style - a plain, correctly-spelled page beats an elaborate one with errors.`
}

async function generateImage(prompt) {
  const { data, model } = await vertexGenerateContentWithFallback(IMAGE_MODEL_CANDIDATES, [{ role: "user", parts: [{ text: prompt }] }], { responseModalities: ["TEXT", "IMAGE"] })
  const parts = data?.candidates?.[0]?.content?.parts || []
  for (const part of parts) {
    if (part.inlineData?.data) {
      return { base64: part.inlineData.data, mimeType: part.inlineData.mimeType || "image/png", model }
    }
  }
  return null
}

async function transcribeImage(base64, mimeType) {
  const { data } = await vertexGenerateContentWithFallback(TEXT_MODEL_CANDIDATES, [
    {
      role: "user",
      parts: [
        { inlineData: { mimeType, data: base64 } },
        { text: "Transcribe every word of visible text in this image exactly as written, in reading order. Output only the transcribed text, no commentary." },
      ],
    },
  ])
  const parts = data?.candidates?.[0]?.content?.parts || []
  return parts.map((p) => p.text || "").join("").trim()
}

// ============ Verification: word-overlap between intended page content and what the
// image actually rendered - a cheap, dependency-free gate against garbled/hallucinated
// text, adapted directly from the app's own proven notes-image-generator. ============

function tokenize(text) {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(Boolean)
}

function textSimilarity(source, transcribed) {
  const sourceTokens = new Set(tokenize(source))
  const transcribedTokens = new Set(tokenize(transcribed))
  if (sourceTokens.size === 0) return 0
  let matched = 0
  sourceTokens.forEach((t) => { if (transcribedTokens.has(t)) matched++ })
  return matched / sourceTokens.size
}

const ACCURACY_THRESHOLD = 0.9 // raised from 0.75 - for medical content, "mostly right" isn't good enough; a garbled key term hiding among mostly-matching filler words is exactly the failure mode this threshold needs to catch
const MAX_IMAGE_ATTEMPTS = 3

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function generateVerifiedImage(pageContent, topicName, chapterTitle) {
  const prompt = buildNoteImagePrompt(pageContent, topicName, chapterTitle)
  let best = null
  let lastError = "Image model returned no image"

  for (let attempt = 1; attempt <= MAX_IMAGE_ATTEMPTS; attempt++) {
    try {
      const img = await generateImage(prompt)
      if (!img) { lastError = "Image model returned no image"; continue }

      const transcribed = await transcribeImage(img.base64, img.mimeType).catch((e) => { lastError = `Vision transcription failed: ${e?.message || e}`; return "" })
      const score = textSimilarity(pageContent, transcribed)
      const result = { base64: img.base64, mimeType: img.mimeType, model: img.model, needsReview: score < ACCURACY_THRESHOLD, matchScore: score, transcribed }

      if (score >= ACCURACY_THRESHOLD) return result
      if (!best || score > best.matchScore) best = result
    } catch (err) {
      lastError = err?.message || String(err)
      if (String(lastError).includes("429") || String(lastError).includes("RESOURCE_EXHAUSTED")) {
        await sleep(attempt * 10000)
      }
    }
  }

  if (best) return best
  return { error: `Failed after ${MAX_IMAGE_ATTEMPTS} attempts: ${lastError}` }
}

async function uploadImage(base64, mimeType, subjectId, docId, topicIndex) {
  const ext = mimeType.includes("png") ? "png" : "jpg"
  const destPath = `note-images/${subjectId}/${docId}/${topicIndex}.${ext}`
  const buffer = Buffer.from(base64, "base64")
  const file = bucket.file(destPath)
  await file.save(buffer, { metadata: { contentType: mimeType } })
  await file.makePublic()
  return `https://storage.googleapis.com/${bucket.name}/${destPath}`
}

function stripExistingImage(markdown) {
  const lines = markdown.split("\n")
  const imgIdx = lines.findIndex((l) => /^!\[[^\]]*\]\(/.test(l.trim()))
  if (imgIdx === -1) return markdown
  let end = imgIdx + 1
  while (end < lines.length) {
    const line = lines[end].trim()
    if (line === "" || /^\*Image:.*\*$/.test(line)) end++
    else break
  }
  lines.splice(imgIdx, end - imgIdx)
  return lines.join("\n")
}

function insertImageAfterFirstHeading(markdown, imageMarkdown) {
  const lines = markdown.split("\n")
  const headingIndex = lines.findIndex((l) => /^#{1,3}\s/.test(l))
  if (headingIndex === -1) return `${imageMarkdown}\n${markdown}`
  lines.splice(headingIndex + 1, 0, "", imageMarkdown)
  return lines.join("\n")
}

async function processTopic(topic, subjectName, chapterTitle, subjectId, docId, topicIndex) {
  try {
    const pageContent = await condensePageContent(topic.markdown, topic.name, chapterTitle)
    const result = await generateVerifiedImage(pageContent, topic.name, chapterTitle)
    if (result.error) return { error: result.error }

    const url = await uploadImage(result.base64, result.mimeType, subjectId, docId, topicIndex)
    return { url, model: result.model, matchScore: result.matchScore, needsReview: result.needsReview }
  } catch (err) {
    return { error: err.message }
  }
}

async function main() {
  console.log(CONFIRM ? "Running in LIVE mode (will write changes).\n" : "Running in DRY RUN mode - no changes will be written.\n")
  if (SUBJECT_FILTER) console.log(`Filtering to subject: "${SUBJECT_FILTER}"`)
  console.log(`Limit: ${LIMIT} image(s) this run (use --limit=N to change)${REPLACE_EXISTING ? " | replacing existing images too" : ""}\n`)

  const subjectsSnap = await db.collection("subjects").get()
  let processed = 0
  let succeeded = 0
  let flaggedForReview = 0

  outer:
  for (const subjectDoc of subjectsSnap.docs) {
    const subjectName = (subjectDoc.data().name || "").trim()
    if (SUBJECT_FILTER && subjectName.toLowerCase() !== SUBJECT_FILTER) continue

    const notesSnap = await db.collection("subjects").doc(subjectDoc.id).collection("textNotes").get()
    for (const noteDoc of notesSnap.docs) {
      const data = noteDoc.data()
      const topics = data.topics || []
      let changed = false
      const newTopics = [...topics]

      for (let i = 0; i < topics.length; i++) {
        if (processed >= LIMIT) break outer
        const topic = topics[i]
        const hasImage = /!\[[^\]]*\]\(/.test(topic.markdown || "")
        if (hasImage && !REPLACE_EXISTING) continue

        processed++
        console.log(`[${processed}/${LIMIT}] Generating handwritten-style page for: "${topic.name}" (${subjectName} / ${data.chapterTitle || noteDoc.id})`)
        const result = await processTopic(topic, subjectName, data.chapterTitle || "", subjectDoc.id, noteDoc.id, i)

        if (result.error) {
          console.log(`  FAILED: ${result.error}\n`)
          continue
        }

        const reviewFlag = result.needsReview ? "  ** NEEDS REVIEW (below accuracy threshold) **" : ""
        console.log(`  OK (model: ${result.model}, match score: ${(result.matchScore * 100).toFixed(0)}%)${reviewFlag}: ${result.url}\n`)
        succeeded++
        if (result.needsReview) flaggedForReview++
        changed = true
        const baseMarkdown = REPLACE_EXISTING ? stripExistingImage(topic.markdown) : topic.markdown
        newTopics[i] = { ...topic, markdown: insertImageAfterFirstHeading(baseMarkdown, `![${topic.name}](${result.url})\n`) }
        await sleep(500)
      }

      if (changed && CONFIRM) {
        await db.collection("subjects").doc(subjectDoc.id).collection("textNotes").doc(noteDoc.id).update({ topics: newTopics })
      }
    }
  }

  console.log("\n--- Summary ---")
  console.log(`Topics processed: ${processed}`)
  console.log(`Images generated successfully: ${succeeded}`)
  console.log(`Flagged as needing review (below ${ACCURACY_THRESHOLD * 100}% text match): ${flaggedForReview}`)
  if (!CONFIRM) {
    console.log(`\nThis was a dry run - nothing was saved. Re-run with --confirm to actually write these changes.`)
  }
}

main().catch((err) => {
  console.error("Fatal error:", err)
  process.exit(1)
})
