"use client"

import { useState, useEffect } from "react"
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
  FileDown
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import Link from "next/link"

export default function NoteViewerPage({ params }: { params: { id: string, topicId: string } }) {
  const [page, setPage] = useState(1)
  const totalPages = 42
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [activeTool, setActiveTool] = useState<string | null>(null)

  // Automatic last-page memory simulation
  useEffect(() => {
    const saved = localStorage.getItem(`note-${params.topicId}-page`)
    if (saved) setPage(parseInt(saved))
  }, [params.topicId])

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return
    setPage(newPage)
    localStorage.setItem(`note-${params.topicId}-page`, newPage.toString())
  }

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
            <h1 className="font-bold text-sm truncate max-w-[200px] md:max-w-md">Connective Tissues - Detailed Histology</h1>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{params.id} • Unit 3</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <TooltipProvider>
            <div className="hidden md:flex items-center gap-1 p-1 rounded-xl glass-darker border-white/5 mr-4">
              {[
                { id: 'highlight', icon: Highlighter, label: 'Highlight Text' },
                { id: 'note', icon: StickyNote, label: 'Add Sticky Note' },
                { id: 'search', icon: Search, label: 'Search Note' },
              ].map((tool) => (
                <Tooltip key={tool.id}>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => setActiveTool(activeTool === tool.id ? null : tool.id)}
                      className={`h-9 w-9 rounded-lg transition-all ${activeTool === tool.id ? 'bg-primary text-white' : 'hover:bg-white/10 text-muted-foreground'}`}
                    >
                      <tool.icon className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{tool.label}</TooltipContent>
                </Tooltip>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link href="/ai-tools/summarizer">
                    <Button variant="outline" size="sm" className="hidden lg:flex rounded-xl glass border-primary/20 hover:bg-primary/10 gap-2 text-primary">
                      <BrainCircuit className="h-4 w-4" /> Summarize Section
                    </Button>
                  </Link>
                </TooltipTrigger>
                <TooltipContent>AI Analysis</TooltipContent>
              </Tooltip>

              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsBookmarked(!isBookmarked)}
                className={`rounded-xl ${isBookmarked ? 'text-accent' : 'text-muted-foreground'}`}
              >
                <Bookmark className={`h-5 w-5 ${isBookmarked ? 'fill-current' : ''}`} />
              </Button>
              <Button variant="ghost" size="icon" className="rounded-xl text-muted-foreground hidden md:flex">
                <Share2 className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="rounded-xl text-muted-foreground">
                <Settings className="h-5 w-5" />
              </Button>
            </div>
          </TooltipProvider>
        </div>
      </header>

      {/* Main Viewer Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Sidebar / Thumbnails (Optional in real app) */}
        <div className="hidden xl:block w-64 border-r border-white/5 bg-black/20 shrink-0 p-4 overflow-y-auto">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4">Pages</h3>
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 12 }).map((_, i) => (
              <div 
                key={i} 
                className={`aspect-[3/4] rounded-lg border-2 cursor-pointer transition-all ${page === i + 1 ? 'border-primary ring-2 ring-primary/20 scale-[0.98]' : 'border-white/5 hover:border-white/20'}`}
                onClick={() => handlePageChange(i + 1)}
              >
                <div className="w-full h-full bg-card/50 flex flex-col p-2">
                  <div className="w-full h-full bg-white/5 rounded-[2px]" />
                  <span className="text-[8px] mt-1 text-center font-bold text-muted-foreground">{i + 1}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Content Viewport */}
        <main className="flex-1 overflow-y-auto p-4 md:p-12 flex justify-center bg-[#1e1a26]">
          <Card className="w-full max-w-4xl min-h-[1200px] shadow-2xl border-none relative bg-white overflow-hidden text-slate-800">
            {/* Mocked PDF Content */}
            <div className="p-16 space-y-8 pointer-events-auto selection:bg-yellow-200">
              <div className="border-b-2 border-slate-200 pb-4">
                <h2 className="text-3xl font-serif font-bold text-primary italic">Connective Tissues</h2>
                <p className="text-slate-500 font-medium">Topic 1.3 - General Histology Overview</p>
              </div>
              
              <div className="space-y-4 text-lg leading-relaxed font-serif">
                <p>
                  Connective tissue is one of the four basic types of animal tissue, along with epithelial, muscle, and nervous tissue. It develops from the <span className="bg-yellow-200/50 px-1 rounded">mesoderm</span>. Connective tissue is found in between other tissues everywhere in the body, including the nervous system.
                </p>
                <div className="flex gap-4 items-start bg-slate-50 p-6 rounded-xl border border-slate-100 italic">
                  <div className="w-1 h-12 bg-primary shrink-0" />
                  <p className="text-sm">
                    <strong>Clinical Note:</strong> Disorders of connective tissue often present as systemic autoimmune diseases (e.g., SLE, Scleroderma). High yield for clinical correlations.
                  </p>
                </div>
                <h3 className="text-xl font-bold mt-8">Classification of Connective Tissue</h3>
                <ul className="list-disc pl-8 space-y-2">
                  <li><strong>Embryonic connective tissue:</strong> Mesenchyme, Mucous connective tissue.</li>
                  <li><strong>Connective tissue proper:</strong> Loose (areolar), Dense (regular/irregular).</li>
                  <li><strong>Specialized connective tissue:</strong> Cartilage, Bone, Blood, Adipose tissue.</li>
                </ul>
                <div className="grid grid-cols-2 gap-4 mt-8">
                  <div className="aspect-square bg-slate-100 rounded-xl flex items-center justify-center border-2 border-dashed border-slate-200 group hover:border-primary transition-colors cursor-zoom-in">
                    <span className="text-xs text-slate-400 font-bold group-hover:text-primary uppercase tracking-tighter">Fig 1.3a - Collagen Fibers (H&E)</span>
                  </div>
                  <div className="aspect-square bg-slate-100 rounded-xl flex items-center justify-center border-2 border-dashed border-slate-200 group hover:border-primary transition-colors cursor-zoom-in">
                    <span className="text-xs text-slate-400 font-bold group-hover:text-primary uppercase tracking-tighter">Fig 1.3b - Reticular Fibers (Silver)</span>
                  </div>
                </div>
                <p>
                  The extracellular matrix (ECM) consists of fibers (collagen, elastic, and reticular) and ground substance. Collagen is the most abundant protein in the human body...
                </p>
              </div>

              {/* Floating Sticky Note Example */}
              <div className="absolute top-[20%] right-10 w-48 p-4 bg-yellow-100 shadow-xl rounded-lg -rotate-2 border-b-4 border-yellow-300 transform animate-in slide-in-from-right-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-yellow-700 uppercase tracking-widest">Sticky Note</span>
                  <X className="h-3 w-3 text-yellow-700 cursor-pointer" />
                </div>
                <p className="text-xs text-yellow-900 leading-tight">
                  Remember to compare with basement membrane structure for MCQ 4 in Unit 1.
                </p>
              </div>
            </div>
          </Card>
        </main>

        {/* Floating Controls for Mobile / Extra */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-4 glass p-2 rounded-2xl border-white/10 shadow-2xl z-30">
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-xl h-12 w-12"
            onClick={() => handlePageChange(page - 1)}
            disabled={page === 1}
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <div className="px-6 flex items-center gap-2 font-mono text-sm">
            <span className="font-bold">{page}</span>
            <span className="text-muted-foreground">/</span>
            <span className="text-muted-foreground">{totalPages}</span>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-xl h-12 w-12"
            onClick={() => handlePageChange(page + 1)}
            disabled={page === totalPages}
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
          <div className="w-[1px] h-6 bg-white/10 mx-2" />
          <Button variant="ghost" size="icon" className="rounded-xl h-12 w-12 text-muted-foreground hover:text-white">
            <Maximize2 className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="rounded-xl h-12 w-12 text-muted-foreground hover:text-white hidden sm:flex">
            <FileDown className="h-5 w-5" />
          </Button>
        </div>

        {/* Reading Progress Indicator */}
        <div className="absolute top-16 left-0 right-0 h-1 z-20 pointer-events-none">
          <Progress value={(page / totalPages) * 100} className="h-full rounded-none bg-transparent" />
        </div>
      </div>
    </div>
  )
}

import { X } from "lucide-react";