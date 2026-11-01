
"use client"
import { SubjectYearGrid } from "@/components/subjects/SubjectYearGrid"
import { compareSubjects } from "@/lib/subject-year"
import { DeepResults } from "@/components/layout/deep-search"
import { SubjectArtCard } from "@/components/subjects/SubjectArtCard"
import { useTopSearch } from "@/components/layout/top-search"

import { useMemo, useState, useEffect } from "react"
import { useCollection, useFirestore } from "@/firebase"
import { collection } from "firebase/firestore"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Database, Brain, HeartPulse, TestTube, Stethoscope, Microscope, BookOpen, ChevronRight, Search, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
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
  // 1st Year
  "Anatomy", "Physiology", "Biochemistry",
  // 2nd Year  
  "Pathology", "Pharmacology", "Microbiology", "Forensic Medicine", "Community Medicine",
  // 3rd Year (Part 1)
  "Ophthalmology", "ENT", "Medicine", "Surgery",
  // Final Year
  "Obstetrics & Gynaecology", "Paediatrics", "Psychiatry", "Orthopaedics",
  "Radiology", "Anaesthesia", "Dermatology", "Anesthesiology"
];

export default function QBankPage() {
  const db = useFirestore()
  const [subjects, setSubjects] = useState<any[]>([]);
  const [search] = useTopSearch("Search question banks…")
  const subjectsQuery = useMemo(() => (!db ? null : collection(db, 'subjects')), [db])
  const { data, loading } = useCollection(subjectsQuery)

  useEffect(() => {
    if (data) {
      const sorted = data.sort((a: any, b: any) => compareSubjects(a.name, b.name))
      setSubjects(sorted)
    }
  }, [data])

  const { checkingAuth } = useRequireAuth()
  if (checkingAuth) return <div className="h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 text-primary animate-spin" /></div>

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-12 space-y-8 animate-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">Question Bank Hub</h1>
          <p className="text-muted-foreground text-lg">Active recall through board-style MCQs and clinical simulations.</p>
        </div>
      </div>

      <div className="space-y-8">

        <DeepResults kind="qbank" query={search} noun="questions" />

      {loading ? (
          <div className="h-64 flex items-center justify-center">
            <Loader2 className="h-10 w-10 text-primary animate-spin" />
          </div>
        ) : (
                    <>
            <SubjectYearGrid items={(subjects || []).filter((s: any) => !search.trim() || String(s.name).toLowerCase().includes(search.trim().toLowerCase()))} hrefBase="/qbank" subtitle="Board-standard MCQs, subject by subject." />
            {!loading && (!subjects || subjects.length === 0) && (
              <div className="col-span-full py-20 text-center text-muted-foreground glass rounded-3xl">
                <Database className="h-12 w-12 mx-auto mb-4 opacity-10" />
                <p>No question banks found. Add subjects in the Admin Panel.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
