"use client"

import { useState, useMemo } from "react"
import { useUser, useFirestore, useCollection } from "@/firebase"
import { collection, query, orderBy, getDocs } from "firebase/firestore"
import { Button } from "@/components/ui/button"

type ChapterProgress = {
  chapterId: string
  title: string
  status: "pending" | "running" | "done" | "failed" | "skipped"
  detail?: string
}

type SectionType = "long-essays" | "short-essays" | "short-answers"

/**
 * Admin page for the "master read" pipeline. Pick a subject and one of its textbooks,
 * then run each generation step against every chapter of that textbook:
 *   - Knowledge extraction + text notes (combined, since notes are a cheap reshape of
 *     the same knowledge)
 *   - Mindmaps (a pure transform of the knowledge tree - no AI call)
 *   - Flashcards (one cheap AI call per topic, using facts already tagged for it)
 *   - Long answers (one real exam question at a time, for a chapter you pick, pasted
 *     into the box below - these come from an external question bank, not derivable
 *     from the chapter text alone)
 *
 * A single subject can draw from multiple textbooks - this page processes and exports
 * ONE textbook at a time, and every storage key is scoped by textbookId+chapterId so
 * different textbooks under the same subject can never collide.
 */
export default function MasterKnowledgeExtractionPage() {
  const { user } = useUser()
  const db = useFirestore()

  const subjectsQuery = useMemo(() => (!db ? null : query(collection(db, "subjects"), orderBy("name", "asc"))), [db])
  const { data: subjects } = useCollection(subjectsQuery)

  const textbooksQuery = useMemo(() => (!db ? null : query(collection(db, "textbooks"), orderBy("title", "asc"))), [db])
  const { data: textbooks } = useCollection(textbooksQuery)

  const [subjectId, setSubjectId] = useState("")
  const [textbookId, setTextbookId] = useState("")
  const [useGeminiNative, setUseGeminiNative] = useState(false)
  const [chapters, setChapters] = useState<{ id: string; title: string }[]>([])
  const [progress, setProgress] = useState<ChapterProgress[]>([])
  const [running, setRunning] = useState<string>("") // which bulk action is currently running
  const [exportedJson, setExportedJson] = useState<string>("")

  const [longAnswerChapterId, setLongAnswerChapterId] = useState("")
  const [longAnswerSectionType, setLongAnswerSectionType] = useState<SectionType>("long-essays")
  const [longAnswerQuestions, setLongAnswerQuestions] = useState("")
  const [longAnswerProgress, setLongAnswerProgress] = useState<{ question: string; status: string; detail?: string }[]>([])
  const [longAnswerRunning, setLongAnswerRunning] = useState(false)

  const selectedSubject = subjects?.find((s: any) => s.id === subjectId) as any

  async function loadChapters() {
    if (!db || !textbookId) return
    const chaptersSnap = await getDocs(collection(db, "textbooks", textbookId, "chapters"))
    const list = chaptersSnap.docs
      .map((d) => ({ id: d.id, title: (d.data() as any).title || d.id }))
      .sort((a, b) => a.title.localeCompare(b.title))
    setChapters(list)
    setProgress(list.map((c) => ({ chapterId: c.id, title: c.title, status: "pending" as const })))
  }

  async function runBulk(actionName: string, endpoint: string, extraBody: Record<string, any> = {}) {
    if (!user || !subjectId || !textbookId || chapters.length === 0) return
    setRunning(actionName)
    setProgress(chapters.map((c) => ({ chapterId: c.id, title: c.title, status: "pending" })))

    const idToken = await user.getIdToken()

    for (let i = 0; i < chapters.length; i++) {
      const ch = chapters[i]
      setProgress((prev) => prev.map((p, idx) => (idx === i ? { ...p, status: "running" } : p)))

      try {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            idToken,
            textbookId,
            chapterId: ch.id,
            subjectId,
            subjectName: selectedSubject?.name || subjectId,
            chapterTitle: ch.title,
            useGeminiNative,
            ...extraBody,
          }),
        })
        const data = await res.json()

        if (data.success) {
          const detail = data.reusedExistingKnowledge
            ? "reused existing knowledge, notes generated"
            : data.branchCount !== undefined
            ? `${data.branchCount} branches`
            : data.deckCount !== undefined
            ? `${data.deckCount} deck(s), ${data.totalCards} card(s)`
            : `${data.topicCount ?? ""} topics`.trim()
          setProgress((prev) => prev.map((p, idx) => (idx === i ? { ...p, status: "done", detail } : p)))
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

  async function runLongAnswers() {
    if (!user || !subjectId || !textbookId || !longAnswerChapterId) return
    const questions = longAnswerQuestions.split("\n").map((q) => q.trim()).filter(Boolean)
    if (questions.length === 0) return

    setLongAnswerRunning(true)
    setLongAnswerProgress(questions.map((q) => ({ question: q, status: "pending" })))

    const idToken = await user.getIdToken()
    const chapterTitle = chapters.find((c) => c.id === longAnswerChapterId)?.title

    for (let i = 0; i < questions.length; i++) {
      setLongAnswerProgress((prev) => prev.map((p, idx) => (idx === i ? { ...p, status: "running" } : p)))

      try {
        const res = await fetch("/api/admin/master-generate-answer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            idToken,
            subjectId,
            textbookId,
            chapterId: longAnswerChapterId,
            chapterTitle,
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
    if (!db || !subjectId || !textbookId) return
    const knowledgeSnap = await getDocs(collection(db, "subjects", subjectId, "chapterKnowledge"))
    const records = knowledgeSnap.docs
      .map((d) => d.data() as any)
      .filter((r) => r.textbookId === textbookId)
      .sort((a, b) => (a.chapterTitle || "").localeCompare(b.chapterTitle || ""))

    setExportedJson(JSON.stringify(records, null, 2))
  }

  function downloadJson() {
    if (!exportedJson) return
    const blob = new Blob([exportedJson], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${textbookId}-knowledge.json`
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
          Pick a subject and one of its textbooks, load its chapters, then run each generation step.
        </p>
      </div>

      <div className="space-y-4 rounded-2xl glass border p-6">
        <div>
          <label className="text-sm font-medium block mb-1">Subject</label>
          <select className="w-full rounded-lg border bg-background p-2" value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
            <option value="">Select a subject...</option>
            {subjects?.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium block mb-1">Textbook</label>
          <select className="w-full rounded-lg border bg-background p-2" value={textbookId} onChange={(e) => { setTextbookId(e.target.value); setChapters([]); setProgress([]) }}>
            <option value="">Select a textbook...</option>
            {textbooks?.map((t: any) => <option key={t.id} value={t.id}>{t.title}</option>)}
          </select>
          <p className="text-xs text-muted-foreground mt-1">A subject can have more than one textbook - run this once per textbook.</p>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={useGeminiNative} onChange={(e) => setUseGeminiNative(e.target.checked)} />
          Use Gemini 3.8 Flash (native endpoint) instead of the default provider chain
        </label>

        <Button onClick={loadChapters} disabled={!textbookId} variant="secondary">
          Load Chapters ({chapters.length > 0 ? chapters.length : "none loaded"})
        </Button>
      </div>

      {chapters.length > 0 && (
        <div className="space-y-4 rounded-2xl glass border p-6">
          <h2 className="text-lg font-semibold">Bulk generation (all {chapters.length} chapters)</h2>
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => runBulk("knowledge", "/api/admin/master-extract-chapter")} disabled={!!running}>
              {running === "knowledge" ? "Running..." : "1. Extract Knowledge + Notes"}
            </Button>
            <Button onClick={() => runBulk("mindmap", "/api/admin/master-generate-mindmap")} disabled={!!running}>
              {running === "mindmap" ? "Running..." : "2. Generate Mindmaps"}
            </Button>
            <Button onClick={() => runBulk("flashcards", "/api/admin/master-generate-flashcards")} disabled={!!running}>
              {running === "flashcards" ? "Running..." : "3. Generate Flashcards"}
            </Button>
          </div>

          <p className="text-sm text-muted-foreground">{doneCount}/{progress.length} done{failedCount > 0 ? `, ${failedCount} failed` : ""}</p>
          <div className="space-y-1 max-h-96 overflow-y-auto">
            {progress.map((p) => (
              <div key={p.chapterId} className="flex items-center justify-between text-sm rounded-lg border p-2">
                <span className="truncate flex-1">{p.title}</span>
                <span className={p.status === "done" ? "text-green-500" : p.status === "failed" ? "text-red-500" : p.status === "running" ? "text-blue-500" : "text-muted-foreground"}>
                  {p.status}{p.detail ? ` - ${p.detail}` : ""}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {chapters.length > 0 && (
        <div className="space-y-4 rounded-2xl glass border p-6">
          <h2 className="text-lg font-semibold">4. Long Answers (one chapter at a time)</h2>
          <p className="text-sm text-muted-foreground">Paste real exam questions for one chapter, one per line. These come from an external question bank, not the chapter text itself.</p>

          <div>
            <label className="text-sm font-medium block mb-1">Chapter</label>
            <select className="w-full rounded-lg border bg-background p-2" value={longAnswerChapterId} onChange={(e) => setLongAnswerChapterId(e.target.value)}>
              <option value="">Select a chapter...</option>
              {chapters.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium block mb-1">Section type</label>
            <select className="w-full rounded-lg border bg-background p-2" value={longAnswerSectionType} onChange={(e) => setLongAnswerSectionType(e.target.value as SectionType)}>
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

          <Button onClick={runLongAnswers} disabled={!longAnswerChapterId || longAnswerRunning}>
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
        <p className="text-sm text-muted-foreground">Pull every extracted knowledge record for this textbook as JSON, to review or share for correction.</p>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={exportJson} disabled={!subjectId || !textbookId}>Load JSON</Button>
          <Button variant="secondary" onClick={downloadJson} disabled={!exportedJson}>Download JSON</Button>
        </div>
        {exportedJson && <textarea readOnly value={exportedJson} className="w-full h-64 font-mono text-xs rounded-lg border bg-background p-3" />}
      </div>
    </div>
  )
}
