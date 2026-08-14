"use client"

import { useState, useMemo, useEffect } from "react"
import { useUser, useDoc, useFirestore, useCollection, useStorage } from "@/firebase"
import { doc, collection, query, orderBy, setDoc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore"
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage"
import { formatLongAnswers } from "@/ai/flows/ai-long-answers-formatter"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Sparkles, Lock, ArrowLeft, Save, FileText, FolderOpen, Trash2, X, ImagePlus, Wand2, Check } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

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

export default function LongAnswersAdminPage() {
  const { user, loading: authLoading } = useUser()
  const db = useFirestore()
  const storage = useStorage()
  const { toast } = useToast()

  const profileRef = useMemo(() => (!db || !user) ? null : doc(db, 'users', user.uid), [db, user])
  const { data: profile, loading: profileLoading } = useDoc(profileRef)

  const subjectsQuery = useMemo(() => (!db) ? null : query(collection(db, 'subjects'), orderBy('name', 'asc')), [db])
  const { data: subjects } = useCollection(subjectsQuery)

  // --- Create tab state ---
  const [subject, setSubject] = useState("")
  const [chapter, setChapter] = useState("")
  const [sectionType, setSectionType] = useState<"long-essays" | "short-essays" | "short-answers">("long-essays")
  const [rawText, setRawText] = useState("")
  const [generatedHtml, setGeneratedHtml] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const previewItems = useMemo(() => generatedHtml ? parseQaItems(generatedHtml) : [], [generatedHtml])

  // Create-tab image attachment state
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
    if (!storage || previewItems.length === 0 || !subject || !chapter.trim()) return
    setCreateIsEmbedding(true)
    try {
      const subjectId = subject.toLowerCase().replace(/\s+/g, '-')
      const chapterId = chapter.trim().toLowerCase().replace(/\s+/g, '-')
      const updatedItems = [...previewItems]
      let embeddedCount = 0

      for (let i = 0; i < createImageFiles.length; i++) {
        const questionIndices = Array.from(createMatchMatrix[i] || [])
        if (questionIndices.length === 0) continue

        const file = createImageFiles[i]
        const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_")
        const filePath = `long-answers/${subjectId}/${chapterId}/${sectionType}/${Date.now()}-${safeName}`
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
      toast({ title: "Images Embedded", description: embeddedCount + " image placement(s) added to the preview below. Click Save & Publish to finish." })
      resetCreateImages()
    } catch (e: any) {
      toast({ variant: "destructive", title: "Embed Failed", description: e.message })
    } finally {
      setCreateIsEmbedding(false)
    }
  }

  // --- Manage tab state ---
  const [manageSubject, setManageSubject] = useState("")
  const manageSubjectId = manageSubject ? manageSubject.toLowerCase().replace(/\s+/g, '-') : ""
  const chaptersQuery = useMemo(() => (!db || !manageSubjectId) ? null : query(collection(db, 'subjects', manageSubjectId, 'essayChapters'), orderBy('title', 'asc')), [db, manageSubjectId])
  const { data: manageChapters } = useCollection(chaptersQuery)

  const [manageChapterId, setManageChapterId] = useState("")
  const [manageSectionType, setManageSectionType] = useState<"long-essays" | "short-essays" | "short-answers">("long-essays")
  const [isLoadingSection, setIsLoadingSection] = useState(false)
  const [manageItems, setManageItems] = useState<QAItem[] | null>(null)
  const [isSavingManage, setIsSavingManage] = useState(false)

  useEffect(() => {
    setManageChapterId("")
    setManageItems(null)
  }, [manageSubject])

  useEffect(() => {
    setManageItems(null)
  }, [manageChapterId, manageSectionType])

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

  async function handleGenerate() {
    if (!subject || !chapter.trim() || !rawText.trim()) {
      toast({ variant: "destructive", title: "Missing fields", description: "Select a subject, enter a chapter name, and paste your questions/answers." })
      return
    }
    setIsGenerating(true)
    setGeneratedHtml("")
    resetCreateImages()
    try {
      const result = await formatLongAnswers({ rawText, subject, chapter: chapter.trim(), sectionType })
      if (result.error || !result.html) {
        toast({ variant: "destructive", title: "Formatting Failed", description: result.error || "AI returned no usable content. Try again." })
      } else {
        setGeneratedHtml(result.html)
        toast({ title: "Formatted", description: "Review the preview below. Attach images if you have any, then save." })
      }
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message })
    } finally {
      setIsGenerating(false)
    }
  }

  async function handleSave() {
    if (!db || !subject || !chapter.trim() || !generatedHtml) return
    setIsSaving(true)
    try {
      const subjectId = subject.toLowerCase().replace(/\s+/g, '-')
      const chapterId = chapter.trim().toLowerCase().replace(/\s+/g, '-')
      const questionCount = (generatedHtml.match(/class="qa-item"/g) || []).length

      const chapterRef = doc(db, 'subjects', subjectId, 'essayChapters', chapterId)
      await setDoc(chapterRef, { title: chapter.trim(), subjectId, updatedAt: serverTimestamp() }, { merge: true })
      await updateDoc(chapterRef, { [`sectionCounts.${sectionType}`]: questionCount })

      const sectionRef = doc(db, 'subjects', subjectId, 'essayChapters', chapterId, 'sections', sectionType)
      await setDoc(sectionRef, {
        sectionType,
        html: generatedHtml,
        questionCount,
        updatedAt: serverTimestamp()
      }, { merge: true })

      const sectionLabel = sectionType === 'long-essays' ? 'Long Essays' : sectionType === 'short-essays' ? 'Short Essays' : 'Short Answers'
      toast({ title: "Saved", description: `${sectionLabel} saved to ${chapter.trim()}.` })
      setRawText("")
      setGeneratedHtml("")
      resetCreateImages()
    } catch (e: any) {
      toast({ variant: "destructive", title: "Save Failed", description: e.message })
    } finally {
      setIsSaving(false)
    }
  }

  async function handleLoadSection() {
    if (!db || !manageSubjectId || !manageChapterId) return
    setIsLoadingSection(true)
    setManageItems(null)
    try {
      const { getDoc } = await import("firebase/firestore")
      const sectionRef = doc(db, 'subjects', manageSubjectId, 'essayChapters', manageChapterId, 'sections', manageSectionType)
      const snap = await getDoc(sectionRef)
      if (!snap.exists() || !(snap.data() as any).html) {
        setManageItems([])
        toast({ title: "No content found", description: "This section is empty for the selected chapter." })
      } else {
        setManageItems(parseQaItems((snap.data() as any).html))
      }
    } catch (e: any) {
      toast({ variant: "destructive", title: "Load Failed", description: e.message })
    } finally {
      setIsLoadingSection(false)
    }
  }

  function updateManageItem(index: number, field: "questionHtml" | "answerHtml", value: string) {
    setManageItems((prev) => {
      if (!prev) return prev
      const next = [...prev]
      next[index] = { ...next[index], [field]: value }
      return next
    })
  }

  function deleteManageItem(index: number) {
    if (!confirm("Delete this question? This cannot be undone until you save.")) return
    setManageItems((prev) => (prev ? prev.filter((_, i) => i !== index) : prev))
  }

  async function handleSaveManageChanges() {
    if (!db || !manageSubjectId || !manageChapterId || !manageItems) return
    setIsSavingManage(true)
    try {
      const html = rebuildHtml(manageItems)
      const questionCount = manageItems.length

      const chapterRef = doc(db, 'subjects', manageSubjectId, 'essayChapters', manageChapterId)
      await updateDoc(chapterRef, { [`sectionCounts.${manageSectionType}`]: questionCount })

      const sectionRef = doc(db, 'subjects', manageSubjectId, 'essayChapters', manageChapterId, 'sections', manageSectionType)
      if (questionCount === 0) {
        await deleteDoc(sectionRef)
      } else {
        await setDoc(sectionRef, { sectionType: manageSectionType, html, questionCount, updatedAt: serverTimestamp() }, { merge: true })
      }

      toast({ title: "Changes Saved", description: `${questionCount} question${questionCount !== 1 ? 's' : ''} in this section now.` })
    } catch (e: any) {
      toast({ variant: "destructive", title: "Save Failed", description: e.message })
    } finally {
      setIsSavingManage(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-12 space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-3">
        <Link href="/admin"><Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button></Link>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" /> Long Answers Builder
          </h1>
          <p className="text-sm text-muted-foreground">Create new content with AI, or manage what's already published.</p>
        </div>
      </div>

      <Tabs defaultValue="create">
        <TabsList className="glass border-white/10">
          <TabsTrigger value="create" className="gap-2"><Sparkles className="h-4 w-4" /> Create New</TabsTrigger>
          <TabsTrigger value="manage" className="gap-2"><FolderOpen className="h-4 w-4" /> Manage Existing</TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="space-y-8 mt-6">
          <Card className="glass border-none">
            <CardHeader><CardTitle className="text-base">Content Settings</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Subject</Label>
                  <Select value={subject} onValueChange={setSubject}>
                    <SelectTrigger className="glass border-white/10"><SelectValue placeholder="Select Subject" /></SelectTrigger>
                    <SelectContent className="glass border-white/10">
                      {subjects?.map((s: any) => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Chapter</Label>
                  <Input placeholder="e.g., Axilla and Brachial Plexus" value={chapter} onChange={(e) => setChapter(e.target.value)} className="glass border-white/10" />
                </div>
                <div className="space-y-2">
                  <Label>Section</Label>
                  <Select value={sectionType} onValueChange={(v: any) => setSectionType(v)}>
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
                <Label>Paste Questions + Your Rough Answers</Label>
                <p className="text-[10px] text-muted-foreground">
                  Use this format per question - repeat-frequency in brackets is optional:{" "}
                  <span className="font-mono">Q1 [asked 3x: 2015, 2018, 2022] Describe the boundaries and contents of the axilla. [your rough answer text...]</span>
                </p>
                <Textarea
                  placeholder="Q1 [asked 3x: 2015, 2018, 2022] Describe the boundaries and contents of the axilla.
The axilla is a pyramidal space...

Q2 Describe the brachial plexus.
..."
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  className="glass border-white/10 min-h-[300px] font-mono text-sm"
                />
              </div>

              <Button onClick={handleGenerate} disabled={isGenerating || !subject || !chapter.trim() || !rawText.trim()} className="w-full h-12 gap-2">
                {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {isGenerating ? "Formatting..." : "Format with AI"}
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
                <p className="text-xs text-muted-foreground">Upload diagrams/photos for this section - AI will suggest which question(s) each one illustrates. Nothing uploads until you confirm.</p>
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
        </TabsContent>

        <TabsContent value="manage" className="space-y-8 mt-6">
          <Card className="glass border-none">
            <CardHeader><CardTitle className="text-base">Load a Section</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Subject</Label>
                  <Select value={manageSubject} onValueChange={setManageSubject}>
                    <SelectTrigger className="glass border-white/10"><SelectValue placeholder="Select Subject" /></SelectTrigger>
                    <SelectContent className="glass border-white/10">
                      {subjects?.map((s: any) => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Chapter</Label>
                  <Select value={manageChapterId} onValueChange={setManageChapterId} disabled={!manageSubject}>
                    <SelectTrigger className="glass border-white/10"><SelectValue placeholder={manageSubject ? "Select Chapter" : "Pick a subject first"} /></SelectTrigger>
                    <SelectContent className="glass border-white/10">
                      {manageChapters?.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}
                      {manageChapters?.length === 0 && <div className="px-3 py-2 text-xs text-muted-foreground">No chapters yet for this subject</div>}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Section</Label>
                  <Select value={manageSectionType} onValueChange={(v: any) => setManageSectionType(v)}>
                    <SelectTrigger className="glass border-white/10"><SelectValue /></SelectTrigger>
                    <SelectContent className="glass border-white/10">
                      <SelectItem value="long-essays">Long Essays</SelectItem>
                      <SelectItem value="short-essays">Short Essays</SelectItem>
                      <SelectItem value="short-answers">Short Answers</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={handleLoadSection} disabled={isLoadingSection || !manageSubject || !manageChapterId} className="w-full h-12 gap-2">
                {isLoadingSection ? <Loader2 className="h-4 w-4 animate-spin" /> : <FolderOpen className="h-4 w-4" />}
                {isLoadingSection ? "Loading..." : "Load Questions"}
              </Button>
            </CardContent>
          </Card>

          {manageItems !== null && (
            <div className="space-y-4 animate-in slide-in-from-bottom-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">{manageItems.length} Question{manageItems.length !== 1 ? 's' : ''}</h2>
                <Button onClick={handleSaveManageChanges} disabled={isSavingManage} className="gap-2">
                  {isSavingManage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {isSavingManage ? "Saving..." : "Save Changes"}
                </Button>
              </div>

              {manageItems.length === 0 && (
                <div className="text-center py-16 text-muted-foreground rounded-2xl glass border-none">
                  No questions in this section.
                </div>
              )}

              {manageItems.map((item, i) => (
                <Card key={i} className="glass border-none">
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Question {i + 1}</span>
                      <button onClick={() => deleteManageItem(i)} className="text-muted-foreground hover:text-destructive transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="rounded-xl bg-white/5 p-4">
                      <div className="qa-question" dangerouslySetInnerHTML={{ __html: item.questionHtml }} />
                      <div className="qa-answer mt-3 pt-3 border-t border-white/10" dangerouslySetInnerHTML={{ __html: item.answerHtml }} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] text-muted-foreground">Edit Question (HTML)</Label>
                      <Textarea
                        value={item.questionHtml}
                        onChange={(e) => updateManageItem(i, "questionHtml", e.target.value)}
                        className="glass border-white/10 min-h-[70px] font-mono text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] text-muted-foreground">Edit Answer (HTML)</Label>
                      <Textarea
                        value={item.answerHtml}
                        onChange={(e) => updateManageItem(i, "answerHtml", e.target.value)}
                        className="glass border-white/10 min-h-[140px] font-mono text-xs"
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
