"use client"

import { useState, useMemo, useRef } from "react"
import { useUser, useDoc, useFirestore, useCollection } from "@/firebase"
import { doc, collection, query, orderBy, getDocs, setDoc, updateDoc, serverTimestamp } from "firebase/firestore"
import { Button } from "@/components/ui/button"

const JOB_ID = "current"

type ChapterProgress = { chapterId: string; textbookId: string; title: string; status: "pending" | "running" | "done" | "failed"; detail?: string }

/**
 * Master Knowledge Extraction - deliberately does ONE job: extract structured
 * knowledge for every chapter of the selected textbook(s) and let you export it as
 * JSON to review chapter-by-chapter before anything else is generated from it.
 *
 * Progress is persisted to a Firestore job document (subjects/{subjectId}/
 * extractionJobs/current), not just local browser state - so it survives closing the
 * tab, can be watched live from any session, and supports Pause/Resume/Retry Failed,
 * matching the same pattern already used by the other bulk-generation admin tools.
 *
 * Already works for any subject, not just Pathology - subjectId/textbookId are plain
 * parameters throughout, nothing here is subject-specific.
 */
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
  const [exportedJson, setExportedJson] = useState<string>("")

  const jobRef = useMemo(() => (!db || !subjectId) ? null : doc(db, "subjects", subjectId, "extractionJobs", JOB_ID), [db, subjectId])
  const { data: job } = useDoc(jobRef)

  const isPausedRef = useRef(false)
  const isRunningLocallyRef = useRef(false)

  const selectedSubject = subjects?.find((s: any) => s.id === subjectId) as any

  function toggleTextbook(id: string) {
    setSelectedTextbookIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  async function updateJob(fields: any) {
    if (!jobRef) return
    await updateDoc(jobRef, fields)
  }

  /** Builds a fresh job doc for the currently-selected textbooks and starts running it. */
  async function startNewJob() {
    if (!db || !subjectId || selectedTextbookIds.length === 0 || !jobRef) return
    const chapters: ChapterProgress[] = []
    for (const tbId of selectedTextbookIds) {
      const tbTitle = textbooks?.find((t: any) => t.id === tbId)?.title || tbId
      const chaptersSnap = await getDocs(collection(db, "textbooks", tbId, "chapters"))
      chaptersSnap.docs.forEach((d) => {
        chapters.push({ chapterId: d.id, textbookId: tbId, title: `${tbTitle} - ${(d.data() as any).title || d.id}`, status: "pending" })
      })
    }
    chapters.sort((a, b) => a.title.localeCompare(b.title))

    await setDoc(jobRef, {
      subjectId,
      subjectName: selectedSubject?.name || subjectId,
      textbookIds: selectedTextbookIds,
      chapters,
      status: "running",
      useGeminiNative,
      updatedAt: serverTimestamp(),
    })
    isPausedRef.current = false
    runLoop(chapters, 0)
  }

  /** Runs (or resumes) the job starting at startIndex, processing only chapters that
   * aren't already "done" - a fresh start, a resume after pause, and picking back up
   * after a browser refresh all go through this same path. */
  async function runLoop(chapters: ChapterProgress[], startIndex: number) {
    if (isRunningLocallyRef.current || !user || !jobRef) return
    isRunningLocallyRef.current = true
    const idToken = await user.getIdToken()

    const working = [...chapters]
    for (let i = startIndex; i < working.length; i++) {
      if (isPausedRef.current) {
        await updateJob({ status: "paused", chapters: working, updatedAt: serverTimestamp() })
        isRunningLocallyRef.current = false
        return
      }
      if (working[i].status === "done") continue

      working[i] = { ...working[i], status: "running" }
      await updateJob({ chapters: working, updatedAt: serverTimestamp() })

      try {
        const res = await fetch("/api/admin/master-extract-chapter", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            idToken,
            textbookId: working[i].textbookId,
            chapterId: working[i].chapterId,
            subjectId,
            subjectName: selectedSubject?.name || subjectId,
            useGeminiNative,
          }),
        })
        const data = await res.json()
        if (data.success) {
          const detail = data.reused ? `already extracted (${data.topicCount} topics)` : `${data.topicCount} topics, ${data.factCount} facts`
          working[i] = { ...working[i], status: "done", detail }
        } else {
          working[i] = { ...working[i], status: "failed", detail: data.error }
        }
      } catch (err: any) {
        working[i] = { ...working[i], status: "failed", detail: err.message }
      }

      await updateJob({ chapters: working, updatedAt: serverTimestamp() })
      await new Promise((r) => setTimeout(r, 3000))
    }

    await updateJob({ status: "done", chapters: working, updatedAt: serverTimestamp() })
    isRunningLocallyRef.current = false
  }

  function handlePause() {
    isPausedRef.current = true
  }

  function handleResume() {
    if (!job) return
    isPausedRef.current = false
    const chapters: ChapterProgress[] = job.chapters
    const startIndex = chapters.findIndex((c) => c.status !== "done")
    runLoop(chapters, startIndex === -1 ? chapters.length : startIndex)
    updateJob({ status: "running" })
  }

  async function handleRetryFailed() {
    if (!job) return
    isPausedRef.current = false
    const chapters: ChapterProgress[] = job.chapters.map((c: ChapterProgress) =>
      c.status === "failed" ? { ...c, status: "pending" as const } : c
    )
    await updateJob({ status: "running", chapters, updatedAt: serverTimestamp() })
    runLoop(chapters, 0)
  }

  async function handleResetJob() {
    if (!jobRef) return
    if (!confirm("Reset this job? Already-extracted knowledge is NOT deleted, only the job's progress tracking.")) return
    isPausedRef.current = true
    await updateJob({ status: "idle", chapters: [], updatedAt: serverTimestamp() })
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

  const chapters: ChapterProgress[] = job?.chapters || []
  const doneCount = chapters.filter((c) => c.status === "done").length
  const failedCount = chapters.filter((c) => c.status === "failed").length
  const hasActiveJob = chapters.length > 0

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-12 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Master Knowledge Extraction</h1>
        <p className="text-muted-foreground mt-2">
          Extract structured knowledge, chapter by chapter, then export it as JSON for review. Progress is saved to Firestore, so it survives closing this tab.
        </p>
      </div>

      <div className="space-y-4 rounded-2xl glass border p-6">
        <div>
          <label className="text-sm font-medium block mb-1">Subject</label>
          <select className="w-full rounded-lg border bg-background p-2" value={subjectId} onChange={(e) => { setSubjectId(e.target.value); setSelectedTextbookIds([]) }}>
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
      </div>

      {subjectId && (
        <div className="space-y-4 rounded-2xl glass border p-6">
          <h2 className="text-lg font-semibold">Extraction{hasActiveJob ? ` (${chapters.length} chapters)` : ""}</h2>

          {!hasActiveJob || job?.status === "idle" ? (
            <Button onClick={startNewJob} disabled={selectedTextbookIds.length === 0} className="w-full">
              Start Extraction
            </Button>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                {doneCount}/{chapters.length} done{failedCount > 0 ? `, ${failedCount} failed` : ""} &middot; job status: {job?.status}
              </p>
              <div className="flex gap-3">
                {job?.status === "running" && (
                  <Button onClick={handlePause} variant="secondary" className="flex-1">Pause</Button>
                )}
                {job?.status === "paused" && (
                  <Button onClick={handleResume} className="flex-1">Resume</Button>
                )}
                {failedCount > 0 && (job?.status === "done" || job?.status === "paused") && (
                  <Button onClick={handleRetryFailed} variant="secondary" className="flex-1">Retry {failedCount} Failed</Button>
                )}
                {job?.status !== "running" && (
                  <Button onClick={handleResetJob} variant="destructive">Reset Job</Button>
                )}
              </div>

              <div className="space-y-1 max-h-96 overflow-y-auto">
                {chapters.map((p: ChapterProgress) => (
                  <div key={`${p.textbookId}-${p.chapterId}`} className="flex items-center justify-between text-sm rounded-lg border p-2 gap-2">
                    <span className="truncate flex-1">{p.title}</span>
                    <span className={`text-right ${p.status === "done" ? "text-green-500" : p.status === "failed" ? "text-red-500" : p.status === "running" ? "text-blue-500" : "text-muted-foreground"}`}>
                      {p.status}{p.detail ? ` - ${p.detail}` : ""}
                    </span>
                  </div>
                ))}
              </div>
            </>
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
