"use client"

import { useState, useMemo } from "react"
import { useUser, useFirestore, useStorage, useCollection } from "@/firebase"
import { collection, query, orderBy, getDocs } from "firebase/firestore"
import { ref as storageRef, uploadBytes } from "firebase/storage"
import { Button } from "@/components/ui/button"

type Chapter = { id: string; title: string; textbookId: string; textbookTitle: string }
type StepStatus = "pending" | "running" | "done" | "failed" | "skipped"
type ChapterProgress = { chapterId: string; textbookId: string; title: string; status: StepStatus; detail?: string }
type SectionType = "long-essays" | "short-essays" | "short-answers"
type ParsedQBChapter = { chapterNum: number; title: string; longEssays: string[]; shortEssays: string[]; shortAnswers: string[] }

export default function MasterKnowledgeExtractionPage() {
  const { user } = useUser()
  const db = useFirestore()
  const storage = useStorage()

  const subjectsQuery = useMemo(() => (!db ? null : query(collection(db, "subjects"), orderBy("name", "asc"))), [db])
  const { data: subjects } = useCollection(subjectsQuery)

  const textbooksQuery = useMemo(() => (!db ? null : query(collection(db, "textbooks"), orderBy("title", "asc"))), [db])
  const { data: textbooks } = useCollection(textbooksQuery)

  const [subjectId, setSubjectId] = useState("")
  const [selectedTextbookIds, setSelectedTextbookIds] = useState<string[]>([])
  const [useGeminiNative, setUseGeminiNative] = useState(false)
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [progress, setProgress] = useState<ChapterProgress[]>([])
  const [running, setRunning] = useState<string>("")
  const [exportedJson, setExportedJson] = useState<string>("")

  const [qbFile, setQbFile] = useState<File | null>(null)
  const [qbParsing, setQbParsing] = useState(false)
  const [qbChapters, setQbChapters] = useState<ParsedQBChapter[]>([])
  const [qbError, setQbError] = useState("")

  const [longAnswerChapterKey, setLongAnswerChapterKey] = useState("")
  const [longAnswerSectionType, setLongAnswerSectionType] = useState<SectionType>("long-essays")
  const [longAnswerQuestions, setLongAnswerQuestions] = useState("")
  const [longAnswerProgress, setLongAnswerProgress] = useState<{ question: string; status: string; detail?: string }[]>([])
  const [longAnswerRunning, setLongAnswerRunning] = useState(false)

  const selectedSubject = subjects?.find((s: any) => s.id === subjectId) as any

  function toggleTextbook(id: string) {
    setSelectedTextbookIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
    setChapters([])
    setProgress([])
  }

  async function loadChapters() {
    if (!db || selectedTextbookIds.length === 0) return
    const all: Chapter[] = []
    for (const tbId of selectedTextbookIds) {
      const tbTitle = textbooks?.find((t: any) => t.id === tbId)?.title || tbId
      const chaptersSnap = await getDocs(collection(db, "textbooks", tbId, "chapters"))
      chaptersSnap.docs.forEach((d) => {
        all.push({ id: d.id, title: (d.data() as any).title || d.id, textbookId: tbId, textbookTitle: tbTitle })
      })
    }
    all.sort((a, b) => a.textbookTitle.localeCompare(b.textbookTitle) || a.title.localeCompare(b.title))
    setChapters(all)
    setProgress(all.map((c) => ({ chapterId: c.id, textbookId: c.textbookId, title: `${c.textbookTitle} - ${c.title}`, status: "pending" as const })))
  }

  async function callStep(endpoint: string, ch: Chapter, idToken: string, extra: Record<string, any> = {}) {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        idToken,
        textbookId: ch.textbookId,
        chapterId: ch.id,
        subjectId,
        subjectName: selectedSubject?.name || subjectId,
        chapterTitle: ch.title,
        useGeminiNative,
        ...extra,
      }),
    })
    return res.json()
  }

  function detailFor(data: any): string {
    if (data.reusedExistingKnowledge) return "reused existing knowledge, notes generated"
    if (data.branchCount !== undefined) return `${data.branchCount} branches`
    if (data.deckCount !== undefined) return `${data.deckCount} deck(s), ${data.totalCards} card(s)`
    if (data.topicCount !== undefined) return `${data.topicCount} topics`
    return ""
  }

  async function runSingleStep(actionName: string, endpoint: string) {
    if (!user || chapters.length === 0) return
    setRunning(actionName)
    setProgress(chapters.map((c) => ({ chapterId: c.id, textbookId: c.textbookId, title: `${c.textbookTitle} - ${c.title}`, status: "pending" })))
    const idToken = await user.getIdToken()

    for (let i = 0; i < chapters.length; i++) {
      setProgress((prev) => prev.map((p, idx) => (idx === i ? { ...p, status: "running" } : p)))
      try {
        const data = await callStep(endpoint, chapters[i], idToken)
        if (data.success) {
          setProgress((prev) => prev.map((p, idx) => (idx === i ? { ...p, status: "done", detail: detailFor(data) } : p)))
        } else {
          setProgress((prev) => prev.map((p, idx) => (idx === i ? { ...p, status: "failed", detail: data.error } : p)))
        }
      } catch (err: any) {
        setProgress((prev) => prev.map((p, idx) => (idx === i ? { ...p, status: "failed", detail: err.message } : p)))
      }
      await new Promise((r) => setTimeout(r, 3000))
    }
    setRunning("")
  }

  async function runEverything() {
    if (!user || chapters.length === 0) return
    setRunning("everything")
    setProgress(chapters.map((c) => ({ chapterId: c.id, textbookId: c.textbookId, title: `${c.textbookTitle} - ${c.title}`, status: "pending" })))
    const idToken = await user.getIdToken()

    for (let i = 0; i < chapters.length; i++) {
      const ch = chapters[i]
      setProgress((prev) => prev.map((p, idx) => (idx === i ? { ...p, status: "running", detail: "extracting knowledge..." } : p)))

      try {
        const knowledgeData = await callStep("/api/admin/master-extract-chapter", ch, idToken)
        if (!knowledgeData.success) {
          setProgress((prev) => prev.map((p, idx) => (idx === i ? { ...p, status: "failed", detail: `knowledge: ${knowledgeData.error}` } : p)))
          await new Promise((r) => setTimeout(r, 2000))
          continue
        }

        setProgress((prev) => prev.map((p, idx) => (idx === i ? { ...p, detail: "generating mindmap..." } : p)))
        const mindmapData = await callStep("/api/admin/master-generate-mindmap", ch, idToken)

        setProgress((prev) => prev.map((p, idx) => (idx === i ? { ...p, detail: "generating flashcards..." } : p)))
        const flashcardData = await callStep("/api/admin/master-generate-flashcards", ch, idToken)

        const parts = [
          detailFor(knowledgeData),
          mindmapData.success ? `${mindmapData.branchCount} mindmap branches` : `mindmap failed: ${mindmapData.error}`,
          flashcardData.success ? `${flashcardData.deckCount} flashcard decks` : `flashcards failed: ${flashcardData.error}`,
        ]
        setProgress((prev) => prev.map((p, idx) => (idx === i ? { ...p, status: "done", detail: parts.join(" | ") } : p)))
      } catch (err: any) {
        setProgress((prev) => prev.map((p, idx) => (idx === i ? { ...p, status: "failed", detail: err.message } : p)))
      }

      await new Promise((r) => setTimeout(r, 3000))
    }
    setRunning("")
  }

  async function uploadAndParseQB() {
    if (!qbFile || !user || !storage) return
    setQbParsing(true)
    setQbError("")
    try {
      const storagePath = `question-banks/${Date.now()}-${qbFile.name}`
      const fileRef = storageRef(storage, storagePath)
      await uploadBytes(fileRef, qbFile)

      const idToken = await user.getIdToken()
      const res = await fetch("/api/admin/parse-question-bank", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken, storagePath }),
      })
      const data = await res.json()
      if (data.error) {
        setQbError(data.error)
      } else {
        setQbChapters(data.chapters || [])
      }
    } catch (err: any) {
      setQbError(err.message)
    }
    setQbParsing(false)
  }

  function findMatchingQBChapter(chapterTitle: string): ParsedQBChapter | undefined {
    const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "")
    const target = norm(chapterTitle)
    return qbChapters.find((qc) => norm(qc.title) === target || target.includes(norm(qc.title)) || norm(qc.title).includes(target))
  }

  function selectLongAnswerChapter(key: string) {
    setLongAnswerChapterKey(key)
    const ch = chapters.find((c) => `${c.textbookId}__${c.id}` === key)
    if (!ch) return
    const match = findMatchingQBChapter(ch.title)
    if (match) {
      const list = longAnswerSectionType === "long-essays" ? match.longEssays : longAnswerSectionType === "short-essays" ? match.shortEssays : match.shortAnswers
      setLongAnswerQuestions(list.join("\n"))
    }
  }

  async function runLongAnswers() {
    if (!user || !longAnswerChapterKey) return
    const ch = chapters.find((c) => `${c.textbookId}__${c.id}` === longAnswerChapterKey)
    if (!ch) return
    const questions = longAnswerQuestions.split("\n").map((q) => q.trim()).filter(Boolean)
    if (questions.length === 0) return

    setLongAnswerRunning(true)
    setLongAnswerProgress(questions.map((q) => ({ question: q, status: "pending" })))
    const idToken = await user.getIdToken()

    for (let i = 0; i < questions.length; i++) {
      setLongAnswerProgress((prev) => prev.map((p, idx) => (idx === i ? { ...p, status: "running" } : p)))
      try {
        const res = await fetch("/api/admin/master-generate-answer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            idToken,
            subjectId,
            textbookId: ch.textbookId,
            chapterId: ch.id,
            chapterTitle: ch.title,
            sectionType: longAnswerSectionType,
            question: questions[i],
            useGeminiNative,
          }),
        })
        const data = await res.json()
        if (data.skipped) {
          setLongAnswerProgress((prev) => prev.map((p, idx) => (idx === i ? { ...p, status: "skipped", detail: "already answered" } : p)))
        } else if (data.success) {
          setLongAnswerProgress((prev) => prev.map((p, idx) => (idx === i ? { ...p, status: "done", detail: `${data.answerLength} chars` } : p)))
        } else {
          setLongAnswerProgress((prev) => prev.map((p, idx) => (idx === i ? { ...p, status: "failed", detail: data.error } : p)))
        }
      } catch (err: any) {
        setLongAnswerProgress((prev) => prev.map((p, idx) => (idx === i ? { ...p, status: "failed", detail: err.message } : p)))
      }
      await new Promise((r) => setTimeout(r, 3000))
    }
    setLongAnswerRunning(false)
  }

  async function exportJson() {
    if (!db || !subjectId || selectedTextbookIds.length === 0) return
    const knowledgeSnap = await getDocs(collection(db, "subjects", subjectId, "chapterKnowledge"))
    const records = knowledgeSnap.docs
      .map((d) => d.data() as any)
      .filter((r) => selectedTextbookIds.includes(r.textbookId))
      .sort((a, b) => (a.chapterTitle || "").localeCompare(b.chapterTitle || ""))
    setExportedJson(JSON.stringify(records, null, 2))
  }

  function downloadJson() {
    if (!exportedJson) return
    const blob = new Blob([exportedJson], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${subjectId}-knowledge.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const doneCount = progress.filter((p) => p.status === "done").length
  const failedCount = progress.filter((p) => p.status === "failed").length

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-12 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Master Knowledge Extraction</h1>
        <p className="text-muted-foreground mt-2">
          Pick a subject and one or more of its textbooks, load chapters, then run generation.
        </p>
      </div>

      <div className="space-y-4 rounded-2xl glass border p-6">
        <div>
          <label className="text-sm font-medium block mb-1">Subject</label>
          <select className="w-full rounded-lg border bg-background p-2" value={subjectId} onChange={(e) => { setSubjectId(e.target.value); setSelectedTextbookIds([]); setChapters([]); setProgress([]) }}>
            <option value="">Select a subject...</option>
            {subjects?.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium block mb-1">Textbooks (select one or more)</label>
          <div className="max-h-48 overflow-y-auto space-y-1 rounded-lg border p-2">
            {textbooks?.map((t: any) => (
              <label key={t.id} className="flex items-center gap-2 text-sm p-1">
                <input type="checkbox" checked={selectedTextbookIds.includes(t.id)} onChange={() => toggleTextbook(t.id)} />
                {t.title}
              </label>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-1">A subject can have more than one textbook - select all that apply and they'll be processed together.</p>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={useGeminiNative} onChange={(e) => setUseGeminiNative(e.target.checked)} />
          Use Gemini 3.8 Flash (native endpoint) instead of the default provider chain
        </label>

        <Button onClick={loadChapters} disabled={selectedTextbookIds.length === 0} variant="secondary">
          Load Chapters ({chapters.length > 0 ? chapters.length : "none loaded"})
        </Button>
      </div>

      <div className="space-y-3 rounded-2xl glass border p-6">
        <h2 className="text-lg font-semibold">Question bank (optional)</h2>
        <p className="text-sm text-muted-foreground">Upload a chapter-wise question bank PDF to auto-fill real exam questions per chapter below.</p>
        <input type="file" accept="application/pdf" onChange={(e) => setQbFile(e.target.files?.[0] || null)} className="text-sm" />
        <Button onClick={uploadAndParseQB} disabled={!qbFile || qbParsing} variant="secondary">
          {qbParsing ? "Parsing..." : "Upload & Parse"}
        </Button>
        {qbError && <p className="text-sm text-red-500">{qbError}</p>}
        {qbChapters.length > 0 && (
          <p className="text-sm text-muted-foreground">
            Parsed {qbChapters.length} chapters, {qbChapters.reduce((s, c) => s + c.longEssays.length + c.shortEssays.length + c.shortAnswers.length, 0)} total questions.
          </p>
        )}
      </div>

      {chapters.length > 0 && (
        <div className="space-y-4 rounded-2xl glass border p-6">
          <h2 className="text-lg font-semibold">Generation ({chapters.length} chapters)</h2>
          <Button onClick={runEverything} disabled={!!running} className="w-full">
            {running === "everything" ? "Running..." : "Run Everything (one reading pass per chapter)"}
          </Button>
          <p className="text-xs text-muted-foreground">Or run individual steps:</p>
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => runSingleStep("knowledge", "/api/admin/master-extract-chapter")} disabled={!!running} variant="secondary">
              Extract Knowledge + Notes
            </Button>
            <Button onClick={() => runSingleStep("mindmap", "/api/admin/master-generate-mindmap")} disabled={!!running} variant="secondary">
              Generate Mindmaps
            </Button>
            <Button onClick={() => runSingleStep("flashcards", "/api/admin/master-generate-flashcards")} disabled={!!running} variant="secondary">
              Generate Flashcards
            </Button>
          </div>

          <p className="text-sm text-muted-foreground">{doneCount}/{progress.length} done{failedCount > 0 ? `, ${failedCount} failed` : ""}</p>
          <div className="space-y-1 max-h-96 overflow-y-auto">
            {progress.map((p) => (
              <div key={`${p.textbookId}-${p.chapterId}`} className="flex items-center justify-between text-sm rounded-lg border p-2 gap-2">
                <span className="truncate flex-1">{p.title}</span>
                <span className={`text-right ${p.status === "done" ? "text-green-500" : p.status === "failed" ? "text-red-500" : p.status === "running" ? "text-blue-500" : "text-muted-foreground"}`}>
                  {p.status}{p.detail ? ` - ${p.detail}` : ""}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {chapters.length > 0 && (
        <div className="space-y-4 rounded-2xl glass border p-6">
          <h2 className="text-lg font-semibold">Long Answers (one chapter at a time)</h2>
          <p className="text-sm text-muted-foreground">Auto-filled from the uploaded question bank if a matching chapter is found - edit freely before running.</p>

          <div>
            <label className="text-sm font-medium block mb-1">Chapter</label>
            <select className="w-full rounded-lg border bg-background p-2" value={longAnswerChapterKey} onChange={(e) => selectLongAnswerChapter(e.target.value)}>
              <option value="">Select a chapter...</option>
              {chapters.map((c) => <option key={`${c.textbookId}__${c.id}`} value={`${c.textbookId}__${c.id}`}>{c.textbookTitle} - {c.title}</option>)}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium block mb-1">Section type</label>
            <select className="w-full rounded-lg border bg-background p-2" value={longAnswerSectionType} onChange={(e) => { setLongAnswerSectionType(e.target.value as SectionType); if (longAnswerChapterKey) selectLongAnswerChapter(longAnswerChapterKey) }}>
              <option value="long-essays">Long Essays</option>
              <option value="short-essays">Short Essays</option>
              <option value="short-answers">Short Answers</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium block mb-1">Questions (one per line)</label>
            <textarea
              className="w-full h-40 rounded-lg border bg-background p-2 text-sm"
              value={longAnswerQuestions}
              onChange={(e) => setLongAnswerQuestions(e.target.value)}
              placeholder="Define inflammation. Mention the types...&#10;Describe the vascular phenomenon of inflammation..."
            />
          </div>

          <Button onClick={runLongAnswers} disabled={!longAnswerChapterKey || longAnswerRunning}>
            {longAnswerRunning ? "Running..." : "Generate Answers"}
          </Button>

          {longAnswerProgress.length > 0 && (
            <div className="space-y-1 max-h-96 overflow-y-auto">
              {longAnswerProgress.map((p, i) => (
                <div key={i} className="flex items-center justify-between text-sm rounded-lg border p-2">
                  <span className="truncate flex-1">{p.question.slice(0, 60)}...</span>
                  <span className={p.status === "done" ? "text-green-500" : p.status === "failed" ? "text-red-500" : p.status === "running" ? "text-blue-500" : "text-muted-foreground"}>
                    {p.status}{p.detail ? ` - ${p.detail}` : ""}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="space-y-3 rounded-2xl glass border p-6">
        <h2 className="text-lg font-semibold">Export for review</h2>
        <p className="text-sm text-muted-foreground">Pull every extracted knowledge record for the selected textbooks as JSON, to review or share for correction.</p>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={exportJson} disabled={!subjectId || selectedTextbookIds.length === 0}>Load JSON</Button>
          <Button variant="secondary" onClick={downloadJson} disabled={!exportedJson}>Download JSON</Button>
        </div>
        {exportedJson && <textarea readOnly value={exportedJson} className="w-full h-64 font-mono text-xs rounded-lg border bg-background p-3" />}
      </div>
    </div>
  )
}
