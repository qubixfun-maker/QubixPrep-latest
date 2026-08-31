"use client"

import { useState, useMemo, useRef } from "react"
import { useUser, useDoc, useFirestore, useCollection, useStorage } from "@/firebase"
import { doc, collection, query, orderBy, getDoc, setDoc, updateDoc, serverTimestamp, increment, arrayUnion } from "firebase/firestore"
import { ref as storageRef, uploadBytes } from "firebase/storage"
import { extractLongAnswerQuestions } from "@/ai/flows/ai-longanswers-question-extractor"
import { generateProfPyqAnswerWithProvider } from "@/ai/flows/ai-profpyq-answer-generator"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Lock, ArrowLeft, FileText, Play, Pause, RotateCcw, AlertTriangle, ListTree, Plus, X } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

const JOB_ID = "current"
const MAX_PAIRS = 10

type QAItem = { questionHtml: string; answerHtml: string }

function parseQaItems(html: string): QAItem[] {
  if (typeof document === "undefined") return []
  const container = document.createElement("div")
  container.innerHTML = html
  return Array.from(container.querySelectorAll(".qa-item")).map((el) => {
    const qEl = el.querySelector(".qa-question")
    const aEl = el.querySelector(".qa-answer")
    const qClone = qEl ? qEl.cloneNode(true) as HTMLElement : null
    qClone?.querySelector(".qa-number")?.remove()
    return {
      questionHtml: (qClone?.innerHTML || "").trim(),
      answerHtml: (aEl?.innerHTML || "").trim(),
    }
  })
}

function rebuildHtml(items: QAItem[]): string {
  return items.map((item, i) => `<div class="qa-item">
  <div class="qa-question">
    <span class="qa-number">${i + 1}.</span>
    ${item.questionHtml}
  </div>
  <div class="qa-answer">
    ${item.answerHtml}
  </div>
</div>`).join("\n")
}

function answerTextToHtml(text: string): string {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean)
  const htmlParts: string[] = []
  let listBuffer: string[] = []
  function flushList() {
    if (listBuffer.length > 0) {
      htmlParts.push(`<ul>${listBuffer.map((l) => `<li>${l}</li>`).join("")}</ul>`)
      listBuffer = []
    }
  }
  for (const line of lines) {
    if (line.startsWith("-") || line.startsWith("•")) {
      listBuffer.push(line.replace(/^[-•]\s*/, ""))
    } else {
      flushList()
      htmlParts.push(`<p>${line}</p>`)
    }
  }
  flushList()
  return htmlParts.join("\n")
}

function chapterIdFor(title: string) {
  return title.trim().toLowerCase().replace(/\s+/g, '-')
}

function splitIntoChapters(rawText: string): { title: string; text: string }[] {
  const pattern = /Chapter\s+\d+[:.]?\s*/gi
  const matches = [...rawText.matchAll(pattern)]
  if (matches.length === 0) {
    return [{ title: "Untitled Chapter", text: rawText }]
  }
  const chapters: { title: string; text: string }[] = []
  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].index!
    const end = i < matches.length - 1 ? matches[i + 1].index! : rawText.length
    const chunk = rawText.slice(start, end)
    // Chapter titles sometimes visually wrap across 2 printed lines - keep
    // appending lines to the title until we hit a recognizable section header
    // or a sane line cap, instead of always stopping at the first line break.
    const stopWords = /^(Long Essay|Short Essay|Short Answer|MCQ|\(No questions)/i
    const chunkLines = chunk.split("\n")
    let titleLines: string[] = []
    for (let li = 0; li < chunkLines.length && li < 3; li++) {
      const line = chunkLines[li].trim()
      if (li > 0 && stopWords.test(line)) break
      if (line) titleLines.push(line)
    }
    const titleRaw = titleLines.join(" ") || chunk.slice(0, 120)
    const title = titleRaw.replace(pattern, "").trim().slice(0, 150) || `Chapter ${i + 1}`
    chapters.push({ title, text: chunk })
  }
  return chapters
}

