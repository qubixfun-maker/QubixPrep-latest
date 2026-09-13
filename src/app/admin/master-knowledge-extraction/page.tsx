"use client"

import { useState, useMemo } from "react"
import { useUser, useFirestore, useCollection } from "@/firebase"
import { collection, query, orderBy, getDocs } from "firebase/firestore"
import { Button } from "@/components/ui/button"

type Chapter = { id: string; title: string; textbookId: string; textbookTitle: string }
type ChapterProgress = { chapterId: string; textbookId: string; title: string; status: "pending" | "running" | "done" | "failed"; detail?: string }

export default function MasterKnowledgeExtractionPage() {
  const { user } = useUser()
  const db = useFirestore()

  const subjectsQuery = useMemo(() => (!db ? null : query(collection(db, "subjects"), orderBy("name", "asc"))), [db])
  const { data: subjects } = useCollection(subjectsQuery)

  const textbooksQuery = useMemo(() => (!db ? null : query(collection(db, "textbooks"), orderBy("title", "asc"))), [db])
  const { data: textbooks } = useCollection(textbooksQuery)

  const [subjectId, setSubjectId] = useState("")
  const [selectedTextbookIds, setSelectedTextbookIds] = useState<string[]>([])
  const [useGeminiNative, setUseGeminiNative] = useState(true)
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [progress, setProgress] = useState<ChapterProgress[]>([])
  const [running, setRunning] = useState(false)
  const [exportedJson, setExportedJson] = useState<string>("")

  const selectedSubject = subjects?.find((s: any) => s.id === subjectId) as any

  function toggleTextbook(id: string) {
    setSelectedTextbookIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
    setChapters([])
    setProgress([])
  }

  async function loadChapters() {
    if (!db || !subjectId || selectedTextbookIds.length === 0) return
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

  async function runExtraction() {
    if (!user || !subjectId || chapters.length === 0) return
    setRunning(true)
    setProgress(chapters.map((c) => ({ chapterId: c.id, textbookId: c.textbookId, title: `${c.textbookTitle} - ${c.title}`, status: "pending" })))
    const idToken = await user.getIdToken()

    for (let i = 0; i < chapters.length; i++) {
      const ch = chapters[i]
      setProgress((prev) => prev.map((p, idx) => (idx === i ? { ...p, status: "running" } : p)))

      try {
        const res = await fetch("/api/admin/master-extract-chapter", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            idToken,
            textbookId: ch.textbookId,
            chapterId: ch.id,
            subjectId,
            subjectName: selectedSubject?.name || subjectId,
            useGeminiNative,
          }),
        })
        const data = await res.json()
        if (data.success) {
          const detail = data.reused ? `already extracted (${data.topicCount} topics)` : `${data.topicCount} topics, ${data.factCount} facts`
          setProgress((prev) => prev.map((p, idx) => (idx === i ? { ...p, status: "done", detail } : p)))
        } else {
          setProgress((prev) => prev.map((p, idx) => (idx === i ? { ...p, status: "failed", detail: data.error } : p)))
        }
      } catch (err: any) {
        setProgress((prev) => prev.map((p, idx) => (idx === i ? { ...p, status: "failed", detail: err.message } : p)))
      }

      await new Promise((r) => setTimeout(r, 3000))
    }
    setRunning(false)
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
          Extract structured knowledge, chapter by chapter, then export it as JSON for review before anything else is generated from it.
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
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={useGeminiNative} onChange={(e) => setUseGeminiNative(e.target.checked)} />
          Use Gemini 3.8 Flash (native endpoint)
        </label>

        <Button onClick={loadChapters} disabled={!subjectId || selectedTextbookIds.length === 0} variant="secondary">
          Load Chapters ({chapters.length > 0 ? chapters.length : "none loaded"})
        </Button>
      </div>

      {chapters.length > 0 && (
        <div className="space-y-4 rounded-2xl glass border p-6">
          <h2 className="text-lg font-semibold">Extraction ({chapters.length} chapters)</h2>
          <Button onClick={runExtraction} disabled={running} className="w-full">
            {running ? "Running..." : "Extract Knowledge"}
          </Button>

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
