"use client"

import { useState } from "react"
import { Search, FileText, Video, BrainCircuit, History, X, Command } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

const mockResults = [
  { id: 1, title: "Cranial Nerve Pathways", type: "Note", category: "Anatomy", href: "/notes/anatomy/cn-pathways" },
  { id: 2, title: "Beta Blockers Mechanism", type: "Video", category: "Pharmacology", href: "/videos/pharma-beta" },
  { id: 3, title: "Thyroid Storm Management", type: "Quiz", category: "AI Quiz", href: "/ai-tools/quiz" },
  { id: 4, title: "Histology of Liver", type: "Note", category: "Anatomy", href: "/notes/anatomy/liver-histo" },
  { id: 5, title: "Mechanism of Action: Penicillins", type: "Note", category: "Microbiology", href: "/notes/micro/penicillin" },
]

export default function SearchPage() {
  const [query, setQuery] = useState("")
  const [activeFilter, setActiveFilter] = useState("All")

  const filteredResults = mockResults.filter(item => {
    const matchesQuery = item.title.toLowerCase().includes(query.toLowerCase()) || 
                         item.category.toLowerCase().includes(query.toLowerCase())
    const matchesFilter = activeFilter === "All" || item.type === activeFilter
    return matchesQuery && matchesFilter
  })

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-12 space-y-8 animate-in fade-in duration-500">
      <div className="space-y-6">
        <div className="relative group">
          <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
            <Search className="h-6 w-6 text-muted-foreground group-focus-within:text-primary transition-colors" />
          </div>
          <Input 
            className="h-20 pl-16 pr-20 text-2xl glass border-white/10 rounded-3xl focus-visible:ring-primary focus-visible:ring-offset-0 shadow-2xl"
            placeholder="Search notes, videos, or quizzes..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          <div className="absolute inset-y-0 right-6 flex items-center gap-2">
            {query && (
              <button onClick={() => setQuery("")} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            )}
            <kbd className="hidden md:inline-flex h-8 items-center gap-1 rounded border border-white/10 bg-white/5 px-2 text-xs font-mono font-medium text-muted-foreground">
              <Command className="h-3 w-3" /> K
            </kbd>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 px-2">
          {["All", "Note", "Video", "Quiz"].map(filter => (
            <Badge 
              key={filter}
              variant={activeFilter === filter ? "default" : "outline"}
              className={`cursor-pointer px-4 py-2 rounded-xl text-sm transition-all ${activeFilter === filter ? 'bg-primary border-primary shadow-lg shadow-primary/20' : 'glass border-white/10 hover:bg-white/5'}`}
              onClick={() => setActiveFilter(filter)}
            >
              {filter}
            </Badge>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {query ? (
          filteredResults.length > 0 ? (
            filteredResults.map(result => (
              <Link key={result.id} href={result.href}>
                <Card className="glass border-none hover:scale-[1.01] transition-all cursor-pointer group mb-4">
                  <CardContent className="p-6 flex items-center gap-6">
                    <div className={`p-4 rounded-2xl bg-white/5 ${result.type === 'Video' ? 'text-accent' : result.type === 'Note' ? 'text-primary' : 'text-orange-400'}`}>
                      {result.type === 'Video' && <Video className="h-6 w-6" />}
                      {result.type === 'Note' && <FileText className="h-6 w-6" />}
                      {result.type === 'Quiz' && <BrainCircuit className="h-6 w-6" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{result.category}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/5 text-muted-foreground uppercase">{result.type}</span>
                      </div>
                      <h3 className="text-xl font-bold group-hover:text-primary transition-colors truncate">{result.title}</h3>
                    </div>
                    <History className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </CardContent>
                </Card>
              </Link>
            ))
          ) : (
            <div className="text-center py-20 text-muted-foreground">
              <Search className="h-16 w-16 mx-auto mb-4 opacity-10" />
              <p className="text-xl">No results found for "{query}"</p>
            </div>
          )
        ) : (
          <div className="space-y-8 pt-4">
            <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground px-2">Trending Searches</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="glass p-6 rounded-2xl flex items-center gap-4 hover:bg-white/5 cursor-pointer transition-colors border-white/5">
                <div className="p-3 rounded-xl bg-primary/10 text-primary">
                  <BrainCircuit className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-bold">NEET-PG 2024 Recall</p>
                  <p className="text-xs text-muted-foreground">High-yield questions list</p>
                </div>
              </div>
              <div className="glass p-6 rounded-2xl flex items-center gap-4 hover:bg-white/5 cursor-pointer transition-colors border-white/5">
                <div className="p-3 rounded-xl bg-accent/10 text-accent">
                  <Video className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-bold">ECG Interpretation</p>
                  <p className="text-xs text-muted-foreground">Step-by-step masterclass</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}