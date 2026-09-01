"use client"

import { useState, useMemo, useEffect } from "react"
import { useUser, useDoc, useFirestore, useCollection, useStorage } from "@/firebase"
import { doc, collection, query, orderBy, getDocs, setDoc, increment, serverTimestamp } from "firebase/firestore"
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage"
import { planNotesPages, generatePageContent, generateVerifiedNoteImage, type PagePlanItem } from "@/ai/flows/ai-notes-image-generator"
import { type MindmapNode } from "@/ai/flows/ai-mindmap-data-generator"
import { extractLongAnswerQuestions } from "@/ai/flows/ai-longanswers-question-extractor"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2, Lock, ArrowLeft, BookOpenText, Sparkles, Save, AlertTriangle, CheckCircle2, Upload } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

// Flattens a mindmap-style knowledge tree (from the mindmap pipeline's extractedKnowledge)
// into plain readable text, so already-extracted chapter knowledge can feed the notes
// planner directly instead of re-deriving everything from raw textbook text.
function flattenKnowledgeTree(nodes: MindmapNode[], depth = 0): string {
  return nodes.map((n) => {
    const indent = "  ".repeat(depth)
    const bits = [n.name]
    if (n.definition) bits.push(n.definition)
    if (n.mechanism) bits.push(n.mechanism)
    if (n.examples) bits.push(n.examples)
    const line = `${indent}- ${bits.join(": ")}`
    const children = n.branches && n.branches.length > 0 ? "\n" + flattenKnowledgeTree(n.branches, depth + 1) : ""
    return line + children
  }).join("\n")
}

// Splits a raw PYQ PDF text dump into per-chapter chunks (same heuristic used by the
// mindmap generator's PYQ upload) so we can find the chunk matching the selected chapter.
function splitIntoChapters(rawText: string) {
  const pattern = /Chapter\s+\d+[:.]?\s*/gi
  const matches = [...rawText.matchAll(pattern)]
  if (matches.length === 0) {
    return [{ title: "Untitled Chapter", text: rawText }]
  }
  const chapters = []
  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].index
    const end = i < matches.length - 1 ? matches[i + 1].index : rawText.length
    const chunk = rawText.slice(start, end)
    const stopWords = /^(Long Essay|Short Essay|Short Answer|MCQ|\(No questions)/i
    const chunkLines = chunk.split("\n")
    let titleLines = []
    for (let li = 0; li < chunkLines.length && li < 3; li++) {
      const line = chunkLines[li].trim()
      if (li > 0 && stopWords.test(line)) break
      if (line) titleLines.push(line)
    }
    const title = titleLines.join(" ") || `Chapter ${i + 1}`
    chapters.push({ title, text: chunk })
  }
  return chapters
}

function fuzzyMatchChapter(query: string, chapters: { title: string; __idx: number }[]) {
  const q = query.toLowerCase().trim()
  if (!q) return null
  let best: { title: string; __idx: number } | null = null
  let bestScore = 0
  for (const ch of chapters) {
    const title = (ch.title || "").toLowerCase()
    let score = 0
    if (title.includes(q)) score += 10
    const qWords = q.split(/\s+/).filter(Boolean)
    for (const w of qWords) if (w.length > 2 && title.includes(w)) score += 1
    if (score > bestScore) { bestScore = score; best = ch }
  }
  return bestScore > 0 ? best : null
}

