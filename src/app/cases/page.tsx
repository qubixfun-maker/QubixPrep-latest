"use client"

import { useMemo, useState, useEffect } from "react"
import { useCollection, useFirestore } from "@/firebase"
import { collection } from "firebase/firestore"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Stethoscope, Brain, HeartPulse, TestTube, Microscope, BookOpen, ChevronRight, Loader2 } from "lucide-react"
import Link from "next/link"
import { useRequireAuth } from "@/hooks/use-require-auth"

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

export default function CasesHubPage() {
  const db = useFirestore()
  const [subjects, setSubjects] = useState<any[]>([])
  const subjectsQuery = useMemo(() => (!db ? null : collection(db, 'subjects')), [db])
  const { data, loading } = useCollection(subjectsQuery)

  useEffect(() => {
    if (data) {
      const sorted = data.sort((a, b) => {
        const ai = SUBJECT_ORDER.indexOf(a.name)
        const bi = SUBJECT_ORDER.indexOf(b.name)
        if (ai === -1 && bi === -1) return a.name.localeCompare(b.name)
        if (ai === -1) return 1
        if (bi === -1) return -1
        return ai - bi
      })
      setSubjects(sorted)
    }
  }, [data])

  const { checkingAuth } = useRequireAuth()
  if (checkingAuth) return <div className="h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 text-primary animate-spin" /></div>

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-12 space-y-8 animate-in slide-in-from-bottom-4 duration-700">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">Clinical Cases</h1>
        <p className="text-muted-foreground text-lg">Solve real patient scenarios. Build clinical reasoning, not just recall.</p>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <Loader2 className="h-10 w-10 text-primary animate-spin" />
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subjects?.map((subject: any) => {
            const Icon = ICON_MAP[subject.name] || Stethoscope
            return (
              <Link key={subject.id} href={`/cases/${subject.id}`}>
                <Card className="glass border-none group cursor-pointer hover:bg-white/5 transition-all duration-300 relative overflow-hidden h-full flex flex-col">
                  <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                  <CardHeader className="flex flex-row items-start justify-between p-8">
                    <div className="p-4 rounded-2xl bg-primary/10 text-primary">
                      <Icon className="h-8 w-8" />
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1" />
                  </CardHeader>
                  <CardContent className="px-8 pb-8 flex-1">
                    <CardTitle className="text-2xl font-bold mb-2">{subject.name}</CardTitle>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                      Solve realistic clinical scenarios in {subject.name}.
                    </p>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
          {!loading && (!subjects || subjects.length === 0) && (
            <div className="col-span-full py-20 text-center text-muted-foreground glass rounded-3xl">
              <Stethoscope className="h-12 w-12 mx-auto mb-4 opacity-10" />
              <p>No subjects found yet.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
