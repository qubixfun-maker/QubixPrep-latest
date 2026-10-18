import fs from "fs";

function patch(file, edits) {
  let src = fs.readFileSync(file, "utf8");
  for (const [label, from, to] of edits) {
    const count = src.split(from).length - 1;
    if (count !== 1) {
      console.error(`FAILED on ${file} [${label}]: expected 1 match, found ${count}. No changes written to this file.`);
      process.exit(1);
    }
    src = src.replace(from, to);
  }
  fs.writeFileSync(file, src, "utf8");
  console.log(`Patched ${file}`);
}

// 1. src/ai/chapter-notes-from-knowledge.ts
patch("src/ai/chapter-notes-from-knowledge.ts", [
  [
    "signature + topic resolution",
    `export async function generateChapterNotesFromKnowledge(subjectName: string, chapterTitle: string): Promise<GenerateFromKnowledgeOutput> {
  const { topics: topicNames, error: topicListError } = await generateTopicList(subjectName, chapterTitle)
  if (!topicNames) return { error: \`Could not generate a topic breakdown for this chapter. \${topicListError || ''}\`.trim() }

  const results: GeneratedTopic[] = new Array(topicNames.length)`,
    `export async function generateChapterNotesFromKnowledge(subjectName: string, chapterTitle: string, topicNamesOverride?: string[]): Promise<GenerateFromKnowledgeOutput> {
  let topicNames: string[]
  if (topicNamesOverride && topicNamesOverride.length > 0) {
    topicNames = topicNamesOverride
  } else {
    const { topics, error: topicListError } = await generateTopicList(subjectName, chapterTitle)
    if (!topics) return { error: \`Could not generate a topic breakdown for this chapter. \${topicListError || ''}\`.trim() }
    topicNames = topics
  }

  const results: GeneratedTopic[] = new Array(topicNames.length)`,
  ],
]);

// 2. src/app/api/admin/generate-chapter-notes/route.ts
patch("src/app/api/admin/generate-chapter-notes/route.ts", [
  [
    "read topicNames from body",
    `    const { idToken, subjectId, chapterTitle } = await req.json()
    if (!idToken || !subjectId || !chapterTitle?.trim()) {
      return NextResponse.json({ error: 'Missing idToken, subjectId, or chapterTitle' }, { status: 400 })
    }`,
    `    const { idToken, subjectId, chapterTitle, topicNames } = await req.json()
    if (!idToken || !subjectId || !chapterTitle?.trim()) {
      return NextResponse.json({ error: 'Missing idToken, subjectId, or chapterTitle' }, { status: 400 })
    }
    const topicNamesOverride: string[] | undefined = Array.isArray(topicNames)
      ? topicNames.map((t) => String(t).trim()).filter(Boolean)
      : undefined`,
  ],
  [
    "pass override into generator",
    `    const result = await generateChapterNotesFromKnowledge(subjectName, chapterTitle.trim())`,
    `    const result = await generateChapterNotesFromKnowledge(subjectName, chapterTitle.trim(), topicNamesOverride && topicNamesOverride.length > 0 ? topicNamesOverride : undefined)`,
  ],
]);

// 3. src/app/admin/ai-notes-generator/page.tsx
patch("src/app/admin/ai-notes-generator/page.tsx", [
  [
    "ChapterProgress type gains topics field",
    `type ChapterProgress = {
  title: string
  status: "pending" | "running" | "done" | "failed"
  topicCount?: number
  textbookId?: string
  chapterId?: string
  error?: string
}`,
    `type ChapterProgress = {
  title: string
  status: "pending" | "running" | "done" | "failed"
  topicCount?: number
  textbookId?: string
  chapterId?: string
  error?: string
  topics?: string[]
}

// Chapter Names textarea accepts an optional, indented topic list under any chapter:
//   Cardiology
//     Heart failure
//     Arrhythmias
//   Neurology
// A line with leading whitespace is a topic of the chapter above it; an unindented
// line starts a new chapter. Chapters with no indented lines under them fall back to
// letting Gemini pick the topic breakdown itself (unchanged existing behavior).
function parseChaptersInput(text: string): { title: string; topics?: string[] }[] {
  const chapters: { title: string; topics?: string[] }[] = []
  for (const rawLine of text.split("\\n")) {
    if (!rawLine.trim()) continue
    const isIndented = /^\\s/.test(rawLine)
    if (isIndented && chapters.length > 0) {
      const topic = rawLine.trim().replace(/^[-*•]\\s*/, "")
      if (topic) {
        const last = chapters[chapters.length - 1]
        last.topics = last.topics || []
        last.topics.push(topic)
      }
    } else {
      const title = rawLine.trim().replace(/^\\d+[.)]\\s*/, "")
      if (title) chapters.push({ title })
    }
  }
  return chapters
}`,
  ],
  [
    "startNewJob uses parseChaptersInput",
    `  async function startNewJob() {
    if (!db || !subjectId || !jobRef) return
    const titles = chapterNamesInput
      .split("\\n")
      .map((t) => t.trim().replace(/^\\d+[.)]\\s*/, ""))
      .filter(Boolean)
    if (titles.length === 0) {
      alert("Enter at least one chapter name, one per line.")
      return
    }
    const chapters: ChapterProgress[] = titles.map((title) => ({ title, status: "pending" }))`,
    `  async function startNewJob() {
    if (!db || !subjectId || !jobRef) return
    const parsedChapters = parseChaptersInput(chapterNamesInput)
    if (parsedChapters.length === 0) {
      alert("Enter at least one chapter name, one per line.")
      return
    }
    const chapters: ChapterProgress[] = parsedChapters.map(({ title, topics }) => ({
      title,
      status: "pending",
      ...(topics && topics.length > 0 ? { topics } : {}),
    }))`,
  ],
  [
    "send topicNames in the generate-chapter-notes request",
    `          body: JSON.stringify({ idToken, subjectId, chapterTitle: working[i].title }),`,
    `          body: JSON.stringify({
            idToken,
            subjectId,
            chapterTitle: working[i].title,
            topicNames: working[i].topics && working[i].topics!.length > 0 ? working[i].topics : undefined,
          }),`,
  ],
  [
    "update label to document the optional topic syntax",
    `              <Label className="text-sm font-medium block mb-1">Chapter Names (one per line)</Label>`,
    `              <Label className="text-sm font-medium block mb-1">Chapter Names (one per line) - optionally indent lines under a chapter to give its exact topic list</Label>`,
  ],
]);

console.log("All files patched successfully.");
