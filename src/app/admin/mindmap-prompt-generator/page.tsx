"use client"

import { useState, useMemo } from "react"
import { useUser, useDoc, useFirestore, useCollection } from "@/firebase"
import { doc, collection, query, orderBy, getDocs } from "firebase/firestore"
import { generateMindmapPrompt } from "@/ai/flows/ai-mindmap-prompt-generator"
import { extractChapterTopics } from "@/ai/flows/ai-chapter-topic-extractor"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Lock, ArrowLeft, Network, Sparkles, ListTree, Copy, Trash2, Combine } from "lucide-react"
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

type GeneratedPrompt = { id: string; label: string; prompt: string }

export default function MindmapPromptGeneratorPage() {
  const { user, loading: authLoading } = useUser()
  const db = useFirestore()
  const { toast } = useToast()

  const profileRef = useMemo(() => (!db || !user) ? null : doc(db, 'users', user.uid), [db, user])
  const { data: profile, loading: profileLoading } = useDoc(profileRef)

  const textbooksQuery = useMemo(() => (!db) ? null : query(collection(db, 'textbooks'), orderBy('createdAt', 'desc')), [db])
  const { data: textbooks, loading: textbooksLoading } = useCollection(textbooksQuery)

  // --- Chapter matching (same pattern as flashcard generator) ---
  const [selectedTextbookIds, setSelectedTextbookIds] = useState<string[]>([])
  const [referenceChapterName, setReferenceChapterName] = useState("")
  const [isMatchingChapters, setIsMatchingChapters] = useState(false)
  const [matchedChapters, setMatchedChapters] = useState<Record<string, any>>({})
  const [chapterOptionsByTextbook, setChapterOptionsByTextbook] = useState<Record<string, any[]>>({})

  function toggleTextbookSelection(id: string) {
    setSelectedTextbookIds((prev) => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
    setMatchedChapters({})
    setExtractedTopics([])
    setSelectedTopics([])
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
      setExtractedTopics([])
      setSelectedTopics([])
      toast({ title: "Chapters Matched", description: "Now extract topics below." })
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
    setExtractedTopics([])
    setSelectedTopics([])
  }

  function buildMatchedSources() {
    return selectedTextbookIds.map(id => {
      const tb = textbooks?.find((t: any) => t.id === id)
      const ch = matchedChapters[id]
      return ch ? { textbookTitle: tb?.title || id, chapterTitle: ch.title, text: ch.text } : null
    }).filter(Boolean) as { textbookTitle: string; chapterTitle: string; text: string }[]
  }

  // --- Topic extraction + selection ---
  const [isExtractingTopics, setIsExtractingTopics] = useState(false)
  const [extractedTopics, setExtractedTopics] = useState<string[]>([])
  const [selectedTopics, setSelectedTopics] = useState<string[]>([])

  async function handleExtractTopics() {
    const sources = buildMatchedSources()
    if (sources.length === 0) {
      toast({ variant: "destructive", title: "Match a chapter first" })
      return
    }
    setIsExtractingTopics(true)
    setExtractedTopics([])
    setSelectedTopics([])
    try {
      const result = await extractChapterTopics({ sources })
      if (result.error || result.topics.length === 0) {
        toast({ variant: "destructive", title: "Topic Extraction Failed", description: result.error || "No topics returned." })
      } else {
        setExtractedTopics(result.topics)
        toast({ title: "Topics Found", description: `${result.topics.length} topic(s) - select which one(s) you want a mind map prompt for.` })
      }
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message })
    } finally {
      setIsExtractingTopics(false)
    }
  }

  function toggleTopic(topic: string) {
    setSelectedTopics((prev) => prev.includes(topic) ? prev.filter(t => t !== topic) : [...prev, topic])
  }

  function toggleSelectAllTopics() {
    setSelectedTopics((prev) => prev.length === extractedTopics.length ? [] : [...extractedTopics])
  }

  // --- Generation ---
  const [isGeneratingEach, setIsGeneratingEach] = useState(false)
  const [isGeneratingCombined, setIsGeneratingCombined] = useState(false)
  const [generationProgress, setGenerationProgress] = useState("")
  const [generatedPrompts, setGeneratedPrompts] = useState<GeneratedPrompt[]>([])

  async function handleGenerateEach() {
    const sources = buildMatchedSources()
    if (sources.length === 0 || selectedTopics.length === 0) {
      toast({ variant: "destructive", title: "Match a chapter and select at least one topic" })
      return
    }
    setIsGeneratingEach(true)
    try {
      const results: GeneratedPrompt[] = []
      for (const topic of selectedTopics) {
        setGenerationProgress(`Generating prompt for "${topic}"...`)
        const result = await generateMindmapPrompt({ sources, topics: [topic] })
        if (result.error || !result.prompt) {
          toast({ variant: "destructive", title: `Failed on "${topic}"`, description: result.error || "No prompt returned." })
          continue
        }
        results.push({ id: `${topic}-${Date.now()}`, label: topic, prompt: result.prompt })
      }
      setGeneratedPrompts((prev) => [...results, ...prev])
      if (results.length > 0) {
        toast({ title: "Generated", description: `${results.length} mind map prompt(s) ready.` })
      }
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message })
    } finally {
      setIsGeneratingEach(false)
      setGenerationProgress("")
    }
  }

  async function handleGenerateCombined() {
    const sources = buildMatchedSources()
    if (sources.length === 0 || selectedTopics.length < 2) {
      toast({ variant: "destructive", title: "Select at least 2 topics to combine" })
      return
    }
    setIsGeneratingCombined(true)
    setGenerationProgress(`Combining ${selectedTopics.length} topics into one prompt...`)
    try {
      const result = await generateMindmapPrompt({ sources, topics: selectedTopics })
      if (result.error || !result.prompt) {
        toast({ variant: "destructive", title: "Generation Failed", description: result.error || "No prompt returned." })
      } else {
        const label = selectedTopics.join(" + ")
        setGeneratedPrompts((prev) => [{ id: `combined-${Date.now()}`, label, prompt: result.prompt }, ...prev])
        toast({ title: "Generated", description: "Combined mind map prompt ready." })
      }
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message })
    } finally {
      setIsGeneratingCombined(false)
      setGenerationProgress("")
    }
  }

  function updatePromptText(id: string, value: string) {
    setGeneratedPrompts((prev) => prev.map(p => p.id === id ? { ...p, prompt: value } : p))
  }

  function deletePrompt(id: string) {
    setGeneratedPrompts((prev) => prev.filter(p => p.id !== id))
  }

  async function copyPrompt(text: string) {
    try {
      await navigator.clipboard.writeText(text)
      toast({ title: "Copied to clipboard" })
    } catch {
      toast({ variant: "destructive", title: "Copy failed", description: "Select and copy the text manually." })
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
            <Network className="h-6 w-6 text-primary" /> Mind Map Prompt Generator
          </h1>
          <p className="text-sm text-muted-foreground">Reads your textbook chapter and writes an image-generation prompt you can paste into an AI image tool to create the mind map.</p>
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
                    <select
                      value={match?.chapterId || ""}
                      onChange={(e) => overrideChapterMatch(id, e.target.value)}
                      className="w-full h-9 text-sm glass border border-white/10 rounded-md bg-transparent px-2"
                    >
                      <option value="">No match - pick manually</option>
                      {options.map((c: any) => <option key={c.chapterId} value={c.chapterId}>{c.title} (pages {c.startPage}-{c.endPage})</option>)}
                    </select>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="glass border-none">
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><ListTree className="h-4 w-4" /> 2. Pick Topics</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">Extract the sub-topics inside the matched chapter, then select one topic per mind map, or select several and combine them into a single mind map prompt.</p>
          <div className="flex gap-2 flex-wrap">
            <Button onClick={handleExtractTopics} disabled={isExtractingTopics || Object.values(matchedChapters).every(v => !v)} variant="secondary" className="gap-2">
              {isExtractingTopics ? <Loader2 className="h-4 w-4 animate-spin" /> : <ListTree className="h-4 w-4" />}
              {isExtractingTopics ? "Extracting..." : "Extract Topics From Chapter"}
            </Button>
            {extractedTopics.length > 0 && (
              <Button onClick={toggleSelectAllTopics} variant="outline" className="gap-2">
                {selectedTopics.length === extractedTopics.length ? "Deselect All" : "Select All"}
              </Button>
            )}
          </div>

          {extractedTopics.length > 0 && (
            <div className="space-y-2">
              {extractedTopics.map((topic) => {
                const selected = selectedTopics.includes(topic)
                return (
                  <label key={topic} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${selected ? "bg-primary/10 border-primary/40" : "glass border-white/10"}`}>
                    <input type="checkbox" checked={selected} onChange={() => toggleTopic(topic)} />
                    <span className="text-sm font-medium flex-1 truncate">{topic}</span>
                  </label>
                )
              })}

              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <Button onClick={handleGenerateEach} disabled={isGeneratingEach || isGeneratingCombined || selectedTopics.length === 0} className="gap-2 flex-1">
                  {isGeneratingEach ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  {isGeneratingEach ? (generationProgress || "Generating...") : `Generate ${selectedTopics.length > 1 ? "a Prompt for Each Selected Topic" : "Prompt"}`}
                </Button>
                <Button onClick={handleGenerateCombined} disabled={isGeneratingEach || isGeneratingCombined || selectedTopics.length < 2} variant="secondary" className="gap-2 flex-1">
                  {isGeneratingCombined ? <Loader2 className="h-4 w-4 animate-spin" /> : <Combine className="h-4 w-4" />}
                  {isGeneratingCombined ? (generationProgress || "Combining...") : "Combine Selected Topics into One Prompt"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {generatedPrompts.length > 0 && (
        <div className="space-y-4 animate-in slide-in-from-bottom-4">
          <h2 className="text-lg font-bold">{generatedPrompts.length} Prompt{generatedPrompts.length !== 1 ? "s" : ""}</h2>
          {generatedPrompts.map((p) => (
            <Card key={p.id} className="glass border-none">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground truncate">{p.label}</span>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" size="icon" onClick={() => copyPrompt(p.prompt)} title="Copy prompt"><Copy className="h-4 w-4" /></Button>
                    <button onClick={() => deletePrompt(p.id)} className="text-muted-foreground hover:text-destructive transition-colors p-2" title="Remove"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
                <Textarea value={p.prompt} onChange={(e) => updatePromptText(p.id, e.target.value)} className="glass border-white/10 text-sm min-h-[140px]" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
