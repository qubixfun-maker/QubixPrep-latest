"use client"

import { useState, useEffect, useMemo } from "react"
import { Search, FileText, Video, Database, Network, X, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { useFirestore, useCollection } from "@/firebase"
import { collection, getDocs } from "firebase/firestore"
import { supabase } from "@/lib/supabase"

type SearchResult = {
  id: string
  title: string
  type: "Note" | "Video" | "Mindmap" | "QBank"
  category: string
  href: string
  meta?: string
}

const FILTERS = ["All", "Note", "Video", "Mindmap", "QBank"] as const

export default function SearchPage() {
  const [query, setQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const [activeFilter, setActiveFilter] = useState<typeof FILTERS[number]>("All")
  const [results, setResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)

  const db = useFirestore()
  const subjectsQuery = useMemo(() => db ? collection(db, 'subjects') : null, [db])
  const { data: subjects } = useCollection(subjectsQuery)

  // Debounce input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), 350)
    return () => clearTimeout(timer)
  }, [query])

  useEffect(() => {
    async function runSearch() {
      if (!debouncedQuery || debouncedQuery.length < 2 || !db || !subjects) {
        setResults([])
        return
      }

      setIsSearching(true)
      const lowerQuery = debouncedQuery.toLowerCase()
      const found: SearchResult[] = []

      try {
        // Search topics (notes + videos) across all subjects
        await Promise.all(
          subjects.map(async (subject: any) => {
            const topicsSnap = await getDocs(collection(db, 'subjects', subject.id, 'topics'))
            topicsSnap.forEach(docSnap => {
              const data = docSnap.data() as any
              const title = data.title || ""
              if (title.toLowerCase().includes(lowerQuery)) {
                const isVideo = data.contentType === 'video'
                found.push({
                  id: docSnap.id,
                  title,
                  type: isVideo ? "Video" : "Note",
                  category: subject.name,
                  href: isVideo ? `/notes/${subject.id}/${docSnap.id}` : `/notes/${subject.id}/${docSnap.id}`,
                  meta: data.unitName || undefined
                })
              }
            })

            // Search mindmaps
            const mindmapsSnap = await getDocs(collection(db, 'subjects', subject.id, 'mindmaps'))
            mindmapsSnap.forEach(docSnap => {
              const data = docSnap.data() as any
              const title = data.title || ""
              if (title.toLowerCase().includes(lowerQuery)) {
                found.push({
                  id: docSnap.id,
                  title,
                  type: "Mindmap",
                  category: subject.name,
                  href: `/mindmaps/${subject.id}/${docSnap.id}`,
                  meta: data.unitName || undefined
                })
              }
            })
          })
        )

        // Search QBank questions (Supabase)
        const { data: qbankResults } = await supabase
          .from('questions')
          .select('id, question_text, subject_id, unit_title, topic_title')
          .ilike('question_text', `%${debouncedQuery}%`)
          .limit(15)

        if (qbankResults) {
          qbankResults.forEach((q: any) => {
            found.push({
              id: String(q.id),
              title: q.question_text,
              type: "QBank",
              category: q.subject_id,
              href: `/qbank/${q.subject_id}`,
              meta: q.topic_title || q.unit_title || undefined
            })
          })
        }

        setResults(found)
      } catch (e) {
        console.error("Search error:", e)
      } finally {
        setIsSearching(false)
      }
    }

    runSearch()
  }, [debouncedQuery, db, subjects])

  const filteredResults = results.filter(r => activeFilter === "All" || r.type === activeFilter)

  const iconFor = (type: SearchResult["type"]) => {
    switch (type) {
      case "Video": return <Video className="h-6 w-6" />
      case "Note": return <FileText className="h-6 w-6" />
      case "Mindmap": return <Network className="h-6 w-6" />
      case "QBank": return <Database className="h-6 w-6" />
    }
  }

  const colorFor = (type: SearchResult["type"]) => {
    switch (type) {
      case "Video": return "text-accent"
      case "Note": return "text-primary"
      case "Mindmap": return "text-green-400"
      case "QBank": return "text-orange-400"
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-12 space-y-8 animate-in fade-in duration-500">
      <div className="space-y-6">
        <div className="relative group">
          <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
            {isSearching ? (
              <Loader2 className="h-6 w-6 text-primary animate-spin" />
            ) : (
              <Search className="h-6 w-6 text-muted-foreground group-focus-within:text-primary transition-colors" />
            )}
          </div>
          <Input
            className="h-16 md:h-20 pl-16 pr-16 text-lg md:text-2xl glass border-white/10 rounded-2xl md:rounded-3xl focus-visible:ring-primary focus-visible:ring-offset-0 shadow-2xl"
            placeholder="Search notes, videos, mindmaps, QBank..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          {query && (
            <div className="absolute inset-y-0 right-6 flex items-center">
              <button onClick={() => setQuery("")} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2 px-2">
          {FILTERS.map(filter => (
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
        {debouncedQuery.length >= 2 ? (
          isSearching ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredResults.length > 0 ? (
            filteredResults.map(result => (
              <Link key={`${result.type}-${result.id}`} href={result.href}>
                <Card className="glass border-none hover:scale-[1.01] transition-all cursor-pointer group mb-4">
                  <CardContent className="p-4 md:p-6 flex items-center gap-4 md:gap-6">
                    <div className={`p-3 md:p-4 rounded-2xl bg-white/5 shrink-0 ${colorFor(result.type)}`}>
                      {iconFor(result.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground capitalize">{result.category}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/5 text-muted-foreground uppercase">{result.type}</span>
                        {result.meta && <span className="text-[10px] text-muted-foreground">· {result.meta}</span>}
                      </div>
                      <h3 className="text-base md:text-xl font-bold group-hover:text-primary transition-colors line-clamp-2">{result.title}</h3>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))
          ) : (
            <div className="text-center py-20 text-muted-foreground">
              <Search className="h-16 w-16 mx-auto mb-4 opacity-10" />
              <p className="text-xl">No results found for "{debouncedQuery}"</p>
            </div>
          )
        ) : (
          <div className="text-center py-20 text-muted-foreground opacity-40">
            <Search className="h-16 w-16 mx-auto mb-4 opacity-20" />
            <p className="text-lg">Type at least 2 characters to search across notes, videos, mindmaps, and QBank.</p>
          </div>
        )}
      </div>
    </div>
  )
}
