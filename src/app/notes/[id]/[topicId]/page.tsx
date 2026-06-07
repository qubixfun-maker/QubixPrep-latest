
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
  ListRestart
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import Link from "next/link"
import { SummarizerPageContent } from "@/app/ai-tools/summarizer/page"

export default function NoteViewerPage({ params }: { params: Promise<{ id: string, topicId: string }> }) {
  const { id, topicId } = use(params)
  const db = useFirestore()
  const [isBookmarked, setIsBookmarked] = useState(false)
  
  const topicRef = useMemo(() => doc(db, 'subjects', id, 'topics', topicId), [db, id, topicId])
  const { data: topic, loading } = useDoc(topicRef)

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
      </div>
    )
  }

  if (!topic) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-background space-y-4">
        <h1 className="text-2xl font-bold">Topic Not Found</h1>
        <Link href={`/notes/${id}`}>
          <Button variant="outline">Return to Subject</Button>
        </Link>
      </div>
    )
  }

  const topicData = topic as any

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#0a0a0c]">
      {/* Immersive Header - Inspired by Premium Learning Apps */}
      <header className="h-14 border-b border-white/5 glass flex items-center justify-between px-4 z-40 shrink-0">
        <div className="flex items-center gap-4">
          <Link href={`/notes/${id}`}>
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-white/5">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <div className="hidden md:flex flex-col">
              <h1 className="font-bold text-xs truncate max-w-[150px] md:max-w-xs">{topicData.title}</h1>
              <p className="text-[9px] text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                {id} <ChevronRight className="h-2 w-2" /> {topicData.unitName || 'General'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <TooltipProvider>
            {/* AI Sidebar Integration */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="rounded-full bg-primary/10 border-primary/20 hover:bg-primary/20 gap-2 text-primary h-8 px-4">
                  <BrainCircuit className="h-3.5 w-3.5" /> 
                  <span className="hidden sm:inline">AI Analysis</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-full sm:max-w-lg glass border-l border-white/5 p-0 overflow-y-auto">
                <div className="p-6">
                   <h2 className="text-xl font-bold flex items-center gap-2 mb-6">
                     <Sparkles className="h-5 w-5 text-primary" /> Topic Insight
                   </h2>
                   <div className="bg-white/5 rounded-2xl p-4 border border-white/5 mb-6">
                     <p className="text-xs font-bold text-accent uppercase tracking-widest mb-2">Topic Context</p>
                     <p className="text-sm text-muted-foreground leading-relaxed">
                       You are currently studying <strong>{topicData.title}</strong> within the <strong>{id}</strong> curriculum. 
                       This topic is flagged as <strong>{topicData.importance}</strong> yield.
                     </p>
                   </div>
                   <SummarizerPageContent />
                </div>
              </SheetContent>
            </Sheet>

            <div className="h-6 w-[1px] bg-white/5 mx-2" />

            <div className="flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsBookmarked(!isBookmarked)}
                className={`h-9 w-9 rounded-xl ${isBookmarked ? 'text-accent' : 'text-muted-foreground'}`}
              >
                <Bookmark className={`h-4 w-4 ${isBookmarked ? 'fill-current' : ''}`} />
              </Button>
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-muted-foreground" asChild>
                <a href={topicData.contentUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </TooltipProvider>
        </div>
      </header>

      {/* Content Canvas */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <div className="absolute inset-0 bg-[#121214] flex flex-col items-center overflow-auto scrollbar-hide">
          {topicData.contentType === 'pdf' ? (
            <div className="w-full h-full max-w-5xl mx-auto shadow-2xl">
              <iframe 
                src={`${topicData.contentUrl}#toolbar=0&navpanes=0&scrollbar=0`} 
                className="w-full h-full border-none bg-white"
                title={topicData.title}
              />
            </div>
          ) : topicData.contentType === 'video' ? (
            <div className="flex-1 w-full flex items-center justify-center p-4">
              <div className="relative aspect-video w-full max-w-5xl rounded-2xl overflow-hidden shadow-2xl bg-black group">
                <video controls className="w-full h-full">
                  <source src={topicData.contentUrl} />
                  Your browser does not support the video tag.
                </video>
              </div>
            </div>
          ) : topicData.contentType === 'image' ? (
            <div className="flex-1 w-full p-4 flex justify-center items-start">
               <img src={topicData.contentUrl} alt={topicData.title} className="max-w-full rounded-lg shadow-2xl" />
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-6">
              <FileText className="h-16 w-16 text-muted-foreground opacity-20" />
              <div className="space-y-2">
                <h2 className="text-xl font-bold">Document Ready</h2>
                <p className="text-sm text-muted-foreground">This resource type is optimized for external viewing.</p>
              </div>
              <Button size="lg" className="rounded-xl px-10 bg-primary hover:bg-primary/90" asChild>
                <a href={topicData.contentUrl} target="_blank" rel="noopener noreferrer">
                  Launch Reader <ExternalLink className="ml-2 h-3.5 w-3.5" />
                </a>
              </Button>
            </div>
          )}
        </div>

        {/* Floating Productivity Dock */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 glass p-1.5 rounded-full border-white/5 shadow-2xl z-30 animate-in slide-in-from-bottom-4 duration-500">
          <Button variant="ghost" size="sm" className="rounded-full h-9 px-4 gap-2 text-xs font-bold text-muted-foreground hover:text-white" asChild>
             <a href={topicData.contentUrl} download={topicData.title}>
               <FileDown className="h-3.5 w-3.5" /> Download
             </a>
          </Button>
          <div className="w-[1px] h-4 bg-white/10" />
          <Button variant="ghost" size="icon" className="rounded-full h-9 w-9 text-muted-foreground hover:text-white" onClick={() => window.print()}>
            <Maximize2 className="h-3.5 w-3.5" />
          </Button>
          <div className="w-[1px] h-4 bg-white/10" />
          <Button variant="ghost" size="icon" className="rounded-full h-9 w-9 text-muted-foreground hover:text-white" onClick={() => window.location.reload()}>
            <ListRestart className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  )
}
