"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import { useUser, useDoc, useFirestore, useCollection } from "@/firebase"
import { doc, collection, query, orderBy, setDoc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

const JOB_ID = "current"

type NoteDoc = {
  id: string
  textbookId: string
  chapterId: string
  chapterTitle: string
}

type ChapterProgress = {
  title: string
  textbookId: string
  chapterId: string
  status: "pending" | "running" | "done" | "failed"
  deckCount?: number
  totalCards?: number
  error?: string
}

export default function FlashcardsFromNotesPage() {
  const { user } = useUser()
  const db = useFirestore()

  const subjectsQuery = useMemo(() => (!db ? null : query(collection(db, "subjects"), orderBy("name", "asc"))), [db])
  const { data: subjects } = useCollection(subjectsQuery)

  const [subjectId, setSubjectId] = useState("")

  const notesQuery = useMemo(() => (!db || !subjectId) ? null : query(collection(db, "subjects", subjectId, "textNotes")), [db, subjectId])
  const { data: notesRaw } = useCollection(notesQuery)
  const notes = (notesRaw as NoteDoc[] | null) || []

  const decksQuery = useMemo(() => (!db || !subjectId) ? null : query(collection(db, "subjects", subjectId, "flashcardDecks")), [db, subjectId])
  const { data: decksRaw } = useCollection(decksQuery)
  const chaptersWithDecks = useMemo(() => {
    const set = new Set<string>()
    for (const d of (decksRaw || []) as any[]) {
      if (d.textbookId && d.chapterId) set.add(`${d.textbookId}__${d.chapterId}`)
    }
    return set
  }, [decksRaw])

  const jobRef = useMemo(() => (!db || !subjectId) ? null : doc(db, "subjects", subjectId, "flashcardFromNotesJob", JOB_ID), [db, subjectId])
  const { data: job } = useDoc(jobRef)

  const [selected, setSelected] = useState<Record<string, boolean>>({})

  // Default selection: chapters that have notes but no flashcard decks yet.
  useEffect(() => {
    const defaults: Record<string, boolean> = {}
    for (const n of notes) {
      defaults[n.id] = !chaptersWithDecks.has(`${n.textbookId}__${n.chapterId}`)
    }
    setSelected(defaults)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjectId, notes.length, chaptersWithDecks.size])

  const pausedRef = useRef(false)
  const runningRef = useRef(false)

  async function updateJob(fields: any) {
    if (!jobRef) return
    await updateDoc(jobRef, fields)
  }

  async function startNewJob() {
    if (!db || !subjectId || !jobRef) return
    const chosen = notes.filter((n) => selected[n.id])
    if (chosen.length === 0) {
      alert("Select at least one chapter.")
      return
    }
    const chapters: ChapterProgress[] = chosen.map((n) => ({
      title: n.chapterTitle, textbookId: n.textbookId, chapterId: n.chapterId, status: "pending",
    }))

    try {
      await setDoc(jobRef, { subjectId, chapters, status: "running", updatedAt: serverTimestamp() })
      pausedRef.current = false
      runLoop(chapters, 0)
    } catch (err: any) {
      alert(`Could not start: ${err?.message || "unknown error"}. If this says "permission denied", the Firestore rule for flashcardFromNotesJob may not be published yet - check Firebase Console -> Firestore Database -> Rules.`)
    }
  }

  // Same tab-driven, one-at-a-time pattern as AI Notes Generator / Mindmaps from
  // Notes - the batch only advances while this tab stays open.
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
        const res = await fetch("/api/admin/generate-flashcards-from-notes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            idToken, subjectId,
            textbookId: working[i].textbookId, chapterId: working[i].chapterId, chapterTitle: working[i].title,
          }),
        })
        let data: any
        try {
          data = await res.json()
        } catch {
          data = { error: res.ok ? "Server returned a non-JSON response" : `Server error (status ${res.status}), likely a timeout - try again` }
        }
        if (data.success) {
          working[i] = { ...working[i], status: "done", deckCount: data.deckCount, totalCards: data.totalCards }
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
    if (!confirm("Clear this job? Decks already generated are NOT deleted, only the progress list.")) return
    pausedRef.current = true
    runningRef.current = false
    await deleteDoc(jobRef)
  }

  const chapters: ChapterProgress[] = job?.chapters || []
  const doneCount = chapters.filter((c) => c.status === "done").length
  const failedCount = chapters.filter((c) => c.status === "failed").length
  const hasActiveJob = chapters.length > 0
  const selectedCount = Object.values(selected).filter(Boolean).length

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-12 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Flashcards from Notes</h1>
        <p className="text-muted-foreground mt-2">
          Builds a flashcard deck for each topic directly from its already-generated notes - no chapterKnowledge or separate content source needed. Chapters without notes yet don't show up here; generate their notes first in AI Notes Generator.
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

        {!hasActiveJob && subjectId && (
          <>
            {notes.length === 0 ? (
              <p className="text-sm text-muted-foreground">No notes found for this subject yet.</p>
            ) : (
              <>
                <div className="space-y-1 max-h-96 overflow-y-auto">
                  {notes.map((n) => {
                    const hasDecks = chaptersWithDecks.has(`${n.textbookId}__${n.chapterId}`)
                    return (
                      <label key={n.id} className="flex items-center gap-3 text-sm rounded-lg border p-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!selected[n.id]}
                          onChange={(e) => setSelected((s) => ({ ...s, [n.id]: e.target.checked }))}
                        />
                        <span className="truncate flex-1">{n.chapterTitle}</span>
                        {hasDecks && <span className="text-xs text-muted-foreground shrink-0">already has decks</span>}
                      </label>
                    )
                  })}
                </div>
                <Button onClick={startNewJob} disabled={selectedCount === 0} className="w-full">
                  Generate {selectedCount > 0 ? `${selectedCount} ` : ""}Chapter{selectedCount === 1 ? "" : "s"} of Flashcards
                </Button>
              </>
            )}
          </>
        )}
      </div>

      {hasActiveJob && (
        <div className="space-y-4 rounded-2xl glass border p-6">
          <h2 className="text-lg font-semibold">Progress ({chapters.length} chapter{chapters.length === 1 ? "" : "s"})</h2>
          <p className="text-sm text-muted-foreground">
            {doneCount}/{chapters.length} done{failedCount > 0 ? `, ${failedCount} failed` : ""} &middot; job status: {job?.status}
            {job?.status === "running" && " (keep this tab open - a minute or two per chapter)"}
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
                {c.status === "done" ? (
                  <span className="text-primary shrink-0">{c.deckCount} deck{c.deckCount === 1 ? "" : "s"}, {c.totalCards} cards</span>
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
