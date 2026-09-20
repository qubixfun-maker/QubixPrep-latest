"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import { useUser, useDoc, useFirestore, useCollection } from "@/firebase"
import { doc, collection, query, orderBy, getDocs, setDoc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

const JOB_ID = "current"

// Mirrors src/ai/notes-repair.ts's looksTruncated() - kept as a plain client-side copy
// since that file is 'use server' and can't be imported directly into this component.
// Every well-formed topic ends with a closed ```quiz fence, so its absence (or any
// unclosed code fence anywhere) is a reliable truncation signal.
function looksTruncated(markdown: string): boolean {
  if (!markdown || markdown.trim().length < 30) return true
  const fenceCount = (markdown.match(/```/g) || []).length
  if (fenceCount % 2 !== 0) return true
  const hasClosedQuiz = /```quiz[\s\S]*?```/.test(markdown)
  if (!hasClosedQuiz) return true
  const trimmed = markdown.trimEnd()
  const lastChar = trimmed[trimmed.length - 1]
  if (!/[.!?:)\]}`]/.test(lastChar)) return true
  return false
}

type FlaggedTopic = {
  subjectId: string
  subjectName: string
  textbookId: string
  chapterId: string
  chapterTitle: string
  topicIndex: number
  topicName: string
  snippet: string // last ~150 chars, so you can see exactly where it cuts off
}

type TopicProgress = FlaggedTopic & {
  status: "pending" | "running" | "done" | "failed"
  addedChars?: number
  stillTruncated?: boolean
  error?: string
}

export default function NotesRepairPage() {
  const { user } = useUser()
  const db = useFirestore()

  const subjectsQuery = useMemo(() => (!db ? null : query(collection(db, "subjects"), orderBy("name", "asc"))), [db])
  const { data: subjects } = useCollection(subjectsQuery)

  const [selectedSubjects, setSelectedSubjects] = useState<Record<string, boolean>>({})
  const [isScanning, setIsScanning] = useState(false)
  const [flagged, setFlagged] = useState<FlaggedTopic[]>([])
  const [hasScanned, setHasScanned] = useState(false)
  const [selected, setSelected] = useState<Record<string, boolean>>({})

  const keyOf = (t: { subjectId: string; textbookId: string; chapterId: string; topicIndex: number }) =>
    `${t.subjectId}::${t.textbookId}::${t.chapterId}::${t.topicIndex}`

  async function handleScan() {
    if (!db) return
    const subjectIds = Object.keys(selectedSubjects).filter((id) => selectedSubjects[id])
    if (subjectIds.length === 0) {
      alert("Select at least one subject to scan.")
      return
    }
    setIsScanning(true)
    setFlagged([])
    try {
      const results: FlaggedTopic[] = []
      for (const subjectId of subjectIds) {
        const subjectName = (subjects || []).find((s: any) => s.id === subjectId)?.name || subjectId
        const notesSnap = await getDocs(collection(db, "subjects", subjectId, "textNotes"))
        for (const noteDoc of notesSnap.docs) {
          const data = noteDoc.data() as any
          const topics = data.topics || []
          topics.forEach((topic: any, topicIndex: number) => {
            if (looksTruncated(topic.markdown)) {
              const snippet = (topic.markdown || "").trim().slice(-150)
              results.push({
                subjectId, subjectName,
                textbookId: data.textbookId, chapterId: data.chapterId,
                chapterTitle: data.chapterTitle || noteDoc.id,
                topicIndex, topicName: topic.name,
                snippet: (snippet.length === 150 ? "..." : "") + snippet,
              })
            }
          })
        }
      }
      setFlagged(results)
      const defaults: Record<string, boolean> = {}
      results.forEach((t) => { defaults[keyOf(t)] = true })
      setSelected(defaults)
      setHasScanned(true)
    } finally {
      setIsScanning(false)
    }
  }

  const jobRef = useMemo(() => (!db ? null : doc(db, "notesRepairJobs", JOB_ID)), [db])
  const { data: job } = useDoc(jobRef)

  const pausedRef = useRef(false)
  const runningRef = useRef(false)
  const autoResumedRef = useRef(false)

  useEffect(() => {
    if (!job || autoResumedRef.current || runningRef.current) return
    if (job.status !== "running") return
    autoResumedRef.current = true
    const topics: TopicProgress[] = job.topics || []
    const startIndex = topics.findIndex((t) => t.status !== "done")
    if (startIndex !== -1) {
      pausedRef.current = false
      runLoop(topics, startIndex)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [job?.status])

  async function updateJob(fields: any) {
    if (!jobRef) return
    await updateDoc(jobRef, fields)
  }

  async function startNewJob() {
    if (!db || !jobRef) return
    const chosen = flagged.filter((t) => selected[keyOf(t)])
    if (chosen.length === 0) {
      alert("Select at least one topic to repair.")
      return
    }
    const topics: TopicProgress[] = chosen.map((t) => ({ ...t, status: "pending" }))
    try {
      await setDoc(jobRef, { topics, status: "running", updatedAt: serverTimestamp() })
      pausedRef.current = false
      runLoop(topics, 0)
    } catch (err: any) {
      alert(`Could not start: ${err?.message || "unknown error"}. If this says "permission denied", the Firestore rule for notesRepairJobs may not be published yet - check Firebase Console -> Firestore Database -> Rules.`)
    }
  }

  async function runLoop(topics: TopicProgress[], startIndex: number) {
    if (runningRef.current || !user || !jobRef) return
    runningRef.current = true
    const working = [...topics]

    for (let i = startIndex; i < working.length; i++) {
      if (pausedRef.current) {
        await updateJob({ status: "paused", topics: working, updatedAt: serverTimestamp() })
        runningRef.current = false
        return
      }
      if (working[i].status === "done") continue

      working[i] = { ...working[i], status: "running" }
      await updateJob({ topics: working, updatedAt: serverTimestamp() })

      try {
        const idToken = await user.getIdToken()
        const res = await fetch("/api/admin/repair-truncated-notes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            idToken, subjectId: working[i].subjectId,
            textbookId: working[i].textbookId, chapterId: working[i].chapterId, topicIndex: working[i].topicIndex,
          }),
        })
        let data: any
        try {
          data = await res.json()
        } catch {
          data = { error: res.ok ? "Server returned a non-JSON response" : `Server error (status ${res.status}), likely a timeout - try again` }
        }
        if (data.success) {
          working[i] = { ...working[i], status: "done", addedChars: data.addedChars, stillTruncated: data.stillTruncated }
        } else {
          working[i] = { ...working[i], status: "failed", error: data.error || "Repair failed" }
        }
      } catch (err: any) {
        working[i] = { ...working[i], status: "failed", error: err.message || "Repair failed" }
      }

      await updateJob({ topics: working, updatedAt: serverTimestamp() })
    }

    await updateJob({ status: "done", topics: working, updatedAt: serverTimestamp() })
    runningRef.current = false
  }

  function handlePause() {
    pausedRef.current = true
  }
  function handleResume() {
    if (!job) return
    pausedRef.current = false
    const topics: TopicProgress[] = job.topics
    const startIndex = topics.findIndex((t: TopicProgress) => t.status !== "done")
    runLoop(topics, startIndex === -1 ? topics.length : startIndex)
    updateJob({ status: "running" })
  }
  async function handleRetryFailed() {
    if (!job) return
    pausedRef.current = false
    const topics: TopicProgress[] = job.topics.map((t: TopicProgress) =>
      t.status === "failed" ? { ...t, status: "pending" as const } : t
    )
    await updateJob({ status: "running", topics, updatedAt: serverTimestamp() })
    runLoop(topics, 0)
  }
  async function handleClearJob() {
    if (!jobRef) return
    if (!confirm("Clear this job? Topics already repaired are NOT reverted, only the progress list.")) return
    pausedRef.current = true
    runningRef.current = false
    await deleteDoc(jobRef)
  }

  const jobTopics: TopicProgress[] = job?.topics || []
  const doneCount = jobTopics.filter((t) => t.status === "done").length
  const failedCount = jobTopics.filter((t) => t.status === "failed").length
  const hasActiveJob = jobTopics.length > 0
  const selectedCount = Object.values(selected).filter(Boolean).length
  const stillTruncatedAfterCount = jobTopics.filter((t) => t.status === "done" && t.stillTruncated).length

  const flaggedGrouped = useMemo(() => {
    const groups: { key: string; subjectName: string; chapterTitle: string; topics: FlaggedTopic[] }[] = []
    const map = new Map<string, typeof groups[0]>()
    for (const t of flagged) {
      const gKey = `${t.subjectId}::${t.textbookId}::${t.chapterId}`
      if (!map.has(gKey)) {
        const g = { key: gKey, subjectName: t.subjectName, chapterTitle: t.chapterTitle, topics: [] as FlaggedTopic[] }
        map.set(gKey, g)
        groups.push(g)
      }
      map.get(gKey)!.topics.push(t)
    }
    return groups
  }, [flagged])

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-12 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Fix Truncated Notes</h1>
        <p className="text-muted-foreground mt-2">
          Scans your existing AI Notes Generator chapters for topics that were cut off by the old token cap (every complete topic ends with a self-test quiz block - its absence, or any unclosed code fence, is how a cut-off topic is detected). Repairing a topic asks the model to continue exactly where it stopped, then merges the result - it does not regenerate the topic from scratch.
        </p>
      </div>

      {!hasActiveJob && (
        <div className="space-y-4 rounded-2xl glass border p-6">
          <div>
            <Label className="text-sm font-medium block mb-1">Subjects to scan</Label>
            <div className="space-y-1 max-h-64 overflow-y-auto border rounded-lg p-2">
              {subjects?.map((s: any) => (
                <label key={s.id} className="flex items-center gap-3 text-sm rounded-lg p-2 cursor-pointer hover:bg-muted/50">
                  <input
                    type="checkbox"
                    checked={!!selectedSubjects[s.id]}
                    onChange={(e) => setSelectedSubjects((prev) => ({ ...prev, [s.id]: e.target.checked }))}
                  />
                  <span className="truncate flex-1">{s.name}</span>
                </label>
              ))}
            </div>
          </div>
          <Button onClick={handleScan} disabled={isScanning} className="w-full">
            {isScanning ? "Scanning..." : "Scan for Truncated Topics"}
          </Button>
        </div>
      )}

      {!hasActiveJob && hasScanned && (
        <div className="space-y-4 rounded-2xl glass border p-6">
          {flagged.length === 0 ? (
            <p className="text-sm text-muted-foreground">No truncated topics found in the selected subject(s).</p>
          ) : (
            <>
              <h2 className="text-lg font-semibold">{flagged.length} truncated topic{flagged.length === 1 ? "" : "s"} found</h2>
              <div className="space-y-4 max-h-[32rem] overflow-y-auto">
                {flaggedGrouped.map((group) => (
                  <div key={group.key}>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">{group.subjectName} &mdash; {group.chapterTitle}</p>
                    <div className="space-y-2">
                      {group.topics.map((t) => (
                        <label key={keyOf(t)} className="flex items-start gap-3 text-sm rounded-lg border p-2 cursor-pointer">
                          <input
                            type="checkbox"
                            className="mt-1"
                            checked={!!selected[keyOf(t)]}
                            onChange={(e) => setSelected((s) => ({ ...s, [keyOf(t)]: e.target.checked }))}
                          />
                          <div className="min-w-0 flex-1">
                            <p className="font-medium">{t.topicName}</p>
                            <p className="text-xs text-muted-foreground italic truncate">...{t.snippet}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <Button onClick={startNewJob} disabled={selectedCount === 0} className="w-full">
                Repair {selectedCount > 0 ? `${selectedCount} ` : ""}Topic{selectedCount === 1 ? "" : "s"}
              </Button>
            </>
          )}
        </div>
      )}

      {hasActiveJob && (
        <div className="space-y-4 rounded-2xl glass border p-6">
          <h2 className="text-lg font-semibold">Progress ({jobTopics.length} topic{jobTopics.length === 1 ? "" : "s"})</h2>
          <p className="text-sm text-muted-foreground">
            {doneCount}/{jobTopics.length} done{failedCount > 0 ? `, ${failedCount} failed` : ""}
            {stillTruncatedAfterCount > 0 ? `, ${stillTruncatedAfterCount} still incomplete after repair (may need another pass)` : ""} &middot; job status: {job?.status}
            {job?.status === "running" && " (keep this tab open)"}
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
            {jobTopics.map((t, i) => (
              <div key={i} className="flex items-center justify-between text-sm rounded-lg border p-2 gap-2">
                <span className="truncate flex-1">{t.subjectName} &mdash; {t.chapterTitle} &mdash; {t.topicName}</span>
                {t.status === "done" ? (
                  <span className={`shrink-0 ${t.stillTruncated ? "text-yellow-500" : "text-primary"}`}>
                    +{t.addedChars} chars{t.stillTruncated ? " (still incomplete)" : ""}
                  </span>
                ) : (
                  <span className={`text-right shrink-0 ${t.status === "failed" ? "text-red-500" : t.status === "running" ? "text-blue-500" : "text-muted-foreground"}`}>
                    {t.status}{t.error ? ` - ${t.error}` : ""}
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
