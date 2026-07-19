"use client"

import { useMemo, use, useState } from "react"
import { useCollection, useFirestore } from "@/firebase"
import { collection, query, where } from "firebase/firestore"
import { ChevronLeft, ChevronDown, Loader2, GraduationCap, Lock, Search } from "lucide-react"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { usePlan } from "@/hooks/use-plan"
import { UpgradeGate } from "@/components/upgrade-gate"
import { useUser, useDoc } from "@/firebase"
import { doc } from "firebase/firestore"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

const TYPE_LABEL: Record<string, string> = {
  short_answer: "Short Answer",
  short_essay: "Short Essay",
  long_answer: "Long Answer"
}

export default function ProfPyqSubjectPage({ params }: { params: Promise<{ subject: string }> }) {
  const { subject } = use(params)
  const subjectName = decodeURIComponent(subject)

  const db = useFirestore()
  const { canAccessContent, loading: planLoading } = usePlan()
  const { user } = useUser()
  const router = useRouter()
  const profileRef = useMemo(() => (!db || !user) ? null : doc(db, "users", user.uid), [db, user])
  const { data: profile, loading: profileLoading } = useDoc(profileRef)
  const isAdmin = profile && (profile as any).role === "admin"

  useEffect(() => {
    if (!profileLoading && !isAdmin) router.replace("/")
  }, [profileLoading, isAdmin, router])

  const [search, setSearch] = useState("")
  const [openId, setOpenId] = useState<string | null>(null)

  const ref = useMemo(() => (!db ? null : query(collection(db, 'profpyq'), where('subject', '==', subjectName))), [db, subjectName])
  const { data, loading } = useCollection(ref)

  const grouped = useMemo(() => {
    const list = ((data as any[]) || []).filter((q) =>
      !search.trim() || q.question?.toLowerCase().includes(search.toLowerCase())
    )
    const groups: Record<string, any[]> = {}
    list.forEach((q) => {
      const key = q.chapter || "General"
      if (!groups[key]) groups[key] = []
      groups[key].push(q)
    })
    Object.values(groups).forEach((g) => g.sort((a, b) => (a.order ?? 0) - (b.order ?? 0)))
    return Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0]))
  }, [data, search])

  if (planLoading || profileLoading || !isAdmin) return <div className="h-screen flex items-center justify-center"><Loader2 className="h-10 w-10 text-primary animate-spin" /></div>

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-12 space-y-8 animate-in slide-in-from-right-4 duration-700">
      <div>
        <Link href="/prof-pyq" className="text-xs font-bold uppercase tracking-widest text-accent flex items-center gap-1 mb-4 hover:underline w-fit">
          <ChevronLeft className="h-3 w-3" /> Back to Prof PYQ
        </Link>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{subjectName}</h1>
        <p className="text-muted-foreground mt-2">Tap a question to reveal its model answer.</p>
      </div>

      <div className="relative w-full md:w-80">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search questions..." className="pl-10 rounded-xl glass border-white/10" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {!canAccessContent ? (
        <UpgradeGate type="content" />
      ) : loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : grouped.length > 0 ? (
        <div className="space-y-6">
          {grouped.map(([chapter, questions]) => (
            <div key={chapter} className="space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-1">{chapter}</h2>
              <div className="space-y-2">
                {questions.map((q: any) => {
                  const isOpen = openId === q.id
                  return (
                    <div key={q.id} className="rounded-xl glass border-none overflow-hidden">
                      <button
                        onClick={() => setOpenId(isOpen ? null : q.id)}
                        className="w-full flex items-start justify-between gap-4 px-5 py-4 text-left hover:bg-white/5 transition-colors"
                      >
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">{TYPE_LABEL[q.type] || q.type}</p>
                          <p className="text-sm font-medium">{q.question}</p>
                        </div>
                        <ChevronDown className={`h-4 w-4 text-muted-foreground shrink-0 mt-1 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                      </button>
                      {isOpen && (
                        <div className="px-5 pb-5 pt-1 text-sm text-muted-foreground whitespace-pre-line leading-relaxed border-t border-white/5">
                          {q.answer}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-muted-foreground rounded-2xl glass border-none">
          <GraduationCap className="h-10 w-10 mx-auto mb-3 opacity-10" />
          No questions found for {subjectName} yet.
        </div>
      )}
    </div>
  )
}
