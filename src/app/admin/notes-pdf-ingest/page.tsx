"use client"

import { useState, useMemo, useEffect } from "react"
import { useUser, useDoc, useFirestore, useCollection, useStorage } from "@/firebase"
import { doc, collection, query, orderBy, setDoc, updateDoc, serverTimestamp } from "firebase/firestore"
import { ref as storageRef, uploadBytes } from "firebase/storage"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type PageStatus = "pending" | "running" | "done" | "failed"
type JobPage = {
  pageNum: number
  status: PageStatus
  topicName?: string
  pageOfTopic?: number
  totalPagesOfTopic?: number
  markdown?: string
  error?: string
}

const BATCH_SIZE = 4 // stays under the API route's 5-page cap with a little headroom

export default function NotesPdfIngestPage() {
  const { user } = useUser()
  const db = useFirestore()
  const storage = useStorage()

  const subjectsQuery = useMemo(() => (!db ? null : query(collection(db, "subjects"), orderBy("name", "asc"))), [db])
  const { data: subjects } = useCollection(subjectsQuery)

  const [subjectId, setSubjectId] = useState("")
  const [textbookId, setTextbookId] = useState("")
  const [chapterId, setChapterId] = useState("")
  const [chapterTitle, setChapterTitle] = useState("")
  const [startPage, setStartPage] = useState("")
  const [endPage, setEndPage] = useState("")

  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [storagePath, setStoragePath] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState("")

  const [isPausedLocal, setIsPausedLocal] = useState(false)
  const [isRunningLocal, setIsRunningLocal] = useState(false)
  const [finalizeResult, setFinalizeResult] = useState<string>("")
  const [isFinalizing, setIsFinalizing] = useState(false)

  // A PDF uploaded once for a given textbookId is reused for every chapter of that
  // book - no need to re-upload per chapter. Looked up by textbookId as soon as it's
  // typed, and auto-fills storagePath below if a prior upload is found.
  const sourceRef = useMemo(() => (!db || !textbookId.trim()) ? null : doc(db, "notesPdfSources", textbookId.trim()), [db, textbookId])
  const { data: existingSource } = useDoc(sourceRef)

  useEffect(() => {
    if (existingSource?.storagePath && !storagePath) {
      setStoragePath(existingSource.storagePath)
    }
  }, [existingSource, storagePath])

  const jobKey = textbookId && chapterId ? `${textbookId}__${chapterId}` : ""
  const jobRef = useMemo(() => (!db || !subjectId || !jobKey) ? null : doc(db, "subjects", subjectId, "notesPdfIngestJob", jobKey), [db, subjectId, jobKey])
  const { data: job } = useDoc(jobRef)

  async function handleUpload() {
    if (!storage || !uploadFile || !textbookId.trim() || !db) return
    setIsUploading(true)
    setUploadError("")
    try {
      const path = `textbooks-source/${textbookId.trim()}-notes-${Date.now()}.pdf`
      const fileRef = storageRef(storage, path)
      await uploadBytes(fileRef, uploadFile)
      setStoragePath(path)
      // Persist so this textbookId never needs a re-upload again.
      if (sourceRef) {
        await setDoc(sourceRef, { textbookId: textbookId.trim(), storagePath: path, uploadedAt: serverTimestamp() })
      }
    } catch (err: any) {
      setUploadError(err?.message || "Upload failed - check your connection and try again.")
    } finally {
      setIsUploading(false)
    }
  }

  async function updateJob(fields: any) {
    if (!jobRef) return
    await updateDoc(jobRef, fields)
  }

  async function startIngestion() {
    if (!db || !subjectId || !jobRef || !storagePath) return
    const start = parseInt(startPage, 10)
    const end = parseInt(endPage, 10)
    if (!start || !end || end < start) {
      alert("Enter a valid start/end page range.")
      return
    }
    const pages: JobPage[] = []
    for (let p = start; p <= end; p++) pages.push({ pageNum: p, status: "pending" })

    setFinalizeResult("")
    try {
      await setDoc(jobRef, {
        subjectId, textbookId, chapterId, chapterTitle, storagePath,
        startPage: start, endPage: end,
        pages, status: "running", updatedAt: serverTimestamp(),
      })
      setIsPausedLocal(false)
      runLoop(pages)
    } catch (err: any) {
      alert(`Could not start ingestion: ${err?.message || "unknown error"}. If this says "permission denied", the Firestore rules for this feature may not be deployed yet - check with whoever manages the Firebase project.`)
    }
  }

  async function runLoop(initialPages: JobPage[]) {
    if (isRunningLocal || !user || !jobRef) return
    setIsRunningLocal(true)
    const working = [...initialPages]

    const pending = working.filter((p) => p.status === "pending" || p.status === "running")
    for (let i = 0; i < pending.length; i += BATCH_SIZE) {
      if (isPausedLocal) {
        await updateJob({ status: "paused", pages: working, updatedAt: serverTimestamp() })
        setIsRunningLocal(false)
        return
      }
      const batch = pending.slice(i, i + BATCH_SIZE)
      const pageNumbers = batch.map((p) => p.pageNum)

      for (const pn of pageNumbers) {
        const idx = working.findIndex((p) => p.pageNum === pn)
        if (idx !== -1) working[idx] = { ...working[idx], status: "running" }
      }
      await updateJob({ pages: working, updatedAt: serverTimestamp() })

      try {
        const idToken = await user.getIdToken()
        const res = await fetch("/api/admin/ingest-notes-pdf-batch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken, storagePath, pageNumbers }),
        })
        let data: any
        try {
          data = await res.json()
        } catch {
          data = { error: res.ok ? "Server returned a non-JSON response" : `Server error (status ${res.status})` }
        }
        if (data.success && Array.isArray(data.results)) {
          for (const r of data.results) {
            const idx = working.findIndex((p) => p.pageNum === r.pageNum)
            if (idx === -1) continue
            if (r.error) {
              working[idx] = { ...working[idx], status: "failed", error: r.error }
            } else {
              working[idx] = {
                ...working[idx], status: "done",
                topicName: r.topicName, pageOfTopic: r.pageOfTopic,
                totalPagesOfTopic: r.totalPagesOfTopic, markdown: r.markdown,
              }
            }
          }
        } else {
          for (const pn of pageNumbers) {
            const idx = working.findIndex((p) => p.pageNum === pn)
            if (idx !== -1) working[idx] = { ...working[idx], status: "failed", error: data.error || "Batch failed" }
          }
        }
      } catch (err: any) {
        for (const pn of pageNumbers) {
          const idx = working.findIndex((p) => p.pageNum === pn)
          if (idx !== -1) working[idx] = { ...working[idx], status: "failed", error: err.message }
        }
      }

      await updateJob({ pages: working, updatedAt: serverTimestamp() })
    }

    await updateJob({ status: "done", pages: working, updatedAt: serverTimestamp() })
    setIsRunningLocal(false)
  }

  function handlePause() {
    setIsPausedLocal(true)
  }

  function handleResume() {
    if (!job) return
    setIsPausedLocal(false)
    runLoop(job.pages)
    updateJob({ status: "running" })
  }

  async function handleRetryFailed() {
    if (!job) return
    setIsPausedLocal(false)
    const pages: JobPage[] = job.pages.map((p: JobPage) => (p.status === "failed" ? { ...p, status: "pending" as const } : p))
    await updateJob({ status: "running", pages, updatedAt: serverTimestamp() })
    runLoop(pages)
  }

  async function handleFinalize() {
    if (!user || !subjectId || !textbookId || !chapterId) return
    setIsFinalizing(true)
    setFinalizeResult("")
    try {
      const idToken = await user.getIdToken()
      const res = await fetch("/api/admin/finalize-notes-pdf-ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken, subjectId, textbookId, chapterId, chapterTitle }),
      })
      const data = await res.json()
      if (data.success) {
        setFinalizeResult(`Saved ${data.topicCount} topic(s) from ${data.pagesUsed} page(s)${data.pagesFailed ? ` (${data.pagesFailed} page(s) failed and were skipped)` : ""}.`)
      } else {
        setFinalizeResult(`Error: ${data.error}`)
      }
    } finally {
      setIsFinalizing(false)
    }
  }

  const pages: JobPage[] = job?.pages || []
  const doneCount = pages.filter((p) => p.status === "done").length
  const failedCount = pages.filter((p) => p.status === "failed").length
  const hasActiveJob = pages.length > 0
  const allSettled = hasActiveJob && pages.every((p) => p.status === "done" || p.status === "failed")

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-12 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Notes PDF Ingestion</h1>
        <p className="text-muted-foreground mt-2">
          For pre-made notes PDFs (e.g. Marrow-style condensed notes) - Gemini reads each page's actual image directly and transcribes it faithfully, rather than extracting-then-rewriting like the textbook pipeline. Give it a subject, a page range, and a chapter/section name - it groups pages into topics automatically using each page's own "Page X/Y" counter.
        </p>
      </div>

      <div className="space-y-4 rounded-2xl glass border p-6">
        <div>
          <Label className="text-sm font-medium block mb-1">Subject</Label>
          <select className="w-full rounded-lg border bg-background p-2" value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
            <option value="">Select a subject...</option>
            {subjects?.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-medium block mb-1">Textbook/Source ID</Label>
            <Input placeholder="e.g. marrow-physiology-e8" value={textbookId} onChange={(e) => setTextbookId(e.target.value)} className="glass border-white/10" />
          </div>
          <div>
            <Label className="text-sm font-medium block mb-1">Chapter/Section ID</Label>
            <Input placeholder="e.g. ch-02" value={chapterId} onChange={(e) => setChapterId(e.target.value)} className="glass border-white/10" />
          </div>
        </div>

        <div>
          <Label className="text-sm font-medium block mb-1">Chapter/Section Title</Label>
          <Input placeholder="e.g. Cellular Physiology" value={chapterTitle} onChange={(e) => setChapterTitle(e.target.value)} className="glass border-white/10" />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-medium block mb-1">Start PDF page</Label>
            <Input type="number" placeholder="e.g. 6" value={startPage} onChange={(e) => setStartPage(e.target.value)} className="glass border-white/10" />
          </div>
          <div>
            <Label className="text-sm font-medium block mb-1">End PDF page</Label>
            <Input type="number" placeholder="e.g. 37" value={endPage} onChange={(e) => setEndPage(e.target.value)} className="glass border-white/10" />
          </div>
        </div>

        <div>
          <Label className="text-sm font-medium block mb-1">PDF file</Label>
          {storagePath && !uploadFile ? (
            <div className="flex items-center gap-3">
              <p className="text-xs text-green-500">
                {existingSource?.storagePath === storagePath
                  ? "This textbook was already uploaded previously - reusing it, no need to upload again."
                  : "Uploaded - ready to ingest."}
              </p>
              <button onClick={() => setStoragePath("")} className="text-xs text-muted-foreground underline shrink-0">
                Use a different file
              </button>
            </div>
          ) : (
            <>
              <div className="flex gap-3">
                <Input type="file" accept="application/pdf" onChange={(e) => { setUploadFile(e.target.files?.[0] || null); setUploadError("") }} className="glass border-white/10" />
                <Button onClick={handleUpload} disabled={!uploadFile || !textbookId.trim() || isUploading} variant="secondary">
                  {isUploading ? "Uploading..." : "Upload"}
                </Button>
              </div>
              {storagePath && <p className="text-xs text-green-500 mt-1">Uploaded - ready to ingest.</p>}
            </>
          )}
          {uploadError && (
            <p className="text-xs text-destructive mt-1 rounded-lg bg-destructive/10 p-2">
              Upload failed: {uploadError}
            </p>
          )}
        </div>

        {!hasActiveJob && (
          <Button
            onClick={startIngestion}
            disabled={!subjectId || !textbookId.trim() || !chapterId.trim() || !storagePath || !startPage || !endPage}
            className="w-full"
          >
            Start Ingestion
          </Button>
        )}
      </div>

      {hasActiveJob && (
        <div className="space-y-4 rounded-2xl glass border p-6">
          <h2 className="text-lg font-semibold">Progress ({pages.length} pages)</h2>
          <p className="text-sm text-muted-foreground">
            {doneCount}/{pages.length} done{failedCount > 0 ? `, ${failedCount} failed` : ""} &middot; job status: {job?.status}
          </p>
          <div className="flex gap-3 flex-wrap">
            {job?.status === "running" && (
              <>
                <Button onClick={handlePause} variant="secondary" className="flex-1">Pause</Button>
                <Button onClick={handleResume} variant="secondary" className="flex-1">Continue (if stuck)</Button>
              </>
            )}
            {job?.status === "paused" && <Button onClick={handleResume} className="flex-1">Resume</Button>}
            {failedCount > 0 && job?.status !== "running" && (
              <Button onClick={handleRetryFailed} variant="secondary" className="flex-1">Retry {failedCount} Failed</Button>
            )}
            {allSettled && (
              <Button onClick={handleFinalize} disabled={isFinalizing} className="flex-1">
                {isFinalizing ? "Saving..." : "Finalize & Save Notes"}
              </Button>
            )}
          </div>

          {finalizeResult && (
            <p className={`text-sm rounded-lg p-3 ${finalizeResult.startsWith("Error") ? "bg-destructive/10 text-destructive" : "bg-green-500/10 text-green-500"}`}>
              {finalizeResult}
            </p>
          )}

          <div className="space-y-1 max-h-96 overflow-y-auto">
            {pages.map((p) => (
              <div key={p.pageNum} className="flex items-center justify-between text-sm rounded-lg border p-2 gap-2">
                <span className="truncate flex-1">
                  Page {p.pageNum}{p.topicName ? ` - ${p.topicName}` : ""}
                  {p.pageOfTopic ? ` (${p.pageOfTopic}/${p.totalPagesOfTopic || 1})` : ""}
                </span>
                <span className={`text-right shrink-0 ${p.status === "done" ? "text-green-500" : p.status === "failed" ? "text-red-500" : p.status === "running" ? "text-blue-500" : "text-muted-foreground"}`}>
                  {p.status}{p.error ? ` - ${p.error}` : ""}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
