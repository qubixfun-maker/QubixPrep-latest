"use client"

import { useState, useMemo } from "react"
import { useUser, useDoc, useFirestore, useCollection } from "@/firebase"
import { doc, collection, query, orderBy, getDocs, setDoc, updateDoc, serverTimestamp } from "firebase/firestore"
import { Button } from "@/components/ui/button"

const JOB_ID = "current"

type ChapterProgress = { chapterId: string; textbookId: string; title: string; status: "pending" | "running" | "done" | "failed"; detail?: string }

export default function NotesBulkGeneratorPage() {
  const { user } = useUser()
  const db = useFirestore()

  const subjectsQuery = useMemo(() => (!db ? null : query(collection(db, "subjects"), orderBy("name", "asc"))), [db])
  const { data: subjects } = useCollection(subjectsQuery)

  const [subjectId, setSubjectId] = useState("")
  const [useGeminiNative, setUseGeminiNative] = useState(true)

  const jobRef = useMemo(() => (!db || !subjectId) ? null : doc(db, "subjects", subjectId, "notesGenerationJob", JOB_ID), [db, subjectId])
  const { data: job } = useDoc(jobRef)

  const [isPausedLocal, setIsPausedLocal] = useState(false)
  const [isRunningLocal, setIsRunningLocal] = useState(false)

  const selectedSubject = subjects?.find((s: any) => s.id === subjectId) as any

  async function updateJob(fields: any) {
    if (!jobRef) return
    await updateDoc(jobRef, fields)
  }

  async function startNewJob() {
    if (!db || !subjectId || !jobRef) return
    const knowledgeSnap = await getDocs(collection(db, "subjects", subjectId, "chapterKnowledge"))
    const chapters: ChapterProgress[] = knowledgeSnap.docs.map((d) => {
      const data = d.data() as any
      return { chapterId: data.chapterId, textbookId: data.textbookId, title: data.chapterTitle || d.id, status: "pending" as const }
    })
    chapters.sort((a, b) => a.title.localeCompare(b.title))

    if (chapters.length === 0) {
      alert("No chapterKnowledge found for this subject - run Master Knowledge Extraction first.")
      return
    }

    await setDoc(jobRef, { subjectId, chapters, status: "running", useGeminiNative, updatedAt: serverTimestamp() })
    setIsPausedLocal(false)
    runLoop(chapters, 0)
  }

  async function runLoop(chapters: ChapterProgress[], startIndex: number) {
    if (isRunningLocal || !user || !jobRef) return
    setIsRunningLocal(true)
    const working = [...chapters]

    for (let i = startIndex; i < working.length; i++) {
      if (isPausedLocal) {
        await updateJob({ status: "paused", chapters: working, updatedAt: serverTimestamp() })
        setIsRunningLocal(false)
        return
      }
      if (working[i].status === "done") continue

      working[i] = { ...working[i], status: "running" }
      await updateJob({ chapters: working, updatedAt: serverTimestamp() })

      try {
        const idToken = await user.getIdToken()
        const res = await fetch("/api/admin/master-generate-notes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            idToken,
            subjectId,
            textbookId: working[i].textbookId,
            chapterId: working[i].chapterId,
            chapterTitle: working[i].title,
            useGeminiNative,
          }),
        })
        const data = await res.json()
        if (data.success) {
          working[i] = { ...working[i], status: "done", detail: `${data.topicCount} topics` }
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
    setIsRunningLocal(false)
  }

  function handlePause() {
    setIsPausedLocal(true)
  }

  function handleResume() {
    if (!job) return
    setIsPausedLocal(false)
    const chapters: ChapterProgress[] = job.chapters
    const startIndex = chapters.findIndex((c) => c.status !== "done")
    runLoop(chapters, startIndex === -1 ? chapters.length : startIndex)
    updateJob({ status: "running" })
  }

  async function handleRetryFailed() {
    if (!job) return
    setIsPausedLocal(false)
    const chapters: ChapterProgress[] = job.chapters.map((c: ChapterProgress) =>
      c.status === "failed" ? { ...c, status: "pending" as const } : c
    )
    await updateJob({ status: "running", chapters, updatedAt: serverTimestamp() })
    runLoop(chapters, 0)
  }

  async function handleResetJob() {
    if (!jobRef) return
    if (!confirm("Reset this job? Already-generated notes are NOT deleted, only the job's progress tracking.")) return
    setIsPausedLocal(true)
    await updateJob({ status: "idle", chapters: [], updatedAt: serverTimestamp() })
  }

  const chapters: ChapterProgress[] = job?.chapters || []
  const doneCount = chapters.filter((c) => c.status === "done").length
  const failedCount = chapters.filter((c) => c.status === "failed").length
  const hasActiveJob = chapters.length > 0

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-12 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Notes Bulk Generator</h1>
        <p className="text-muted-foreground mt-2">
          Generates topic-wise notes for every chapter that already has extracted knowledge. Run Master Knowledge Extraction first for any chapter not yet processed.
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

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={useGeminiNative} onChange={(e) => setUseGeminiNative(e.target.checked)} />
          Use Gemini 3.8 Flash (native endpoint)
        </label>
      </div>

      {subjectId && (
        <div className="space-y-4 rounded-2xl glass border p-6">
          <h2 className="text-lg font-semibold">Generation{hasActiveJob ? ` (${chapters.length} chapters)` : ""}</h2>

          {!hasActiveJob || job?.status === "idle" ? (
            <Button onClick={startNewJob} className="w-full">Start Generating Notes</Button>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                {doneCount}/{chapters.length} done{failedCount > 0 ? `, ${failedCount} failed` : ""} &middot; job status: {job?.status}
              </p>
              <div className="flex gap-3">
                {job?.status === "running" && (
                  <>
                    <Button onClick={handlePause} variant="secondary" className="flex-1">Pause</Button>
                    <Button onClick={handleResume} variant="secondary" className="flex-1">Continue (if stuck)</Button>
                  </>
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
    </div>
  )
}
