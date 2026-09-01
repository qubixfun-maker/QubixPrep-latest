"use client"

import { useState, useMemo } from "react"
import { useUser, useDoc, useFirestore, useCollection } from "@/firebase"
import { doc, collection, query, orderBy, getDocs, setDoc, increment, serverTimestamp } from "firebase/firestore"
import { generateMindmapData } from "@/ai/flows/ai-mindmap-data-generator"
import MindMapRadial, { type MindmapNode } from "@/components/mindmap/MindMapRadial"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Lock, ArrowLeft, Network, Sparkles, Save } from "lucide-react"
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

export default function MindmapGeneratorPage() {
  const { user, loading: authLoading } = useUser()
  const db = useFirestore()
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

  // --- Generation ---
  const [topicFocus, setTopicFocus] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
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
      const result = await generateMindmapData({ sources, topicFocus: topicFocus.trim() || undefined })
      if (result.error || !result.data) {
        toast({ variant: "destructive", title: "Generation Failed", description: result.error || "No data returned." })
      } else {
        setGeneratedData(result.data)
        toast({ title: "Generated", description: `${result.data.branches.length} branch(es) ready to preview.` })
      }
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message })
    } finally {
      setIsGenerating(false)
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
        <CardHeader><CardTitle className="text-base">2. Generate</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Topic Focus (optional - leave blank to cover the whole matched chapter)</Label>
            <Input placeholder="e.g., only necrosis and apoptosis" value={topicFocus} onChange={(e) => setTopicFocus(e.target.value)} className="glass border-white/10" />
          </div>
          <Button onClick={handleGenerate} disabled={isGenerating || Object.values(matchedChapters).every(v => !v)} className="gap-2">
            {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {isGenerating ? "Generating..." : "Generate Mind Map"}
          </Button>
        </CardContent>
      </Card>

      {generatedData && (
        <>
          <Card className="glass border-none overflow-x-auto">
            <CardHeader><CardTitle className="text-base">3. Preview</CardTitle></CardHeader>
            <CardContent className="flex justify-center py-8">
              <div style={{ transform: "scale(0.55)", transformOrigin: "top center", marginBottom: "-380px" }}>
                <MindMapRadial root={{ name: generatedData.centralTopic, branches: generatedData.branches }} />
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
