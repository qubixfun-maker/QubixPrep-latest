"use client"

import { useState, useMemo, useRef } from "react"
import { useUser, useDoc, useFirestore, useCollection } from "@/firebase"
import { doc, collection, query, orderBy, getDoc, getDocs, setDoc, updateDoc, serverTimestamp, increment, arrayUnion } from "firebase/firestore"
import { generateFlashcards } from "@/ai/flows/ai-flashcard-generator"
import { extractChapterTopics } from "@/ai/flows/ai-chapter-topic-extractor"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Lock, ArrowLeft, Layers, Play, Pause, RotateCcw, AlertTriangle, ListTree } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

const JOB_ID = "current"

function sanitizeIdPart(s: string) {
  return (s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
}
function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

type ChapterMeta = {
  key: string // textbookId__chapterId
  textbookId: string
  textbookTitle: string
  subjectId: string
  chapterId: string
  chapterTitle: string
  unitName?: string
}

type TopicItem = {
  key: string // chapterKey + '__' + topicIndex
  chapterKey: string
  textbookId: string
  textbookTitle: string
  subjectId: string
  chapterId: string
  chapterTitle: string
  unitName?: string
  topic: string | null // null = whole-chapter fallback batch
  selected: boolean
  cardCount: number
}

type QueueItem = {
  textbookId: string
  textbookTitle: string
  subjectId: string
  chapterId: string
  chapterTitle: string
  unitName?: string
  topic: string | null
  cardCount: number
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
    setTopicItems([])
  }
  function setSubjectForTextbook(textbookId: string, subjectId: string) {
    setSelectedPairs((prev) => ({ ...prev, [textbookId]: subjectId }))
  }
  const readyTextbooks = textbooks?.filter((tb: any) => tb.status === "ready") || []
  const selectedTextbookIds = Object.keys(selectedPairs)
  const allMapped = selectedTextbookIds.length > 0 && selectedTextbookIds.every((id) => selectedPairs[id])

  // --- Step 2: load + select chapters across selected textbooks ---
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
      setTopicItems([])
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

  // --- Step 3: extract topics across all selected chapters ---
  const [topicItems, setTopicItems] = useState<TopicItem[]>([])
  const [isExtracting, setIsExtracting] = useState(false)
  const [extractProgress, setExtractProgress] = useState("")

  async function handleExtractAll() {
    if (!db || selectedChapters.length === 0) return
    setIsExtracting(true)
    setTopicItems([])
    try {
      const allItems: TopicItem[] = []
      for (const ch of selectedChapters) {
        setExtractProgress(`Extracting topics: ${ch.chapterTitle}...`)
        const chapterDoc = await getDoc(doc(db, 'textbooks', ch.textbookId, 'chapters', ch.chapterId))
        const data = chapterDoc.data() as any
        const sources = [{ textbookTitle: ch.textbookTitle, chapterTitle: ch.chapterTitle, text: data?.text || "" }]
        const result = await extractChapterTopics({ sources })
        const topics = result.topics && result.topics.length > 0 ? result.topics : [null]
        topics.forEach((topic, idx) => {
          allItems.push({
            key: `${ch.key}__${idx}`,
            chapterKey: ch.key,
            textbookId: ch.textbookId,
            textbookTitle: ch.textbookTitle,
            subjectId: ch.subjectId,
            chapterId: ch.chapterId,
            chapterTitle: ch.chapterTitle,
            unitName: ch.unitName,
            topic,
            selected: true,
            cardCount: topic === null ? 16 : 4,
          })
        })
      }
      setTopicItems(allItems)
      toast({ title: "Topics Extracted", description: `${allItems.length} topic(s) across ${selectedChapters.length} chapter(s).` })
    } catch (e: any) {
      toast({ variant: "destructive", title: "Extraction Failed", description: e.message })
    } finally {
      setIsExtracting(false)
      setExtractProgress("")
    }
  }

  function toggleTopicItem(key: string) {
    setTopicItems((prev) => prev.map((t) => t.key === key ? { ...t, selected: !t.selected } : t))
  }
  function setTopicCardCount(key: string, count: number) {
    setTopicItems((prev) => prev.map((t) => t.key === key ? { ...t, cardCount: count } : t))
  }
  function toggleSelectAllTopics() {
    setTopicItems((prev) => {
      const allSelected = prev.every((t) => t.selected)
      return prev.map((t) => ({ ...t, selected: !allSelected }))
    })
  }

  const selectedTopicItems = topicItems.filter((t) => t.selected)
  const totalCardsEstimate = selectedTopicItems.reduce((sum, t) => sum + t.cardCount, 0)

  // group topicItems by chapterKey for display
  const topicsByChapter = useMemo(() => {
    const groups: Record<string, { chapterTitle: string; textbookTitle: string; items: TopicItem[] }> = {}
    topicItems.forEach((t) => {
      if (!groups[t.chapterKey]) groups[t.chapterKey] = { chapterTitle: t.chapterTitle, textbookTitle: t.textbookTitle, items: [] }
      groups[t.chapterKey].items.push(t)
    })
    return Object.values(groups)
  }, [topicItems])

  // --- Step 4: settings + start ---
  const [pauseSeconds, setPauseSeconds] = useState(60)
  const [isStarting, setIsStarting] = useState(false)

  const isPausedRef = useRef(false)
  const isRunningLocallyRef = useRef(false)
  const [currentLabel, setCurrentLabel] = useState("")

  async function updateJob(fields: any) {
    if (!db) return
    await updateDoc(doc(db, 'bulkFlashcardJobs', JOB_ID), fields)
  }

  async function handleStart() {
    if (!db || selectedTopicItems.length === 0) return
    setIsStarting(true)
    try {
      const queue: QueueItem[] = selectedTopicItems.map((t) => ({
        textbookId: t.textbookId,
        textbookTitle: t.textbookTitle,
        subjectId: t.subjectId,
        chapterId: t.chapterId,
        chapterTitle: t.chapterTitle,
        unitName: t.unitName || undefined,
        topic: t.topic,
        cardCount: t.cardCount,
      }))

      await setDoc(doc(db, 'bulkFlashcardJobs', JOB_ID), {
        status: "running",
        queue,
        pauseSeconds,
        currentIndex: 0,
        completedCount: 0,
        totalCardsSaved: 0,
        failedChapters: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })

      toast({ title: "Job Started", description: `${queue.length} topic(s) queued.` })
      isPausedRef.current = false
      runLoop(queue, 0, pauseSeconds)
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
    runLoop(job.queue, job.currentIndex, job.pauseSeconds)
  }
  function handlePause() {
    isPausedRef.current = true
    toast({ title: "Pausing...", description: "Will stop after the current topic finishes." })
  }
  async function handleReset() {
    if (!confirm("Reset the job? This clears progress tracking (already-saved decks are NOT deleted).")) return
    isPausedRef.current = true
    await updateJob({ status: "idle", queue: [], currentIndex: 0, completedCount: 0, totalCardsSaved: 0, failedChapters: [] })
  }

  async function runLoop(queue: QueueItem[], startIndex: number, pauseSecs: number) {
    if (isRunningLocallyRef.current) return
    isRunningLocallyRef.current = true

    for (let i = startIndex; i < queue.length; i++) {
      if (isPausedRef.current) {
        await updateJob({ status: "paused", currentIndex: i, updatedAt: serverTimestamp() })
        isRunningLocallyRef.current = false
        return
      }

      const item = queue[i]
      setCurrentLabel(`${item.textbookTitle} — ${item.chapterTitle}${item.topic ? " — " + item.topic : ""}`)

      try {
        const chapterDoc = await getDoc(doc(db!, 'textbooks', item.textbookId, 'chapters', item.chapterId))
        const chapterData = chapterDoc.data() as any
        const sources = [{ textbookTitle: item.textbookTitle, chapterTitle: item.chapterTitle, text: chapterData?.text || "" }]

        const result = await generateFlashcards({ sources, topicFocus: item.topic || "", cardCount: item.cardCount })
        let cardsSaved = 0
        if (result.cards && result.cards.length > 0) {
          const parts = [item.unitName, item.chapterTitle, item.topic].filter(Boolean).join(" ")
          const deckId = sanitizeIdPart(parts) + "-" + Date.now() + "-" + Math.floor(Math.random() * 1000)
          const cardsWithIds = result.cards.map((c: any, idx: number) => ({ id: `c${idx}`, front: c.front, back: c.back }))

          await setDoc(doc(db!, 'subjects', item.subjectId, 'flashcardDecks', deckId), {
            unitName: item.unitName || null,
            chapterName: item.chapterTitle,
            topicName: item.topic,
            title: item.topic || item.chapterTitle,
            cards: cardsWithIds,
            cardCount: cardsWithIds.length,
            createdAt: serverTimestamp(),
          })
          cardsSaved = cardsWithIds.length
        }

        await updateJob({
          currentIndex: i + 1,
          completedCount: increment(1),
          totalCardsSaved: increment(cardsSaved),
          updatedAt: serverTimestamp(),
        })
      } catch (e: any) {
        await updateJob({
          currentIndex: i + 1,
          failedChapters: arrayUnion({ chapterTitle: item.chapterTitle, topic: item.topic, textbookTitle: item.textbookTitle, error: e.message || "Unknown error" }),
          updatedAt: serverTimestamp(),
        })
      }

      const nextItem = queue[i + 1]
      const movingToNewChapter = !nextItem || nextItem.chapterId !== item.chapterId || nextItem.textbookId !== item.textbookId
      if (movingToNewChapter && i < queue.length - 1 && !isPausedRef.current) {
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
          <p className="text-sm text-muted-foreground">Pick chapters across multiple textbooks, review all their topics together, then run automation with a rest period between chapters.</p>
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
                  <Button onClick={handleExtractAll} disabled={isExtracting} className="w-full gap-2 mt-3">
                    {isExtracting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ListTree className="h-4 w-4" />}
                    {isExtracting ? (extractProgress || "Extracting...") : `Extract Topics From ${selectedChapters.length} Chapter(s)`}
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {topicsByChapter.length > 0 && (
            <Card className="glass border-none">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">3. Review Topics & Card Counts</CardTitle>
                <Button onClick={toggleSelectAllTopics} variant="outline" size="sm">
                  {topicItems.every((t) => t.selected) ? "Deselect All" : "Select All"}
                </Button>
              </CardHeader>
              <CardContent className="space-y-4 max-h-[32rem] overflow-y-auto">
                {topicsByChapter.map((group, gi) => (
                  <div key={gi} className="space-y-1.5">
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{group.chapterTitle} <span className="normal-case font-normal">({group.textbookTitle})</span></p>
                    {group.items.map((t) => (
                      <div key={t.key} className={`flex items-center gap-3 p-2.5 rounded-lg border ${t.selected ? "bg-primary/10 border-primary/40" : "glass border-white/10"}`}>
                        <input type="checkbox" checked={t.selected} onChange={() => toggleTopicItem(t.key)} />
                        <span className="text-sm flex-1 truncate">{t.topic || "(Whole chapter — no distinct topics found)"}</span>
                        {t.selected && (
                          <Input
                            type="number"
                            min={1}
                            max={50}
                            value={t.cardCount}
                            onChange={(e) => setTopicCardCount(t.key, parseInt(e.target.value) || 1)}
                            className="glass border-white/10 w-20 h-8 text-sm shrink-0"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                ))}
                <p className="text-xs text-primary font-medium pt-1">{selectedTopicItems.length} topic(s) selected — {totalCardsEstimate} cards total.</p>
              </CardContent>
            </Card>
          )}

          {selectedTopicItems.length > 0 && (
            <>
              <Card className="glass border-none">
                <CardHeader><CardTitle className="text-base">4. Settings</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-2 max-w-xs">
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
            <p className="text-xs text-muted-foreground text-center">{job.currentIndex || 0} / {job.queue.length} topic(s) processed ({progressPct}%)</p>

            {job.status === "running" && currentLabel && (
              <p className="text-sm text-center flex items-center justify-center gap-2"><Loader2 className="h-3.5 w-3.5 animate-spin text-primary" /> {currentLabel}</p>
            )}

            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="p-3 rounded-xl glass border border-white/10">
                <p className="text-2xl font-bold text-primary">{job.completedCount || 0}</p>
                <p className="text-xs text-muted-foreground">Topics done</p>
              </div>
              <div className="p-3 rounded-xl glass border border-white/10">
                <p className="text-2xl font-bold text-primary">{job.totalCardsSaved || 0}</p>
                <p className="text-xs text-muted-foreground">Cards saved</p>
              </div>
            </div>

            {job.failedChapters && job.failedChapters.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-bold text-destructive flex items-center gap-1.5"><AlertTriangle className="h-3.5 w-3.5" /> {job.failedChapters.length} item(s) failed</p>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {job.failedChapters.map((f: any, i: number) => (
                    <p key={i} className="text-xs text-muted-foreground truncate">• {f.chapterTitle}{f.topic ? " — " + f.topic : ""} — {f.error}</p>
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
