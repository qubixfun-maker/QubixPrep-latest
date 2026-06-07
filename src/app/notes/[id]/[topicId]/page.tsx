
"use client"

import { useState, useMemo, use, useEffect } from "react"
import { useDoc, useFirestore } from "@/firebase"
import { doc } from "firebase/firestore"
import { 
  ArrowLeft, 
  Bookmark, 
  BrainCircuit, 
  Loader2,
  FileText,
  Sparkles,
  ChevronRight,
  PanelRightClose,
  Info,
  EyeOff,
  ShieldCheck,
  Maximize2,
  Minimize2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import Link from "next/link"
import { SummarizerPageContent } from "@/app/ai-tools/summarizer/page"

export default function NoteViewerPage({ params }: { params: Promise<{ id: string, topicId: string }> }) {
  const resolvedParams = use(params)
  const id = resolvedParams.id
  const topicId = resolvedParams.topicId
  
  const db = useFirestore()
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isFullView, setIsFullView] = useState(false)
  
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

  if (loading) {
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
          <p className="text-muted-foreground max-w-sm">This topic has been moved or access has been restricted by the admin.</p>
        </div>
        <Link href={`/notes/${id}`}>
          <Button variant="outline" className="rounded-xl glass border-white/10">Back to Subject</Button>
        </Link>
      </div>
    )
  }

  const topicData = topic as any

  const getViewerUrl = (url: string) => {
    if (topicData.contentType === 'pdf') {
       return `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;
    }
    return url;
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#000] text-white selection:bg-none select-none">
      <header className="h-14 border-b border-white/5 glass-darker flex items-center justify-between px-4 z-40 shrink-0">
        <div className="flex items-center gap-3">
          <Link href={`/notes/${id}`}>
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
            className="text-muted-foreground h-8 gap-2 hover:text-white hidden sm:flex"
            onClick={() => setIsFullView(!isFullView)}
          >
            {isFullView ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
            <span className="text-[10px] font-bold uppercase tracking-tighter">
              {isFullView ? 'Standard View' : 'Focus Mode'}
            </span>
          </Button>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="rounded-full bg-primary/10 border-primary/20 hover:bg-primary/20 gap-2 text-primary h-8 px-4 font-bold text-[11px] shadow-lg shadow-primary/5 transition-all">
                <Sparkles className="h-3.5 w-3.5" /> 
                <span className="hidden sm:inline uppercase">AI Analyze</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:max-w-lg glass-darker border-l border-white/10 p-0 overflow-y-auto">
              <div className="p-8 space-y-8">
                 <div className="flex items-center justify-between">
                   <h2 className="text-xl font-bold flex items-center gap-3">
                     <BrainCircuit className="h-6 w-6 text-primary" /> Concept Insight
                   </h2>
                   <SheetTrigger asChild>
                     <Button variant="ghost" size="icon" className="h-8 w-8 opacity-50 hover:opacity-100">
                       <PanelRightClose className="h-5 w-5" />
                     </Button>
                   </SheetTrigger>
                 </div>
                 
                 <div className="bg-white/5 rounded-2xl p-5 border border-white/5 space-y-3">
                   <div className="flex items-center justify-between">
                     <span className="text-[10px] font-bold text-accent uppercase tracking-widest flex items-center gap-1">
                       <Info className="h-3 w-3" /> Yield Report
                     </span>
                     <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${topicData.importance === 'Essential' || topicData.importance === 'High' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'}`}>
                       {topicData.importance} Yield
                     </span>
                   </div>
                   <p className="text-xs text-muted-foreground leading-relaxed">
                     This resource is optimized for <span className="text-white font-semibold">NEET-PG/USMLE</span> preparation. 
                   </p>
                 </div>
                 
                 <SummarizerPageContent />
              </div>
            </SheetContent>
          </Sheet>

          <div className="h-6 w-[1px] bg-white/10 mx-1 hidden sm:block" />

          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setIsBookmarked(!isBookmarked)}
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
              <div className="absolute top-0 right-0 w-48 h-16 z-20 pointer-events-auto cursor-default" />
              <iframe 
                src={getViewerUrl(topicData.contentUrl)} 
                className="w-full h-full border-none"
                title={topicData.title}
              />
            </div>
          ) : topicData.contentType === 'video' ? (
            <div className="flex-1 w-full flex items-center justify-center p-4">
              <div className={`relative aspect-video w-full transition-all duration-500 rounded-2xl overflow-hidden shadow-2xl bg-[#000] border border-white/5 ${isFullView ? 'max-w-none h-full' : 'max-w-5xl'}`}>
                <video controls className="w-full h-full" controlsList="nodownload" onContextMenu={(e) => e.preventDefault()}>
                  <source src={topicData.contentUrl} />
                </video>
              </div>
            </div>
          ) : topicData.contentType === 'image' ? (
            <div className="flex-1 w-full p-4 flex justify-center items-start overflow-auto">
               <img 
                 src={topicData.contentUrl} 
                 alt={topicData.title} 
                 className={`transition-all duration-500 rounded-xl shadow-2xl border border-white/5 pointer-events-none ${isFullView ? 'max-w-none w-full' : 'max-w-5xl w-full'}`}
                 onContextMenu={(e) => e.preventDefault()}
               />
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-8">
              <div className="p-10 rounded-full bg-primary/10 text-primary border border-primary/20">
                <FileText className="h-16 w-16" />
              </div>
              <h2 className="text-2xl font-bold">Clinical Resource Protected</h2>
            </div>
          )}
        </div>
      </div>
      
      <div className="h-8 glass-darker border-t border-white/5 flex items-center justify-between px-6 z-40 shrink-0">
        <div className="flex items-center gap-2 text-[8px] font-bold text-muted-foreground uppercase tracking-widest">
           <ShieldCheck className="h-3 w-3 text-accent" />
           Encrypted Learning Session
        </div>
        <div className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">
           Qubix Secure Reader v2.0
        </div>
      </div>
    </div>
  )
}
