"use client"

import { useMemo, useState } from "react"
import { useCollection, useFirestore } from "@/firebase"
import { collection } from "firebase/firestore"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Network, ChevronRight, Search, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { useRequireAuth } from "@/hooks/use-require-auth"
import { getSubjectColor } from "@/lib/subject-colors"
import { getSubjectYear } from "@/lib/subject-year"

export default function MindmapsSubjectsPage() {
  const db = useFirestore()
  const [search, setSearch] = useState("")
  const subjectsQuery = useMemo(() => (!db ? null : collection(db, 'subjects')), [db])
  const { data: subjects, loading } = useCollection(subjectsQuery)

  const filtered = useMemo(() => {
    if (!subjects) return []
    if (!search.trim()) return subjects
    return subjects.filter((s: any) => s.name.toLowerCase().includes(search.toLowerCase()))
  }, [subjects, search])

  const groupedByYear = useMemo(() => {
    const groups: Record<string, any[]> = {}
    filtered.forEach((s: any) => {
      const year = getSubjectYear(s.name)
      const key = year.label
      if (!groups[key]) groups[key] = []
      groups[key].push(s)
    })
    Object.values(groups).forEach((list) => list.sort((a, b) => a.name.localeCompare(b.name)))
    return Object.entries(groups)
      .sort((a, b) => getSubjectYear(a[1][0].name).order - getSubjectYear(b[1][0].name).order)
      .map(([label, items]) => ({ label, items }))
  }, [filtered])

  const { checkingAuth } = useRequireAuth()
  if (checkingAuth) return <div className="h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 text-primary animate-spin" /></div>

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-12 space-y-8 animate-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">Mindmaps</h1>
          <p className="text-muted-foreground text-lg">Visual chapter breakdowns, by subject.</p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search subjects..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 rounded-xl glass border-white/10" />
        </div>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center"><Loader2 className="h-10 w-10 text-primary animate-spin" /></div>
      ) : (
        <div className="space-y-10">
          {groupedByYear.map((group) => (
            <div key={group.label} className="space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground px-1">{group.label}</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {group.items.map((subject: any) => {
                  const color = getSubjectColor(subject.name)
                  return (
                    <Link key={subject.id} href={`/mindmaps/${subject.id}`}>
                      <Card className={`${color.bg} ${color.border} border group cursor-pointer hover:scale-[1.02] transition-all duration-300 relative overflow-hidden h-full flex flex-col`}>
                        <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full ${color.glow} opacity-20 blur-2xl group-hover:opacity-30 transition-opacity`} />
                        <CardHeader className="flex flex-row items-start justify-between p-8 relative">
                          <div className={`p-4 rounded-2xl ${color.bgSolid} ${color.text}`}>
                            <Network className="h-8 w-8" />
                          </div>
                          <ChevronRight className={`h-5 w-5 ${color.text} group-hover:translate-x-1 transition-transform`} />
                        </CardHeader>
                        <CardContent className="px-8 pb-8 flex-1 relative">
                          <h2 className="text-2xl font-bold mb-2">{subject.name}</h2>
                          <p className="text-sm text-muted-foreground">Explore chapters as visual mind maps.</p>
                        </CardContent>
                      </Card>
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
