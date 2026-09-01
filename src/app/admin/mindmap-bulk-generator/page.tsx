"use client"

import { useState, useMemo, useRef } from "react"
import { useUser, useDoc, useFirestore, useCollection } from "@/firebase"
import { doc, collection, query, orderBy, getDocs, setDoc, updateDoc, increment, serverTimestamp, arrayUnion } from "firebase/firestore"
import { extractMindmapBranches, generateMindmapBranchDetail, type MindmapNode } from "@/ai/flows/ai-mindmap-data-generator"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Lock, ArrowLeft, Network, Play, Pause, RotateCcw, AlertTriangle, ListTree } from "lucide-react"
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

type ExtractedChapter = ChapterMeta & {
  centralTopic: string
  branchNames: string[]
  selectedBranches: Record<string, boolean>
  isExtracting: boolean
  error: string
}

type QueueItem = {
  subjectId: string
  chapterTitle: string
  unitName?: string | null
  mindmapKey: string
  centralTopic: string
  branchName: string
}

export default function MindmapBulkGeneratorPage() {
  const { user, loading: authLoading } = useUser()
  const db = useFirestore()
  const { toast } = useToast()

  const profileRef = useMemo(() => (!db || !user) ? null : doc(db, 'users', user.uid), [db, user])
  const { data: profile, loading: profileLoading } = useDoc(profileRef)

  const textbooksQuery = useMemo(() => (!db) ? null : query(collection(db, 'textbooks'), orderBy('createdAt', 'desc')), [db])
  const { data: textbooks, loading: textbooksLoading } = useCollection(textbooksQuery)

  const subjectsQuery = useMemo(() => (!db) ? null : query(collection(db, 'subjects'), orderBy('name', 'asc')), [db])
  const { data: subjects } = useCollection(subjectsQuery)

  const jobRef = useMemo(() => (!db) ? null : doc(db, 'bulkMindmapJobs', JOB_ID), [db])
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
    setExtractedChapters([])
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
      setExtractedChapters([])
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

  // --- Step 3: extract branch list per chapter (phase 1), for review ---
  const [extractedChapters, setExtractedChapters] = useState<ExtractedChapter[]>([])
  const [isExtracting, setIsExtracting] = useState(false)
  const [extractProgress, setExtractProgress] = useState("")

  async function handleExtractAll() {
    if (!db || selectedChapters.length === 0) return
    setIsExtracting(true)
    setExtractedChapters([])
    try {
      const results: ExtractedChapter[] = []
      for (let i = 0; i < selectedChapters.length; i++) {
        const ch = selectedChapters[i]
        setExtractProgress(`Planning: ${ch.chapterTitle} (${i + 1}/${selectedChapters.length})...`)
        const chapterData = (chaptersByTextbook[ch.textbookId] || []).find((c: any) => c.chapterId === ch.chapterId)
        const sources = [{ textbookTitle: ch.textbookTitle, chapterTitle: ch.chapterTitle, text: chapterData?.text || "" }]

        const result = await extractMindmapBranches({ sources })
        if (result.error || !result.branchNames || !result.centralTopic) {
          results.push({ ...ch, centralTopic: ch.chapterTitle, branchNames: [], selectedBranches: {}, isExtracting: false, error: result.error || "Failed to plan branches" })
          continue
        }
        const selectedBranches: Record<string, boolean> = {}
        result.branchNames.forEach((b) => { selectedBranches[b] = true })
        results.push({ ...ch, centralTopic: result.centralTopic, branchNames: result.branchNames, selectedBranches, isExtracting: false, error: "" })
      }
      setExtractedChapters(results)
      const totalBranches = results.reduce((sum, c) => sum + c.branchNames.length, 0)
      toast({ title: "Planning Complete", description: `${results.length} chapter(s), ${totalBranches} branch(es) total.` })
    } catch (e: any) {
      toast({ variant: "destructive", title: "Extraction Failed", description: e.message })
    } finally {
      setIsExtracting(false)
      setExtractProgress("")
    }
  }

  function toggleBranch(chapterKey: string, branchName: string) {
    setExtractedChapters((prev) => prev.map((c) => {
      if (c.key !== chapterKey) return c
      const next = { ...c.selectedBranches }
      next[branchName] = !next[branchName]
      return { ...c, selectedBranches: next }
    }))
  }

  const totalSelectedBranches = extractedChapters.reduce(
    (sum, c) => sum + Object.values(c.selectedBranches).filter(Boolean).length, 0
  )

  // --- Step 4: settings + run ---
  const [pauseSeconds, setPauseSeconds] = useState(60)
  const [branchPauseSeconds, setBranchPauseSeconds] = useState(3)
  const [isStarting, setIsStarting] = useState(false)

  const isPausedRef = useRef(false)
  const isRunningLocallyRef = useRef(false)
  const [currentLabel, setCurrentLabel] = useState("")

  async function updateJob(fields: any) {
    if (!db) return
    await updateDoc(doc(db, 'bulkMindmapJobs', JOB_ID), fields)
  }

  async function handleStart() {
    if (!db || totalSelectedBranches === 0) return
    setIsStarting(true)
    try {
      const queue: QueueItem[] = []
      extractedChapters.forEach((ch) => {
        const branches = Object.entries(ch.selectedBranches).filter(([, v]) => v).map(([name]) => name)
        branches.forEach((branchName) => {
          queue.push({
            subjectId: ch.subjectId,
            chapterTitle: ch.chapterTitle,
            unitName: ch.unitName || null,
            mindmapKey: ch.key,
            centralTopic: ch.centralTopic,
            branchName,
          })
        })
      })

      if (queue.length === 0) {
        toast({ variant: "destructive", title: "No branches to process" })
        setIsStarting(false)
        return
      }

      await setDoc(doc(db, 'bulkMindmapJobs', JOB_ID), {
        status: "running",
        queue,
        pauseSeconds,
        branchPauseSeconds,
        currentIndex: 0,
        completedCount: 0,
        failedBranches: [],
        collectedBranches: {},
        providerCounts: {},
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })

      toast({ title: "Job Started", description: `${queue.length} branch(es) across ${extractedChapters.length} chapter(s) queued.` })
      isPausedRef.current = false
      runLoop(queue, 0, pauseSeconds, branchPauseSeconds, {})
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
    runLoop(job.queue, job.currentIndex, job.pauseSeconds, job.branchPauseSeconds || 3, job.collectedBranches || {})
  }
  function handlePause() {
    isPausedRef.current = true
    toast({ title: "Pausing...", description: "Will stop after the current branch finishes." })
  }
  async function handleReset() {
    if (!confirm("Reset the job? This clears progress tracking (already-saved mind maps are NOT deleted).")) return
    isPausedRef.current = true
    await updateJob({ status: "idle", queue: [], currentIndex: 0, completedCount: 0, failedBranches: [], collectedBranches: {} })
  }

  function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  async function saveMindmap(subjectId: string, chapterTitle: string, unitName: string | null | undefined, centralTopic: string, branches: MindmapNode[]) {
    const mmId = chapterTitle.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") + "-" + Date.now()
    const subjectRef = doc(db!, 'subjects', subjectId)
    const mmRef = doc(db!, 'subjects', subjectId, 'mindmaps', mmId)
    await setDoc(subjectRef, { mindmapCount: increment(1) }, { merge: true })
    await setDoc(mmRef, {
      id: mmId,
      subjectId,
      unitName: unitName || null,
      order: Date.now(),
      title: chapterTitle,
      type: "radial",
      data: { centralTopic, branches },
      tier: "free",
      createdAt: serverTimestamp(),
    })
  }

  async function runLoop(queue: QueueItem[], startIndex: number, pauseSecs: number, branchPauseSecs: number, collectedSoFar: Record<string, MindmapNode[]>) {
    if (isRunningLocallyRef.current) return
    isRunningLocallyRef.current = true

    const collected: Record<string, MindmapNode[]> = { ...collectedSoFar }

    for (let i = startIndex; i < queue.length; i++) {
      if (isPausedRef.current) {
        await updateJob({ status: "paused", currentIndex: i, collectedBranches: collected, updatedAt: serverTimestamp() })
        isRunningLocallyRef.current = false
        return
      }

      const item = queue[i]
      setCurrentLabel(`${item.chapterTitle} — ${item.branchName}`)

      try {
        const chapterMeta = extractedChapters.find((c) => c.key === item.mindmapKey)
        const chapterData = chapterMeta ? (chaptersByTextbook[chapterMeta.textbookId] || []).find((c: any) => c.chapterId === chapterMeta.chapterId) : null
        const sources = [{ textbookTitle: chapterMeta?.textbookTitle || "", chapterTitle: item.chapterTitle, text: chapterData?.text || "" }]

        const result = await generateMindmapBranchDetail({ sources, centralTopic: item.centralTopic, branchName: item.branchName })
        if (result.error || !result.branch) {
          throw new Error(result.error || "No branch data returned")
        }

        if (!collected[item.mindmapKey]) collected[item.mindmapKey] = []
        collected[item.mindmapKey].push(result.branch)
        const providerUsed = result.provider || "unknown"

        const nextItem = queue[i + 1]
        const isLastForThisChapter = !nextItem || nextItem.mindmapKey !== item.mindmapKey
        if (isLastForThisChapter) {
          await saveMindmap(item.subjectId, item.chapterTitle, item.unitName, item.centralTopic, collected[item.mindmapKey])
          // This chapter is now permanently saved as its own mindmap doc - drop it from the
          // job-tracking doc so collectedBranches doesn't grow past Firestore's 1MB doc limit.
          delete collected[item.mindmapKey]
        }

        await updateJob({
          currentIndex: i + 1,
          completedCount: increment(1),
          collectedBranches: collected,
          [`providerCounts.${providerUsed}`]: increment(1),
          updatedAt: serverTimestamp(),
        })
      } catch (e: any) {
        await updateJob({
          currentIndex: i + 1,
          failedBranches: arrayUnion({ chapterTitle: item.chapterTitle, branchName: item.branchName, error: e.message || "Unknown error" }),
          updatedAt: serverTimestamp(),
        })
      }

      if (i < queue.length - 1 && !isPausedRef.current) {
        const nextItem = queue[i + 1]
        const movingToNewChapter = nextItem.mindmapKey !== item.mindmapKey
        await sleep((movingToNewChapter ? pauseSecs : branchPauseSecs) * 1000)
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
            <Network className="h-6 w-6 text-primary" /> Mind Map Bulk Automation
          </h1>
          <p className="text-sm text-muted-foreground">Select chapters across textbooks, review each chapter's planned branches, then generate automatically with a rest period between chapters.</p>
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
                    {isExtracting ? (extractProgress || "Planning...") : `Plan Branches For ${selectedChapters.length} Chapter(s)`}
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {extractedChapters.length > 0 && (
            <Card className="glass border-none">
              <CardHeader><CardTitle className="text-base">3. Review Planned Branches</CardTitle></CardHeader>
              <CardContent className="space-y-4 max-h-[32rem] overflow-y-auto">
                {extractedChapters.map((ch) => (
                  <div key={ch.key} className="space-y-1.5">
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{ch.chapterTitle} <span className="normal-case font-normal">({ch.textbookTitle})</span></p>
                    {ch.error && <p className="text-xs text-destructive flex items-center gap-1.5"><AlertTriangle className="h-3.5 w-3.5" /> {ch.error}</p>}
                    {ch.branchNames.map((b) => (
                      <label key={b} className={`flex items-center gap-3 p-2 rounded-lg border cursor-pointer ${ch.selectedBranches[b] ? "bg-primary/10 border-primary/40" : "glass border-white/10"}`}>
                        <input type="checkbox" checked={!!ch.selectedBranches[b]} onChange={() => toggleBranch(ch.key, b)} />
                        <span className="text-sm">{b}</span>
                      </label>
                    ))}
                  </div>
                ))}
                <p className="text-xs text-primary font-medium pt-1">{totalSelectedBranches} branch(es) selected across {extractedChapters.length} chapter(s).</p>
              </CardContent>
            </Card>
          )}

          {totalSelectedBranches > 0 && (
            <>
              <Card className="glass border-none">
                <CardHeader><CardTitle className="text-base">4. Settings</CardTitle></CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Pause between branches (seconds)</Label>
                    <Input type="number" min={1} max={60} value={branchPauseSeconds} onChange={(e) => setBranchPauseSeconds(parseInt(e.target.value) || 3)} className="glass border-white/10" />
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
            <p className="text-xs text-muted-foreground text-center">{job.currentIndex || 0} / {job.queue.length} branch(es) processed ({progressPct}%)</p>

            {job.status === "running" && currentLabel && (
              <p className="text-sm text-center flex items-center justify-center gap-2"><Loader2 className="h-3.5 w-3.5 animate-spin text-primary" /> {currentLabel}</p>
            )}

            <div className="p-3 rounded-xl glass border border-white/10 text-center">
              <p className="text-2xl font-bold text-primary">{job.completedCount || 0}</p>
              <p className="text-xs text-muted-foreground">Branches generated</p>
            </div>

            {job.providerCounts && Object.keys(job.providerCounts).length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-bold text-muted-foreground">Branches by provider (for quality spot-checking):</p>
                {Object.entries(job.providerCounts).map(([provider, count]: any) => (
                  <p key={provider} className="text-xs text-muted-foreground">• {provider}: {count}</p>
                ))}
              </div>
            )}

            {job.failedBranches && job.failedBranches.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-bold text-destructive flex items-center gap-1.5"><AlertTriangle className="h-3.5 w-3.5" /> {job.failedBranches.length} branch(es) failed</p>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {job.failedBranches.map((f: any, i: number) => (
                    <p key={i} className="text-xs text-muted-foreground break-words">• {f.chapterTitle} — {f.branchName} — {f.error}</p>
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
