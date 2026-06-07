
"use client"

import { useState, useMemo, use } from "react"
import { useDoc, useFirestore } from "@/firebase"
import { doc } from "firebase/firestore"
import { 
  ArrowLeft, 
  Bookmark, 
  BrainCircuit, 
  Maximize2,
  FileDown,
  Loader2,
  ExternalLink,
  FileText,
  Sparkles,
  ChevronRight,
  ListRestart,
  PanelRightClose,
  Download,
  EyeOff
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import Link from "next/link"
import { SummarizerPageContent } from "@/app/ai-tools/summarizer/page"

export default function NoteViewerPage({ params }: { params: Promise<{ id: string, topicId: string }> }) {
  const { id, topicId } = use(params)
  const db = useFirestore()
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [loadError, setLoadError] = useState(false)
  
  const topicRef = useMemo(() => (!db) ? null : doc(db, 'subjects', id, 'topics', topicId), [db, id, topicId])
  const { data: topic, loading } = useDoc(topicRef)

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#0a0a0c]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 text-primary animate-spin" />
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest animate-pulse">Initializing Study Canvas...</p>
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
          <h1 className="text-2xl font-bold">Topic Not Found</h1>
          <p className="text-muted-foreground max-w-sm">This resource might have been moved or deleted by an administrator.</p>
        </div>
        <Link href={`/notes/${id}`}>
          <Button variant="outline" className="rounded-xl glass border-white/10">Return to Subject</Button>
        </Link>
      </div>
    )
  }

  const topicData = topic as any

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#0a0a0c] text-white">
      {/* Immersive Mobile-First Header */}
      <header className="h-14 border-b border-white/5 glass-darker flex items-center justify-between px-4 z-40 shrink-0">
        <div className="flex items-center gap-3">
          <Link href={`/notes/${id}`}>
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-white/5">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex flex-col">
            <h1 className="font-bold text-sm truncate max-w-[140px] md:max-w-md">{topicData.title}</h1>
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
              <span className="text-primary">{id}</span>
              <ChevronRight className="h-2.5 w-2.5 opacity-50" />
              <span>{topicData.unitName || 'General'}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <TooltipProvider>
            {/* AI Insight Sidebar */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="rounded-full bg-accent/10 border-accent/20 hover:bg-accent/20 gap-2 text-accent h-8 px-4 font-bold text-[11px] shadow-lg shadow-accent/5">
                  <Sparkles className="h-3.5 w-3.5" /> 
                  <span className="hidden sm:inline uppercase">Analyze</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-full sm:max-w-lg glass-darker border-l border-white/10 p-0 overflow-y-auto">
                <div className="p-8 space-y-8">
                   <div className="flex items-center justify-between">
                     <h2 className="text-xl font-bold flex items-center gap-3">
                       <BrainCircuit className="h-6 w-6 text-accent" /> Concept Insight
                     </h2>
                     <SheetTrigger asChild>
                       <Button variant="ghost" size="icon" className="h-8 w-8 opacity-50 hover:opacity-100">
                         <PanelRightClose className="h-5 w-5" />
                       </Button>
                     </SheetTrigger>
                   </div>
                   
                   <div className="bg-white/5 rounded-2xl p-5 border border-white/5 space-y-3">
                     <div className="flex items-center justify-between">
                       <span className="text-[10px] font-bold text-accent uppercase tracking-widest">Yield Report</span>
                       <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${topicData.importance === 'Essential' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'}`}>
                         {topicData.importance} Yield
                       </span>
                     </div>
                     <p className="text-xs text-muted-foreground leading-relaxed">
                       This topic is part of the <span className="text-white font-semibold">{id}</span> core curriculum. 
                       Focus on diagnostic patterns and high-yield clinical correlations.
                     </p>
                   </div>
                   
                   <SummarizerPageContent />
                </div>
              </SheetContent>
            </Sheet>

            <div className="h-6 w-[1px] bg-white/10 mx-2 hidden sm:block" />

            <div className="flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsBookmarked(!isBookmarked)}
                className={`h-9 w-9 rounded-xl ${isBookmarked ? 'text-accent' : 'text-muted-foreground'}`}
              >
                <Bookmark className={`h-4.5 w-4.5 ${isBookmarked ? 'fill-current' : ''}`} />
              </Button>
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-muted-foreground" asChild>
                <a href={topicData.contentUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4.5 w-4.5" />
                </a>
              </Button>
            </div>
          </TooltipProvider>
        </div>
      </header>

      {/* Main Study Canvas */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <div className="absolute inset-0 bg-[#000] flex flex-col items-center overflow-auto scrollbar-hide">
          {topicData.contentType === 'pdf' ? (
            <div className="w-full h-full max-w-5xl mx-auto shadow-2xl relative">
              {!loadError ? (
                <embed 
                  src={topicData.contentUrl} 
                  type="application/pdf"
                  className="w-full h-full border-none"
                  onError={() => setLoadError(true)}
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full p-12 text-center space-y-6">
                  <div className="p-6 rounded-full bg-white/5 text-muted-foreground">
                    <EyeOff className="h-12 w-12" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-xl font-bold">Preview Blocked</h2>
                    <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                      Chrome's built-in PDF viewer is blocking the direct embed. You can view it in a new window or download it.
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button variant="default" className="rounded-xl bg-primary hover:bg-primary/90 px-8" asChild>
                      <a href={topicData.contentUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="mr-2 h-4 w-4" /> Open External
                      </a>
                    </Button>
                    <Button variant="outline" className="rounded-xl glass border-white/10 px-8" asChild>
                      <a href={topicData.contentUrl} download={topicData.title}>
                        <Download className="mr-2 h-4 w-4" /> Download
                      </a>
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : topicData.contentType === 'video' ? (
            <div className="flex-1 w-full flex items-center justify-center p-4">
              <div className="relative aspect-video w-full max-w-5xl rounded-3xl overflow-hidden shadow-2xl bg-[#000] border border-white/5">
                <video controls className="w-full h-full" poster="https://picsum.photos/seed/video/1280/720">
                  <source src={topicData.contentUrl} />
                  Your browser does not support the video tag.
                </video>
              </div>
            </div>
          ) : topicData.contentType === 'image' ? (
            <div className="flex-1 w-full p-6 flex justify-center items-start overflow-auto">
               <img src={topicData.contentUrl} alt={topicData.title} className="max-w-full rounded-2xl shadow-2xl border border-white/5" />
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-8 animate-in zoom-in-95 duration-700">
              <div className="p-10 rounded-full bg-primary/10 text-primary border border-primary/20">
                <FileText className="h-16 w-16" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold">Medical Resource Ready</h2>
                <p className="text-sm text-muted-foreground max-w-sm">
                  This document type ({topicData.contentType}) is optimized for external viewing or offline study.
                </p>
              </div>
              <div className="flex gap-4">
                <Button size="lg" className="rounded-2xl px-12 bg-primary hover:bg-primary/90 h-14 font-bold text-lg shadow-xl shadow-primary/20" asChild>
                  <a href={topicData.contentUrl} target="_blank" rel="noopener noreferrer">
                    Open Reader <ExternalLink className="ml-2 h-5 w-5" />
                  </a>
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Floating Productivity Dock - PW/Marrow Style */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-1.5 glass-darker p-1.5 rounded-full border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-30 animate-in slide-in-from-bottom-8 duration-700">
          <Button variant="ghost" size="sm" className="rounded-full h-10 px-6 gap-2 text-xs font-bold text-muted-foreground hover:text-white hover:bg-white/5" asChild>
             <a href={topicData.contentUrl} download={topicData.title}>
               <FileDown className="h-4 w-4" /> <span className="hidden sm:inline">Offline</span>
             </a>
          </Button>
          <div className="w-[1px] h-4 bg-white/10" />
          <Button variant="ghost" size="icon" className="rounded-full h-10 w-10 text-muted-foreground hover:text-white hover:bg-white/5" onClick={() => window.print()}>
            <Maximize2 className="h-4 w-4" />
          </Button>
          <div className="w-[1px] h-4 bg-white/10" />
          <Button variant="ghost" size="icon" className="rounded-full h-10 w-10 text-muted-foreground hover:text-white hover:bg-white/5" onClick={() => window.location.reload()}>
            <ListRestart className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
