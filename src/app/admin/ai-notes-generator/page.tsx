"use client"

import { useState, useMemo } from "react"
import { useUser, useDoc, useFirestore, useCollection } from "@/firebase"
import { doc, collection, query, orderBy, setDoc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

const JOB_ID = "current"

type ChapterProgress = {
  title: string
  status: "pending" | "running" | "done" | "failed"
  topicCount?: number
  textbookId?: string
  chapterId?: string
  error?: string
}

export default function AiNotesGeneratorPage() {
  const { user } = useUser()
  const db = useFirestore()

  const subjectsQuery = useMemo(() => (!db ? null : query(collection(db, "subjects"), orderBy("name", "asc"))), [db])
  const { data: subjects } = useCollection(subjectsQuery)

  const [subjectId, setSubjectId] = useState("")
  const [chapterNamesInput, setChapterNamesInput] = useState("")
  const [isTriggering, setIsTriggering] = useState(false)

  const jobRef = useMemo(() => (!db || !subjectId) ? null : doc(db, "subjects", subjectId, "aiNotesGenJob", JOB_ID), [db, subjectId])
  const { data: job } = useDoc(jobRef)

  // Kicks off (or continues) the job on the server. The server then keeps going on
  // its own, chapter by chapter, even if this tab is closed - see run-notes-job/route.ts.
  async function triggerJob() {
    if (!user || !subjectId) return
    setIsTriggering(true)
    try {
      const idToken = await user.getIdToken()
      await fetch("/api/admin/run-notes-job", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken, subjectId }),
      })
    } catch {
      // The Firestore listener is the real source of truth for progress - a
      // dropped response here isn't fatal, Resume can always kick it again.
    } finally {
      setIsTriggering(false)
    }
  }

  async function startNewJob() {
    if (!db || !subjectId || !jobRef) return
    const titles = chapterNamesInput
      .split("\n")
      .map((t) => t.trim().replace(/^\d+[.)]\s*/, ""))
      .filter(Boolean)
    if (titles.length === 0) {
      alert("Enter at least one chapter name, one per line.")
      return
    }
    const chapters: ChapterProgress[] = titles.map((title) => ({ title, status: "pending" }))
    const chainSecret = crypto.randomUUID()

    try {
      await setDoc(jobRef, { subjectId, chapters, chainSecret, status: "running", updatedAt: serverTimestamp() })
      triggerJob()
    } catch (err: any) {
      alert(`Could not start: ${err?.message || "unknown error"}. If this says "permission denied", the Firestore rule for aiNotesGenJob may not be published yet - check Firebase Console -> Firestore Database -> Rules.`)
    }
  }

  async function handlePause() {
    if (!jobRef) return
    await updateDoc(jobRef, { status: "paused" })
  }

  function handleResume() {
    triggerJob()
  }

  async function handleRetryFailed() {
    if (!job || !jobRef) return
    const chapters: ChapterProgress[] = job.chapters.map((c: ChapterProgress) =>
      c.status === "failed" ? { ...c, status: "pending" as const } : c
    )
    await updateDoc(jobRef, { status: "running", chapters, updatedAt: serverTimestamp() })
    triggerJob()
  }

  async function handleClearJob() {
    if (!jobRef) return
    if (!confirm("Clear this job? Chapters already generated are NOT deleted, only the progress list.")) return
    await deleteDoc(jobRef)
    setChapterNamesInput("")
  }

  const chapters: ChapterProgress[] = job?.chapters || []
  const doneCount = chapters.filter((c) => c.status === "done").length
  const failedCount = chapters.filter((c) => c.status === "failed").length
  const hasActiveJob = chapters.length > 0

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-12 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">AI Notes Generator</h1>
        <p className="text-muted-foreground mt-2">
          No textbook or PDF needed - give it a subject and one or more chapter names (one per line), and Gemini writes colorful, topic-wise revision notes from its own medical knowledge, at the depth of standard Indian MBBS textbooks and the NMC curriculum. Each topic includes flowcharts for any process/pathway, tables for comparisons, and a short self-test at the end. Chapters are generated one at a time, in order, so each gets the model's full attention - and the whole batch keeps running on the server even if you close this tab.
        </p>
      </div>

      <div className="space-y-4 rounded-2xl glass border p-6">
        <div>
          <Label className="text-sm font-medium block mb-1">Subject</Label>
          <select className="w-full rounded-lg border bg-background p-2" value={subjectId} onChange={(e) => setSubjectId(e.target.value)} disabled={hasActiveJob}>
            <option value="">Select a subject...</option>
            {subjects?.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>

        {!hasActiveJob && (
          <>
            <div>
              <Label className="text-sm font-medium block mb-1">Chapter Names (one per line)</Label>
              <Textarea
                placeholder={"Cardiovascular Physiology\nRenal Physiology\nEndocrine Physiology"}
                value={chapterNamesInput}
                onChange={(e) => setChapterNamesInput(e.target.value)}
                className="glass border-white/10 min-h-[140px]"
              />
            </div>
            <Button onClick={startNewJob} disabled={!subjectId || !chapterNamesInput.trim() || isTriggering} className="w-full">
              Generate Notes
            </Button>
          </>
        )}
      </div>

      {hasActiveJob && (
        <div className="space-y-4 rounded-2xl glass border p-6">
          <h2 className="text-lg font-semibold">Progress ({chapters.length} chapter{chapters.length === 1 ? "" : "s"})</h2>
          <p className="text-sm text-muted-foreground">
            {doneCount}/{chapters.length} done{failedCount > 0 ? `, ${failedCount} failed` : ""} &middot; job status: {job?.status}
            {job?.status === "running" && " (running on the server - safe to close this tab, a couple of minutes per chapter)"}
          </p>
          <div className="flex gap-3 flex-wrap">
            {job?.status === "running" && (
              <Button onClick={handlePause} variant="secondary" className="flex-1">Pause</Button>
            )}
            {job?.status === "paused" && (
              <Button onClick={handleResume} disabled={isTriggering} className="flex-1">Resume</Button>
            )}
            {failedCount > 0 && job?.status !== "running" && (
              <Button onClick={handleRetryFailed} variant="secondary" className="flex-1">Retry {failedCount} Failed</Button>
            )}
            {job?.status !== "running" && (
              <Button onClick={handleClearJob} variant="outline" className="flex-1 border-destructive/40 text-destructive hover:bg-destructive/10">
                Clear &amp; Start Over
              </Button>
            )}
          </div>

          <div className="space-y-1 max-h-96 overflow-y-auto">
            {chapters.map((c, i) => (
              <div key={i} className="flex items-center justify-between text-sm rounded-lg border p-2 gap-2">
                <span className="truncate flex-1">{c.title}</span>
                {c.status === "done" && c.textbookId && c.chapterId ? (
                  <Link href={`/notes/${subjectId}/${c.textbookId}/${c.chapterId}`} className="text-primary underline shrink-0">
                    {c.topicCount} topic{c.topicCount === 1 ? "" : "s"} &rarr;
                  </Link>
                ) : (
                  <span className={`text-right shrink-0 ${c.status === "failed" ? "text-red-500" : c.status === "running" ? "text-blue-500" : "text-muted-foreground"}`}>
                    {c.status}{c.error ? ` - ${c.error}` : ""}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
