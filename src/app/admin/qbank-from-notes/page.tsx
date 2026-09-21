"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import { useUser, useDoc, useFirestore, useCollection } from "@/firebase"
import { doc, collection, query, orderBy, getDocs, setDoc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

const JOB_ID = "current"
const QUESTION_COUNT_OPTIONS = [10, 15, 20, 25, 30]

type NoteDoc = {
  id: string
  subjectId: string
  textbookId: string
  chapterId: string
  chapterTitle: string
}

type ChapterProgress = {
  title: string
  subjectId: string
  textbookId: string
  chapterId: string
  status: "pending" | "running" | "done" | "failed"
  questionCount?: number
  error?: string | null
}

export default function QBankFromNotesPage() {
  const { user } = useUser()
  const db = useFirestore()

  const subjectsQuery = useMemo(() => (!db ? null : query(collection(db, "subjects"), orderBy("name", "asc"))), [db])
  const { data: subjects } = useCollection(subjectsQuery)
  const subjectNameById = useMemo(() => {
    const map: Record<string, string> = {}
    for (const s of (subjects || []) as any[]) map[s.id] = s.name
    return map
  }, [subjects])

  // Multiple subjects can be picked at once. Notes come from Firestore; existing
  // question topic_titles come from the QBank table itself (Neon, via the existing
  // public /api/questions GET route) since that's where questions actually live, not
  // Firestore - both fetched on demand as a subject is checked, not as live listeners.
  const [selectedSubjects, setSelectedSubjects] = useState<Record<string, boolean>>({})
  const [notesBySubject, setNotesBySubject] = useState<Record<string, NoteDoc[]>>({})
  const [existingTopicsBySubject, setExistingTopicsBySubject] = useState<Record<string, Set<string>>>({})
  const [loadingSubjects, setLoadingSubjects] = useState<Record<string, boolean>>({})

  async function toggleSubject(subjectId: string, checked: boolean) {
    setSelectedSubjects((s) => ({ ...s, [subjectId]: checked }))
    if (!checked || notesBySubject[subjectId] || !db) return
    setLoadingSubjects((s) => ({ ...s, [subjectId]: true }))
    try {
      const notesSnap = await getDocs(collection(db, "subjects", subjectId, "textNotes"))
      const notesForSubject: NoteDoc[] = notesSnap.docs.map((d) => {
        const data = d.data() as any
        return { id: d.id, subjectId, textbookId: data.textbookId, chapterId: data.chapterId, chapterTitle: data.chapterTitle }
      })

      const qRes = await fetch(`/api/questions?subject_id=${encodeURIComponent(subjectId)}`)
      const qJson = await qRes.json()
      const existingTopics = new Set<string>((qJson.data || []).map((q: any) => q.topic_title))

      setNotesBySubject((prev) => ({ ...prev, [subjectId]: notesForSubject }))
      setExistingTopicsBySubject((prev) => ({ ...prev, [subjectId]: existingTopics }))
    } finally {
      setLoadingSubjects((s) => ({ ...s, [subjectId]: false }))
    }
  }

  const selectedSubjectIds = useMemo(() => Object.keys(selectedSubjects).filter((id) => selectedSubjects[id]), [selectedSubjects])
  const allNotes = useMemo(
    () => selectedSubjectIds.flatMap((sid) => notesBySubject[sid] || []),
    [selectedSubjectIds, notesBySubject]
  )

  const keyOf = (n: NoteDoc) => `${n.subjectId}::${n.id}`

  const jobRef = useMemo(() => (!db ? null : doc(db, "qbankFromNotesJobs", JOB_ID)), [db])
  const { data: job } = useDoc(jobRef)

  const [numQuestions, setNumQuestions] = useState(15)
  const [selected, setSelected] = useState<Record<string, boolean>>({})

  // Default selection: chapters that have notes but no question set yet.
  useEffect(() => {
    const defaults: Record<string, boolean> = {}
    for (const n of allNotes) {
      const hasQuestions = existingTopicsBySubject[n.subjectId]?.has(n.chapterTitle)
      defaults[keyOf(n)] = !hasQuestions
    }
    setSelected(defaults)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allNotes.length])

  const pausedRef = useRef(false)
  const runningRef = useRef(false)
  const autoResumedRef = useRef(false)

  // If this page loads and finds a job already marked "running" in Firestore, but no
  // local loop is actually active (the tab that was running it closed, crashed, or
  // lost connection without cleanly writing "paused"), pick it back up automatically
  // instead of leaving it stuck forever with no Resume button showing.
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
    if (!db || !jobRef) return
    const chosen = allNotes.filter((n) => selected[keyOf(n)])
    if (chosen.length === 0) {
      alert("Select at least one chapter.")
      return
    }
    const chapters: ChapterProgress[] = chosen.map((n) => ({
      title: n.chapterTitle, subjectId: n.subjectId, textbookId: n.textbookId, chapterId: n.chapterId, status: "pending",
    }))

    try {
      await setDoc(jobRef, { chapters, numQuestions, status: "running", updatedAt: serverTimestamp() })
      pausedRef.current = false
      runLoop(chapters, 0)
    } catch (err: any) {
      alert(`Could not start: ${err?.message || "unknown error"}. If this says "permission denied", the Firestore rule for qbankFromNotesJobs may not be published yet - check Firebase Console -> Firestore Database -> Rules.`)
    }
  }

  // Same tab-driven, one-at-a-time pattern as the other "from notes" generators.
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

      working[i] = { ...working[i], status: "running", error: null }
      await updateJob({ chapters: working, updatedAt: serverTimestamp() })

      try {
        const idToken = await user.getIdToken()
        const res = await fetch("/api/admin/generate-qbank-from-notes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            idToken, subjectId: working[i].subjectId,
            textbookId: working[i].textbookId, chapterId: working[i].chapterId, chapterTitle: working[i].title,
            numQuestions,
          }),
        })
        let data: any
        try {
          data = await res.json()
        } catch {
          data = { error: res.ok ? "Server returned a non-JSON response" : `Server error (status ${res.status}), likely a timeout - try again` }
        }
        if (data.success) {
          working[i] = { ...working[i], status: "done", questionCount: data.count }
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
      c.status === "failed" ? { ...c, status: "pending" as const, error: null } : c
    )
    await updateJob({ status: "running", chapters, updatedAt: serverTimestamp() })
    runLoop(chapters, 0)
  }

  async function handleClearJob() {
    if (!jobRef) return
    if (!confirm("Clear this job? Questions already generated are NOT deleted, only the progress list.")) return
    pausedRef.current = true
    runningRef.current = false
    await deleteDoc(jobRef)
  }

  const chapters: ChapterProgress[] = job?.chapters || []
  const doneCount = chapters.filter((c) => c.status === "done").length
  const failedCount = chapters.filter((c) => c.status === "failed").length
  const hasActiveJob = chapters.length > 0
  const selectedCount = Object.values(selected).filter(Boolean).length

  const notesBySubjectFiltered = useMemo(() => {
    const groups: { subjectId: string; subjectName: string; notes: NoteDoc[] }[] = []
    for (const sid of selectedSubjectIds) {
      groups.push({ subjectId: sid, subjectName: subjectNameById[sid] || sid, notes: notesBySubject[sid] || [] })
    }
    return groups
  }, [selectedSubjectIds, notesBySubject, subjectNameById])

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-12 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">QBank from Notes</h1>
        <p className="text-muted-foreground mt-2">
          Builds a mastery-focused MCQ set for each chapter directly from its already-generated notes. Each explanation is written to teach the concept in full, not just justify the answer, so working through a chapter's set is a complete revision pass on its own. Chapters without notes yet don't show up here; generate their notes first in AI Notes Generator.
        </p>
      </div>

      <div className="space-y-4 rounded-2xl glass border p-6">
        <div>
          <Label className="text-sm font-medium block mb-1">Subjects</Label>
          <div className="space-y-1 max-h-64 overflow-y-auto border rounded-lg p-2">
            {subjects?.map((s: any) => (
              <label key={s.id} className="flex items-center gap-3 text-sm rounded-lg p-2 cursor-pointer hover:bg-muted/50">
                <input
                  type="checkbox"
                  checked={!!selectedSubjects[s.id]}
                  disabled={hasActiveJob}
                  onChange={(e) => toggleSubject(s.id, e.target.checked)}
                />
                <span className="truncate flex-1">{s.name}</span>
                {loadingSubjects[s.id] && <span className="text-xs text-muted-foreground shrink-0">loading...</span>}
              </label>
            ))}
          </div>
        </div>

        {!hasActiveJob && (
          <div>
            <Label className="text-sm font-medium block mb-1">Questions per chapter</Label>
            <div className="flex flex-wrap gap-2">
              {QUESTION_COUNT_OPTIONS.map((count) => (
                <button
                  key={count}
                  onClick={() => setNumQuestions(count)}
                  className={`h-9 px-4 rounded-lg text-sm font-bold transition-all border ${
                    numQuestions === count ? "bg-primary text-primary-foreground border-primary" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {count}
                </button>
              ))}
            </div>
          </div>
        )}

        {!hasActiveJob && selectedSubjectIds.length > 0 && (
          <>
            {allNotes.length === 0 ? (
              <p className="text-sm text-muted-foreground">No notes found yet for the selected subject{selectedSubjectIds.length === 1 ? "" : "s"}.</p>
            ) : (
              <>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {notesBySubjectFiltered.map((group) => group.notes.length > 0 && (
                    <div key={group.subjectId}>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">{group.subjectName}</p>
                      <div className="space-y-1">
                        {group.notes.map((n) => {
                          const hasQuestions = existingTopicsBySubject[n.subjectId]?.has(n.chapterTitle)
                          return (
                            <label key={keyOf(n)} className="flex items-center gap-3 text-sm rounded-lg border p-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={!!selected[keyOf(n)]}
                                onChange={(e) => setSelected((s) => ({ ...s, [keyOf(n)]: e.target.checked }))}
                              />
                              <span className="truncate flex-1">{n.chapterTitle}</span>
                              {hasQuestions && <span className="text-xs text-muted-foreground shrink-0">already has questions</span>}
                            </label>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
                <Button onClick={startNewJob} disabled={selectedCount === 0} className="w-full">
                  Generate {selectedCount > 0 ? `${selectedCount} ` : ""}Chapter{selectedCount === 1 ? "" : "s"} of Questions
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
                <span className="truncate flex-1">{subjectNameById[c.subjectId] || c.subjectId} &mdash; {c.title}</span>
                {c.status === "done" ? (
                  <span className="text-primary shrink-0">{c.questionCount} question{c.questionCount === 1 ? "" : "s"}</span>
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