export default function NotesImageGeneratorPage() {
  const { user, loading: authLoading } = useUser()
  const db = useFirestore()
  const storage = useStorage()
  const { toast } = useToast()

  const profileRef = useMemo(() => (!db || !user) ? null : doc(db, 'users', user.uid), [db, user])
  const { data: profile, loading: profileLoading } = useDoc(profileRef)

  const textbooksQuery = useMemo(() => (!db) ? null : query(collection(db, 'textbooks'), orderBy('createdAt', 'desc')), [db])
  const { data: textbooks } = useCollection(textbooksQuery)
  const readyTextbooks = textbooks?.filter((tb: any) => tb.status === "ready") || []

  const subjectsQuery = useMemo(() => (!db) ? null : query(collection(db, 'subjects'), orderBy('name', 'asc')), [db])
  const { data: subjects } = useCollection(subjectsQuery)

  // --- Step 1: pick textbook + subject + chapter ---
  const [textbookId, setTextbookId] = useState("")
  const [subjectId, setSubjectId] = useState("")
  const [chapters, setChapters] = useState<any[]>([])
  const [chapterId, setChapterId] = useState("")
  const [isLoadingChapters, setIsLoadingChapters] = useState(false)

  async function handleLoadChapters(tbId: string) {
    if (!db || !tbId) return
    setTextbookId(tbId)
    setChapterId("")
    setChapters([])
    setPlan([])
    setGeneratedPages([])
    setUploadedPyqQuestions([])
    setIsLoadingChapters(true)
    try {
      const snap = await getDocs(collection(db, 'textbooks', tbId, 'chapters'))
      setChapters(snap.docs.map((d) => ({ chapterId: d.id, ...(d.data() as any) })))
    } catch (e: any) {
      toast({ variant: "destructive", title: "Failed to load chapters", description: e.message })
    } finally {
      setIsLoadingChapters(false)
    }
  }

  const selectedChapter = chapters.find((c) => c.chapterId === chapterId)

  // --- Step 2a: auto-pull QBank questions for this subject, filtered to this chapter's unit ---
  const [qbankQuestions, setQbankQuestions] = useState<string[]>([])
  useEffect(() => {
    if (!subjectId || !selectedChapter) { setQbankQuestions([]); return }
    let cancelled = false
    fetch(`/api/questions?subject_id=${encodeURIComponent(subjectId)}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled || !data?.data) return
        const unitName = (selectedChapter.unitName || "").toLowerCase().trim()
        const filtered = unitName
          ? data.data.filter((q: any) => (q.unit_title || "").toLowerCase().trim() === unitName)
          : data.data
        setQbankQuestions(filtered.slice(0, 60).map((q: any) => q.question_text).filter(Boolean))
      })
      .catch(() => setQbankQuestions([]))
    return () => { cancelled = true }
  }, [subjectId, selectedChapter])

  // --- Step 2b: optional - upload a PYQ PDF and extract this chapter's questions from it ---
  const [pyqFile, setPyqFile] = useState<File | null>(null)
  const [isExtractingPyq, setIsExtractingPyq] = useState(false)
  const [pyqStage, setPyqStage] = useState("")
  const [uploadedPyqQuestions, setUploadedPyqQuestions] = useState<string[]>([])

  async function handleExtractPyq() {
    if (!storage || !user || !pyqFile || !selectedChapter) {
      toast({ variant: "destructive", title: "Select a chapter and pick a PYQ PDF first" })
      return
    }
    setIsExtractingPyq(true)
    setUploadedPyqQuestions([])
    try {
      setPyqStage("Uploading PYQ PDF...")
      const safeId = "notes-pyq-" + Date.now()
      const storagePath = `long-answers-source/${safeId}.pdf`
      const fileRef = storageRef(storage, storagePath)
      await uploadBytes(fileRef, pyqFile)

      setPyqStage("Extracting text from PDF...")
      const idToken = await user.getIdToken()
      const res = await fetch("/api/long-answers/extract-pdf-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken, storagePath }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Extraction failed")

      setPyqStage("Matching chapter and extracting questions...")
      const pyqChapters = splitIntoChapters(data.text)
      const matched = fuzzyMatchChapter(selectedChapter.title, pyqChapters.map((c, i) => ({ title: c.title, __idx: i })))
      if (!matched) {
        toast({ variant: "destructive", title: "No matching chapter found in PYQ PDF" })
        return
      }
      const matchedChunk = pyqChapters[matched.__idx]
      const result = await extractLongAnswerQuestions({ chapterTitle: matchedChunk.title, rawText: matchedChunk.text })
      if (result.error) {
        toast({ variant: "destructive", title: "Extraction Failed", description: result.error })
        return
      }
      const flatQuestions = [...result.longEssays, ...result.shortEssays, ...result.shortAnswers]
      setUploadedPyqQuestions(flatQuestions)
      toast({ title: "PYQ Extracted", description: `${flatQuestions.length} question(s) found for this chapter.` })
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message })
    } finally {
      setIsExtractingPyq(false)
      setPyqStage("")
    }
  }

  // Combined depth signal used everywhere below: auto-pulled QBank + any manually uploaded PYQ.
  const combinedQuestions = useMemo(() => [...qbankQuestions, ...uploadedPyqQuestions], [qbankQuestions, uploadedPyqQuestions])

  // --- Step 3: plan pages (titles + scope only) ---
  const [plan, setPlan] = useState<PagePlanItem[]>([])
  const [selectedPages, setSelectedPages] = useState<Record<number, boolean>>({})
  const [isPlanning, setIsPlanning] = useState(false)
  const [sourceText, setSourceText] = useState("")

  async function handlePlan() {
    if (!selectedChapter) return
    setIsPlanning(true)
    setPlan([])
    setGeneratedPages([])
    try {
      const knowledgeText = selectedChapter.extractedKnowledge?.branches
        ? flattenKnowledgeTree(selectedChapter.extractedKnowledge.branches)
        : ""
      const resolvedSourceText = knowledgeText || selectedChapter.text || ""
      setSourceText(resolvedSourceText)

      const result = await planNotesPages({
        chapterTitle: selectedChapter.title,
        textbookText: resolvedSourceText,
        qbankQuestions: combinedQuestions.length > 0 ? combinedQuestions : undefined,
      })
      if (result.error || !result.pages) {
        toast({ variant: "destructive", title: "Planning Failed", description: result.error })
        return
      }
      setPlan(result.pages)
      setSelectedPages(Object.fromEntries(result.pages.map((_, i) => [i, true])))
      toast({ title: "Planned", description: `${result.pages.length} page(s) planned.` })
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message })
    } finally {
      setIsPlanning(false)
    }
  }

  // --- Step 4: for each selected page, write its content, then generate + verify + upload the image ---
  type GeneratedPage = { topicTitle: string; imageUrl: string; needsReview: boolean; matchScore: number }
  const [generatedPages, setGeneratedPages] = useState<GeneratedPage[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [currentLabel, setCurrentLabel] = useState("")

  async function handleGenerate() {
    if (!storage || !selectedChapter) return
    const pagesToRun = plan.filter((_, i) => selectedPages[i])
    if (pagesToRun.length === 0) return

    setIsGenerating(true)
    const results: GeneratedPage[] = []
    try {
      for (let i = 0; i < pagesToRun.length; i++) {
        const planItem = pagesToRun[i]
        setCurrentLabel(`Writing: ${planItem.topicTitle} (${i + 1}/${pagesToRun.length})`)

        const contentResult = await generatePageContent({
          chapterTitle: selectedChapter.title,
          textbookText: sourceText,
          qbankQuestions: combinedQuestions.length > 0 ? combinedQuestions : undefined,
          topicTitle: planItem.topicTitle,
          scope: planItem.scope,
          pageType: planItem.pageType,
        })
        if (contentResult.error || !contentResult.content) {
          toast({ variant: "destructive", title: `Failed writing "${planItem.topicTitle}"`, description: contentResult.error })
          continue
        }

        setCurrentLabel(`Generating image: ${planItem.topicTitle} (${i + 1}/${pagesToRun.length})`)
        const page = { topicTitle: planItem.topicTitle, content: contentResult.content, pageType: planItem.pageType }
        const result = await generateVerifiedNoteImage(page, selectedChapter.title)
        if ("error" in result) {
          toast({ variant: "destructive", title: `Failed on "${planItem.topicTitle}"`, description: result.error })
          continue
        }

        const ext = result.mimeType.includes("jpeg") ? "jpg" : "png"
        const path = `notes-images/${subjectId}/${chapterId}/${Date.now()}-${i}.${ext}`
        const fileRef = storageRef(storage, path)
        const buffer = Uint8Array.from(atob(result.base64), (c) => c.charCodeAt(0))
        await uploadBytes(fileRef, buffer, { contentType: result.mimeType })
        const imageUrl = await getDownloadURL(fileRef)

        results.push({ topicTitle: planItem.topicTitle, imageUrl, needsReview: result.needsReview, matchScore: result.matchScore })
        setGeneratedPages([...results])

        // Small pause between pages so we don't immediately re-trip the image model's
        // per-minute quota right after finishing one.
        if (i < pagesToRun.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 5000))
        }
      }
      toast({ title: "Generation Complete", description: `${results.length}/${pagesToRun.length} page(s) generated.` })
    } finally {
      setIsGenerating(false)
      setCurrentLabel("")
    }
  }

  // --- Step 5: save chapter to Firestore ---
  const [isSaving, setIsSaving] = useState(false)

  async function handleSaveChapter() {
    if (!db || !subjectId || !selectedChapter || generatedPages.length === 0) return
    setIsSaving(true)
    try {
      const chapterDocId = chapterId
      const subjectRef = doc(db, 'subjects', subjectId)
      const noteChapterRef = doc(db, 'subjects', subjectId, 'noteChapters', chapterDocId)
      await setDoc(subjectRef, { noteChapterCount: increment(1) }, { merge: true })
      await setDoc(noteChapterRef, {
        id: chapterDocId,
        subjectId,
        chapterTitle: selectedChapter.title,
        unitName: selectedChapter.unitName || null,
        order: Date.now(),
        pages: generatedPages.map((p, i) => ({ id: `page-${i}`, topicTitle: p.topicTitle, imageUrl: p.imageUrl, order: i, needsReview: p.needsReview, matchScore: p.matchScore })),
        updatedAt: serverTimestamp(),
      }, { merge: true })
      toast({ title: "Chapter Saved" })
    } catch (e: any) {
      toast({ variant: "destructive", title: "Save Failed", description: e.message })
    } finally {
      setIsSaving(false)
    }
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

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
      <Link href="/admin" className="text-sm text-muted-foreground flex items-center gap-1 hover:text-foreground w-fit"><ArrowLeft className="h-4 w-4" /> Back to Admin</Link>
      <h1 className="text-2xl font-bold flex items-center gap-2"><BookOpenText className="h-6 w-6 text-primary" /> Notes Image Generator</h1>

      <Card>
        <CardHeader><CardTitle className="text-base">1. Select Chapter</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Textbook</Label>
              <Select value={textbookId} onValueChange={handleLoadChapters}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select textbook" /></SelectTrigger>
                <SelectContent>
                  {readyTextbooks.map((tb: any) => <SelectItem key={tb.id} value={tb.id}>{tb.title}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Subject</Label>
              <Select value={subjectId} onValueChange={setSubjectId}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select subject" /></SelectTrigger>
                <SelectContent>
                  {subjects?.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {isLoadingChapters ? (
            <div className="flex justify-center py-4"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : chapters.length > 0 ? (
            <div>
              <Label>Chapter</Label>
              <Select value={chapterId} onValueChange={(v) => { setChapterId(v); setPlan([]); setGeneratedPages([]); setUploadedPyqQuestions([]) }}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select chapter" /></SelectTrigger>
                <SelectContent>
                  {chapters.map((c) => <SelectItem key={c.chapterId} value={c.chapterId}>{c.title}{c.extractedKnowledge ? " (has extracted knowledge)" : ""}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          ) : null}

          {selectedChapter && (
            <>
              <p className="text-xs text-muted-foreground">
                {qbankQuestions.length > 0 ? `${qbankQuestions.length} QBank question(s) auto-found for this chapter's unit.` : "No matching QBank questions found for this chapter's unit."}
                {uploadedPyqQuestions.length > 0 ? ` +${uploadedPyqQuestions.length} from uploaded PYQ PDF.` : ""}
              </p>

              <div className="p-3 rounded-lg border border-white/10 space-y-2">
                <Label className="text-xs">Optional: Upload PYQ PDF (extracts this chapter's real exam questions to sharpen topic depth)</Label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input type="file" accept="application/pdf" onChange={(e) => setPyqFile(e.target.files?.[0] || null)} className="text-xs" />
                  <Button onClick={handleExtractPyq} disabled={!pyqFile || isExtractingPyq} variant="outline" className="gap-2 shrink-0">
                    {isExtractingPyq ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    {isExtractingPyq ? pyqStage || "Extracting..." : "Extract PYQ"}
                  </Button>
                </div>
              </div>
            </>
          )}

          <Button onClick={handlePlan} disabled={!selectedChapter || isPlanning} className="gap-2">
            {isPlanning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {isPlanning ? "Planning..." : "Plan Pages"}
          </Button>
        </CardContent>
      </Card>

      {plan.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">2. Review Planned Pages ({plan.length})</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {plan.map((page, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg border border-white/10">
                <Checkbox checked={!!selectedPages[i]} onCheckedChange={(v) => setSelectedPages((prev) => ({ ...prev, [i]: !!v }))} className="mt-1" />
                <div className="min-w-0">
                  <p className="font-semibold text-sm flex items-center gap-1.5">
                    {page.topicTitle}
                    {page.pageType === "diagram" && <span className="text-[10px] px-1.5 py-0.5 rounded bg-fuchsia-500/20 text-fuchsia-400 font-medium">diagram</span>}
                  </p>
                  <p className="text-xs text-muted-foreground">{page.scope}</p>
                </div>
              </div>
            ))}
            <Button onClick={handleGenerate} disabled={isGenerating} className="gap-2">
              {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {isGenerating ? currentLabel : "Generate Selected Pages"}
            </Button>
          </CardContent>
        </Card>
      )}

      {generatedPages.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">3. Generated Pages ({generatedPages.length})</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              {generatedPages.map((p, i) => (
                <div key={i} className="rounded-lg border border-white/10 overflow-hidden">
                  <img src={p.imageUrl} alt={p.topicTitle} className="w-full h-auto" />
                  <div className="p-2 flex items-center justify-between">
                    <p className="text-xs font-medium truncate">{p.topicTitle}</p>
                    {p.needsReview ? (
                      <span className="flex items-center gap-1 text-xs text-amber-500"><AlertTriangle className="h-3.5 w-3.5" /> Review ({Math.round(p.matchScore * 100)}%)</span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-green-500"><CheckCircle2 className="h-3.5 w-3.5" /> {Math.round(p.matchScore * 100)}%</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <Button onClick={handleSaveChapter} disabled={isSaving} className="gap-2">
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {isSaving ? "Saving..." : "Save Chapter"}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
