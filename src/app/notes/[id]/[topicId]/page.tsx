"use client"

import { useState, useMemo, use, useEffect, useRef } from "react"
import { useDoc, useFirestore, useUser } from "@/firebase"
import { doc, setDoc, deleteDoc } from "firebase/firestore"
import { 
  ArrowLeft, 
  Bookmark, 
  BrainCircuit, 
  Loader2,
  FileText,
  Sparkles,
  ChevronRight,
  PanelRightClose,
  EyeOff,
  ShieldCheck,
  Maximize2,
  Minimize2,
  LayoutList,
  Network,
  Copy,
  Zap,
  Camera,
  X,
  Video,
  CheckCircle2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

// AI Flow Imports
import { aiNoteSummarizer } from "@/ai/flows/ai-note-summarizer"
import { generateQuizAndFlashcards, type GenerateQuizAndFlashcardsOutput } from "@/ai/flows/ai-quiz-flashcard-generator-flow"
import { generateMindMap, type MindMapGeneratorOutput } from "@/ai/flows/ai-mind-map-generator"
import { analyzeMedicalImage } from "@/ai/flows/ai-vision-analyzer"

export default function NoteViewerPage({ params }: { params: Promise<{ id: string, topicId: string }> }) {
  const { id, topicId } = use(params)
  
  const { user } = useUser()
  const db = useFirestore()
  const { toast } = useToast()
  
  const [isFullView, setIsFullView] = useState(false)
  
  // Progress State
  const progressRef = useMemo(() => (!db || !user) ? null : doc(db, 'users', user.uid, 'progress', topicId), [db, user, topicId])
  const { data: progress, loading: progressLoading } = useDoc(progressRef)
  const isCompleted = progress?.completed === true

  const bookmarkRef = useMemo(() => (!db || !user) ? null : doc(db, 'users', user.uid, 'bookmarks', topicId), [db, user, topicId])
  const { data: bookmarkData } = useDoc(bookmarkRef)
  const isBookmarked = !!bookmarkData

  // AI States
  const [inputText, setInputText] = useState("")
  const [isAiLoading, setIsAiLoading] = useState(false)
  const [summary, setSummary] = useState("")
  const [quizResults, setQuizResults] = useState<GenerateQuizAndFlashcardsOutput | null>(null)
  const [mindmapResult, setMindmapResult] = useState<MindMapGeneratorOutput | null>(null)
  const [visionResult, setVisionResult] = useState<string | null>(null)

  // Vision States
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey && (e.key === 's' || e.key === 'p' || e.key === 'u')) ||
        (e.metaKey && (e.key === 's' || e.key === 'p' || e.key === 'u'))
      ) {
        e.preventDefault();
      }
    };
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const topicRef = useMemo(() => (!db) ? null : doc(db, 'subjects', id, 'topics', topicId), [db, id, topicId])
  const { data: topic, loading } = useDoc(topicRef)

  if (loading || progressLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#0a0a0c]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 text-primary animate-spin" />
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest animate-pulse">Syncing Secure Canvas...</p>
        </div>
      </div>
    )
  }

  if (!topic) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-background space-y-6 p-6 text-center">
        <div className="p-4 rounded-full bg-destructive/10 text-destructive">
          <EyeOff className="h-10 w-10" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Resource Unavailable</h1>
          <p className="text-muted-foreground max-w-sm">This content is currently restricted.</p>
        </div>
        <Link href={`/notes/${id}`}>
          <Button variant="outline" className="rounded-xl glass border-white/10">Back to Subject</Button>
        </Link>
      </div>
    )
  }

  const topicData = topic as any

  const handleToggleComplete = async () => {
    if (!progressRef) return
    try {
      await setDoc(progressRef, { 
        completed: !isCompleted,
        type: topicData.contentType,
        subjectId: id,
        updatedAt: new Date().toISOString()
      }, { merge: true })
      toast({ 
        title: !isCompleted ? "Topic Mastered!" : "Progress Reset",
        description: !isCompleted ? "This topic has been added to your completed list." : "Topic status updated."
      })
    } catch (e: any) {
      toast({ variant: "destructive", title: "Update Failed", description: e.message })
    }
  }

  const handleToggleBookmark = async () => {
    if (!bookmarkRef) return
    try {
      if (isBookmarked) {
        await deleteDoc(bookmarkRef)
        toast({ title: "Bookmark Removed" })
      } else {
        await setDoc(bookmarkRef, {
          topicId,
          subjectId: id,
          title: topicData.title,
          type: topicData.contentType,
          savedAt: new Date().toISOString()
        })
        toast({ title: "Note Bookmarked" })
      }
    } catch (e: any) {
      toast({ variant: "destructive", title: "Action Failed" })
    }
  }

  const getViewerUrl = (url: string) => {
    if (topicData.contentType === 'pdf') {
       return `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;
    }
    if (topicData.contentType === 'video') {
       if (url.includes('youtube.com/watch?v=') || url.includes('youtu.be/')) {
         const videoId = url.split('v=')[1]?.split('&')[0] || url.split('/').pop();
         return `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`;
       }
    }
    return url;
  }

  // Vision Handler
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewImage(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  async function handleVisionAnalyze(task: 'summarize' | 'quiz' | 'map') {
    if (!previewImage) return
    setIsAiLoading(true)
    setVisionResult(null)
    try {
      const result = await analyzeMedicalImage({ imageDataUri: previewImage, task })
      setVisionResult(result)
      toast({ title: "Vision Scan Complete", description: "Text extracted and analyzed." })
    } catch (e) {
      toast({ variant: "destructive", title: "OCR Error", description: "Could not process image." })
    } finally {
      setIsAiLoading(false)
    }
  }

  // AI Action Handlers
  async function handleSummarize() {
    if (!inputText.trim()) return
    setIsAiLoading(true)
    try {
      const result = await aiNoteSummarizer({ noteContent: inputText })
      setSummary(result.summary)
    } catch (e) {
      toast({ variant: "destructive", title: "AI Error", description: "Summary failed." })
    } finally {
      setIsAiLoading(false)
    }
  }

  async function handleGenerateQuiz() {
    if (!inputText.trim()) return
    setIsAiLoading(true)
    try {
      const result = await generateQuizAndFlashcards({ studyTopic: inputText })
      setQuizResults(result)
    } catch (e) {
      toast({ variant: "destructive", title: "AI Error", description: "Quiz failed." })
    } finally {
      setIsAiLoading(false)
    }
  }

  async function handleGenerateMindmap() {
    if (!inputText.trim()) return
    setIsAiLoading(true)
    try {
      const result = await generateMindMap({ medicalText: inputText })
      setMindmapResult(result)
    } catch (e) {
      toast({ variant: "destructive", title: "AI Error", description: "Mapping failed." })
    } finally {
      setIsAiLoading(false)
    }
  }

  const isYoutube = topicData.contentType === 'video' && (topicData.contentUrl.includes('youtube.com') || topicData.contentUrl.includes('youtu.be'));

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#000] text-white selection:bg-none select-none">
      <header className="h-14 border-b border-white/5 glass-darker flex items-center justify-between px-4 z-40 shrink-0">
        <div className="flex items-center gap-3">
          <Link href={topicData.contentType === 'video' ? `/videos/${id}` : `/notes/${id}`}>
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-white/5">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex flex-col">
            <h1 className="font-bold text-sm truncate max-w-[140px] md:max-w-md">{topicData.title}</h1>
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
              <span className="text-accent">{id}</span>
              <ChevronRight className="h-2 w-2 opacity-50" />
              <span>{topicData.unitName || 'General'}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className={`h-8 gap-2 rounded-xl transition-all ${isCompleted ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'text-muted-foreground hover:text-white'}`}
            onClick={handleToggleComplete}
          >
            <CheckCircle2 className={`h-4 w-4 ${isCompleted ? 'fill-current' : ''}`} />
            <span className="hidden sm:inline text-[10px] font-bold uppercase tracking-tighter">
              {isCompleted ? 'Completed' : 'Mark as Done'}
            </span>
          </Button>

          <Button 
            variant="ghost" 
            size="sm" 
            className="text-muted-foreground h-8 gap-2 hover:text-white hidden sm:flex"
            onClick={() => setIsFullView(!isFullView)}
          >
            {isFullView ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
            <span className="text-[10px] font-bold uppercase tracking-tighter">
              {isFullView ? 'Standard' : 'Focus'}
            </span>
          </Button>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="rounded-full bg-primary/10 border-primary/20 hover:bg-primary/20 gap-2 text-primary h-8 px-4 font-bold text-[11px] shadow-lg shadow-primary/5 transition-all">
                <Sparkles className="h-3.5 w-3.5" /> 
                <span className="hidden sm:inline uppercase">AI Laboratory</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:max-w-xl glass-darker border-l border-white/10 p-0 overflow-y-auto">
              <SheetTitle className="sr-only">AI Study Intelligence</SheetTitle>
              <div className="p-8 space-y-8 pb-20">
                 <div className="flex items-center justify-between">
                   <h2 className="text-xl font-bold flex items-center gap-3">
                     <BrainCircuit className="h-6 w-6 text-primary" /> Qubix AI Insight
                   </h2>
                   <SheetTrigger asChild>
                     <Button variant="ghost" size="icon" className="h-8 w-8 opacity-50 hover:opacity-100">
                       <PanelRightClose className="h-5 w-5" />
                     </Button>
                   </SheetTrigger>
                 </div>
                 
                 <div className="bg-white/5 rounded-2xl p-5 border border-white/5 space-y-4">
                   <div className="flex items-center justify-between">
                     <span className="text-[10px] font-bold text-accent uppercase tracking-widest flex items-center gap-1">
                       <Zap className="h-3 w-3" /> Content Capture
                     </span>
                     <Badge variant="secondary" className="text-[9px] uppercase">{topicData.importance} Yield</Badge>
                   </div>
                   
                   {!previewImage ? (
                     <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-white/10 rounded-xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-white/5 transition-colors"
                     >
                       <Camera className="h-5 w-5 text-muted-foreground" />
                       <span className="text-[10px] font-bold uppercase text-muted-foreground">Scan Screenshot</span>
                       <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                     </div>
                   ) : (
                     <div className="relative rounded-xl overflow-hidden group">
                        <img src={previewImage} alt="Preview" className="w-full h-32 object-cover opacity-50" />
                        <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40">
                          <Button size="sm" variant="secondary" className="h-7 text-[9px] font-bold uppercase rounded-lg" onClick={() => handleVisionAnalyze('summarize')}>OCR Analyze</Button>
                          <Button size="icon" variant="destructive" className="h-7 w-7 rounded-full" onClick={() => setPreviewImage(null)}><X className="h-3 w-3" /></Button>
                        </div>
                     </div>
                   )}

                   <Textarea 
                     placeholder="Paste excerpts or type concepts to explore..."
                     className="min-h-[100px] glass border-white/5 text-xs resize-none"
                     value={inputText}
                     onChange={(e) => setInputText(e.target.value)}
                   />
                 </div>

                 <Tabs defaultValue="summary" className="w-full">
                    <TabsList className="glass grid grid-cols-3 h-12 p-1 rounded-xl mb-6">
                      <TabsTrigger value="summary" className="rounded-lg text-[10px] font-bold uppercase">Summary</TabsTrigger>
                      <TabsTrigger value="quiz" className="rounded-lg text-[10px] font-bold uppercase">Quiz</TabsTrigger>
                      <TabsTrigger value="map" className="rounded-lg text-[10px] font-bold uppercase">Mindmap</TabsTrigger>
                    </TabsList>

                    <TabsContent value="summary" className="space-y-6">
                       <Button onClick={handleSummarize} disabled={isAiLoading || !inputText.trim()} className="w-full rounded-xl bg-primary gap-2 h-11">
                         {isAiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                         Summarize Concepts
                       </Button>
                       {(summary || visionResult) && (
                         <div className="glass rounded-2xl p-6 border-white/5 animate-in slide-in-from-top-2">
                           <div className="prose prose-invert max-w-none text-sm leading-relaxed text-foreground/80 whitespace-pre-wrap">
                              {summary || visionResult}
                           </div>
                         </div>
                       )}
                    </TabsContent>

                    <TabsContent value="quiz" className="space-y-6">
                       <Button onClick={handleGenerateQuiz} disabled={isAiLoading || !inputText.trim()} className="w-full rounded-xl bg-accent text-background hover:bg-accent/90 gap-2 h-11">
                         {isAiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LayoutList className="h-4 w-4" />}
                         Generate Cases
                       </Button>
                       {quizResults && (
                         <div className="space-y-4 animate-in slide-in-from-top-2">
                           {quizResults.quizzes.slice(0, 3).map((q, i) => (
                             <div key={i} className="glass rounded-2xl p-5 border-white/5 space-y-3">
                               <p className="text-[11px] font-bold text-primary uppercase">Clinical Case {i+1}</p>
                               <p className="text-sm font-semibold">{q.question}</p>
                               <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20">
                                  <p className="text-[10px] font-bold text-green-400 uppercase">Answer: {q.correctAnswer}</p>
                               </div>
                             </div>
                           ))}
                         </div>
                       )}
                    </TabsContent>

                    <TabsContent value="map" className="space-y-6">
                       <Button onClick={handleGenerateMindmap} disabled={isAiLoading || !inputText.trim()} className="w-full rounded-xl bg-secondary gap-2 h-11 border border-white/5">
                         {isAiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Network className="h-4 w-4" />}
                         Relationship Map
                       </Button>
                       {mindmapResult && (
                         <div className="glass rounded-2xl p-6 border-white/5 animate-in zoom-in-95">
                           {mindmapResult.edges.map((e, i) => (
                             <div key={i} className="text-[11px] p-2.5 rounded-lg bg-black/20 flex items-center gap-2 mb-2">
                               <span className="font-bold text-accent">{e.source}</span>
                               <span className="text-muted-foreground opacity-50">→</span>
                               <span className="text-primary font-bold">{e.target}</span>
                             </div>
                           ))}
                         </div>
                       )}
                    </TabsContent>
                 </Tabs>
              </div>
            </SheetContent>
          </Sheet>

          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleToggleBookmark}
            className={`h-9 w-9 rounded-xl ${isBookmarked ? 'text-accent' : 'text-muted-foreground'}`}
          >
            <Bookmark className={`h-4.5 w-4.5 ${isBookmarked ? 'fill-current' : ''}`} />
          </Button>
        </div>
      </header>

      <div className="flex-1 flex flex-col overflow-hidden relative">
        <div className="absolute inset-0 bg-[#000] flex flex-col items-center overflow-auto scrollbar-hide">
          {topicData.contentType === 'pdf' ? (
            <div className={`w-full h-full transition-all duration-500 mx-auto shadow-2xl relative bg-white ${isFullView ? 'max-w-none' : 'max-w-6xl'}`}>
              <iframe 
                src={getViewerUrl(topicData.contentUrl)} 
                className="w-full h-full border-none"
                title={topicData.title}
              />
            </div>
          ) : topicData.contentType === 'video' ? (
            <div className="flex-1 w-full flex items-center justify-center p-4">
              <div className={`relative aspect-video w-full transition-all duration-500 rounded-2xl overflow-hidden shadow-2xl bg-[#000] border border-white/5 ${isFullView ? 'max-w-none h-full' : 'max-w-5xl'}`}>
                {isYoutube ? (
                  <iframe 
                    src={getViewerUrl(topicData.contentUrl)}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <video controls className="w-full h-full" controlsList="nodownload">
                    <source src={topicData.contentUrl} />
                  </video>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-8">
               <ShieldCheck className="h-16 w-16 text-primary" />
               <h2 className="text-2xl font-bold">Secure Content Protection Active</h2>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
