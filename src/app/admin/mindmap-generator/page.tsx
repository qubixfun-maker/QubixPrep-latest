"use client"

import { useState, useMemo } from "react"
import { useUser, useDoc, useFirestore, useCollection, useStorage } from "@/firebase"
import { doc, collection, query, orderBy, getDocs, setDoc, increment, serverTimestamp } from "firebase/firestore"
import { extractMindmapBranches, generateMindmapBranchDetail } from "@/ai/flows/ai-mindmap-data-generator"
import { extractLongAnswerQuestions } from "@/ai/flows/ai-longanswers-question-extractor"
import { ref as storageRef, uploadBytes } from "firebase/storage"
import MindMapCanvas, { type MindmapNode } from "@/components/mindmap/MindMapCanvas"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Lock, ArrowLeft, Network, Sparkles, Save, ListTree } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

function fuzzyMatchChapter(query: string, chapters: any[]) {
  const q = query.toLowerCase().trim()
  if (!q) return null
  let best: any = null
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

export default function MindmapGeneratorPage() {
  const { user, loading: authLoading } = useUser()
  const db = useFirestore()
  const storage = useStorage()
  const { toast } = useToast()

  const profileRef = useMemo(() => (!db || !user) ? null : doc(db, 'users', user.uid), [db, user])
  const { data: profile, loading: profileLoading } = useDoc(profileRef)

  const textbooksQuery = useMemo(() => (!db) ? null : query(collection(db, 'textbooks'), orderBy('createdAt', 'desc')), [db])
  const { data: textbooks, loading: textbooksLoading } = useCollection(textbooksQuery)

  const subjectsQuery = useMemo(() => (!db) ? null : query(collection(db, 'subjects'), orderBy('name', 'asc')), [db])
  const { data: subjects } = useCollection(subjectsQuery)

  // --- Chapter matching ---
  const [selectedTextbookIds, setSelectedTextbookIds] = useState<string[]>([])
  const [referenceChapterName, setReferenceChapterName] = useState("")
  const [isMatchingChapters, setIsMatchingChapters] = useState(false)
  const [matchedChapters, setMatchedChapters] = useState<Record<string, any>>({})
  const [chapterOptionsByTextbook, setChapterOptionsByTextbook] = useState<Record<string, any[]>>({})

  function toggleTextbookSelection(id: string) {
    setSelectedTextbookIds((prev) => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
    setMatchedChapters({})
  }

  async function handleMatchChapters() {
    if (!db || selectedTextbookIds.length === 0 || !referenceChapterName.trim()) return
    setIsMatchingChapters(true)
    try {
      const results: Record<string, any> = {}
      const optionsMap: Record<string, any[]> = {}
      for (const textbookId of selectedTextbookIds) {
        const chaptersSnap = await getDocs(collection(db, 'textbooks', textbookId, 'chapters'))
        const chapters = chaptersSnap.docs.map(d => ({ chapterId: d.id, ...d.data() }))
        optionsMap[textbookId] = chapters
        results[textbookId] = fuzzyMatchChapter(referenceChapterName, chapters)
      }
      setChapterOptionsByTextbook(optionsMap)
      setMatchedChapters(results)
      toast({ title: "Chapters Matched" })
    } catch (e: any) {
      toast({ variant: "destructive", title: "Matching Failed", description: e.message })
    } finally {
      setIsMatchingChapters(false)
    }
  }

  function overrideChapterMatch(textbookId: string, chapterId: string) {
    const options = chapterOptionsByTextbook[textbookId] || []
    const found = options.find(c => c.chapterId === chapterId)
    setMatchedChapters((prev) => ({ ...prev, [textbookId]: found || null }))
  }

  function buildMatchedSources() {
    return selectedTextbookIds.map(id => {
      const tb = textbooks?.find((t: any) => t.id === id)
      const ch = matchedChapters[id]
      return ch ? { textbookTitle: tb?.title || id, chapterTitle: ch.title, text: ch.text } : null
    }).filter(Boolean) as { textbookTitle: string; chapterTitle: string; text: string }[]
  }

  // --- Optional: PYQ / question bank PDF, used to prioritize depth/topics ---
  const [pyqFile, setPyqFile] = useState<File | null>(null)
  const [isExtractingPyq, setIsExtractingPyq] = useState(false)
  const [pyqStage, setPyqStage] = useState("")
  const [pyqQuestions, setPyqQuestions] = useState<string[]>([])

  async function handleExtractPyq() {
    if (!storage || !user || !pyqFile || !referenceChapterName.trim()) {
      toast({ variant: "destructive", title: "Match a chapter and pick a PYQ PDF first" })
      return
    }
    setIsExtractingPyq(true)
    setPyqQuestions([])
    try {
      setPyqStage("Uploading PYQ PDF...")
      const safeId = "mindmap-pyq-" + Date.now()
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
      const chapters = splitIntoChapters(data.text)
      const matched = fuzzyMatchChapter(referenceChapterName, chapters.map((c, i) => ({ title: c.title, __idx: i })))
      if (!matched) {
        toast({ variant: "destructive", title: "No matching chapter found in PYQ PDF" })
        setIsExtractingPyq(false)
        setPyqStage("")
        return
      }
      const matchedChunk = chapters[matched.__idx]
      const result = await extractLongAnswerQuestions({ chapterTitle: matchedChunk.title, rawText: matchedChunk.text })
      const flatQuestions = [...result.longEssays, ...result.shortEssays, ...result.shortAnswers]

      if (flatQuestions.length === 0) {
        toast({ variant: "destructive", title: "No questions found for this chapter in the PYQ PDF" })
      } else {
        setPyqQuestions(flatQuestions)
        toast({ title: "PYQs Extracted", description: `${flatQuestions.length} question(s) found for "${matchedChunk.title}".` })
      }
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message })
    } finally {
      setIsExtractingPyq(false)
      setPyqStage("")
    }
  }

  // --- Generation ---
  const [topicFocus, setTopicFocus] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState("")
  const [generatedData, setGeneratedData] = useState<{ centralTopic: string; branches: MindmapNode[] } | null>(null)

  async function handleGenerate() {
    const sources = buildMatchedSources()
    if (sources.length === 0) {
      toast({ variant: "destructive", title: "Match a chapter first" })
      return
    }
    setIsGenerating(true)
    setGeneratedData(null)
    try {
      setGenerationProgress("Planning chapter structure...")
      const pyqs = pyqQuestions.length > 0 ? pyqQuestions : undefined
      const branchesResult = await extractMindmapBranches({ sources, topicFocus: topicFocus.trim() || undefined, pyqQuestions: pyqs })
      if (branchesResult.error || !branchesResult.branchNames || !branchesResult.centralTopic) {
        toast({ variant: "destructive", title: "Planning Failed", description: branchesResult.error || "No branches returned." })
        setIsGenerating(false)
        setGenerationProgress("")
        return
      }

      const centralTopic = branchesResult.centralTopic
      const branchNames = branchesResult.branchNames
      const finalBranches: MindmapNode[] = []

      for (let i = 0; i < branchNames.length; i++) {
        const branchName = branchNames[i]
        setGenerationProgress(`Generating branch ${i + 1} of ${branchNames.length}: ${branchName}...`)
        const detailResult = await generateMindmapBranchDetail({ sources, centralTopic, branchName, pyqQuestions: pyqs })
        if (detailResult.error || !detailResult.branch) {
          toast({ variant: "destructive", title: `Failed on "${branchName}"`, description: detailResult.error || "No data returned." })
          continue
        }
        finalBranches.push(detailResult.branch)
      }

      if (finalBranches.length === 0) {
        toast({ variant: "destructive", title: "Generation Failed", description: "No branches were successfully generated." })
      } else {
        setGeneratedData({ centralTopic, branches: finalBranches })
        toast({ title: "Generated", description: `${finalBranches.length} branch(es) ready to preview.` })
      }
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message })
    } finally {
      setIsGenerating(false)
      setGenerationProgress("")
    }
  }

  // --- Save ---
  const [genSubjectId, setGenSubjectId] = useState("")
  const [genUnit, setGenUnit] = useState("")
  const [genTitle, setGenTitle] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  async function handleSave() {
    if (!db || !genSubjectId || !genTitle.trim() || !generatedData) return
    setIsSaving(true)
    try {
      const mmId = genTitle.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") + "-" + Date.now()
      const subjectRef = doc(db, 'subjects', genSubjectId)
      const mmRef = doc(db, 'subjects', genSubjectId, 'mindmaps', mmId)

      await setDoc(subjectRef, { mindmapCount: increment(1) }, { merge: true })
      await setDoc(mmRef, {
        id: mmId,
        subjectId: genSubjectId,
        unitName: genUnit.trim() || null,
        order: Date.now(),
        title: genTitle.trim(),
        type: "radial",
        data: generatedData,
        tier: "free",
        createdAt: serverTimestamp(),
      })

      toast({ title: "Mind Map Saved" })
      setGeneratedData(null)
      setGenTitle("")
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
    <div className="max-w-5xl mx-auto p-4 md:p-12 space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-3">
        <Link href="/admin"><Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button></Link>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Network className="h-6 w-6 text-primary" /> Mind Map Generator
          </h1>
          <p className="text-sm text-muted-foreground">Generates an interactive radial mind map (not an image) grounded in your ingested textbook.</p>
        </div>
      </div>

      <Card className="glass border-none">
        <CardHeader><CardTitle className="text-base">1. Select Textbook(s) & Match Chapter</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-2">
            {textbooksLoading ? <Loader2 className="h-5 w-5 animate-spin text-primary" /> : textbooks?.filter((tb: any) => tb.status === "ready").map((tb: any) => (
              <label key={tb.id} className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-colors ${selectedTextbookIds.includes(tb.id) ? "bg-primary/10 border-primary/40 text-primary" : "glass border-white/10 hover:bg-white/5"}`}>
                <input type="checkbox" checked={selectedTextbookIds.includes(tb.id)} onChange={() => toggleTextbookSelection(tb.id)} />
                <span className="text-sm font-medium truncate">{tb.title}</span>
              </label>
            ))}
          </div>
          <div className="flex gap-2">
            <Input placeholder="e.g., Cell Injury" value={referenceChapterName} onChange={(e) => setReferenceChapterName(e.target.value)} className="glass border-white/10" />
            <Button onClick={handleMatchChapters} disabled={isMatchingChapters || selectedTextbookIds.length === 0 || !referenceChapterName.trim()} variant="secondary" className="gap-2 shrink-0">
              {isMatchingChapters ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Match
            </Button>
          </div>
          {Object.keys(matchedChapters).length > 0 && (
            <div className="space-y-2">
              {selectedTextbookIds.map((id) => {
                const tb = textbooks?.find((t: any) => t.id === id)
                const match = matchedChapters[id]
                const options = chapterOptionsByTextbook[id] || []
                return (
                  <div key={id} className="p-3 rounded-xl glass border border-white/10 space-y-1">
                    <p className="text-xs font-bold text-muted-foreground">{tb?.title}</p>
                    <Select value={match?.chapterId || ""} onValueChange={(v) => overrideChapterMatch(id, v)}>
                      <SelectTrigger className="glass border-white/10 h-9 text-sm"><SelectValue placeholder="No match - pick manually" /></SelectTrigger>
                      <SelectContent className="glass border-white/10">
                        {options.map((c: any) => <SelectItem key={c.chapterId} value={c.chapterId}>{c.title} (pages {c.startPage}-{c.endPage})</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="glass border-none">
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><ListTree className="h-4 w-4" /> 2. Optional: PYQ / Question Bank PDF</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">Upload a question bank PDF to prioritize which topics need more depth. Match a chapter above first.</p>
          <input type="file" accept="application/pdf" onChange={(e) => setPyqFile(e.target.files?.[0] || null)} className="text-sm" />
          <Button onClick={handleExtractPyq} disabled={isExtractingPyq || !pyqFile} variant="secondary" className="gap-2">
            {isExtractingPyq ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {isExtractingPyq ? (pyqStage || "Extracting...") : "Extract PYQs For This Chapter"}
          </Button>
          {pyqQuestions.length > 0 && <p className="text-xs text-green-400">{pyqQuestions.length} question(s) loaded and will be used to guide depth.</p>}
        </CardContent>
      </Card>

      <Card className="glass border-none">
        <CardHeader><CardTitle className="text-base">3. Generate</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Topic Focus (optional - leave blank to cover the whole matched chapter)</Label>
            <Input placeholder="e.g., only necrosis and apoptosis" value={topicFocus} onChange={(e) => setTopicFocus(e.target.value)} className="glass border-white/10" />
          </div>
          <Button onClick={handleGenerate} disabled={isGenerating || Object.values(matchedChapters).every(v => !v)} className="gap-2">
            {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {isGenerating ? (generationProgress || "Generating...") : "Generate Mind Map"}
          </Button>
        </CardContent>
      </Card>

      {generatedData && (
        <>
          <Card className="glass border-none overflow-x-auto">
            <CardHeader><CardTitle className="text-base">3. Preview</CardTitle></CardHeader>
            <CardContent className="flex justify-center py-8">
              <div className="overflow-x-auto">
                <MindMapCanvas root={{ name: generatedData.centralTopic, branches: generatedData.branches }} />
              </div>
            </CardContent>
          </Card>

          <Card className="glass border-none">
            <CardHeader><CardTitle className="text-base">4. Save</CardTitle></CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Subject</Label>
                <Select value={genSubjectId} onValueChange={setGenSubjectId}>
                  <SelectTrigger className="glass border-white/10"><SelectValue placeholder="Select Subject" /></SelectTrigger>
                  <SelectContent className="glass border-white/10">
                    {subjects?.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Unit (optional)</Label>
                <Input placeholder="e.g., Unit I" value={genUnit} onChange={(e) => setGenUnit(e.target.value)} className="glass border-white/10" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Title</Label>
                <Input placeholder="e.g., Cell Injury" value={genTitle} onChange={(e) => setGenTitle(e.target.value)} className="glass border-white/10" />
              </div>
              <Button onClick={handleSave} disabled={isSaving || !genSubjectId || !genTitle.trim()} className="md:col-span-2 gap-2">
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {isSaving ? "Saving..." : "Save Mind Map"}
              </Button>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
