"use client"

import { useState, useMemo, useRef } from "react"
import { useUser, useDoc, useFirestore, useCollection } from "@/firebase"
import { doc, collection, query, orderBy, getDocs, setDoc, updateDoc, increment, serverTimestamp, arrayUnion } from "firebase/firestore"
import { generateQBankQuestionsFromTextbook } from "@/ai/flows/ai-qbank-generator-from-textbook"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Lock, ArrowLeft, Sparkles, Play, Pause, RotateCcw, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

const JOB_ID = "current"

type ChapterMeta = {
  key: string
  textbookId: string
  textbookTitle: string
  subjectId: string
  chapterId: string
  chapterTitle: string
  unitName?: string
}

type QueueItem = ChapterMeta & { numQuestions: number }

export default function QBankBulkGeneratorPage() {
  const { user, loading: authLoading } = useUser()
  const db = useFirestore()
  const { toast } = useToast()

  const profileRef = useMemo(() => (!db || !user) ? null : doc(db, 'users', user.uid), [db, user])
  const { data: profile, loading: profileLoading } = useDoc(profileRef)

  const textbooksQuery = useMemo(() => (!db) ? null : query(collection(db, 'textbooks'), orderBy('createdAt', 'desc')), [db])
  const { data: textbooks, loading: textbooksLoading } = useCollection(textbooksQuery)

  const subjectsQuery = useMemo(() => (!db) ? null : query(collection(db, 'subjects'), orderBy('name', 'asc')), [db])
  const { data: subjects } = useCollection(subjectsQuery)

  const jobRef = useMemo(() => (!db) ? null : doc(db, 'bulkQbankJobs', JOB_ID), [db])
  const { data: job } = useDoc(jobRef)

  // --- Step 1: textbook selection + subject mapping ---
  const [selectedPairs, setSelectedPairs] = useState<Record<string, string>>({})
  function toggleTextbook(id: string) {
    setSelectedPairs((prev) => {
      const next = { ...prev }
      if (id in next) delete next[id]
      else next[id] = ""
      return next
    })
    setChaptersByTextbook({})
    setSelectedChapterKeys({})
  }
  function setSubjectForTextbook(textbookId: string, subjectId: string) {
    setSelectedPairs((prev) => ({ ...prev, [textbookId]: subjectId }))
  }
  const readyTextbooks = textbooks?.filter((tb: any) => tb.status === "ready") || []
  const selectedTextbookIds = Object.keys(selectedPairs)
  const allMapped = selectedTextbookIds.length > 0 && selectedTextbookIds.every((id) => selectedPairs[id])

  // --- Step 2: load + select chapters ---
  const [chaptersByTextbook, setChaptersByTextbook] = useState<Record<string, any[]>>({})
  const [selectedChapterKeys, setSelectedChapterKeys] = useState<Record<string, boolean>>({})
  const [isLoadingChapters, setIsLoadingChapters] = useState(false)

  async function handleLoadChapters() {
    if (!db || !allMapped) return
    setIsLoadingChapters(true)
    try {
      const map: Record<string, any[]> = {}
      for (const textbookId of selectedTextbookIds) {
        const snap = await getDocs(collection(db, 'textbooks', textbookId, 'chapters'))
        map[textbookId] = snap.docs.map((d) => ({ chapterId: d.id, ...(d.data() as any) }))
      }
      setChaptersByTextbook(map)
      setSelectedChapterKeys({})
    } catch (e: any) {
      toast({ variant: "destructive", title: "Failed to load chapters", description: e.message })
    } finally {
      setIsLoadingChapters(false)
    }
  }

  function toggleChapter(key: string) {
    setSelectedChapterKeys((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const chapterList: ChapterMeta[] = useMemo(() => {
    const list: ChapterMeta[] = []
    for (const textbookId of selectedTextbookIds) {
      const tb = textbooks?.find((t: any) => t.id === textbookId)
      const chapters = chaptersByTextbook[textbookId] || []
      chapters.forEach((ch: any) => {
        list.push({
          key: `${textbookId}__${ch.chapterId}`,
          textbookId,
          textbookTitle: tb?.title || textbookId,
          subjectId: selectedPairs[textbookId],
          chapterId: ch.chapterId,
          chapterTitle: ch.title,
          unitName: ch.unitName || undefined,
        })
      })
    }
    return list
  }, [selectedTextbookIds, chaptersByTextbook, textbooks, selectedPairs])

  const selectedChapters = chapterList.filter((c) => selectedChapterKeys[c.key])

  // --- Step 3: settings + run ---
  const [questionsPerChapter, setQuestionsPerChapter] = useState(12)
  const [concurrency, setConcurrency] = useState(4)
  const [pauseSeconds, setPauseSeconds] = useState(20)
  const [pinVertexOnly, setPinVertexOnly] = useState(false)
  const [isStarting, setIsStarting] = useState(false)

  const isPausedRef = useRef(false)
  const isRunningLocallyRef = useRef(false)
  const [currentLabel, setCurrentLabel] = useState("")

  async function updateJob(fields: any) {
    if (!db) return
    await updateDoc(doc(db, 'bulkQbankJobs', JOB_ID), fields)
  }

  async function handleStart() {
    if (!db || selectedChapters.length === 0) return
    setIsStarting(true)
    try {
      const queue: QueueItem[] = selectedChapters.map((ch) => ({ ...ch, numQuestions: questionsPerChapter }))

      await setDoc(doc(db, 'bulkQbankJobs', JOB_ID), {
        status: "running",
        queue,
        concurrency,
        pauseSeconds,
        forceVertex: pinVertexOnly,
        completedChapters: [],
        failedChapters: [],
        fallbackChapters: [],
        providerCounts: {},
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })

      toast({ title: "Job Started", description: `${queue.length} chapter(s) queued, ${concurrency} at a time, ~${questionsPerChapter} question(s) each.` })
      isPausedRef.current = false
      runLoop(queue, concurrency, pauseSeconds, [], pinVertexOnly)
    } catch (e: any) {
      toast({ variant: "destructive", title: "Failed to start", description: e.message })
    } finally {
      setIsStarting(false)
    }
  }

  async function handleResume() {
    if (!job || job.status !== "paused") return
    isPausedRef.current = false
    await updateJob({ status: "running" })
    runLoop(job.queue, job.concurrency || 4, job.pauseSeconds || 20, job.completedChapters || [], job.forceVertex || false)
  }
  function handlePause() {
    isPausedRef.current = true
    toast({ title: "Pausing...", description: "Will stop once each in-progress chapter finishes." })
  }
  async function handleReset() {
    if (!confirm("Reset the job? This clears progress tracking (already-saved questions are NOT deleted).")) return
    isPausedRef.current = true
    await updateJob({ status: "idle", queue: [], completedChapters: [], failedChapters: [], fallbackChapters: [] })
  }

  function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  // Deletes any existing questions for this chapter (matched by subject_id + topic_title,
  // where topic_title is always set to the chapter title for textbook-generated sets) right
  // before inserting the freshly generated, textbook-grounded replacement set.
  async function processChapter(item: QueueItem, useVertexOnly: boolean) {
    setCurrentLabel(item.chapterTitle)
    try {
      const chapterData = (chaptersByTextbook[item.textbookId] || []).find((c: any) => c.chapterId === item.chapterId)
      const subject = subjects?.find((s: any) => s.id === item.subjectId)

      const result = await generateQBankQuestionsFromTextbook({
        subject: subject?.name || item.subjectId,
        unitName: item.unitName,
        chapterTitle: item.chapterTitle,
        textbookTitle: item.textbookTitle,
        chapterExcerpt: chapterData?.text || "",
        numQuestions: item.numQuestions,
        forceVertex: useVertexOnly,
      })

      if (result.questions.length === 0) {
        throw new Error(result.error || "No questions generated")
      }

      const delRes = await fetch("/api/questions", {
        method: "DELETE",
        body: JSON.stringify({ subject_id: item.subjectId, topic_title: item.chapterTitle }),
      })
      const delJson = await delRes.json()
      if (!delRes.ok || delJson.error) throw new Error(delJson.error || "Failed to clear old questions")

      const questions = result.questions.map((q) => ({
        ...q,
        subject_id: item.subjectId,
        unit_title: item.unitName || null,
        topic_title: item.chapterTitle,
      }))
      const postRes = await fetch("/api/questions", {
        method: "POST",
        body: JSON.stringify({ questions }),
      })
      const postJson = await postRes.json()
      if (!postRes.ok || postJson.error) throw new Error(postJson.error || "Failed to save questions")

      const providerUsed = result.provider || "unknown"
      const updateFields: any = {
        completedChapters: arrayUnion(item.key),
        [`providerCounts.${providerUsed}`]: increment(1),
        updatedAt: serverTimestamp(),
      }
      if (result.usedFallback) {
        updateFields.fallbackChapters = arrayUnion({ chapterTitle: item.chapterTitle, questionCount: questions.length })
      }
      await updateJob(updateFields)
    } catch (e: any) {
      await updateJob({
        failedChapters: arrayUnion({ chapterTitle: item.chapterTitle, error: e.message || "Unknown error" }),
        updatedAt: serverTimestamp(),
      })
    }
  }

  async function runLoop(queue: QueueItem[], concurrencyLevel: number, pauseSecs: number, doneKeysSoFar: string[], useVertexOnly: boolean) {
    if (isRunningLocallyRef.current) return
    isRunningLocallyRef.current = true

    const doneKeys = new Set(doneKeysSoFar)
    const pending = queue.filter((item) => !doneKeys.has(item.key))

    let nextPos = 0
    function claimNext(): QueueItem | null {
      if (nextPos >= pending.length) return null
      return pending[nextPos++]
    }

    async function worker() {
      while (true) {
        if (isPausedRef.current) return
        const item = claimNext()
        if (!item) return
        await processChapter(item, useVertexOnly)
        if (!isPausedRef.current) await sleep(pauseSecs * 1000)
      }
    }

    const workerCount = Math.max(1, Math.min(concurrencyLevel, pending.length || 1))
    await Promise.all(Array.from({ length: workerCount }, () => worker()))

    if (isPausedRef.current) {
      await updateJob({ status: "paused", updatedAt: serverTimestamp() })
    } else {
      await updateJob({ status: "done", updatedAt: serverTimestamp() })
    }
    setCurrentLabel("")
    isRunningLocallyRef.current = false
  }

  if (authLoading || profileLoading) return <div className="h-screen flex items-center justify-center"><Loader2 className="h-10 w-10 text-primary animate-spin" /></div>
  if (!user || (profile as any)?.role !== 'admin') {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center p-6 text-center">
        <Lock className="h-12 w-12 text-destructive mb-4" />
        <h1 className="text-2xl font-bold">Admin Restricted</h1>
        <Link href="/"><Button className="mt-4">Return Home</Button></Link>
      </div>
    )
  }

  const hasJob = job && job.queue && job.queue.length > 0
  const doneCount = hasJob ? (job.completedChapters?.length || 0) + (job.failedChapters?.length || 0) : 0
  const progressPct = hasJob ? Math.round((doneCount / job.queue.length) * 100) : 0

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-12 space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-3">
        <Link href="/admin"><Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button></Link>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" /> QBank Bulk Generator (Textbook-Grounded)
          </h1>
          <p className="text-sm text-muted-foreground">Select chapters, and each chapter's existing question set is replaced with new questions generated strictly from the uploaded textbook.</p>
        </div>
      </div>

      {!hasJob || job.status === "idle" ? (
        <>
          <Card className="glass border-none">
            <CardHeader><CardTitle className="text-base">1. Select Textbooks & Map to Subjects</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {textbooksLoading ? <Loader2 className="h-5 w-5 animate-spin text-primary" /> : readyTextbooks.map((tb: any) => {
                const checked = tb.id in selectedPairs
                return (
                  <div key={tb.id} className={`flex items-center gap-3 p-3 rounded-xl border ${checked ? "bg-primary/10 border-primary/40" : "glass border-white/10"}`}>
                    <input type="checkbox" checked={checked} onChange={() => toggleTextbook(tb.id)} />
                    <span className="text-sm font-medium flex-1 truncate">{tb.title}</span>
                    {checked && (
                      <Select value={selectedPairs[tb.id]} onValueChange={(v) => setSubjectForTextbook(tb.id, v)}>
                        <SelectTrigger className="glass border-white/10 w-48 h-9 text-sm"><SelectValue placeholder="Map to Subject..." /></SelectTrigger>
                        <SelectContent className="glass border-white/10">
                          {subjects?.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                )
              })}
              {selectedTextbookIds.length > 0 && !allMapped && (
                <p className="text-xs text-destructive flex items-center gap-1.5"><AlertTriangle className="h-3.5 w-3.5" /> Every selected textbook needs a Subject mapped.</p>
              )}
              {allMapped && (
                <Button onClick={handleLoadChapters} disabled={isLoadingChapters} variant="secondary" className="gap-2">
                  {isLoadingChapters ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Load Chapters
                </Button>
              )}
            </CardContent>
          </Card>

          {chapterList.length > 0 && (
            <Card className="glass border-none">
              <CardHeader><CardTitle className="text-base">2. Select Chapters</CardTitle></CardHeader>
              <CardContent className="space-y-2 max-h-96 overflow-y-auto">
                {chapterList.map((ch) => (
                  <label key={ch.key} className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer ${selectedChapterKeys[ch.key] ? "bg-primary/10 border-primary/40" : "glass border-white/10"}`}>
                    <input type="checkbox" checked={!!selectedChapterKeys[ch.key]} onChange={() => toggleChapter(ch.key)} />
                    <span className="text-sm flex-1 truncate">{ch.chapterTitle}</span>
                    <span className="text-xs text-muted-foreground shrink-0">{ch.textbookTitle}</span>
                  </label>
                ))}
                {selectedChapters.length > 0 && (
                  <p className="text-xs text-primary font-medium pt-2">{selectedChapters.length} chapter(s) selected.</p>
                )}
              </CardContent>
            </Card>
          )}

          {selectedChapters.length > 0 && (
            <>
              <Card className="glass border-none">
                <CardHeader><CardTitle className="text-base">3. Settings</CardTitle></CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Questions per chapter</Label>
                    <Input type="number" min={1} max={120} value={questionsPerChapter} onChange={(e) => setQuestionsPerChapter(parseInt(e.target.value) || 12)} className="glass border-white/10" />
                    <p className="text-xs text-muted-foreground">If the AI can't produce a usable set at this count, it automatically retries once at 120 for that chapter.</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Concurrent chapters</Label>
                    <Input type="number" min={1} max={8} value={concurrency} onChange={(e) => setConcurrency(parseInt(e.target.value) || 1)} className="glass border-white/10" />
                  </div>
                  <label className="space-y-2 flex flex-col cursor-pointer">
                    <Label className="cursor-pointer">Pin to Vertex AI only</Label>
                    <div className="flex items-center gap-2 h-10">
                      <input type="checkbox" checked={pinVertexOnly} onChange={(e) => setPinVertexOnly(e.target.checked)} />
                      <span className="text-xs text-muted-foreground">Skip the fallback chain — every question set uses the same model.</span>
                    </div>
                  </label>
                  <div className="space-y-2">
                    <Label>Pause between chapters (seconds)</Label>
                    <Input type="number" min={1} max={300} value={pauseSeconds} onChange={(e) => setPauseSeconds(parseInt(e.target.value) || 20)} className="glass border-white/10" />
                  </div>
                </CardContent>
              </Card>

              <div className="p-3 rounded-xl border border-destructive/30 bg-destructive/10 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                <p className="text-xs text-destructive">This deletes each selected chapter's existing questions right before saving the new textbook-grounded set. This cannot be undone.</p>
              </div>

              <Button onClick={handleStart} disabled={isStarting} className="w-full h-12 gap-2">
                {isStarting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                {isStarting ? "Starting..." : "Start Automation"}
              </Button>
            </>
          )}
        </>
      ) : (
        <Card className="glass border-none">
          <CardHeader><CardTitle className="text-base">Job Progress</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Status</span>
              <span className={`font-bold uppercase text-xs px-2 py-1 rounded-full ${job.status === "running" ? "bg-green-500/20 text-green-400" : job.status === "paused" ? "bg-yellow-500/20 text-yellow-400" : "bg-primary/20 text-primary"}`}>
                {job.status}
              </span>
            </div>

            <div className="w-full h-3 rounded-full bg-white/5 overflow-hidden">
              <div className="h-full bg-primary transition-all duration-300" style={{ width: `${progressPct}%` }} />
            </div>
            <p className="text-xs text-muted-foreground text-center">{doneCount} / {job.queue.length} chapter(s) processed ({progressPct}%)</p>

            {job.status === "running" && currentLabel && (
              <p className="text-sm text-center flex items-center justify-center gap-2"><Loader2 className="h-3.5 w-3.5 animate-spin text-primary" /> {currentLabel}</p>
            )}

            {job.providerCounts && Object.keys(job.providerCounts).length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-bold text-muted-foreground">Chapters by provider:</p>
                {Object.entries(job.providerCounts).map(([provider, count]: any) => (
                  <p key={provider} className="text-xs text-muted-foreground">• {provider}: {count}</p>
                ))}
              </div>
            )}

            {job.fallbackChapters && job.fallbackChapters.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-bold text-yellow-400">Used 120-question fallback ({job.fallbackChapters.length} chapter(s)):</p>
                {job.fallbackChapters.map((f: any, i: number) => (
                  <p key={i} className="text-xs text-muted-foreground">• {f.chapterTitle} — {f.questionCount} questions</p>
                ))}
              </div>
            )}

            {job.failedChapters && job.failedChapters.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-bold text-destructive flex items-center gap-1.5"><AlertTriangle className="h-3.5 w-3.5" /> {job.failedChapters.length} chapter(s) failed</p>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {job.failedChapters.map((f: any, i: number) => (
                    <p key={i} className="text-xs text-muted-foreground break-words">• {f.chapterTitle} — {f.error}</p>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              {job.status === "running" && (
                <Button onClick={handlePause} variant="secondary" className="flex-1 gap-2"><Pause className="h-4 w-4" /> Pause</Button>
              )}
              {job.status === "paused" && (
                <Button onClick={handleResume} className="flex-1 gap-2"><Play className="h-4 w-4" /> Resume</Button>
              )}
              {job.status !== "running" && (
                <Button onClick={handleReset} variant="destructive" className="gap-2"><RotateCcw className="h-4 w-4" /> Reset Job</Button>
              )}
            </div>

            {job.status === "running" && !currentLabel && (
              <p className="text-xs text-yellow-400 text-center">Job shows "running" but this tab isn't actively processing it — likely started elsewhere. Pause and Resume to continue from here.</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
