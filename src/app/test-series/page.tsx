"use client"

import { useState, useMemo, useEffect } from "react"
import { useCollection, useFirestore } from "@/firebase"
import { usePlan } from "@/hooks/use-plan"
import { UpgradeGate } from "@/components/upgrade-gate"
import { useRequireAuth } from "@/hooks/use-require-auth"
import { collection } from "firebase/firestore"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Input } from "@/components/ui/input"
import { 
  Trophy, 
  Sparkles, 
  ShieldCheck, 
  Timer, 
  Stethoscope, 
  ArrowRight,
  Loader2,
  ChevronDown,
  BookOpen,
  Filter,
  Clock
} from "lucide-react"
import { useRouter } from "next/navigation"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

export default function TestSeriesPage() {
  const db = useFirestore()
  const { canAccessContent, loading: planLoading } = usePlan()
  const router = useRouter()
  const { checkingAuth } = useRequireAuth()
  const subjectsQuery = useMemo(() => (!db ? null : collection(db, 'subjects')), [db])
  const { data: subjects, loading: subjectsLoading } = useCollection(subjectsQuery)

  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([])
  const [curriculum, setCurriculum] = useState<any[]>([])
  const [curriculumLoading, setCurriculumLoading] = useState(false)
  
  const [selectedUnits, setSelectedUnits] = useState<string[]>([])
  const [selectedTopics, setSelectedTopics] = useState<string[]>([])
  
  const [questionCount, setQuestionCount] = useState(25)
  const [timeLimit, setTimeLimit] = useState(30) // Minutes
  const [mode, setMode] = useState<"practice" | "exam">("practice")

  // Load Curriculum (Units/Topics) for selected subjects
  useEffect(() => {
    async function fetchCurriculum() {
      if (selectedSubjects.length === 0) {
        setCurriculum([])
        return
      }
      setCurriculumLoading(true)
      try {
        const { data, error } = await supabase
          .from('questions')
          .select('subject_id, unit_title, topic_title')
          .in('subject_id', selectedSubjects)
        
        if (error) throw error

        const map: Record<string, any> = {}
        data.forEach(q => {
          const sId = q.subject_id
          const uTitle = q.unit_title || "General"
          const tTitle = q.topic_title || "General"

          if (!map[sId]) map[sId] = { id: sId, units: {} }
          if (!map[sId].units[uTitle]) map[sId].units[uTitle] = new Set()
          map[sId].units[uTitle].add(tTitle)
        })

        const formatted = Object.values(map).map(s => ({
          ...s,
          name: subjects?.find(sub => sub.id === s.id)?.name || s.id,
          units: Object.entries(s.units).map(([title, topics]) => ({
            title,
            topics: Array.from(topics as Set<string>)
          }))
        }))

        setCurriculum(formatted)
      } catch (e) {
        console.error(e)
      } finally {
        setCurriculumLoading(false)
      }
    }
    fetchCurriculum()
  }, [selectedSubjects, subjects])

  const handleToggleSubject = (id: string) => {
    setSelectedSubjects(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    )
  }

  const handleToggleUnit = (subjectId: string, unitTitle: string) => {
    const key = `${subjectId}|${unitTitle}`
    setSelectedUnits(prev => 
      prev.includes(key) ? prev.filter(u => u !== key) : [...prev, key]
    )
  }

  const handleToggleTopic = (subjectId: string, unitTitle: string, topicTitle: string) => {
    const key = `${subjectId}|${unitTitle}|${topicTitle}`
    setSelectedTopics(prev => 
      prev.includes(key) ? prev.filter(t => t !== key) : [...prev, key]
    )
  }

  const handleStart = () => {
    if (selectedSubjects.length === 0) return
    if (!canAccessContent) {
      router.push('/pricing')
      return
    }
    if (!canAccessContent) {
      router.push('/pricing')
      return
    }
    
    const unitTitles = selectedUnits.map(u => u.split('|')[1])
    const topicTitles = selectedTopics.map(t => t.split('|')[2])

    const params = new URLSearchParams({
      subjects: selectedSubjects.join(','),
      units: unitTitles.join(','),
      topics: topicTitles.join(','),
      count: questionCount.toString(),
      time: timeLimit.toString(),
      mode: mode
    })
    router.push(`/test-series/start?${params.toString()}`)
  }

  if (planLoading) return null

  if (checkingAuth) return <div className="h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 text-primary animate-spin" /></div>

  if (!canAccessContent) {
    return (
      <div className="max-w-2xl mx-auto p-8 md:p-12 flex items-center justify-center min-h-[60vh]">
        <UpgradeGate
          type="content"
          title="Custom Quiz — Scholar & Clinician Only"
          description="Upgrade to Scholar or Clinician plan to access AI-powered custom test series with topic selection, timed mode, and performance analytics."
        />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-12 space-y-8 animate-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight flex items-center gap-3">
            <Trophy className="h-10 w-10 text-primary" /> Custom quiz
          </h1>
          <p className="text-muted-foreground text-lg">Build clinical simulations tailored to your curriculum focus.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="glass border-none">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-accent" /> Step 1: Select Subjects
              </CardTitle>
              <CardDescription>Choose core subjects to include in your assessment pool.</CardDescription>
            </CardHeader>
            <CardContent>
              {subjectsLoading ? (
                <div className="p-12 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {subjects?.map((subject: any) => (
                    <div 
                      key={subject.id} 
                      className={`flex items-center space-x-3 p-4 rounded-xl border transition-all cursor-pointer ${
                        selectedSubjects.includes(subject.id) 
                        ? 'bg-primary/10 border-primary shadow-lg shadow-primary/5' 
                        : 'bg-white/5 border-white/5 hover:bg-white/10'
                      }`}
                      onClick={() => handleToggleSubject(subject.id)}
                    >
                      <Checkbox 
                        id={`subject-${subject.id}`} 
                        checked={selectedSubjects.includes(subject.id)}
                        onCheckedChange={() => handleToggleSubject(subject.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="flex-1">
                        <Label htmlFor={`subject-${subject.id}`} className="font-bold cursor-pointer" onClick={(e) => e.stopPropagation()}>
                          {subject.name}
                        </Label>
                        <p className="text-[10px] text-muted-foreground uppercase">{subject.questionCount || 0} Questions</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {selectedSubjects.length > 0 && (
            <Card className="glass border-none animate-in slide-in-from-top-4 duration-500">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Filter className="h-5 w-5 text-primary" /> Step 2: Refine Curriculum (Optional)
                </CardTitle>
                <CardDescription>Leave unselected to include all topics within chosen subjects.</CardDescription>
              </CardHeader>
              <CardContent>
                {curriculumLoading ? (
                  <div className="p-8 flex justify-center"><Loader2 className="h-6 w-6 animate-spin opacity-20" /></div>
                ) : (
                  <div className="space-y-6">
                    {curriculum.map((s) => (
                      <div key={s.id} className="space-y-3">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-primary/60 border-b border-white/5 pb-2">{s.name}</p>
                        <Accordion type="multiple" className="space-y-2">
                          {s.units.map((u: any, uIdx: number) => {
                            const unitKey = `${s.id}|${u.title}`
                            return (
                              <AccordionItem key={uIdx} value={`${s.id}-u-${uIdx}`} className="border-none bg-black/20 rounded-xl overflow-hidden px-2">
                                <div className="flex items-center">
                                  <Checkbox 
                                    id={unitKey}
                                    className="ml-2"
                                    checked={selectedUnits.includes(unitKey)}
                                    onCheckedChange={() => handleToggleUnit(s.id, u.title)}
                                  />
                                  <AccordionTrigger className="hover:no-underline py-3 px-4 flex-1 text-sm font-bold">{u.title}</AccordionTrigger>
                                </div>
                                <AccordionContent className="px-4 pb-4 pt-2 space-y-2">
                                  {u.topics.map((t: string, tIdx: number) => {
                                    const topicKey = `${s.id}|${u.title}|${t}`
                                    return (
                                      <div 
                                        key={tIdx} 
                                        className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer ${
                                          selectedTopics.includes(topicKey) ? 'bg-primary/10 border-primary/40' : 'bg-white/5 border-white/5'
                                        }`}
                                        onClick={() => handleToggleTopic(s.id, u.title, t)}
                                      >
                                        <Checkbox 
                                          checked={selectedTopics.includes(topicKey)} 
                                          onCheckedChange={() => handleToggleTopic(s.id, u.title, t)}
                                          onClick={(e) => e.stopPropagation()}
                                        />
                                        <span className="text-xs font-medium">{t}</span>
                                      </div>
                                    )
                                  })}
                                </AccordionContent>
                              </AccordionItem>
                            )
                          })}
                        </Accordion>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Card className="glass border-none">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Stethoscope className="h-5 w-5 text-primary" /> Step 3: Configure Parameters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-10">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <BookOpen className="h-3.5 w-3.5" /> Question Volume
                  </Label>
                  <div className="flex items-center gap-3">
                    <Input 
                      type="number" 
                      min={1}
                      value={questionCount}
                      onChange={(e) => setQuestionCount(Math.max(1, parseInt(e.target.value) || 0))}
                      className="w-24 h-10 glass text-center text-lg font-bold text-primary border-white/10"
                    />
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Cases</span>
                  </div>
                </div>
                <Slider 
                  value={[questionCount > 500 ? 500 : questionCount]} 
                  onValueChange={(v) => setQuestionCount(v[0])}
                  max={500}
                  min={5}
                  step={5}
                  className="py-4"
                />
                <p className="text-[10px] text-muted-foreground italic">Use the input box for volumes greater than 500.</p>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5" /> Time Duration
                  </Label>
                  <span className="text-xl font-bold text-accent">{timeLimit} Minutes</span>
                </div>
                <Slider 
                  value={[timeLimit]} 
                  onValueChange={(v) => setTimeLimit(v[0])}
                  max={180}
                  min={5}
                  step={5}
                  className="py-4"
                />
                <p className="text-[10px] text-muted-foreground italic">Approx. {Math.round((timeLimit * 60) / questionCount)} seconds per question.</p>
              </div>

              <div className="space-y-4">
                <Label className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Assessment Mode</Label>
                <RadioGroup value={mode} onValueChange={(v: any) => setMode(v)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div 
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                      mode === 'practice' ? 'bg-accent/10 border-accent' : 'bg-white/5 border-white/5'
                    }`}
                    onClick={() => setMode('practice')}
                  >
                    <RadioGroupItem value="practice" id="practice" className="mt-1" />
                    <div>
                      <Label htmlFor="practice" className="font-bold cursor-pointer">Practice Mode</Label>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">Untimed. See immediate feedback after each case.</p>
                    </div>
                  </div>
                  <div 
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                      mode === 'exam' ? 'bg-primary/10 border-primary' : 'bg-white/5 border-white/5'
                    }`}
                    onClick={() => setMode('exam')}
                  >
                    <RadioGroupItem value="exam" id="exam" className="mt-1" />
                    <div>
                      <Label htmlFor="exam" className="font-bold cursor-pointer">Exam Mode</Label>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">Timed. Professional score report at the end.</p>
                    </div>
                  </div>
                </RadioGroup>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="glass border-none sticky top-24">
            <CardHeader className="bg-primary/10 rounded-t-lg">
              <CardTitle className="text-lg">Assessment Summary</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Selected Subjects</span>
                  <span className="font-bold">{selectedSubjects.length}</span>
                </div>
                {selectedUnits.length > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Specific Units</span>
                    <span className="font-bold text-accent">{selectedUnits.length}</span>
                  </div>
                )}
                {selectedTopics.length > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Filtered Topics</span>
                    <span className="font-bold text-accent">{selectedTopics.length}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Exam Volume</span>
                  <span className="font-bold">{questionCount} Cases</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Time</span>
                  <span className="font-bold">{timeLimit} Mins</span>
                </div>
                <div className="flex justify-between text-sm capitalize">
                  <span className="text-muted-foreground">Simulation Mode</span>
                  <span className={`font-bold ${mode === 'exam' ? 'text-primary' : 'text-accent'}`}>{mode}</span>
                </div>
              </div>

              <div className="bg-white/5 p-4 rounded-xl border border-white/5 flex items-start gap-3">
                <ShieldCheck className="h-5 w-5 text-accent shrink-0" />
                <p className="text-[10px] text-muted-foreground leading-relaxed italic">
                  Clinical patterns are based on board-standard MCQ logic for NEET-PG/USMLE.
                </p>
              </div>

              <Button 
                onClick={handleStart}
                disabled={selectedSubjects.length === 0}
                className="w-full h-14 rounded-xl text-lg font-bold bg-primary hover:bg-primary/90 shadow-xl shadow-primary/30 gap-2"
              >
                Launch Simulation <ArrowRight className="h-5 w-5" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
