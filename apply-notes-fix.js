// Notes generation fix: retries with backoff on AI "busy" (429) errors, and never saves
// a chapter that contains failed topics (so error text can't reach students).
const fs = require("fs")
const edits = {
  "src/ai/chapter-notes-from-knowledge.ts": [
    ["const prompt = TOPIC_NOTES_PROMPT(subjectName, chapterTitle, topicName)\n  const MAX_ATTEMPTS = 2",
     "const prompt = TOPIC_NOTES_PROMPT(subjectName, chapterTitle, topicName)\n  const MAX_ATTEMPTS = 4"],
    ["lastError = err.message || 'Unknown error'\n    }",
     "lastError = err.message || 'Unknown error'\n      await new Promise((r) => setTimeout(r, 4000 * attempt))\n    }"],
    ["export async function generateChapterNotesFromKnowledge(",
     "export async function regenerateTopicNotes(subjectName: string, chapterTitle: string, topicName: string): Promise<string> {\n  return generateOneTopicNotes(subjectName, chapterTitle, topicName)\n}\n\nexport async function generateChapterNotesFromKnowledge("],
  ],
  "src/ai/chapter-notes-generator.ts": [
    ["const MAX_ATTEMPTS = 2;\n  let lastError = '';",
     "const MAX_ATTEMPTS = 4;\n  let lastError = '';"],
    ["lastError = err.message || 'Unknown error';\n    }",
     "lastError = err.message || 'Unknown error';\n      await new Promise((r) => setTimeout(r, 4000 * attempt));\n    }"],
  ],
  "src/app/api/admin/generate-chapter-notes/route.ts": [
    ["    const chapterId = slugify(chapterTitle.trim())",
     "    const failedTopics = (result.topics as any[]).filter((t) => String(t?.markdown || '').includes('Notes generation failed for this topic'))\n    if (failedTopics.length) {\n      return NextResponse.json({ error: `${failedTopics.length} of ${result.topics.length} topics failed (AI busy). Nothing was saved - please try again in a few minutes.` }, { status: 503 })\n    }\n\n    const chapterId = slugify(chapterTitle.trim())"],
  ],
  "src/app/api/admin/master-generate-notes/route.ts": [
    ["    await db.collection('subjects').doc(subjectId).collection('textNotes').doc(docKey).set({",
     "    const failedTopics = (notesResult.topics as any[]).filter((t) => String(t?.markdown || '').includes('Notes generation failed for this topic'))\n    if (failedTopics.length) {\n      return NextResponse.json({ error: `${failedTopics.length} of ${notesResult.topics.length} topics failed (AI busy). Nothing was saved - please try again in a few minutes.` }, { status: 503 })\n    }\n\n    await db.collection('subjects').doc(subjectId).collection('textNotes').doc(docKey).set({"],
  ],
}
const out = {}
for (const [f, list] of Object.entries(edits)) {
  if (!fs.existsSync(f)) { console.log("STOP: missing " + f + ". Nothing changed."); process.exit(1) }
  let s = fs.readFileSync(f, "utf8"); const crlf = s.includes("\r\n"); if (crlf) s = s.replace(/\r\n/g, "\n")
  if (s.includes("regenerateTopicNotes") || s.includes("topics failed (AI busy)") || s.includes("4000 * attempt")) { console.log("Already applied: " + f); continue }
  for (const [a, b] of list) {
    if (s.split(a).length !== 2) { console.log("STOP: anchor not found exactly once in " + f + ":\n  " + a.split("\n")[0] + "\nNothing changed."); process.exit(1) }
    s = s.replace(a, () => b)
  }
  out[f] = crlf ? s.replace(/\n/g, "\r\n") : s
}
for (const [f, s] of Object.entries(out)) { fs.writeFileSync(f, s); console.log("Patched " + f) }
console.log("Done.")
