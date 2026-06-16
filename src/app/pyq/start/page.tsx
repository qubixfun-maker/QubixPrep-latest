"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { useState, useEffect, Suspense } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { CheckCircle2, XCircle, Loader2, ArrowLeft, ChevronRight, Trophy, Timer, BrainCircuit, AlertTriangle, MessageSquare } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { clinicalTutorFlow } from "@/ai/flows/ai-clinical-tutor"

function PYQSessionContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { toast } = useToast()

  const exam = searchParams.get('exam') || ''
  const year = searchParams.get('year') || ''
  const subject = searchParams.get('subject') || 'All Subjects'
  const mode = searchParams.get('mode') || 'practice'

  const [questions, setQuestions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [showExplanation, setShowExplanation] = useState(false)
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [timeLeft, setTimeLeft] = useState(0)
  const [aiExplanation, setAiExplanation] = useState<string | null>(null)
  const [isAiLoading, setIsAiLoading] = useState(false)

  useEffect(() => {
    async function load() {
      setLoading(true)
      let query = supabase.from('pyq_questions').select('*').eq('exam_type', exam).eq('year', parseInt(year))
      if (subject !== 'All Subjects') query = query.eq('subject', subject)
      const { data, error } = await query
      if (error) { toast({ variant: "destructive", title: "Error", description: error.message }); return }
      setQuestions(data || [])
      if (mode === 'exam') setTimeLeft((data?.length || 0) * 90) // 90 seconds per question
      setLoading(false)
    }
    load()
  }, [exam, year, subject])

  useEffect(() => {
    if (mode !== 'exam' || finished || loading || timeLeft <= 0) return
    const timer = setInterval(() => setTimeLeft(t => { if (t <= 1) { handleFinish(); return 0 } return t - 1 }), 1000)
    return () => clearInterval(timer)
  }, [mode, finished, loading, timeLeft])

  function handleFinish() {
    let s = 0
    questions.forEach((q, i) => { if (answers[i] === q.correct_answer_index) s++ })
    setScore(s)
    setFinished(true)
  }

  function handleAnswer(idx: number) {
    if (mode === 'practice') {
      if (selectedOption !== null) return
      setSelectedOption(idx)
      setShowExplanation(true)
      if (idx === questions[currentIndex].correct_answer_index) setScore(s => s + 1)
    } else {
      setAnswers(prev => ({ ...prev, [currentIndex]: idx }))
    }
  }

  function nextQuestion() {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(i => i + 1)
      setSelectedOption(null)
      setShowExplanation(false)
      setAiExplanation(null)
    } else {
      handleFinish()
    }
  }

  async function handleAskAi() {
    const q = questions[currentIndex]
    const options = [q.option1, q.option2, q.option3, q.option4].filter(Boolean)
    setIsAiLoading(true)
    try {
      const result = await clinicalTutorFlow(q.question_text, options[q.correct_answer_index], q.explanation)
      setAiExplanation(result)
    } catch (e: any) { toast({ variant: "destructive", title: "AI Error", description: e.message }) }
    finally { setIsAiLoading(false) }
  }

  const formatTime = (s: number) => `${Math.floor(s/60)}:${(s%60).toString().padStart(2,'0')}`

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
  if (questions.length === 0) return (
    <div className="h-screen flex flex-col items-center justify-center space-y-4">
      <AlertTriangle className="h-12 w-12 text-yellow-500" />
      <h2 className="text-2xl font-bold">No Questions Found</h2>
      <p className="text-muted-foreground">No PYQ uploaded for {exam} {year} {subject !== 'All Subjects' ? `— ${subject}` : ''}</p>
      <Button onClick={() => router.push('/pyq')}>Go Back</Button>
    </div>
  )

  if (finished) return (
    <div className="max-w-2xl mx-auto p-4 md:p-12 space-y-6 animate-in zoom-in-95 duration-500">
      <Card className="glass border-none text-center">
        <CardContent className="p-12 space-y-6">
          <Trophy className="h-16 w-16 text-primary mx-auto" />
          <h2 className="text-3xl font-bold">{exam} {year} Complete!</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-6 rounded-2xl bg-white/5"><p className="text-3xl font-bold">{score}/{questions.length}</p><p className="text-xs text-muted-foreground uppercase mt-1">Score</p></div>
            <div className="p-6 rounded-2xl bg-white/5"><p className="text-3xl font-bold">{Math.round(score/questions.length*100)}%</p><p className="text-xs text-muted-foreground uppercase mt-1">Accuracy</p></div>
          </div>
          <div className="flex flex-col gap-3 pt-4">
            <Button onClick={() => window.location.reload()} className="w-full h-12 rounded-xl font-bold">Reattempt</Button>
            <Button variant="ghost" onClick={() => router.push('/pyq')} className="w-full">Back to PYQ</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const q = questions[currentIndex]
  const options = [q.option1, q.option2, q.option3, q.option4].filter(Boolean)

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-12 space-y-6">
      <header className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => router.push('/pyq')} className="gap-2 text-muted-foreground"><ArrowLeft className="h-4 w-4" /> Exit</Button>
        <div className="flex items-center gap-4">
          {mode === 'exam' && <div className={`flex items-center gap-2 px-4 py-2 rounded-full border font-mono font-bold ${timeLeft < 60 ? 'bg-red-500/20 border-red-500 text-red-400 animate-pulse' : 'bg-white/5 border-white/10'}`}><Timer className="h-4 w-4" />{formatTime(timeLeft)}</div>}
          <span className="text-xs font-bold text-muted-foreground uppercase">{exam} {year} • Q{currentIndex+1}/{questions.length}</span>
        </div>
      </header>
      <Progress value={(currentIndex+1)/questions.length*100} className="h-1.5 bg-white/5" />
      <Card className="glass border-none shadow-2xl">
        <CardHeader>
          {q.subject && <p className="text-[10px] font-bold text-accent uppercase tracking-widest mb-2">{q.subject}</p>}
          <CardTitle className="text-xl leading-relaxed">{q.question_text}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-3">
            {options.map((opt: string, i: number) => {
              const isSelected = mode === 'practice' ? selectedOption === i : answers[currentIndex] === i
              const isCorrect = i === q.correct_answer_index
              let styles = "bg-white/5 border-white/5 hover:bg-white/10"
              if (mode === 'practice' && selectedOption !== null) {
                if (isCorrect) styles = "bg-green-500/10 border-green-500/50 text-green-400"
                else if (isSelected) styles = "bg-red-500/10 border-red-500/50 text-red-400"
                else styles = "bg-white/5 border-white/5 opacity-40"
              } else if (mode !== 'practice' && isSelected) styles = "bg-primary/20 border-primary text-primary"
              return (
                <button key={i} disabled={mode === 'practice' && selectedOption !== null} onClick={() => handleAnswer(i)}
                  className={`p-4 rounded-xl border text-left transition-all flex items-center justify-between ${styles}`}>
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-xs font-bold">{String.fromCharCode(65+i)}</span>
                    <span className="text-sm font-medium">{opt}</span>
                  </div>
                  {mode === 'practice' && selectedOption !== null && isCorrect && <CheckCircle2 className="h-5 w-5 shrink-0" />}
                  {mode === 'practice' && selectedOption !== null && isSelected && !isCorrect && <XCircle className="h-5 w-5 shrink-0" />}
                </button>
              )
            })}
          </div>

          {mode === 'practice' && showExplanation && (
            <div className="space-y-4 animate-in slide-in-from-top-4 duration-500">
              <div className="p-5 rounded-2xl bg-accent/5 border border-accent/20">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-bold text-accent uppercase tracking-widest">Explanation</p>
                  <Button variant="outline" size="sm" className="h-7 text-[10px] glass gap-1.5" onClick={handleAskAi} disabled={isAiLoading}>
                    {isAiLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <MessageSquare className="h-3 w-3" />} Ask AI Tutor
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{q.explanation || "No explanation provided."}</p>
              </div>
              {aiExplanation && (
                <div className="p-5 rounded-2xl bg-primary/5 border border-primary/20 animate-in fade-in duration-500">
                  <p className="text-xs font-bold text-primary uppercase tracking-widest mb-3 flex items-center gap-2"><BrainCircuit className="h-3.5 w-3.5" /> AI Clinical Reasoning</p>
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{aiExplanation}</p>
                </div>
              )}
              <Button onClick={nextQuestion} className="w-full h-12 rounded-xl bg-accent text-background font-bold">
                Next Question <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          )}
          {mode !== 'practice' && (
            <div className="flex justify-end pt-4">
              <Button onClick={nextQuestion} disabled={answers[currentIndex] === undefined} className="h-12 px-10 rounded-xl font-bold">
                {currentIndex+1 === questions.length ? 'Submit' : 'Next'} <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function PYQStartPage() {
  return <Suspense fallback={<div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>}><PYQSessionContent /></Suspense>
}