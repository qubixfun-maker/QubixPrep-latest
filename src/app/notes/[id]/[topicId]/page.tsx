
"use client"

import { useState, useMemo } from "react"
import { useDoc, useFirestore } from "@/firebase"
import { doc } from "firebase/firestore"
import { 
  ArrowLeft, 
  Bookmark, 
  Highlighter, 
  StickyNote, 
  BrainCircuit, 
  Settings, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Maximize2,
  Share2,
  FileDown,
  Loader2,
  X,
  ExternalLink
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import Link from "next/link"

export default function NoteViewerPage({ params }: { params: { id: string, topicId: string } }) {
  const db = useFirestore()
  const [isBookmarked, setIsBookmarked] = useState(false)
  
  const topicRef = useMemo(() => doc(db, 'subjects', params.id, 'topics', params.topicId), [db, params.id, params.topicId])
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
        <Link href={`/notes/${params.id}`}>
          <Button variant="outline">Return to Subject</Button>
        </Link>
      </div>
    )
  }

  const topicData = topic as any

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      {/* Top Navigation / Toolbar */}
      <header className="h-16 border-b border-white/10 glass flex items-center justify-between px-6 z-20 shrink-0">
        <div className="flex items-center gap-6">
          <Link href={`/notes/${params.id}`}>
            <Button variant="ghost" size="icon" className="rounded-xl hover:bg-white/5">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="font-bold text-sm truncate max-w-[200px] md:max-w-md">{topicData.title}</h1>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{params.id} • {topicData.unitName || 'General'}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <TooltipProvider>
            <div className="flex items-center gap-2">
              <Link href="/ai-tools/summarizer">
                <Button variant="outline" size="sm" className="hidden lg:flex rounded-xl glass border-primary/20 hover:bg-primary/10 gap-2 text-primary">
                  <BrainCircuit className="h-4 w-4" /> AI Summarize
                </Button>
              </Link>

              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsBookmarked(!isBookmarked)}
                className={`rounded-xl ${isBookmarked ? 'text-accent' : 'text-muted-foreground'}`}
              >
                <Bookmark className={`h-5 w-5 ${isBookmarked ? 'fill-current' : ''}`} />
              </Button>
              <Button variant="ghost" size="icon" className="rounded-xl text-muted-foreground" asChild>
                <a href={topicData.contentUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-5 w-5" />
                </a>
              </Button>
            </div>
          </TooltipProvider>
        </div>
      </header>

      {/* Main Viewer Area */}
      <div className="flex-1 flex flex-col overflow-hidden relative bg-[#1e1a26]">
        {topicData.contentType === 'pdf' ? (
          <iframe 
            src={`${topicData.contentUrl}#toolbar=0`} 
            className="w-full h-full border-none"
            title={topicData.title}
          />
        ) : topicData.contentType === 'video' ? (
          <div className="flex-1 flex items-center justify-center p-4 md:p-12">
            <video controls className="max-w-4xl w-full rounded-3xl shadow-2xl">
              <source src={topicData.contentUrl} />
              Your browser does not support the video tag.
            </video>
          </div>
        ) : topicData.contentType === 'image' ? (
          <div className="flex-1 overflow-auto p-4 md:p-12 flex justify-center items-start">
             <img src={topicData.contentUrl} alt={topicData.title} className="max-w-full rounded-2xl shadow-2xl" />
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-6">
            <FileText className="h-20 w-20 text-muted-foreground opacity-20" />
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Document Ready</h2>
              <p className="text-muted-foreground">This resource type ({topicData.contentType}) is best viewed externally.</p>
            </div>
            <Button size="lg" className="rounded-xl px-10" asChild>
              <a href={topicData.contentUrl} target="_blank" rel="noopener noreferrer">
                Open Resource <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </div>
        )}

        {/* Floating Controls */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-4 glass p-2 rounded-2xl border-white/10 shadow-2xl z-30">
          <Button variant="ghost" size="sm" className="rounded-xl gap-2 text-muted-foreground hover:text-white px-4" asChild>
             <a href={topicData.contentUrl} download={topicData.title}>
               <FileDown className="h-4 w-4" /> Download
             </a>
          </Button>
          <div className="w-[1px] h-6 bg-white/10" />
          <Button variant="ghost" size="icon" className="rounded-xl h-10 w-10 text-muted-foreground hover:text-white" onClick={() => window.print()}>
            <Maximize2 className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  )
}
