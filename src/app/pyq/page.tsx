"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Trophy, BookOpen, Timer, Eye, Loader2, Lock } from "lucide-react"
import { useRouter } from "next/navigation"
import { usePlan } from "@/hooks/use-plan"
import { UpgradeGate } from "@/components/upgrade-gate"

const EXAMS = ["NEET PG", "INICET", "USMLE Step 1", "USMLE Step 2", "FMGE"]
const SUBJECTS = ["All Subjects", "Anatomy", "Physiology", "Biochemistry", "Pathology", "Pharmacology", "Microbiology", "Community Medicine", "Forensic Medicine", "Medicine", "Surgery", "Obstetrics & Gynaecology", "Paediatrics", "Psychiatry", "Ophthalmology", "ENT", "Orthopaedics", "Radiology", "Anaesthesia", "Dermatology"]

export default function PYQPage() {
  const router = useRouter()
  const { isPro, loading: planLoading } = usePlan()
  
  const [selectedExam, setSelectedExam] = useState<string | null>(null)
  const [selectedYear, setSelectedYear] = useState<number | null>(null)
  const [selectedSubject, setSelectedSubject] = useState("All Subjects")
  const [mode, setMode] = useState<"practice" | "exam" | "review">("practice")
  const [years, setYears] = useState<number[]>([])
  const [questionCount, setQuestionCount] = useState(0)
  const [loadingCount, setLoadingCount] = useState(false)

  // Fetch available years when exam is selected
  useEffect(() => {
    if (!selectedExam) return
    async function fetchYears() {
      const { data } = await supabase
        .from('pyq_questions')
        .select('year')
        .eq('exam_type', selectedExam)
      const uniqueYears = [...new Set(data?.map(d => d.year))].sort((a, b) => b - a)
      setYears(uniqueYears)
      setSelectedYear(null)
      setQuestionCount(0)
    }
    fetchYears()
  }, [selectedExam])

  // Fetch question count when year/subject changes
  useEffect(() => {
    if (!selectedExam || !selectedYear) return
    async function fetchCount() {
      setLoadingCount(true)
      let query = supabase
        .from('pyq_questions')
        .select('id', { count: 'exact' })
        .eq('exam_type', selectedExam)
        .eq('year', selectedYear)
      if (selectedSubject !== 'All Subjects') {
        query = query.eq('subject', selectedSubject)
      }
      const { count } = await query
      setQuestionCount(count || 0)
      setLoadingCount(false)
    }
    fetchCount()
  }, [selectedExam, selectedYear, selectedSubject])

  function handleStart() {
    if (!selectedExam || !selectedYear || questionCount === 0) return
    const params = new URLSearchParams({
      exam: selectedExam,
      year: selectedYear.toString(),
      subject: selectedSubject,
      mode
    })
    router.push(`/pyq/start?${params.toString()}`)
  }

  if (planLoading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>

  if (!isPro) {
    return (
      <div className="max-w-3xl mx-auto p-4 md:p-12 space-y-8">
        <div className="text-center space-y-3">
          <Trophy className="h-16 w-16 text-primary mx-auto" />
          <h1 className="text-4xl font-bold">PYQ Test Series</h1>
          <p className="text-muted-foreground text-lg">Year-wise previous year questions for NEET PG, INICET, USMLE & more</p>
        </div>
        <UpgradeGate type="ai" title="Clinician Plan Required" description="Access the full PYQ Test Series with year-wise papers, subject filters, and 3 practice modes. Upgrade to Clinician at ₹59/month." />
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-12 space-y-8 animate-in fade-in duration-500">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold flex items-center gap-3"><Trophy className="h-10 w-10 text-primary" /> PYQ Test Series</h1>
        <p className="text-muted-foreground text-lg">Year-wise previous year questions for NEET PG, INICET, USMLE & more</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">

          {/* Step 1: Exam */}
          <Card className="glass border-none">
            <CardHeader><CardTitle className="flex items-center gap-2"><Trophy className="h-5 w-5 text-primary" /> Step 1: Select Exam</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {EXAMS.map(exam => (
                <button key={exam} onClick={() => setSelectedExam(exam)}
                  className={`p-4 rounded-xl border text-sm font-bold transition-all text-left ${selectedExam === exam ? 'bg-primary/10 border-primary text-primary' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}>
                  {exam}
                </button>
              ))}
            </CardContent>
          </Card>

          {/* Step 2: Year */}
          {selectedExam && (
            <Card className="glass border-none animate-in slide-in-from-top-4 duration-500">
              <CardHeader><CardTitle className="flex items-center gap-2"><BookOpen className="h-5 w-5 text-accent" /> Step 2: Select Year</CardTitle></CardHeader>
              <CardContent>
                {years.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No papers uploaded yet for {selectedExam}.</p>
                ) : (
                  <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                    {years.map(year => (
                      <button key={year} onClick={() => setSelectedYear(year)}
                        className={`p-3 rounded-xl border text-sm font-bold transition-all ${selectedYear === year ? 'bg-accent/10 border-accent text-accent' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}>
                        {year}
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Step 3: Subject Filter */}
          {selectedYear && (
            <Card className="glass border-none animate-in slide-in-from-top-4 duration-500">
              <CardHeader><CardTitle className="flex items-center gap-2"><BookOpen className="h-5 w-5 text-primary" /> Step 3: Subject Filter</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {SUBJECTS.map(sub => (
                  <button key={sub} onClick={() => setSelectedSubject(sub)}
                    className={`p-2.5 rounded-lg border text-xs font-bold transition-all text-left ${selectedSubject === sub ? 'bg-primary/10 border-primary text-primary' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}>
                    {sub}
                  </button>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Step 4: Mode */}
          {selectedYear && (
            <Card className="glass border-none animate-in slide-in-from-top-4 duration-500">
              <CardHeader><CardTitle className="flex items-center gap-2"><Timer className="h-5 w-5 text-accent" /> Step 4: Select Mode</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { id: "practice", label: "Practice", desc: "See answer after each question", icon: BookOpen },
                  { id: "exam", label: "Exam", desc: "Timed, see results at end", icon: Timer },
                  { id: "review", label: "Review", desc: "Attempt all, then review", icon: Eye }
                ].map(m => (
                  <button key={m.id} onClick={() => setMode(m.id as any)}
                    className={`p-4 rounded-xl border text-left transition-all ${mode === m.id ? 'bg-primary/10 border-primary' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}>
                    <m.icon className={`h-5 w-5 mb-2 ${mode === m.id ? 'text-primary' : 'text-muted-foreground'}`} />
                    <p className="font-bold text-sm">{m.label}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">{m.desc}</p>
                  </button>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Summary */}
        <div>
          <Card className="glass border-none sticky top-24">
            <CardHeader className="bg-primary/10 rounded-t-xl"><CardTitle>Session Summary</CardTitle></CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Exam</span><span className="font-bold">{selectedExam || '—'}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Year</span><span className="font-bold">{selectedYear || '—'}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Subject</span><span className="font-bold text-xs">{selectedSubject}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Mode</span><span className="font-bold capitalize">{mode}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Questions</span>
                  <span className="font-bold text-primary">{loadingCount ? <Loader2 className="h-4 w-4 animate-spin inline" /> : questionCount}</span>
                </div>
              </div>
              <Button onClick={handleStart} disabled={!selectedExam || !selectedYear || questionCount === 0}
                className="w-full h-12 rounded-xl font-bold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/30">
                Start Session
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}