type PdfPair = {
  id: string
  subjectId: string
  pdfFile: File | null
  isExtracting: boolean
  stage: string
  rawText: string
  error: string
}

type ExtractedChapter = {
  key: string
  subjectId: string
  subjectName: string
  title: string
  longEssays: string[]
  shortEssays: string[]
  shortAnswers: string[]
  selected: boolean
}

type QueueItem = {
  subjectId: string
  chapterTitle: string
  sectionType: "long-essays" | "short-essays" | "short-answers"
  questionType: "long_answer" | "short_essay" | "short_answer"
  question: string
}

export default function LongAnswersBulkGeneratorPage() {
  const { user, loading: authLoading } = useUser()
  const db = useFirestore()
  const storage = useStorage()
  const { toast } = useToast()

  const profileRef = useMemo(() => (!db || !user) ? null : doc(db, 'users', user.uid), [db, user])
  const { data: profile, loading: profileLoading } = useDoc(profileRef)

  const subjectsQuery = useMemo(() => (!db) ? null : query(collection(db, 'subjects'), orderBy('name', 'asc')), [db])
  const { data: subjects } = useCollection(subjectsQuery)

  const jobRef = useMemo(() => (!db) ? null : doc(db, 'bulkLongAnswerJobs', JOB_ID), [db])
  const { data: job } = useDoc(jobRef)

  // --- Step 1: multiple subject + PDF pairs ---
  const [pairs, setPairs] = useState<PdfPair[]>([{ id: `p-${Date.now()}`, subjectId: "", pdfFile: null, isExtracting: false, stage: "", rawText: "", error: "" }])
  const [isExtractingAll, setIsExtractingAll] = useState(false)

  function addPair() {
    if (pairs.length >= MAX_PAIRS) return
    setPairs((prev) => [...prev, { id: `p-${Date.now()}`, subjectId: "", pdfFile: null, isExtracting: false, stage: "", rawText: "", error: "" }])
  }
  function removePair(id: string) {
    setPairs((prev) => prev.filter((p) => p.id !== id))
  }
  function updatePair(id: string, fields: Partial<PdfPair>) {
    setPairs((prev) => prev.map((p) => p.id === id ? { ...p, ...fields } : p))
  }

  const readyPairs = pairs.filter((p) => p.subjectId && p.pdfFile)

  async function handleExtractAll() {
    if (!storage || !user || readyPairs.length === 0) return
    setIsExtractingAll(true)
    try {
      for (const pair of readyPairs) {
        updatePair(pair.id, { isExtracting: true, error: "", stage: "Uploading PDF..." })
        try {
          const safeId = "longanswers-" + Date.now() + "-" + Math.floor(Math.random() * 1000)
          const storagePath = `long-answers-source/${safeId}.pdf`
          const fileRef = storageRef(storage, storagePath)
          await uploadBytes(fileRef, pair.pdfFile!)

          updatePair(pair.id, { stage: "Extracting text (can take a few minutes for large files)..." })
          const idToken = await user.getIdToken()
          const res = await fetch("/api/long-answers/extract-pdf-text", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ idToken, storagePath }),
          })
          const data = await res.json()
          if (!res.ok) throw new Error(data.error || "Extraction failed")

          updatePair(pair.id, { rawText: data.text, isExtracting: false, stage: "" })
        } catch (e: any) {
          updatePair(pair.id, { isExtracting: false, stage: "", error: e.message })
        }
      }
      toast({ title: "PDFs Extracted", description: "Now split into chapters below." })
    } finally {
      setIsExtractingAll(false)
    }
  }

  // --- Step 2: split + extract questions across all pairs ---
  const [extractedChapters, setExtractedChapters] = useState<ExtractedChapter[]>([])
  const [isExtractingQuestions, setIsExtractingQuestions] = useState(false)
  const [questionExtractProgress, setQuestionExtractProgress] = useState("")

  const pairsWithText = pairs.filter((p) => p.rawText)

  async function handleSplitAndExtractQuestions() {
    if (pairsWithText.length === 0) return
    setIsExtractingQuestions(true)
    setExtractedChapters([])
    try {
      const results: ExtractedChapter[] = []
      for (const pair of pairsWithText) {
        const subject = subjects?.find((s: any) => s.id === pair.subjectId)
        const subjectName = subject?.name || pair.subjectId
        const chapters = splitIntoChapters(pair.rawText)
        for (let i = 0; i < chapters.length; i++) {
          const ch = chapters[i]
          setQuestionExtractProgress(`${subjectName}: ${ch.title} (${i + 1}/${chapters.length})...`)
          const result = await extractLongAnswerQuestions({ chapterTitle: ch.title, rawText: ch.text })
          results.push({
            key: `${pair.id}-${i}-${ch.title}`,
            subjectId: pair.subjectId,
            subjectName,
            title: ch.title,
            longEssays: result.longEssays,
            shortEssays: result.shortEssays,
            shortAnswers: result.shortAnswers,
            selected: true,
          })
        }
      }
      setExtractedChapters(results)
      const totalQ = results.reduce((sum, c) => sum + c.longEssays.length + c.shortEssays.length + c.shortAnswers.length, 0)
      toast({ title: "Questions Extracted", description: `${results.length} chapter(s) across ${pairsWithText.length} subject(s), ${totalQ} question(s) total.` })
    } catch (e: any) {
      toast({ variant: "destructive", title: "Extraction Failed", description: e.message })
    } finally {
      setIsExtractingQuestions(false)
      setQuestionExtractProgress("")
    }
  }

  function toggleChapterSelected(key: string) {
    setExtractedChapters((prev) => prev.map((c) => c.key === key ? { ...c, selected: !c.selected } : c))
  }
  function toggleSelectAllChapters() {
    setExtractedChapters((prev) => {
      const allSelected = prev.every((c) => c.selected)
      return prev.map((c) => ({ ...c, selected: !allSelected }))
    })
  }

  const selectedChapters = extractedChapters.filter((c) => c.selected)
  const totalSelectedQuestions = selectedChapters.reduce((sum, c) => sum + c.longEssays.length + c.shortEssays.length + c.shortAnswers.length, 0)

  const chaptersBySubject = useMemo(() => {
    const groups: Record<string, { subjectName: string; chapters: ExtractedChapter[] }> = {}
    extractedChapters.forEach((c) => {
      if (!groups[c.subjectId]) groups[c.subjectId] = { subjectName: c.subjectName, chapters: [] }
      groups[c.subjectId].chapters.push(c)
    })
    return Object.values(groups)
  }, [extractedChapters])

  // --- Step 3: settings + run ---
  const [pauseSeconds, setPauseSeconds] = useState(60)
  const [questionPauseSeconds, setQuestionPauseSeconds] = useState(3)
  const [isStarting, setIsStarting] = useState(false)

  const isPausedRef = useRef(false)
  const isRunningLocallyRef = useRef(false)
  const [currentLabel, setCurrentLabel] = useState("")

  async function updateJob(fields: any) {
    if (!db) return
    await updateDoc(doc(db, 'bulkLongAnswerJobs', JOB_ID), fields)
  }

  async function handleStart() {
    if (!db || selectedChapters.length === 0) return
    setIsStarting(true)
    try {
      const queue: QueueItem[] = []
      for (const ch of selectedChapters) {
        ch.longEssays.forEach((q) => queue.push({ subjectId: ch.subjectId, chapterTitle: ch.title, sectionType: "long-essays", questionType: "long_answer", question: q }))
        ch.shortEssays.forEach((q) => queue.push({ subjectId: ch.subjectId, chapterTitle: ch.title, sectionType: "short-essays", questionType: "short_essay", question: q }))
        ch.shortAnswers.forEach((q) => queue.push({ subjectId: ch.subjectId, chapterTitle: ch.title, sectionType: "short-answers", questionType: "short_answer", question: q }))
      }

      if (queue.length === 0) {
        toast({ variant: "destructive", title: "No questions to process" })
        setIsStarting(false)
        return
      }

      await setDoc(doc(db, 'bulkLongAnswerJobs', JOB_ID), {
        status: "running",
        queue,
        pauseSeconds,
        questionPauseSeconds,
        currentIndex: 0,
        completedCount: 0,
        failedQuestions: [],
        providerCounts: {},
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })

      toast({ title: "Job Started", description: `${queue.length} question(s) across ${new Set(queue.map(q => q.subjectId)).size} subject(s) queued.` })
      isPausedRef.current = false
      runLoop(queue, 0, pauseSeconds, questionPauseSeconds)
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
    runLoop(job.queue, job.currentIndex, job.pauseSeconds, job.questionPauseSeconds || 3)
  }
  function handlePause() {
    isPausedRef.current = true
    toast({ title: "Pausing...", description: "Will stop after the current question finishes." })
  }
  async function handleReset() {
    if (!confirm("Reset the job? This clears progress tracking (already-saved answers are NOT deleted).")) return
    isPausedRef.current = true
    await updateJob({ status: "idle", queue: [], currentIndex: 0, completedCount: 0, failedQuestions: [], providerCounts: {} })
  }

  function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  async function runLoop(queue: QueueItem[], startIndex: number, pauseSecs: number, qPauseSecs: number) {
    if (isRunningLocallyRef.current) return
    isRunningLocallyRef.current = true

    for (let i = startIndex; i < queue.length; i++) {
      if (isPausedRef.current) {
        await updateJob({ status: "paused", currentIndex: i, updatedAt: serverTimestamp() })
        isRunningLocallyRef.current = false
        return
      }

      const item = queue[i]
      const subject = subjects?.find((s: any) => s.id === item.subjectId)
      const subjectName = subject?.name || item.subjectId
      setCurrentLabel(`${subjectName} — ${item.chapterTitle} — ${item.question.slice(0, 50)}${item.question.length > 50 ? "..." : ""}`)

      try {
        const result = await generateProfPyqAnswerWithProvider({
          subject: subjectName,
          chapter: item.chapterTitle,
          type: item.questionType,
          question: item.question,
        })

        if (!result.answer) {
          throw new Error(result.error || "No answer generated")
        }

        const chapterIdVal = chapterIdFor(item.chapterTitle)
        const chapterRef = doc(db!, 'subjects', item.subjectId, 'essayChapters', chapterIdVal)
        const sectionRef = doc(db!, 'subjects', item.subjectId, 'essayChapters', chapterIdVal, 'sections', item.sectionType)

        const existingSnap = await getDoc(sectionRef)
        const existingItems = existingSnap.exists() && (existingSnap.data() as any).html
          ? parseQaItems((existingSnap.data() as any).html)
          : []
        const newItem: QAItem = { questionHtml: item.question, answerHtml: answerTextToHtml(result.answer) }
        const combinedItems = [...existingItems, newItem]
        const finalHtml = rebuildHtml(combinedItems)

        await setDoc(chapterRef, { title: item.chapterTitle, subjectId: item.subjectId, updatedAt: serverTimestamp() }, { merge: true })
        await setDoc(sectionRef, {
          sectionType: item.sectionType,
          html: finalHtml,
          questionCount: combinedItems.length,
          updatedAt: serverTimestamp(),
        }, { merge: true })
        await updateDoc(chapterRef, { [`sectionCounts.${item.sectionType}`]: combinedItems.length })

        await updateJob({
          currentIndex: i + 1,
          completedCount: increment(1),
          [`providerCounts.${result.provider || "unknown"}`]: increment(1),
          updatedAt: serverTimestamp(),
        })
      } catch (e: any) {
        await updateJob({
          currentIndex: i + 1,
          failedQuestions: arrayUnion({ chapterTitle: item.chapterTitle, question: item.question.slice(0, 100), error: e.message || "Unknown error" }),
          updatedAt: serverTimestamp(),
        })
      }

      if (i < queue.length - 1 && !isPausedRef.current) {
        const nextItem = queue[i + 1]
        const movingToNewChapter = nextItem.chapterTitle !== item.chapterTitle || nextItem.subjectId !== item.subjectId
        await sleep((movingToNewChapter ? pauseSecs : qPauseSecs) * 1000)
      }
    }

    await updateJob({ status: "done", updatedAt: serverTimestamp() })
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
  const progressPct = hasJob ? Math.round(((job.currentIndex || 0) / job.queue.length) * 100) : 0

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-12 space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-3">
        <Link href="/admin"><Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button></Link>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" /> Long Answers Bulk Automation
          </h1>
          <p className="text-sm text-muted-foreground">Add up to {MAX_PAIRS} subject + question-bank PDF pairs, review everything together, then generate model answers automatically.</p>
        </div>
      </div>

      {!hasJob || job.status === "idle" ? (
        <>
          <Card className="glass border-none">
            <CardHeader><CardTitle className="text-base">1. Subjects & PDFs</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {pairs.map((pair, idx) => (
                <div key={pair.id} className="p-3 rounded-xl glass border border-white/10 space-y-2">
                  <div className="flex items-center gap-2">
                    <Select value={pair.subjectId} onValueChange={(v) => updatePair(pair.id, { subjectId: v })}>
                      <SelectTrigger className="glass border-white/10 flex-1"><SelectValue placeholder="Select Subject" /></SelectTrigger>
                      <SelectContent className="glass border-white/10">
                        {subjects?.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    {pairs.length > 1 && (
                      <button onClick={() => removePair(pair.id)} className="text-muted-foreground hover:text-destructive p-2" title="Remove">
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={(e) => updatePair(pair.id, { pdfFile: e.target.files?.[0] || null })}
                    className="text-sm w-full"
                  />
                  {pair.isExtracting && <p className="text-xs text-primary flex items-center gap-1.5"><Loader2 className="h-3 w-3 animate-spin" /> {pair.stage}</p>}
                  {pair.rawText && !pair.isExtracting && <p className="text-xs text-green-400">Text extracted ({pair.rawText.length.toLocaleString()} characters)</p>}
                  {pair.error && <p className="text-xs text-destructive">{pair.error}</p>}
                </div>
              ))}

              <div className="flex gap-2 flex-wrap">
                <Button onClick={addPair} disabled={pairs.length >= MAX_PAIRS} variant="outline" size="sm" className="gap-2">
                  <Plus className="h-4 w-4" /> Add Subject + PDF {pairs.length >= MAX_PAIRS ? `(max ${MAX_PAIRS})` : ""}
                </Button>
              </div>

              <Button onClick={handleExtractAll} disabled={isExtractingAll || readyPairs.length === 0} className="gap-2">
                {isExtractingAll ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {isExtractingAll ? "Extracting..." : `Extract Text From ${readyPairs.length} PDF(s)`}
              </Button>
            </CardContent>
          </Card>

          {pairsWithText.length > 0 && (
            <Card className="glass border-none">
              <CardHeader><CardTitle className="text-base">2. Split Into Chapters & Extract Questions</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-muted-foreground">MCQs are automatically ignored - only Long Essays, Short Essays, and Short Answers are extracted.</p>
                <Button onClick={handleSplitAndExtractQuestions} disabled={isExtractingQuestions} variant="secondary" className="gap-2">
                  {isExtractingQuestions ? <Loader2 className="h-4 w-4 animate-spin" /> : <ListTree className="h-4 w-4" />}
                  {isExtractingQuestions ? (questionExtractProgress || "Extracting...") : `Split & Extract Questions From ${pairsWithText.length} PDF(s)`}
                </Button>
              </CardContent>
            </Card>
          )}

          {chaptersBySubject.length > 0 && (
            <Card className="glass border-none">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">3. Review Chapters & Questions</CardTitle>
                <Button onClick={toggleSelectAllChapters} variant="outline" size="sm">
                  {extractedChapters.every((c) => c.selected) ? "Deselect All" : "Select All"}
                </Button>
              </CardHeader>
              <CardContent className="space-y-4 max-h-[36rem] overflow-y-auto">
                {chaptersBySubject.map((group, gi) => (
                  <div key={gi} className="space-y-1.5">
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{group.subjectName}</p>
                    {group.chapters.map((c) => {
                      const total = c.longEssays.length + c.shortEssays.length + c.shortAnswers.length
                      return (
                        <label key={c.key} className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer ${c.selected ? "bg-primary/10 border-primary/40" : "glass border-white/10"}`}>
                          <input type="checkbox" checked={c.selected} onChange={() => toggleChapterSelected(c.key)} />
                          <span className="text-sm flex-1 truncate">{c.title}</span>
                          <span className="text-xs text-muted-foreground shrink-0">{total} question(s) — {c.longEssays.length}L / {c.shortEssays.length}SE / {c.shortAnswers.length}SA</span>
                        </label>
                      )
                    })}
                  </div>
                ))}
                <p className="text-xs text-primary font-medium pt-1">{selectedChapters.length} chapter(s) selected — {totalSelectedQuestions} question(s) total.</p>
              </CardContent>
            </Card>
          )}

          {totalSelectedQuestions > 0 && (
            <>
              <Card className="glass border-none">
                <CardHeader><CardTitle className="text-base">4. Settings</CardTitle></CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Pause between questions (seconds)</Label>
                    <Input type="number" min={1} max={60} value={questionPauseSeconds} onChange={(e) => setQuestionPauseSeconds(parseInt(e.target.value) || 3)} className="glass border-white/10" />
                  </div>
                  <div className="space-y-2">
                    <Label>Rest between chapters (seconds)</Label>
                    <Input type="number" min={5} max={600} value={pauseSeconds} onChange={(e) => setPauseSeconds(parseInt(e.target.value) || 60)} className="glass border-white/10" />
                  </div>
                </CardContent>
              </Card>

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
            <p className="text-xs text-muted-foreground text-center">{job.currentIndex || 0} / {job.queue.length} question(s) processed ({progressPct}%)</p>

            {job.status === "running" && currentLabel && (
              <p className="text-sm text-center flex items-center justify-center gap-2"><Loader2 className="h-3.5 w-3.5 animate-spin text-primary" /> {currentLabel}</p>
            )}

            <div className="p-3 rounded-xl glass border border-white/10 text-center">
              <p className="text-2xl font-bold text-primary">{job.completedCount || 0}</p>
              <p className="text-xs text-muted-foreground">Questions answered</p>
            </div>

            {job.providerCounts && Object.keys(job.providerCounts).length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-bold text-muted-foreground">Answers by provider (for quality spot-checking):</p>
                {Object.entries(job.providerCounts).map(([provider, count]: any) => (
                  <p key={provider} className="text-xs text-muted-foreground">• {provider}: {count}</p>
                ))}
              </div>
            )}

            {job.failedQuestions && job.failedQuestions.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-bold text-destructive flex items-center gap-1.5"><AlertTriangle className="h-3.5 w-3.5" /> {job.failedQuestions.length} question(s) failed</p>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {job.failedQuestions.map((f: any, i: number) => (
                    <p key={i} className="text-xs text-muted-foreground truncate">• {f.chapterTitle} — {f.question} — {f.error}</p>
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
              <p className="text-xs text-yellow-400 text-center">Job shows "running" but this tab isn't actively processing it — likely started from a different tab/session that closed. Pause and Resume to continue from here.</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
