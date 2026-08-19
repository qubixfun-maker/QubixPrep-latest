"use client"

import { useState, useMemo } from "react"
import { useUser, useDoc, useFirestore, useCollection, useStorage } from "@/firebase"
import { doc, collection, query, orderBy, getDocs, setDoc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore"
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage"
import { generateFromTextbook } from "@/ai/flows/ai-textbook-answer-generator"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Lock, ArrowLeft, BookMarked, UploadCloud, CheckCircle2, FileText, Sparkles, Save, ImagePlus, Wand2, Check } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

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

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, "").trim()
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

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      resolve(result.split(",")[1])
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default function TextbookGeneratorPage() {
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

  // --- Upload state ---
  const [uploadTitle, setUploadTitle] = useState("")
  const [uploadAuthor, setUploadAuthor] = useState("")
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadStage, setUploadStage] = useState("")
  const [lastResult, setLastResult] = useState<{ chapters: any[] } | null>(null)

  async function handleUploadAndIngest() {
    if (!storage || !uploadFile || !uploadTitle.trim() || !user) return
    setIsUploading(true)
    setLastResult(null)
    try {
      setUploadStage("Uploading PDF to storage...")
      const safeId = uploadTitle.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
      const storagePath = `textbooks-source/${safeId}-${Date.now()}.pdf`
      const fileRef = storageRef(storage, storagePath)
      await uploadBytes(fileRef, uploadFile)

      setUploadStage("Reading chapters and extracting text (this can take a few minutes for large books)...")
      const idToken = await user.getIdToken()
      const res = await fetch("/api/textbooks/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken, storagePath, title: uploadTitle.trim(), author: uploadAuthor.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Ingestion failed")

      setLastResult({ chapters: data.chapters })
      toast({ title: "Textbook Ready", description: `Detected ${data.chapters.length} chapters across ${data.totalPages} pages.` })
      setUploadTitle("")
      setUploadAuthor("")
      setUploadFile(null)
    } catch (e: any) {
      toast({ variant: "destructive", title: "Upload Failed", description: e.message })
    } finally {
      setIsUploading(false)
      setUploadStage("")
    }
  }

  // --- Generate Answers state ---
  const [selectedTextbookIds, setSelectedTextbookIds] = useState<string[]>([])
  const [referenceChapterName, setReferenceChapterName] = useState("")
  const [isMatchingChapters, setIsMatchingChapters] = useState(false)
  const [matchedChapters, setMatchedChapters] = useState<Record<string, any>>({})
  const [chapterOptionsByTextbook, setChapterOptionsByTextbook] = useState<Record<string, any[]>>({})

  const [genSubject, setGenSubject] = useState("")
  const [genChapter, setGenChapter] = useState("")
  const [genSectionType, setGenSectionType] = useState<"long-essays" | "short-essays" | "short-answers">("long-essays")
  const [questionsRaw, setQuestionsRaw] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedHtml, setGeneratedHtml] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  const previewItems = useMemo(() => generatedHtml ? parseQaItems(generatedHtml) : [], [generatedHtml])

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
        const match = fuzzyMatchChapter(referenceChapterName, chapters)
        results[textbookId] = match
      }
      setChapterOptionsByTextbook(optionsMap)
      setMatchedChapters(results)
      const missing = Object.entries(results).filter(([, v]) => !v)
      if (missing.length > 0) {
        toast({ variant: "destructive", title: "No match for some textbooks", description: "Pick a chapter manually below for those." })
      } else {
        toast({ title: "Chapters Matched", description: "Review below, then paste your questions." })
      }
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

  async function handleGenerate() {
    const matchedList = selectedTextbookIds.map(id => matchedChapters[id]).filter(Boolean)
    if (matchedList.length === 0 || !questionsRaw.trim() || !genSubject || !genChapter.trim()) {
      toast({ variant: "destructive", title: "Missing info", description: "Match at least one chapter, fill Subject/Chapter, and paste questions." })
      return
    }
    setIsGenerating(true)
    setGeneratedHtml("")
    resetCreateImages()
    try {
      const sources = selectedTextbookIds.map(id => {
        const tb = textbooks?.find((t: any) => t.id === id)
        const ch = matchedChapters[id]
        return { textbookTitle: tb?.title || id, chapterTitle: ch.title, text: ch.text }
      })
      const result = await generateFromTextbook({
        sources,
        questionsRaw,
        subject: genSubject,
        chapter: genChapter.trim(),
        sectionType: genSectionType,
      })
      if (result.error || !result.html) {
        toast({ variant: "destructive", title: "Generation Failed", description: result.error || "No usable content returned." })
      } else {
        setGeneratedHtml(result.html)
        toast({ title: "Generated", description: "Review the preview below, attach images if needed, then save." })
      }
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message })
    } finally {
      setIsGenerating(false)
    }
  }

  async function handleSave() {
    if (!db || !genSubject || !genChapter.trim() || !generatedHtml) return
    setIsSaving(true)
    try {
      const subjectId = genSubject.toLowerCase().replace(/\s+/g, '-')
      const chapterId = genChapter.trim().toLowerCase().replace(/\s+/g, '-')

      const { getDoc } = await import("firebase/firestore")
      const sectionRef = doc(db, 'subjects', subjectId, 'essayChapters', chapterId, 'sections', genSectionType)
      const existingSnap = await getDoc(sectionRef)
      const existingItems = existingSnap.exists() && (existingSnap.data() as any).html
        ? parseQaItems((existingSnap.data() as any).html)
        : []

      const newItems = parseQaItems(generatedHtml)
      const combinedItems = [...existingItems, ...newItems]
      const finalHtml = rebuildHtml(combinedItems)
      const questionCount = combinedItems.length

      const chapterRef = doc(db, 'subjects', subjectId, 'essayChapters', chapterId)
      await setDoc(chapterRef, { title: genChapter.trim(), subjectId, updatedAt: serverTimestamp() }, { merge: true })
      await updateDoc(chapterRef, { [`sectionCounts.${genSectionType}`]: questionCount })

      await setDoc(sectionRef, {
        sectionType: genSectionType,
        html: finalHtml,
        questionCount,
        updatedAt: serverTimestamp()
      }, { merge: true })

      const sectionLabel = genSectionType === 'long-essays' ? 'Long Essays' : genSectionType === 'short-essays' ? 'Short Essays' : 'Short Answers'
      const addedCount = newItems.length
      toast({ title: "Saved", description: `Added ${addedCount} question${addedCount !== 1 ? "s" : ""} to ${sectionLabel} - ${genChapter.trim()} now has ${questionCount} total.` })
      setQuestionsRaw("")
      setGeneratedHtml("")
      resetCreateImages()
    } catch (e: any) {
      toast({ variant: "destructive", title: "Save Failed", description: e.message })
    } finally {
      setIsSaving(false)
    }
  }

  // --- Image attach state (same pattern as Long Answers Create tab) ---
  const [createImageFiles, setCreateImageFiles] = useState<File[]>([])
  const [createImagePreviews, setCreateImagePreviews] = useState<string[]>([])
  const [createMatchMatrix, setCreateMatchMatrix] = useState<Record<number, Set<number>>>({})
  const [createHasMatched, setCreateHasMatched] = useState(false)
  const [createIsMatching, setCreateIsMatching] = useState(false)
  const [createIsEmbedding, setCreateIsEmbedding] = useState(false)

  function resetCreateImages() {
    setCreateImageFiles([])
    setCreateImagePreviews([])
    setCreateMatchMatrix({})
    setCreateHasMatched(false)
  }

  function handleCreateImageFilesSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return
    setCreateImageFiles(files)
    setCreateImagePreviews(files.map(f => URL.createObjectURL(f)))
    setCreateMatchMatrix({})
    setCreateHasMatched(false)
  }

  async function handleCreateRunMatching() {
    if (previewItems.length === 0 || createImageFiles.length === 0) return
    setCreateIsMatching(true)
    try {
      const images = await Promise.all(createImageFiles.map(async (file) => ({
        filename: file.name,
        mimeType: file.type || "image/jpeg",
        base64: await fileToBase64(file),
      })))
      const questions = previewItems.map((item, i) => ({ index: i, text: stripHtml(item.questionHtml) }))

      const res = await fetch("/api/long-answers/match-images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ images, questions }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)

      const matrix: Record<number, Set<number>> = {}
      for (const result of data.results) {
        matrix[result.imageIndex] = new Set(result.matchedQuestionIndices)
      }
      setCreateMatchMatrix(matrix)
      setCreateHasMatched(true)
      toast({ title: "Matching Complete", description: "Review the suggested matches below, then embed." })
    } catch (e: any) {
      toast({ variant: "destructive", title: "Matching Failed", description: e.message })
    } finally {
      setCreateIsMatching(false)
    }
  }

  function toggleCreateMatch(imageIndex: number, questionIndex: number) {
    setCreateMatchMatrix((prev) => {
      const next = { ...prev }
      const current = new Set(next[imageIndex] || [])
      if (current.has(questionIndex)) current.delete(questionIndex)
      else current.add(questionIndex)
      next[imageIndex] = current
      return next
    })
  }

  async function handleCreateConfirmEmbed() {
    if (!storage || previewItems.length === 0 || !genSubject || !genChapter.trim()) return
    setCreateIsEmbedding(true)
    try {
      const subjectId = genSubject.toLowerCase().replace(/\s+/g, '-')
      const chapterId = genChapter.trim().toLowerCase().replace(/\s+/g, '-')
      const updatedItems = [...previewItems]
      let embeddedCount = 0

      for (let i = 0; i < createImageFiles.length; i++) {
        const questionIndices = Array.from(createMatchMatrix[i] || [])
        if (questionIndices.length === 0) continue

        const file = createImageFiles[i]
        const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_")
        const filePath = `long-answers/${subjectId}/${chapterId}/${genSectionType}/${Date.now()}-${safeName}`
        const fileRef = storageRef(storage, filePath)
        await uploadBytes(fileRef, file)
        const url = await getDownloadURL(fileRef)

        for (const qIndex of questionIndices) {
          const imgTag = "\n<img src=\"" + url + "\" alt=\"" + file.name + "\" />"
          updatedItems[qIndex] = {
            ...updatedItems[qIndex],
            answerHtml: updatedItems[qIndex].answerHtml + imgTag
          }
          embeddedCount++
        }
      }

      setGeneratedHtml(rebuildHtml(updatedItems))
      toast({ title: "Images Embedded", description: embeddedCount + " image placement(s) added to the preview below. Click Save to finish." })
      resetCreateImages()
    } catch (e: any) {
      toast({ variant: "destructive", title: "Embed Failed", description: e.message })
    } finally {
      setCreateIsEmbedding(false)
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
            <BookMarked className="h-6 w-6 text-primary" /> Generate from Textbook
          </h1>
          <p className="text-sm text-muted-foreground">Upload a textbook once, then generate Long Answers content from it repeatedly.</p>
        </div>
      </div>

      <Card className="glass border-none">
        <CardHeader><CardTitle className="text-base">Upload a New Textbook</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">
            The PDF needs real bookmarks/chapters (e.g. "3. Cell Injury and Cellular Adaptations") for chapters to be auto-detected.
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input placeholder="e.g., Textbook of Pathology" value={uploadTitle} onChange={(e) => setUploadTitle(e.target.value)} className="glass border-white/10" />
            </div>
            <div className="space-y-2">
              <Label>Author</Label>
              <Input placeholder="e.g., Harsh Mohan" value={uploadAuthor} onChange={(e) => setUploadAuthor(e.target.value)} className="glass border-white/10" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>PDF File</Label>
            <Input type="file" accept="application/pdf" onChange={(e) => setUploadFile(e.target.files?.[0] || null)} className="glass border-white/10 cursor-pointer h-14 pt-4" />
          </div>
          <Button onClick={handleUploadAndIngest} disabled={isUploading || !uploadFile || !uploadTitle.trim()} className="w-full h-12 gap-2">
            {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
            {isUploading ? (uploadStage || "Processing...") : "Upload & Process"}
          </Button>

          {lastResult && (
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-2 animate-in slide-in-from-bottom-2">
              <p className="text-xs font-bold text-primary flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5" /> Detected Chapters</p>
              <div className="max-h-48 overflow-y-auto space-y-1">
                {lastResult.chapters.map((c: any) => (
                  <div key={c.chapterId} className="text-xs text-muted-foreground flex justify-between">
                    <span>{c.title}</span>
                    <span>pages {c.startPage}-{c.endPage}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="glass border-none">
        <CardHeader><CardTitle className="text-base">Textbook Library</CardTitle></CardHeader>
        <CardContent>
          {textbooksLoading ? (
            <div className="py-8 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : textbooks && textbooks.length > 0 ? (
            <div className="space-y-2">
              {textbooks.map((tb: any) => (
                <div key={tb.id} className="p-4 rounded-xl glass border border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0"><FileText className="h-4 w-4" /></div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold truncate">{tb.title}</p>
                      <p className="text-xs text-muted-foreground">{tb.author ? tb.author + " - " : ""}{tb.chapterCount} chapters - {tb.totalPages} pages</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full shrink-0 ${tb.status === "ready" ? "bg-emerald-500/15 text-emerald-400" : "bg-amber-500/15 text-amber-400"}`}>
                    {tb.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">No textbooks uploaded yet.</p>
          )}
        </CardContent>
      </Card>

      <Card className="glass border-none">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Sparkles className="h-4 w-4" /> Generate Answers</CardTitle>
          <p className="text-xs text-muted-foreground">Pick one or more textbooks, tell it which chapter to reference, paste your questions - no answers needed this time.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>1. Select Textbook(s)</Label>
            <div className="grid md:grid-cols-2 gap-2">
              {textbooks?.filter((tb: any) => tb.status === "ready").map((tb: any) => (
                <label key={tb.id} className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-colors ${selectedTextbookIds.includes(tb.id) ? "bg-primary/10 border-primary/40 text-primary" : "glass border-white/10 hover:bg-white/5"}`}>
                  <input type="checkbox" checked={selectedTextbookIds.includes(tb.id)} onChange={() => toggleTextbookSelection(tb.id)} />
                  <span className="text-sm font-medium truncate">{tb.title}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>2. Chapter Name to Reference</Label>
            <div className="flex gap-2">
              <Input placeholder="e.g., Cell Injury" value={referenceChapterName} onChange={(e) => setReferenceChapterName(e.target.value)} className="glass border-white/10" />
              <Button onClick={handleMatchChapters} disabled={isMatchingChapters || selectedTextbookIds.length === 0 || !referenceChapterName.trim()} variant="secondary" className="gap-2 shrink-0">
                {isMatchingChapters ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Match
              </Button>
            </div>
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

          <div className="grid md:grid-cols-3 gap-4 pt-2">
            <div className="space-y-2">
              <Label>Subject</Label>
              <Select value={genSubject} onValueChange={setGenSubject}>
                <SelectTrigger className="glass border-white/10"><SelectValue placeholder="Select Subject" /></SelectTrigger>
                <SelectContent className="glass border-white/10">
                  {subjects?.map((s: any) => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Chapter (to save under)</Label>
              <Input placeholder="e.g., Cell Injury" value={genChapter} onChange={(e) => setGenChapter(e.target.value)} className="glass border-white/10" />
            </div>
            <div className="space-y-2">
              <Label>Section</Label>
              <Select value={genSectionType} onValueChange={(v: any) => setGenSectionType(v)}>
                <SelectTrigger className="glass border-white/10"><SelectValue /></SelectTrigger>
                <SelectContent className="glass border-white/10">
                  <SelectItem value="long-essays">Long Essays</SelectItem>
                  <SelectItem value="short-essays">Short Essays</SelectItem>
                  <SelectItem value="short-answers">Short Answers</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>3. Paste Questions (no answers needed)</Label>
            <p className="text-[10px] text-muted-foreground">One per line or numbered - repeat-frequency in brackets is optional, e.g. "Q1 [asked 3x: 2015, 2018, 2022] Describe biochemical mechanisms of cell injury."</p>
            <Textarea
              placeholder="Q1 Describe biochemical and molecular mechanisms of cell injury.
Q2 Discuss morphological features of necrosis.
..."
              value={questionsRaw}
              onChange={(e) => setQuestionsRaw(e.target.value)}
              className="glass border-white/10 min-h-[200px] font-mono text-sm"
            />
          </div>

          <Button onClick={handleGenerate} disabled={isGenerating || Object.values(matchedChapters).every(v => !v) || !questionsRaw.trim() || !genSubject || !genChapter.trim()} className="w-full h-12 gap-2">
            {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {isGenerating ? "Generating (may take a minute for many questions)..." : "Generate Answers"}
          </Button>
        </CardContent>
      </Card>

      {generatedHtml && (
        <div className="space-y-4 animate-in slide-in-from-bottom-4">
          <h2 className="text-lg font-bold">Preview</h2>
          <Card className="glass border-none">
            <CardContent className="p-6">
              <div dangerouslySetInnerHTML={{ __html: generatedHtml }} />
            </CardContent>
          </Card>
        </div>
      )}

      {generatedHtml && previewItems.length > 0 && (
        <Card className="glass border-none">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><ImagePlus className="h-4 w-4" /> Attach Images (Optional)</CardTitle>
            <p className="text-xs text-muted-foreground">Upload diagrams/photos - AI will suggest which question(s) each one illustrates.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input type="file" accept="image/*" multiple onChange={handleCreateImageFilesSelected} className="glass border-white/10 cursor-pointer h-14 pt-4" />

            {createImagePreviews.length > 0 && (
              <Button onClick={handleCreateRunMatching} disabled={createIsMatching} variant="secondary" className="w-full h-12 gap-2">
                {createIsMatching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                {createIsMatching ? "Matching..." : `Match ${createImagePreviews.length} Image${createImagePreviews.length !== 1 ? "s" : ""} with AI`}
              </Button>
            )}

            {createHasMatched && (
              <div className="space-y-4 pt-2">
                {createImagePreviews.map((preview, imgIndex) => (
                  <div key={imgIndex} className="p-4 rounded-xl glass border border-white/10 space-y-3">
                    <div className="flex items-start gap-4">
                      <img src={preview} alt={createImageFiles[imgIndex]?.name} className="w-24 h-24 object-cover rounded-lg shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold truncate">{createImageFiles[imgIndex]?.name}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">Tick the question(s) this image belongs to:</p>
                        <div className="mt-2 space-y-1 max-h-40 overflow-y-auto pr-2">
                          {previewItems.map((item, qIndex) => {
                            const checked = createMatchMatrix[imgIndex]?.has(qIndex) || false
                            return (
                              <label key={qIndex} className={`flex items-start gap-2 p-2 rounded-lg cursor-pointer text-xs transition-colors ${checked ? "bg-primary/10 text-primary" : "hover:bg-white/5"}`}>
                                <input type="checkbox" checked={checked} onChange={() => toggleCreateMatch(imgIndex, qIndex)} className="mt-0.5" />
                                <span className="line-clamp-2">{stripHtml(item.questionHtml)}</span>
                              </label>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                <Button onClick={handleCreateConfirmEmbed} disabled={createIsEmbedding} variant="secondary" className="w-full h-12 gap-2">
                  {createIsEmbedding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  {createIsEmbedding ? "Uploading & Embedding..." : "Embed Into Preview"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {generatedHtml && (
        <Button onClick={handleSave} disabled={isSaving} className="w-full h-14 gap-2 text-base">
          {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
          {isSaving ? "Saving..." : "Save & Publish"}
        </Button>
      )}
    </div>
  )
}
