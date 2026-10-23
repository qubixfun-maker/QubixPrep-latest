"use client"
import { useTopSearch } from "@/components/layout/top-search"

import { useState, useEffect, useMemo } from "react"
import { doc, getDoc } from "firebase/firestore"
import { useFirestore } from "@/firebase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Trophy, BookOpen, Timer, Eye, Loader2, Check } from "lucide-react"
import { useRouter } from "next/navigation"
import { usePlan } from "@/hooks/use-plan"
import { UpgradeGate } from "@/components/upgrade-gate"
import { useRequireAuth } from "@/hooks/use-require-auth"

type Row = { id: string; exam: string; year: number; subject: string; img: boolean }

const EXAMS = ["NEET-PG", "INI-CET", "AIIMS"]
const QUESTION_COUNT_OPTIONS = [10, 25, 50, 100, 0]
const IMAGE_OPTIONS = [
  { id: "all", label: "All questions" },
  { id: "img", label: "Image-based only" },
  { id: "text", label: "Text only" },
]

function parseRow(s: string): Row {
  const p = s.split("|")
  return { id: p[0], exam: p[1], year: parseInt(p[2]), subject: p[3], img: p[4] === "1" }
}

export default function PYQPage() {
  const router = useRouter()
  const db = useFirestore()
  const { isPro, isBasic, loading: planLoading } = usePlan()
  const { checkingAuth } = useRequireAuth()
  const [search] = useTopSearch("Search subjects in PYQ…")

  const [rows, setRows] = useState<Row[] | null>(null)
  const [loadErr, setLoadErr] = useState("")
  const [selectedExam, setSelectedExam] = useState<string | null>(null)
  const [selectedYears, setSelectedYears] = useState<number[]>([])
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(["All Subjects"])
  const [imageFilter, setImageFilter] = useState("all")
  const [mode, setMode] = useState<"practice" | "exam" | "review">("practice")
  const [desiredCount, setDesiredCount] = useState(25)

  useEffect(() => {
    if (!db) return
    let alive = true
    getDoc(doc(db, "pyqMeta", "facets"))
      .then((snap) => {
        if (!alive) return
        const list = (snap.data()?.rows || []) as string[]
        setRows(list.map(parseRow))
      })
      .catch((e) => { if (alive) { setRows([]); setLoadErr(e?.message || "Could not load PYQ index") } })
    return () => { alive = false }
  }, [db])

  const examCounts = useMemo(() => {
    const m: Record<string, number> = {}
    ;(rows || []).forEach((r) => { m[r.exam] = (m[r.exam] || 0) + 1 })
    return m
  }, [rows])

  const examRows = useMemo(() => (rows || []).filter((r) => r.exam === selectedExam), [rows, selectedExam])

  const yearCounts = useMemo(() => {
    const m = new Map<number, number>()
    examRows.forEach((r) => m.set(r.year, (m.get(r.year) || 0) + 1))
    return [...m.entries()].sort((a, b) => b[0] - a[0])
  }, [examRows])

  const imageRows = useMemo(() => {
    const yr = examRows.filter((r) => selectedYears.includes(r.year))
    if (imageFilter === "img") return yr.filter((r) => r.img)
    if (imageFilter === "text") return yr.filter((r) => !r.img)
    return yr
  }, [examRows, selectedYears, imageFilter])

  const subjectCounts = useMemo(() => {
    const m = new Map<string, number>()
    imageRows.forEach((r) => m.set(r.subject, (m.get(r.subject) || 0) + 1))
    return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0]))
  }, [imageRows])

  const subjectFilter = useMemo(() => {
    if (selectedSubjects.includes("All Subjects") || selectedSubjects.length === 0) return null
    return selectedSubjects
  }, [selectedSubjects])

  const questionCount = useMemo(
    () => (subjectFilter ? imageRows.filter((r) => subjectFilter.includes(r.subject)).length : imageRows.length),
    [imageRows, subjectFilter]
  )

  function pickExam(exam: string) {
    setSelectedExam(exam)
    setSelectedYears([])
    setSelectedSubjects(["All Subjects"])
  }

  function toggleYear(year: number) {
    setSelectedYears((prev) => (prev.includes(year) ? prev.filter((y) => y !== year) : [...prev, year]))
  }

  function toggleAllYears() {
    setSelectedYears((prev) => (prev.length === yearCounts.length ? [] : yearCounts.map(([y]) => y)))
  }

  function toggleSubject(subject: string) {
    if (subject === "All Subjects") {
      setSelectedSubjects(["All Subjects"])
      return
    }
    setSelectedSubjects((prev) => {
      const withoutAll = prev.filter((s) => s !== "All Subjects")
      if (withoutAll.includes(subject)) {
        const next = withoutAll.filter((s) => s !== subject)
        return next.length === 0 ? ["All Subjects"] : next
      }
      return [...withoutAll, subject]
    })
  }

  function handleStart() {
    if (!selectedExam || selectedYears.length === 0 || questionCount === 0) return
    if (!isBasic) {
      router.push("/pricing")
      return
    }
    const params = new URLSearchParams({
      exam: selectedExam,
      years: selectedYears.join(","),
      subjects: subjectFilter ? subjectFilter.join(",") : "All Subjects",
      img: imageFilter,
      mode,
      count: desiredCount === 0 ? questionCount.toString() : Math.min(desiredCount, questionCount).toString(),
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
          <p className="text-muted-foreground text-lg">Year-wise previous year questions from NEET-PG, INI-CET and AIIMS</p>
        </div>
        <UpgradeGate type="ai" title="Clinician Plan Required" description="Access the full PYQ Test Series with year-wise papers, subject filters, and 3 practice modes. Available to Clinician members." />
      </div>
    )
  }

  const willUse = desiredCount === 0 ? questionCount : Math.min(desiredCount, questionCount)

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-12 space-y-8 animate-in fade-in duration-500">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold flex items-center gap-3"><Trophy className="h-10 w-10 text-primary" /> PYQ Test Series</h1>
        <p className="text-muted-foreground text-lg">Year-wise previous year questions from NEET-PG, INI-CET and AIIMS</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">

          <Card className="glass border-none">
            <CardHeader><CardTitle className="flex items-center gap-2"><Trophy className="h-5 w-5 text-primary" /> Step 1: Select Exam</CardTitle></CardHeader>
            <CardContent>
              {rows === null ? (
                <Loader2 className="animate-spin text-primary" />
              ) : rows.length === 0 ? (
                <p className="text-muted-foreground text-sm">{loadErr || "No PYQ papers have been uploaded yet."}</p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {EXAMS.filter((exam) => examCounts[exam]).map((exam) => (
                    <button key={exam} onClick={() => pickExam(exam)}
                      className={`p-4 rounded-xl border text-sm font-bold transition-all text-left ${selectedExam === exam ? "bg-primary/10 border-primary text-primary" : "bg-white/5 border-white/5 hover:bg-white/10"}`}>
                      {exam}
                      <span className="block text-[10px] font-medium text-muted-foreground mt-0.5">{examCounts[exam]} questions</span>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {selectedExam && (
            <Card className="glass border-none animate-in slide-in-from-top-4 duration-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><BookOpen className="h-5 w-5 text-accent" /> Step 2: Select Year(s)</CardTitle>
                <p className="text-xs text-muted-foreground">Tap multiple years to combine them into one session.</p>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                  {yearCounts.map(([year, n]) => {
                    const isSelected = selectedYears.includes(year)
                    return (
                      <button key={year} onClick={() => toggleYear(year)}
                        className={`relative p-3 rounded-xl border text-sm font-bold transition-all ${isSelected ? "bg-accent/10 border-accent text-accent" : "bg-white/5 border-white/5 hover:bg-white/10"}`}>
                        {isSelected && <Check className="h-3 w-3 absolute top-1.5 right-1.5" />}
                        {year}
                        <span className="block text-[10px] font-medium text-muted-foreground mt-0.5">{n} Qs</span>
                      </button>
                    )
                  })}
                </div>
                <button onClick={toggleAllYears} className="text-xs font-bold text-accent">
                  {selectedYears.length === yearCounts.length ? "Clear all years" : "Select all years"}
                </button>
              </CardContent>
            </Card>
          )}

          {selectedYears.length > 0 && (
            <Card className="glass border-none animate-in slide-in-from-top-4 duration-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><BookOpen className="h-5 w-5 text-primary" /> Step 3: Question Type</CardTitle>
                <p className="text-xs text-muted-foreground">Some questions show a picture, such as a slide, X-ray or specimen.</p>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {IMAGE_OPTIONS.map((o) => (
                  <button key={o.id} onClick={() => setImageFilter(o.id)}
                    className={`h-11 px-5 rounded-xl text-sm font-bold transition-all ${imageFilter === o.id ? "bg-primary/10 border border-primary text-primary" : "bg-white/5 border border-white/5 hover:bg-white/10"}`}>
                    {o.label}
                  </button>
                ))}
              </CardContent>
            </Card>
          )}

          {selectedYears.length > 0 && (
            <Card className="glass border-none animate-in slide-in-from-top-4 duration-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><BookOpen className="h-5 w-5 text-primary" /> Step 4: Subject Filter</CardTitle>
                <p className="text-xs text-muted-foreground">Select one or more subjects, or leave on "All Subjects."</p>
              </CardHeader>
              <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {["All Subjects", ...subjectCounts.map(([s]) => s)]
                  .filter((sub) => sub === "All Subjects" || !search.trim() || sub.toLowerCase().includes(search.trim().toLowerCase()))
                  .map((sub) => {
                    const isSelected = selectedSubjects.includes(sub)
                    const n = sub === "All Subjects" ? imageRows.length : subjectCounts.find(([s]) => s === sub)?.[1] || 0
                    return (
                      <button key={sub} onClick={() => toggleSubject(sub)}
                        className={`relative p-2.5 rounded-lg border text-xs font-bold transition-all text-left ${isSelected ? "bg-primary/10 border-primary text-primary" : "bg-white/5 border-white/5 hover:bg-white/10"}`}>
                        {isSelected && sub !== "All Subjects" && <Check className="h-2.5 w-2.5 absolute top-1.5 right-1.5" />}
                        {sub}
                        <span className="block text-[10px] font-medium text-muted-foreground mt-0.5">{n} Qs</span>
                      </button>
                    )
                  })}
              </CardContent>
            </Card>
          )}

          {selectedYears.length > 0 && (
            <Card className="glass border-none animate-in slide-in-from-top-4 duration-500">
              <CardHeader><CardTitle className="flex items-center gap-2"><BookOpen className="h-5 w-5 text-accent" /> Step 5: Number of Questions</CardTitle></CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {QUESTION_COUNT_OPTIONS.map((count) => (
                  <button key={count} onClick={() => setDesiredCount(count)}
                    className={`h-11 px-5 rounded-xl text-sm font-bold transition-all ${desiredCount === count ? "bg-accent text-background shadow-lg shadow-accent/30" : "bg-white/5 border border-white/5 hover:bg-white/10"}`}>
                    {count === 0 ? "All Available" : count}
                  </button>
                ))}
              </CardContent>
            </Card>
          )}

          {selectedYears.length > 0 && (
            <Card className="glass border-none animate-in slide-in-from-top-4 duration-500">
              <CardHeader><CardTitle className="flex items-center gap-2"><Timer className="h-5 w-5 text-accent" /> Step 6: Select Mode</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { id: "practice", label: "Practice", desc: "See answer after each question", icon: BookOpen },
                  { id: "exam", label: "Exam", desc: "Timed, see results at end", icon: Timer },
                  { id: "review", label: "Review", desc: "Attempt all, then review", icon: Eye },
                ].map((m) => (
                  <button key={m.id} onClick={() => setMode(m.id as any)}
                    className={`p-4 rounded-xl border text-left transition-all ${mode === m.id ? "bg-primary/10 border-primary" : "bg-white/5 border-white/5 hover:bg-white/10"}`}>
                    <m.icon className={`h-5 w-5 mb-2 ${mode === m.id ? "text-primary" : "text-muted-foreground"}`} />
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
                <div className="flex justify-between"><span className="text-muted-foreground">Exam</span><span className="font-bold">{selectedExam || "—"}</span></div>
                <div className="flex justify-between items-start"><span className="text-muted-foreground">Years</span><span className="font-bold text-right">{selectedYears.length > 0 ? [...selectedYears].sort((a, b) => b - a).join(", ") : "—"}</span></div>
                <div className="flex justify-between items-start"><span className="text-muted-foreground">Subjects</span><span className="font-bold text-xs text-right">{selectedSubjects.join(", ")}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Type</span><span className="font-bold">{IMAGE_OPTIONS.find((o) => o.id === imageFilter)?.label}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Mode</span><span className="font-bold capitalize">{mode}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Available</span>
                  <span className="font-bold text-primary">{questionCount}</span>
                </div>
                <div className="flex justify-between"><span className="text-muted-foreground">Will Use</span>
                  <span className="font-bold text-accent">{willUse}</span>
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
