"use client"

import { useState, useMemo } from "react"
import { useUser, useDoc, useFirestore, useCollection } from "@/firebase"
import { doc, collection, query, orderBy, getDocs, setDoc, deleteDoc, serverTimestamp } from "firebase/firestore"
import { generateFlashcards, type FlashcardPair } from "@/ai/flows/ai-flashcard-generator"
import { extractChapterTopics } from "@/ai/flows/ai-chapter-topic-extractor"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Lock, ArrowLeft, Layers, Sparkles, Save, Trash2, ListTree, ChevronDown, ChevronUp, FolderOpen } from "lucide-react"
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

type GeneratedCard = FlashcardPair & { topic?: string }

export default function FlashcardGeneratorPage() {
  const { user, loading: authLoading } = useUser()
  const db = useFirestore()
  const { toast } = useToast()

  const profileRef = useMemo(() => (!db || !user) ? null : doc(db, 'users', user.uid), [db, user])
  const { data: profile, loading: profileLoading } = useDoc(profileRef)

  const textbooksQuery = useMemo(() => (!db) ? null : query(collection(db, 'textbooks'), orderBy('createdAt', 'desc')), [db])
  const { data: textbooks, loading: textbooksLoading } = useCollection(textbooksQuery)

  const subjectsQuery = useMemo(() => (!db) ? null : query(collection(db, 'subjects'), orderBy('name', 'asc')), [db])
  const { data: subjects } = useCollection(subjectsQuery)

  // --- Manage existing flashcards ---
  const [manageSubjectId, setManageSubjectId] = useState("")
  const [expandedChapter, setExpandedChapter] = useState<string | null>(null)
  const [deletingKey, setDeletingKey] = useState<string | null>(null)

  const manageDecksQuery = useMemo(
    () => (!db || !manageSubjectId) ? null : collection(db, 'subjects', manageSubjectId, 'flashcardDecks'),
    [db, manageSubjectId]
  )
  const { data: manageDecks, loading: manageDecksLoading } = useCollection(manageDecksQuery)

  const manageChapters = useMemo(() => {
    const groups: Record<string, any[]> = {}
    ;(manageDecks || []).forEach((d: any) => {
      const key = (d.chapterName || d.title || "Untitled").trim()
      if (!groups[key]) groups[key] = []
      groups[key].push(d)
    })
    return Object.entries(groups).map(([chapterName, decks]) => ({
      chapterName,
      decks,
      cardCount: decks.reduce((sum, d) => sum + (d.cardCount ?? (d.cards?.length ?? 0)), 0),
    }))
  }, [manageDecks])

  async function handleDeleteChapterDecks(chapterName: string, decks: any[]) {
    if (!confirm(`Delete the entire chapter "${chapterName}"? This removes all ${decks.length} topic deck(s) and every card in them. This cannot be undone.`)) return
    setDeletingKey(chapterName)
    try {
      await Promise.all(decks.map((d: any) => deleteDoc(doc(db!, 'subjects', manageSubjectId, 'flashcardDecks', d.id))))
      toast({ title: "Chapter Deleted", description: `"${chapterName}" and its ${decks.length} deck(s) were removed.` })
      if (expandedChapter === chapterName) setExpandedChapter(null)
    } catch (e: any) {
      toast({ variant: "destructive", title: "Delete Failed", description: e.message })
    } finally {
      setDeletingKey(null)
    }
  }

  async function handleDeleteSingleDeck(deckId: string, label: string) {
    if (!confirm(`Delete the deck "${label}"? This cannot be undone.`)) return
    setDeletingKey(deckId)
    try {
      await deleteDoc(doc(db!, 'subjects', manageSubjectId, 'flashcardDecks', deckId))
      toast({ title: "Deck Deleted" })
    } catch (e: any) {
      toast({ variant: "destructive", title: "Delete Failed", description: e.message })
    } finally {
      setDeletingKey(null)
    }
  }


  // --- Chapter matching ---
  const [selectedTextbookIds, setSelectedTextbookIds] = useState<string[]>([])
  const [referenceChapterName, setReferenceChapterName] = useState("")
  const [isMatchingChapters, setIsMatchingChapters] = useState(false)
  const [matchedChapters, setMatchedChapters] = useState<Record<string, any>>({})
  const [chapterOptionsByTextbook, setChapterOptionsByTextbook] = useState<Record<string, any[]>>({})

  function toggleTextbookSelection(id: string) {
    setSelectedTextbookIds((prev) => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
    setMatchedChapters({})
    setExtractedTopics([])
    setTopicSelections({})
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
      setTopicSelections({})
      toast({ title: "Chapters Matched", description: "Review below, then extract topics or generate flashcards." })
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
    setTopicSelections({})
  }

  function buildMatchedSources() {
    return selectedTextbookIds.map(id => {
      const tb = textbooks?.find((t: any) => t.id === id)
      const ch = matchedChapters[id]
      return ch ? { textbookTitle: tb?.title || id, chapterTitle: ch.title, text: ch.text } : null
    }).filter(Boolean) as { textbookTitle: string; chapterTitle: string; text: string }[]
  }

  // --- Topic extraction ---
  const [isExtractingTopics, setIsExtractingTopics] = useState(false)
  const [extractedTopics, setExtractedTopics] = useState<string[]>([])
  const [topicSelections, setTopicSelections] = useState<Record<string, number>>({})

  async function handleExtractTopics() {
    const sources = buildMatchedSources()
    if (sources.length === 0) {
      toast({ variant: "destructive", title: "Match a chapter first" })
      return
    }
    setIsExtractingTopics(true)
    setExtractedTopics([])
    setTopicSelections({})
    try {
      const result = await extractChapterTopics({ sources })
      if (result.error || result.topics.length === 0) {
        toast({ variant: "destructive", title: "Topic Extraction Failed", description: result.error || "No topics returned." })
      } else {
        setExtractedTopics(result.topics)
        toast({ title: "Topics Found", description: `${result.topics.length} topic(s) - select which ones you want cards for.` })
      }
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message })
    } finally {
      setIsExtractingTopics(false)
    }
  }

  function toggleTopicSelection(topic: string) {
    setTopicSelections((prev) => {
      const next = { ...prev }
      if (topic in next) {
        delete next[topic]
      } else {
        next[topic] = 5
      }
      return next
    })
  }

  function setTopicCardCount(topic: string, count: number) {
    setTopicSelections((prev) => ({ ...prev, [topic]: count }))
  }

  function toggleSelectAllTopics() {
    setTopicSelections((prev) => {
      const allSelected = extractedTopics.length > 0 && extractedTopics.every((t) => t in prev)
      if (allSelected) return {}
      const next: Record<string, number> = { ...prev }
      extractedTopics.forEach((t) => { if (!(t in next)) next[t] = 5 })
      return next
    })
  }

  // --- Organization + generation ---
  const [genSubject, setGenSubject] = useState("")
  const [genUnit, setGenUnit] = useState("")
  const [genChapterLabel, setGenChapterLabel] = useState("")
  const [genTopic, setGenTopic] = useState("")
  const [topicFocus, setTopicFocus] = useState("")
  const [cardCount, setCardCount] = useState(15)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState("")
  const [generatedCards, setGeneratedCards] = useState<GeneratedCard[]>([])
  const [isSaving, setIsSaving] = useState(false)

  const selectedTopicList = Object.keys(topicSelections)

  async function handleGenerate() {
    const sources = buildMatchedSources()
    if (sources.length === 0 || !genSubject || !genChapterLabel.trim()) {
      toast({ variant: "destructive", title: "Missing info", description: "Match at least one chapter and fill Subject/Chapter." })
      return
    }
    setIsGenerating(true)
    setGeneratedCards([])

    try {
      if (selectedTopicList.length > 0) {
        // Per-topic generation: one batch per selected topic, run sequentially.
        const allCards: GeneratedCard[] = []
        for (const topic of selectedTopicList) {
          const count = topicSelections[topic] || 5
          setGenerationProgress(`Generating "${topic}" (${count} cards)...`)
          const result = await generateFlashcards({ sources, topicFocus: topic, cardCount: count })
          if (result.error || result.cards.length === 0) {
            toast({ variant: "destructive", title: `Failed on "${topic}"`, description: result.error || "No cards returned." })
            continue
          }
          allCards.push(...result.cards.map(c => ({ ...c, topic })))
        }
        setGeneratedCards(allCards)
        if (allCards.length > 0) {
          toast({ title: "Generated", description: `${allCards.length} card(s) across ${selectedTopicList.length} topic(s) ready to review.` })
        }
      } else {
        // Fallback: single batch covering the whole chapter (or the manual Focus field).
        const result = await generateFlashcards({ sources, topicFocus, cardCount })
        if (result.error || result.cards.length === 0) {
          toast({ variant: "destructive", title: "Generation Failed", description: result.error || "No cards returned." })
        } else {
          setGeneratedCards(result.cards.map(c => ({ ...c, topic: genTopic.trim() || undefined })))
          toast({ title: "Generated", description: `${result.cards.length} card(s) ready to review.` })
        }
      }
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message })
    } finally {
      setIsGenerating(false)
      setGenerationProgress("")
    }
  }

  function updateCard(index: number, field: "front" | "back", value: string) {
    setGeneratedCards((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], [field]: value }
      return next
    })
  }

  function deleteCard(index: number) {
    setGeneratedCards((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSave() {
    if (!db || !genSubject || !genChapterLabel.trim() || generatedCards.length === 0) return
    setIsSaving(true)
    try {
      const subjectId = genSubject.toLowerCase().replace(/\s+/g, '-')

      // Group cards by topic (cards with no topic fall under the chapter-level label).
      const groups = new Map<string, GeneratedCard[]>()
      for (const c of generatedCards) {
        const key = c.topic?.trim() || ""
        if (!groups.has(key)) groups.set(key, [])
        groups.get(key)!.push(c)
      }

      let totalSaved = 0
      for (const [topicName, cards] of groups.entries()) {
        const deckSlugParts = [genUnit, genChapterLabel, topicName].filter(Boolean).join(' ')
        const deckId = deckSlugParts.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now() + '-' + Math.floor(Math.random() * 1000)
        const cardsWithIds = cards.map((c, i) => ({ id: `c${i}`, front: c.front, back: c.back }))

        await setDoc(doc(db, 'subjects', subjectId, 'flashcardDecks', deckId), {
          unitName: genUnit.trim() || null,
          chapterName: genChapterLabel.trim(),
          topicName: topicName || null,
          title: topicName || genChapterLabel.trim(),
          cards: cardsWithIds,
          cardCount: cardsWithIds.length,
          createdAt: serverTimestamp(),
        })
        totalSaved += cardsWithIds.length
      }

      toast({ title: "Saved", description: `${totalSaved} card(s) saved across ${groups.size} deck(s).` })
      setGeneratedCards([])
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
            <Layers className="h-6 w-6 text-primary" /> Flashcard Generator
          </h1>
          <p className="text-sm text-muted-foreground">Generate flashcards from your already-ingested textbooks, organized by subject/unit/chapter/topic.</p>
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
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><ListTree className="h-4 w-4" /> 2. Pick Topics (optional)</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">Extract the sub-topics inside the matched chapter, then choose which ones to make cards for and how many cards each gets. Skip this step to generate one mixed batch covering the whole chapter instead.</p>
          <div className="flex gap-2 flex-wrap">
            <Button onClick={handleExtractTopics} disabled={isExtractingTopics || Object.values(matchedChapters).every(v => !v)} variant="secondary" className="gap-2">
              {isExtractingTopics ? <Loader2 className="h-4 w-4 animate-spin" /> : <ListTree className="h-4 w-4" />}
              {isExtractingTopics ? "Extracting..." : "Extract Topics From Chapter"}
            </Button>
            {extractedTopics.length > 0 && (
              <Button onClick={toggleSelectAllTopics} variant="outline" className="gap-2">
                {selectedTopicList.length === extractedTopics.length ? "Deselect All" : "Select All"}
              </Button>
            )}
          </div>

          {extractedTopics.length > 0 && (
            <div className="space-y-2">
              {extractedTopics.map((topic) => {
                const selected = topic in topicSelections
                return (
                  <div key={topic} className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${selected ? "bg-primary/10 border-primary/40" : "glass border-white/10"}`}>
                    <input type="checkbox" checked={selected} onChange={() => toggleTopicSelection(topic)} />
                    <span className="text-sm font-medium flex-1 truncate">{topic}</span>
                    {selected && (
                      <div className="flex items-center gap-2 shrink-0">
                        <Label className="text-xs text-muted-foreground">Cards:</Label>
                        <Input
                          type="number"
                          min={1}
                          max={50}
                          value={topicSelections[topic]}
                          onChange={(e) => setTopicCardCount(topic, parseInt(e.target.value) || 1)}
                          className="glass border-white/10 w-20 h-8 text-sm"
                        />
                      </div>
                    )}
                  </div>
                )
              })}
              {selectedTopicList.length > 0 && (
                <p className="text-xs text-primary font-medium">
                  {selectedTopicList.length} topic(s) selected - {selectedTopicList.reduce((sum, t) => sum + (topicSelections[t] || 0), 0)} cards total.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="glass border-none">
        <CardHeader><CardTitle className="text-base">3. Organize & Generate</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
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
              <Label>Unit (optional)</Label>
              <Input placeholder="e.g., Unit I" value={genUnit} onChange={(e) => setGenUnit(e.target.value)} className="glass border-white/10" />
            </div>
            <div className="space-y-2">
              <Label>Chapter</Label>
              <Input placeholder="e.g., Cell Injury" value={genChapterLabel} onChange={(e) => setGenChapterLabel(e.target.value)} className="glass border-white/10" />
            </div>
            <div className="space-y-2">
              <Label>Topic (optional - used only if no topics selected above)</Label>
              <Input placeholder="e.g., ATP Depletion" value={genTopic} onChange={(e) => setGenTopic(e.target.value)} className="glass border-white/10" disabled={selectedTopicList.length > 0} />
            </div>
          </div>
          {selectedTopicList.length === 0 && (
            <>
              <div className="space-y-2">
                <Label>Focus (optional - leave blank to cover the whole matched chapter)</Label>
                <Input placeholder="e.g., only the mechanisms of cell injury" value={topicFocus} onChange={(e) => setTopicFocus(e.target.value)} className="glass border-white/10" />
              </div>
              <div className="space-y-2">
                <Label>Number of Cards</Label>
                <Input type="number" min={1} max={50} value={cardCount} onChange={(e) => setCardCount(parseInt(e.target.value) || 15)} className="glass border-white/10 w-32" />
              </div>
            </>
          )}
          {selectedTopicList.length > 0 && (
            <p className="text-xs text-muted-foreground">Using your {selectedTopicList.length} selected topic(s) above - one batch will be generated per topic.</p>
          )}
          <Button onClick={handleGenerate} disabled={isGenerating || Object.values(matchedChapters).every(v => !v) || !genSubject || !genChapterLabel.trim()} className="w-full h-12 gap-2">
            {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {isGenerating ? (generationProgress || "Generating...") : "Generate Flashcards"}
          </Button>
        </CardContent>
      </Card>

      {generatedCards.length > 0 && (
        <div className="space-y-4 animate-in slide-in-from-bottom-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">{generatedCards.length} Card{generatedCards.length !== 1 ? "s" : ""}</h2>
            <Button onClick={handleSave} disabled={isSaving} className="gap-2">
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {isSaving ? "Saving..." : "Save Deck"}
            </Button>
          </div>
          {generatedCards.map((card, i) => (
            <Card key={i} className="glass border-none">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    Card {i + 1}{card.topic ? ` - ${card.topic}` : ""}
                  </span>
                  <button onClick={() => deleteCard(i)} className="text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground">Front</Label>
                  <Input value={card.front} onChange={(e) => updateCard(i, "front", e.target.value)} className="glass border-white/10 text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground">Back</Label>
                  <Input value={card.back} onChange={(e) => updateCard(i, "back", e.target.value)} className="glass border-white/10 text-sm" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
