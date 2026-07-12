"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Trophy, BookOpen, Timer, Eye, Loader2, Check } from "lucide-react"
import { useRouter } from "next/navigation"
import { usePlan } from "@/hooks/use-plan"
import { UpgradeGate } from "@/components/upgrade-gate"
import { useRequireAuth } from "@/hooks/use-require-auth"

const EXAMS = ["NEET PG", "INICET", "USMLE Step 1", "USMLE Step 2", "FMGE"]
const SUBJECTS = ["All Subjects", "Anatomy", "Physiology", "Biochemistry", "Pathology", "Pharmacology", "Microbiology", "Community Medicine", "Forensic Medicine", "Medicine", "Surgery", "Obstetrics & Gynaecology", "Paediatrics", "Psychiatry", "Ophthalmology", "ENT", "Orthopaedics", "Radiology", "Anaesthesia", "Dermatology"]
const QUESTION_COUNT_OPTIONS = [10, 25, 50, 100, 0]

export default function PYQPage() {
  const router = useRouter()
  const { isPro, loading: planLoading } = usePlan()
  const { checkingAuth } = useRequireAuth()

  const [selectedExam, setSelectedExam] = useState<string | null>(null)
  const [selectedYears, setSelectedYears] = useState<number[]>([])
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(["All Subjects"])
  const [mode, setMode] = useState<"practice" | "exam" | "review">("practice")
  const [years, setYears] = useState<number[]>([])
  const [questionCount, setQuestionCount] = useState(0)
  const [desiredCount, setDesiredCount] = useState(25)
  const [loadingCount, setLoadingCount] = useState(false)

  useEffect(() => {
    if (!selectedExam) return
    async function fetchYears() {
      const res = await fetch('/api/pyq?exam_type=' + encodeURIComponent(selectedExam as string))
      const json = await res.json()
      const data = json.data || []
      const uniqueYears = [...new Set(data.map((d: any) => d.year ?? 0))] as number[]
      uniqueYears.sort((a: number, b: number) => {
        if (a === 0) return 1
        if (b === 0) return -1
        return b - a
      })
      setYears(uniqueYears)
      setSelectedYears([])
      setQuestionCount(0)
    }
    fetchYears()
  }, [selectedExam])

  const subjectFilter = useMemo(() => {
    if (selectedSubjects.includes("All Subjects") || selectedSubjects.length === 0) return null
    return selectedSubjects
  }, [selectedSubjects])

  useEffect(() => {
    if (!selectedExam || selectedYears.length === 0) return
    async function fetchCount() {
      setLoadingCount(true)
      const params = new URLSearchParams({
        exam_type: selectedExam as string,
        years: selectedYears.join(','),
        count_only: 'true'
      })
      if (subjectFilter) params.set('subjects', subjectFilter.join(','))
      const res = await fetch('/api/pyq?' + params.toString())
      const json = await res.json()
      setQuestionCount(json.count || 0)
      setLoadingCount(false)
    }
    fetchCount()
  }, [selectedExam, selectedYears, subjectFilter])

  function toggleYear(year: number) {
    setSelectedYears(prev =>
      prev.includes(year) ? prev.filter(y => y !== year) : [...prev, year]
    )
  }

  function toggleSubject(subject: string) {
    if (subject === "All Subjects") {
      setSelectedSubjects(["All Subjects"])
      return
    }
    setSelectedSubjects(prev => {
      const withoutAll = prev.filter(s => s !== "All Subjects")
      if (withoutAll.includes(subject)) {
        const next = withoutAll.filter(s => s !== subject)
        return next.length === 0 ? ["All Subjects"] : next
      }
      return [...withoutAll, subject]
    })
  }

  function handleStart() {
    if (!selectedExam || selectedYears.length === 0 || questionCount === 0) return
    const params = new URLSearchParams({
      exam: selectedExam,
      years: selectedYears.join(','),
      subjects: subjectFilter ? subjectFilter.join(',') : 'All Subjects',
      mode,
      count: desiredCount === 0 ? questionCount.toString() : Math.min(desiredCount, questionCount).toString()
    })
    router.push(`/pyq/start?${params.toString()}`)
  }

  if (checkingAuth || planLoading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>

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

          {selectedExam && (
            <Card className="glass border-none animate-in slide-in-from-top-4 duration-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><BookOpen className="h-5 w-5 text-accent" /> Step 2: Select Year(s)</CardTitle>
                <p className="text-xs text-muted-foreground">Tap multiple years to combine them into one session.</p>
              </CardHeader>
              <CardContent>
                {years.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No papers uploaded yet for {selectedExam}.</p>
                ) : (
                  <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                    {years.map(year => {
                      const isSelected = selectedYears.includes(year)
                      return (
                        <button key={year} onClick={() => toggleYear(year)}
                          className={`relative p-3 rounded-xl border text-sm font-bold transition-all ${isSelected ? 'bg-accent/10 border-accent text-accent' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}>
                          {isSelected && <Check className="h-3 w-3 absolute top-1.5 right-1.5" />}
                          {year === 0 ? "Random Year" : year}
                        </button>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {selectedYears.length > 0 && (
            <Card className="glass border-none animate-in slide-in-from-top-4 duration-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><BookOpen className="h-5 w-5 text-primary" /> Step 3: Subject Filter</CardTitle>
                <p className="text-xs text-muted-foreground">Select one or more subjects, or leave on "All Subjects."</p>
              </CardHeader>
              <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {SUBJECTS.map(sub => {
                  const isSelected = selectedSubjects.includes(sub)
                  return (
                    <button key={sub} onClick={() => toggleSubject(sub)}
                      className={`relative p-2.5 rounded-lg border text-xs font-bold transition-all text-left ${isSelected ? 'bg-primary/10 border-primary text-primary' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}>
                      {isSelected && sub !== "All Subjects" && <Check className="h-2.5 w-2.5 absolute top-1.5 right-1.5" />}
                      {sub}
                    </button>
                  )
                })}
              </CardContent>
            </Card>
          )}

          {selectedYears.length > 0 && (
            <Card className="glass border-none animate-in slide-in-from-top-4 duration-500">
              <CardHeader><CardTitle className="flex items-center gap-2"><BookOpen className="h-5 w-5 text-accent" /> Step 4: Number of Questions</CardTitle></CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {QUESTION_COUNT_OPTIONS.map(count => (
                  <button key={count} onClick={() => setDesiredCount(count)}
                    className={`h-11 px-5 rounded-xl text-sm font-bold transition-all ${desiredCount === count ? 'bg-accent text-background shadow-lg shadow-accent/30' : 'bg-white/5 border border-white/5 hover:bg-white/10'}`}>
                    {count === 0 ? "All Available" : count}
                  </button>
                ))}
              </CardContent>
            </Card>
          )}

          {selectedYears.length > 0 && (
            <Card className="glass border-none animate-in slide-in-from-top-4 duration-500">
              <CardHeader><CardTitle className="flex items-center gap-2"><Timer className="h-5 w-5 text-accent" /> Step 5: Select Mode</CardTitle></CardHeader>
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

        <div>
          <Card className="glass border-none sticky top-24">
            <CardHeader className="bg-primary/10 rounded-t-xl"><CardTitle>Session Summary</CardTitle></CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Exam</span><span className="font-bold">{selectedExam || '—'}</span></div>
                <div className="flex justify-between items-start"><span className="text-muted-foreground">Years</span><span className="font-bold text-right">{selectedYears.length > 0 ? selectedYears.map(y => y === 0 ? "Random" : y).join(', ') : '—'}</span></div>
                <div className="flex justify-between items-start"><span className="text-muted-foreground">Subjects</span><span className="font-bold text-xs text-right">{selectedSubjects.join(', ')}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Mode</span><span className="font-bold capitalize">{mode}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Available</span>
                  <span className="font-bold text-primary">{loadingCount ? <Loader2 className="h-4 w-4 animate-spin inline" /> : questionCount}</span>
                </div>
                <div className="flex justify-between"><span className="text-muted-foreground">Will Use</span>
                  <span className="font-bold text-accent">{desiredCount === 0 ? questionCount : Math.min(desiredCount, questionCount)}</span>
                </div>
              </div>
              <Button onClick={handleStart} disabled={!selectedExam || selectedYears.length === 0 || questionCount === 0}
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
