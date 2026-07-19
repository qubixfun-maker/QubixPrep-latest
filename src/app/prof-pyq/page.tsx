"use client"

import { useMemo, useState } from "react"
import { useCollection, useFirestore, useUser, useDoc } from "@/firebase"
import { collection } from "firebase/firestore"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { GraduationCap, Brain, HeartPulse, TestTube, Stethoscope, Microscope, BookOpen, ChevronRight, Search, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { useRequireAuth } from "@/hooks/use-require-auth"
import { doc } from "firebase/firestore"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

const ICON_MAP: Record<string, any> = {
  "Anatomy": Brain,
  "Physiology": HeartPulse,
  "Biochemistry": TestTube,
  "Pathology": Stethoscope,
  "Microbiology": Microscope,
  "Pharmacology": BookOpen
}

const SUBJECT_ORDER = [
  "Anatomy", "Physiology", "Biochemistry",
  "Pathology", "Pharmacology", "Microbiology", "Forensic Medicine", "Community Medicine",
  "Ophthalmology", "ENT", "Medicine", "Surgery",
  "Obstetrics & Gynaecology", "Paediatrics", "Psychiatry", "Orthopaedics",
  "Radiology", "Anaesthesia", "Dermatology", "Anesthesiology"
]

export default function ProfPyqHubPage() {
  const db = useFirestore()
  const { user } = useUser()
  const router = useRouter()
  const profileRef = useMemo(() => (!db || !user) ? null : doc(db, "users", user.uid), [db, user])
  const { data: profile, loading: profileLoading } = useDoc(profileRef)
  const isAdmin = profile && (profile as any).role === "admin"

  useEffect(() => {
    if (!profileLoading && !isAdmin) router.replace("/")
  }, [profileLoading, isAdmin, router])

  const [search, setSearch] = useState("")

  const ref = useMemo(() => (!db ? null : collection(db, 'profpyq')), [db])
  const { data, loading } = useCollection(ref)

  const subjectCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    ;((data as any[]) || []).forEach((q) => {
      const s = q.subject || "General"
      counts[s] = (counts[s] || 0) + 1
    })
    return counts
  }, [data])

  const subjects = useMemo(() => {
    const names = Object.keys(subjectCounts).filter((s) => !search.trim() || s.toLowerCase().includes(search.toLowerCase()))
    return names.sort((a, b) => {
      const ai = SUBJECT_ORDER.indexOf(a)
      const bi = SUBJECT_ORDER.indexOf(b)
      if (ai === -1 && bi === -1) return a.localeCompare(b)
      if (ai === -1) return 1
      if (bi === -1) return -1
      return ai - bi
    })
  }, [subjectCounts, search])

  const { checkingAuth } = useRequireAuth()
  if (checkingAuth || profileLoading || !isAdmin) return <div className="h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 text-primary animate-spin" /></div>

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-12 space-y-8 animate-in slide-in-from-bottom-4 duration-700">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">Prof PYQ Answers</h1>
        <p className="text-muted-foreground text-lg">University professional exam questions with model answers, organized by subject and chapter.</p>
      </div>

      <div className="relative w-full md:w-80">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search subjects..." className="pl-10 rounded-xl glass border-white/10" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <Loader2 className="h-10 w-10 text-primary animate-spin" />
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subjects.map((subject) => {
            const Icon = ICON_MAP[subject] || GraduationCap
            return (
              <Link key={subject} href={`/prof-pyq/${encodeURIComponent(subject)}`}>
                <Card className="glass border-none group cursor-pointer hover:bg-white/5 transition-all duration-300 relative overflow-hidden h-full flex flex-col">
                  <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                  <CardHeader className="flex flex-row items-start justify-between p-8">
                    <div className="p-4 rounded-2xl bg-primary/10 text-primary">
                      <Icon className="h-8 w-8" />
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1" />
                  </CardHeader>
                  <CardContent className="px-8 pb-8 flex-1">
                    <CardTitle className="text-2xl font-bold mb-2">{subject}</CardTitle>
                    <p className="text-sm text-muted-foreground">{subjectCounts[subject]} question{subjectCounts[subject] !== 1 ? "s" : ""}</p>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
          {!loading && subjects.length === 0 && (
            <div className="col-span-full py-20 text-center text-muted-foreground glass rounded-3xl">
              <GraduationCap className="h-12 w-12 mx-auto mb-4 opacity-10" />
              <p>No Prof PYQ questions added yet.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
