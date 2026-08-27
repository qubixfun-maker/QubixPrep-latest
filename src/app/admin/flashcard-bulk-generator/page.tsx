"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import { useUser, useDoc, useFirestore, useCollection } from "@/firebase"
import { doc, collection, query, orderBy, getDoc, getDocs, setDoc, updateDoc, serverTimestamp, increment, arrayUnion } from "firebase/firestore"
import { generateFlashcards } from "@/ai/flows/ai-flashcard-generator"
import { extractChapterTopics } from "@/ai/flows/ai-chapter-topic-extractor"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Lock, ArrowLeft, Layers, Play, Pause, RotateCcw, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

const JOB_ID = "current"

function sanitizeIdPart(s: string) {
  return (s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

type QueueItem = {
  textbookId: string
  textbookTitle: string
  subjectId: string
  chapterId: string
  chapterTitle: string
  unitName?: string
}

export default function FlashcardBulkGeneratorPage() {
  const { user, loading: authLoading } = useUser()
  const db = useFirestore()
  const { toast } = useToast()

  const profileRef = useMemo(() => (!db || !user) ? null : doc(db, 'users', user.uid), [db, user])
  const { data: profile, loading: profileLoading } = useDoc(profileRef)

  const textbooksQuery = useMemo(() => (!db) ? null : query(collection(db, 'textbooks'), orderBy('createdAt', 'desc')), [db])
  const { data: textbooks, loading: textbooksLoading } = useCollection(textbooksQuery)

  const subjectsQuery = useMemo(() => (!db) ? null : query(collection(db, 'subjects'), orderBy('name', 'asc')), [db])
  const { data: subjects } = useCollection(subjectsQuery)

  const jobRef = useMemo(() => (!db) ? null : doc(db, 'bulkFlashcardJobs', JOB_ID), [db])
  const { data: job, loading: jobLoading } = useDoc(jobRef)

  // --- Setup (only relevant before a job exists / when idle) ---
  const [selectedPairs, setSelectedPairs] = useState<Record<string, string>>({}) // textbookId -> subjectId
  const [cardsPerTopic, setCardsPerTopic] = useState(8)
  const [pauseSeconds, setPauseSeconds] = useState(60)
  const [isStarting, setIsStarting] = useState(false)

  function toggleTextbook(id: string) {
    setSelectedPairs((prev) => {
      const next = { ...prev }
      if (id in next) delete next[id]
      else next[id] = ""
      return next
    })
  }
  function setSubjectForTextbook(textbookId: string, subjectId: string) {
    setSelectedPairs((prev) => ({ ...prev, [textbookId]: subjectId }))
  }

  const readyTextbooks = textbooks?.filter((tb: any) => tb.status === "ready") || []
  const selectedIds = Object.keys(selectedPairs)
  const allMapped = selectedIds.length > 0 && selectedIds.every((id) => selectedPairs[id])

  // --- Running loop control ---
  const isPausedRef = useRef(false)
  const isRunningLocallyRef = useRef(false)
  const [currentLabel, setCurrentLabel] = useState("")

  async function updateJob(fields: any) {
    if (!db) return
    await updateDoc(doc(db, 'bulkFlashcardJobs', JOB_ID), fields)
  }

  async function handleStart() {
    if (!db || !allMapped) return
    setIsStarting(true)
    try {
      const queue: QueueItem[] = []
      for (const textbookId of selectedIds) {
        const subjectId = selectedPairs[textbookId]
        const tb = textbooks?.find((t: any) => t.id === textbookId)
        const chaptersSnap = await getDocs(collection(db, 'textbooks', textbookId, 'chapters'))
        const chapters = chaptersSnap.docs.map((d) => ({ chapterId: d.id, ...(d.data() as any) }))
        chapters.forEach((ch: any) => {
          queue.push({
            textbookId,
            textbookTitle: tb?.title || textbookId,
            subjectId,
            chapterId: ch.chapterId,
            chapterTitle: ch.title,
            unitName: ch.unitName || undefined,
          })
        })
      }

      if (queue.length === 0) {
        toast({ variant: "destructive", title: "No chapters found", description: "The selected textbooks have no ingested chapters." })
        setIsStarting(false)
        return
      }

      await setDoc(doc(db, 'bulkFlashcardJobs', JOB_ID), {
        status: "running",
        queue,
        cardsPerTopic,
        pauseSeconds,
        currentIndex: 0,
        completedCount: 0,
        totalCardsSaved: 0,
        failedChapters: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })

      toast({ title: "Job Started", description: `${queue.length} chapter(s) queued.` })
      isPausedRef.current = false
      runLoop(queue, 0, cardsPerTopic, pauseSeconds)
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
    runLoop(job.queue, job.currentIndex, job.cardsPerTopic, job.pauseSeconds)
  }

  function handlePause() {
    isPausedRef.current = true
    toast({ title: "Pausing...", description: "Will stop after the current chapter finishes." })
  }

  async function handleReset() {
    if (!confirm("Reset the job? This clears progress tracking (already-saved decks are NOT deleted).")) return
    isPausedRef.current = true
    await updateJob({ status: "idle", queue: [], currentIndex: 0, completedCount: 0, totalCardsSaved: 0, failedChapters: [] })
  }

  async function runLoop(queue: QueueItem[], startIndex: number, perTopic: number, pauseSecs: number) {
    if (isRunningLocallyRef.current) return
    isRunningLocallyRef.current = true

    for (let i = startIndex; i < queue.length; i++) {
      if (isPausedRef.current) {
        await updateJob({ status: "paused", currentIndex: i, updatedAt: serverTimestamp() })
        isRunningLocallyRef.current = false
        return
      }

      const item = queue[i]
      setCurrentLabel(`${item.textbookTitle} — ${item.chapterTitle}`)

      try {
        const chapterDoc = await getDoc(doc(db!, 'textbooks', item.textbookId, 'chapters', item.chapterId))
        const chapterData = chapterDoc.data() as any
        const sources = [{ textbookTitle: item.textbookTitle, chapterTitle: item.chapterTitle, text: chapterData?.text || "" }]

        const topicsResult = await extractChapterTopics({ sources })
        const topics = topicsResult.topics || []

        const decksToSave: { topicName: string | null; cards: any[] }[] = []

        if (topics.length > 0) {
          for (const topic of topics) {
            const result = await generateFlashcards({ sources, topicFocus: topic, cardCount: perTopic })
            if (result.cards && result.cards.length > 0) {
              decksToSave.push({ topicName: topic, cards: result.cards })
            }
          }
        } else {
          const result = await generateFlashcards({ sources, topicFocus: "", cardCount: perTopic * 2 })
          if (result.cards && result.cards.length > 0) {
            decksToSave.push({ topicName: null, cards: result.cards })
          }
        }

        let cardsSavedThisChapter = 0
        for (const deck of decksToSave) {
          const parts = [item.unitName, item.chapterTitle, deck.topicName].filter(Boolean).join(" ")
          const deckId = sanitizeIdPart(parts) + "-" + Date.now() + "-" + Math.floor(Math.random() * 1000)
          const cardsWithIds = deck.cards.map((c: any, idx: number) => ({ id: `c${idx}`, front: c.front, back: c.back }))

          await setDoc(doc(db!, 'subjects', item.subjectId, 'flashcardDecks', deckId), {
            unitName: item.unitName || null,
            chapterName: item.chapterTitle,
            topicName: deck.topicName,
            title: deck.topicName || item.chapterTitle,
            cards: cardsWithIds,
            cardCount: cardsWithIds.length,
            createdAt: serverTimestamp(),
          })
          cardsSavedThisChapter += cardsWithIds.length
        }

        await updateJob({
          currentIndex: i + 1,
          completedCount: increment(1),
          totalCardsSaved: increment(cardsSavedThisChapter),
          updatedAt: serverTimestamp(),
        })
      } catch (e: any) {
        await updateJob({
          currentIndex: i + 1,
          failedChapters: arrayUnion({ chapterTitle: item.chapterTitle, textbookTitle: item.textbookTitle, error: e.message || "Unknown error" }),
          updatedAt: serverTimestamp(),
        })
      }

      if (i < queue.length - 1 && !isPausedRef.current) {
        await sleep(pauseSecs * 1000)
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
            <Layers className="h-6 w-6 text-primary" /> Bulk Flashcard Automation
          </h1>
          <p className="text-sm text-muted-foreground">Runs while this tab stays open — processes one chapter at a time with a pause in between, and can be paused/resumed anytime.</p>
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
              {selectedIds.length > 0 && !allMapped && (
                <p className="text-xs text-destructive flex items-center gap-1.5"><AlertTriangle className="h-3.5 w-3.5" /> Every selected textbook needs a Subject mapped before starting.</p>
              )}
            </CardContent>
          </Card>

          <Card className="glass border-none">
            <CardHeader><CardTitle className="text-base">2. Settings</CardTitle></CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Cards per topic</Label>
                <Input type="number" min={1} max={30} value={cardsPerTopic} onChange={(e) => setCardsPerTopic(parseInt(e.target.value) || 8)} className="glass border-white/10" />
              </div>
              <div className="space-y-2">
                <Label>Pause between chapters (seconds)</Label>
                <Input type="number" min={5} max={600} value={pauseSeconds} onChange={(e) => setPauseSeconds(parseInt(e.target.value) || 60)} className="glass border-white/10" />
              </div>
            </CardContent>
          </Card>

          <Button onClick={handleStart} disabled={isStarting || !allMapped} className="w-full h-12 gap-2">
            {isStarting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            {isStarting ? "Building queue..." : "Start Automation"}
          </Button>
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
            <p className="text-xs text-muted-foreground text-center">{job.currentIndex || 0} / {job.queue.length} chapters processed ({progressPct}%)</p>

            {job.status === "running" && currentLabel && (
              <p className="text-sm text-center flex items-center justify-center gap-2"><Loader2 className="h-3.5 w-3.5 animate-spin text-primary" /> {currentLabel}</p>
            )}

            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="p-3 rounded-xl glass border border-white/10">
                <p className="text-2xl font-bold text-primary">{job.completedCount || 0}</p>
                <p className="text-xs text-muted-foreground">Chapters done</p>
              </div>
              <div className="p-3 rounded-xl glass border border-white/10">
                <p className="text-2xl font-bold text-primary">{job.totalCardsSaved || 0}</p>
                <p className="text-xs text-muted-foreground">Cards saved</p>
              </div>
            </div>

            {job.failedChapters && job.failedChapters.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-bold text-destructive flex items-center gap-1.5"><AlertTriangle className="h-3.5 w-3.5" /> {job.failedChapters.length} chapter(s) failed</p>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {job.failedChapters.map((f: any, i: number) => (
                    <p key={i} className="text-xs text-muted-foreground truncate">• {f.chapterTitle} — {f.error}</p>
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
