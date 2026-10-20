"use client"
import { SubjectArtCard } from "@/components/subjects/SubjectArtCard"
import { useTopSearch } from "@/components/layout/top-search"

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
  const [search, setSearch] = useTopSearch("Search subjects in Mind Maps…")
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
                    <SubjectArtCard key={subject.id} href={`/mindmaps/${subject.id}`} name={subject.name} subtitle="Explore chapters as visual mind maps." />
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
