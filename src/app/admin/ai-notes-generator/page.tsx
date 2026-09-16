"use client"

import { useState, useMemo, useRef, useEffect } from "react"
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

  const jobRef = useMemo(() => (!db || !subjectId) ? null : doc(db, "subjects", subjectId, "aiNotesGenJob", JOB_ID), [db, subjectId])
  const { data: job } = useDoc(jobRef)

  // Plain refs, not state: these are read mid-loop for control flow, not rendered.
  // As state, setIsPausedLocal(false) followed by an immediate runLoop() call would
  // read the OLD value inside runLoop's closure until the next re-render - so a
  // fresh job started right after a Pause could immediately see a stale "paused"
  // signal and stop before processing anything. Refs update synchronously, so
  // there's no such gap.
  const pausedRef = useRef(false)
  const runningRef = useRef(false)
  // Guards the auto-resume effect below so it only fires once per page load, not
  // every time the job doc updates (which happens constantly while a batch runs).
  const autoResumedRef = useRef(false)

  // If this page loads and finds a job already marked "running" in Firestore, but
  // no local loop is actually active (e.g. the tab that was running it got closed,
  // crashed, or lost its connection without cleanly writing "paused"), the job would
  // otherwise be stuck forever - "running" but nothing is happening, and Resume only
  // shows up for "paused" jobs. This picks such a job back up automatically.
  useEffect(() => {
    if (!job || autoResumedRef.current || runningRef.current) return
    if (job.status !== "running") return
    autoResumedRef.current = true
    const chapters: ChapterProgress[] = job.chapters || []
    const startIndex = chapters.findIndex((c) => c.status !== "done")
    if (startIndex !== -1) {
      pausedRef.current = false
      runLoop(chapters, startIndex)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [job?.status])

  async function updateJob(fields: any) {
    if (!jobRef) return
    await updateDoc(jobRef, fields)
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

    try {
      await setDoc(jobRef, { subjectId, chapters, status: "running", updatedAt: serverTimestamp() })
      pausedRef.current = false
      runLoop(chapters, 0)
    } catch (err: any) {
      alert(`Could not start: ${err?.message || "unknown error"}. If this says "permission denied", the Firestore rule for aiNotesGenJob may not be published yet - check Firebase Console -> Firestore Database -> Rules.`)
    }
  }

  // Runs from this browser tab, one chapter at a time. Deliberately NOT server-driven:
  // the batch only advances while this tab stays open - closing it (or losing the
  // Vercel connection) simply pauses progress right where it is, rather than
  // continuing unattended on Vercel's servers.
  async function runLoop(chapters: ChapterProgress[], startIndex: number) {
    if (runningRef.current || !user || !jobRef) return
    runningRef.current = true
    const working = [...chapters]

    for (let i = startIndex; i < working.length; i++) {
      if (pausedRef.current) {
        await updateJob({ status: "paused", chapters: working, updatedAt: serverTimestamp() })
        runningRef.current = false
        return
      }
      if (working[i].status === "done") continue

      working[i] = { ...working[i], status: "running" }
      await updateJob({ chapters: working, updatedAt: serverTimestamp() })

      try {
        const idToken = await user.getIdToken()
        const res = await fetch("/api/admin/generate-chapter-notes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken, subjectId, chapterTitle: working[i].title }),
        })
        let data: any
        try {
          data = await res.json()
        } catch {
          data = { error: res.ok ? "Server returned a non-JSON response" : `Server error (status ${res.status}), likely a timeout - try again` }
        }
        if (data.success) {
          working[i] = { ...working[i], status: "done", topicCount: data.topicCount, textbookId: data.textbookId, chapterId: data.chapterId }
        } else {
          working[i] = { ...working[i], status: "failed", error: data.error || "Generation failed" }
        }
      } catch (err: any) {
        working[i] = { ...working[i], status: "failed", error: err.message || "Generation failed" }
      }

      await updateJob({ chapters: working, updatedAt: serverTimestamp() })
    }

    await updateJob({ status: "done", chapters: working, updatedAt: serverTimestamp() })
    runningRef.current = false
  }

  function handlePause() {
    pausedRef.current = true
  }

  function handleResume() {
    if (!job) return
    pausedRef.current = false
    const chapters: ChapterProgress[] = job.chapters
    const startIndex = chapters.findIndex((c: ChapterProgress) => c.status !== "done")
    runLoop(chapters, startIndex === -1 ? chapters.length : startIndex)
    updateJob({ status: "running" })
  }

  async function handleRetryFailed() {
    if (!job) return
    pausedRef.current = false
    const chapters: ChapterProgress[] = job.chapters.map((c: ChapterProgress) =>
      c.status === "failed" ? { ...c, status: "pending" as const } : c
    )
    await updateJob({ status: "running", chapters, updatedAt: serverTimestamp() })
    runLoop(chapters, 0)
  }

  async function handleClearJob() {
    if (!jobRef) return
    if (!confirm("Clear this job? Chapters already generated are NOT deleted, only the progress list.")) return
    pausedRef.current = true
    runningRef.current = false
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
          No textbook or PDF needed - give it a subject and one or more chapter names (one per line), and Gemini writes colorful, topic-wise revision notes from its own medical knowledge, at the depth of standard Indian MBBS textbooks and the NMC curriculum. Each topic includes flowcharts for any process/pathway, tables for comparisons, and a short self-test at the end. Chapters are generated one at a time, in order - keep this tab open while it runs; closing it pauses the batch until you come back and hit Resume.
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
            <Button onClick={startNewJob} disabled={!subjectId || !chapterNamesInput.trim()} className="w-full">
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
            {job?.status === "running" && " (keep this tab open - a couple of minutes per chapter)"}
          </p>
          <div className="flex gap-3 flex-wrap">
            {job?.status === "running" && (
              <Button onClick={handlePause} variant="secondary" className="flex-1">Pause</Button>
            )}
            {job?.status === "paused" && (
              <Button onClick={handleResume} className="flex-1">Resume</Button>
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
