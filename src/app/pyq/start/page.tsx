"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { useState, useEffect, Suspense } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { CheckCircle2, XCircle, Loader2, ArrowLeft, ChevronRight, Trophy, Timer, BrainCircuit, AlertTriangle, MessageSquare, ListChecks, Info } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useUser } from "@/firebase"
import { clinicalTutorFlow } from "@/ai/flows/ai-clinical-tutor"

function PYQSessionContent() {
  const { user } = useUser()
  const searchParams = useSearchParams()
  const router = useRouter()
  const { toast } = useToast()

  const exam = searchParams.get('exam') || ''
  const yearsParam = searchParams.get('years') || ''
  const subjectsParam = searchParams.get('subjects') || 'All Subjects'
  const mode = searchParams.get('mode') || 'practice'
  const desiredCount = parseInt(searchParams.get('count') || '0')

  const years = yearsParam.split(',').map(y => parseInt(y)).filter(y => !isNaN(y))
  const subjects = subjectsParam === 'All Subjects' ? null : subjectsParam.split(',')

  const [questions, setQuestions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [showExplanation, setShowExplanation] = useState(false)
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)
  const [showReview, setShowReview] = useState(false)
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [lockedAnswers, setLockedAnswers] = useState<Record<number, number>>({})
  const [timeLeft, setTimeLeft] = useState(0)
  const [aiExplanation, setAiExplanation] = useState<string | null>(null)
  const [isAiLoading, setIsAiLoading] = useState(false)

  useEffect(() => {
    async function load() {
      setLoading(true)
      let query = supabase.from('pyq_questions').select('*').eq('exam_type', exam).range(0, 9999)

      const realYears = years.filter(y => y !== 0)
      const includesRandom = years.includes(0)

      if (includesRandom && realYears.length > 0) {
        query = query.or(`year.in.(${realYears.join(',')}),year.is.null`)
      } else if (includesRandom) {
        query = query.is('year', null)
      } else if (realYears.length > 0) {
        query = query.in('year', realYears)
      }

      if (subjects) query = query.in('subject', subjects)

      const { data, error } = await query
      if (error) { toast({ variant: "destructive", title: "Error", description: error.message }); setLoading(false); return }

      let pool = data || []
      pool = pool.sort(() => 0.5 - Math.random())
      if (desiredCount > 0 && pool.length > desiredCount) {
        pool = pool.slice(0, desiredCount)
      }

      setQuestions(pool)
      if (mode === 'exam') setTimeLeft(pool.length * 90)
      setLoading(false)
    }
    load()
  }, [exam, yearsParam, subjectsParam, desiredCount])

  useEffect(() => {
    if (mode !== 'exam' || finished || loading || timeLeft <= 0) return
    const timer = setInterval(() => setTimeLeft(t => { if (t <= 1) { handleFinish(); return 0 } return t - 1 }), 1000)
    return () => clearInterval(timer)
  }, [mode, finished, loading, timeLeft])

  function handleFinish() {
    let s = 0
    questions.forEach((q, i) => {
      const ans = mode === 'practice' ? lockedAnswers[i] : answers[i]
      if (ans === q.correct_answer_index) s++
    })
    setScore(s)
    setFinished(true)
  }

  function goToQuestion(index: number) {
    if (index < 0 || index >= questions.length) return
    setCurrentIndex(index)
    if (mode === 'practice') {
      const locked = lockedAnswers[index]
      setSelectedOption(locked !== undefined ? locked : null)
      setShowExplanation(locked !== undefined)
    } else {
      setSelectedOption(answers[index] ?? null)
    }
    setAiExplanation(null)
  }

  function handleAnswer(idx: number) {
    if (mode === 'practice') {
      if (lockedAnswers[currentIndex] !== undefined) return
      setSelectedOption(idx)
      setShowExplanation(true)
      setLockedAnswers(prev => ({ ...prev, [currentIndex]: idx }))
      setAnswers(prev => ({ ...prev, [currentIndex]: idx }))
      if (idx === questions[currentIndex].correct_answer_index) setScore(s => s + 1)
    } else {
      setAnswers(prev => ({ ...prev, [currentIndex]: idx }))
      setSelectedOption(idx)
    }
  }

  function nextQuestion() {
    if (currentIndex + 1 < questions.length) {
      goToQuestion(currentIndex + 1)
    } else {
      handleFinish()
    }
  }

  function previousQuestion() {
    goToQuestion(currentIndex - 1)
  }

  async function handleAskAi() {
    const q = questions[currentIndex]
    const options = [q.option1, q.option2, q.option3, q.option4].filter(Boolean)
    setIsAiLoading(true)
    try {
      const result = await clinicalTutorFlow(q.question_text, options[q.correct_answer_index], q.explanation, user?.uid)
      setAiExplanation(result)
    } catch (e: any) { toast({ variant: "destructive", title: "AI Error", description: e.message }) }
    finally { setIsAiLoading(false) }
  }

  const formatTime = (s: number) => `${Math.floor(s/60)}:${(s%60).toString().padStart(2,'0')}`

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
  if (questions.length === 0) return (
    <div className="h-screen flex flex-col items-center justify-center space-y-4 px-4 text-center">
      <AlertTriangle className="h-12 w-12 text-yellow-500" />
      <h2 className="text-2xl font-bold">No Questions Found</h2>
      <p className="text-muted-foreground">No PYQ uploaded matching your selected filters.</p>
      <Button onClick={() => router.push('/pyq')}>Go Back</Button>
    </div>
  )

  if (finished) {
    if (showReview) {
      return (
        <div className="max-w-3xl mx-auto p-4 md:p-12 space-y-6 animate-in fade-in duration-500">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => setShowReview(false)} className="gap-2 text-muted-foreground px-2">
              <ArrowLeft className="h-4 w-4" /> Back to Results
            </Button>
            <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Review Answers</h2>
          </div>

          <div className="space-y-4">
            {questions.map((q, i) => {
              const qOptions = [q.option1, q.option2, q.option3, q.option4].filter(Boolean)
              const userAnswer = mode === 'practice' ? lockedAnswers[i] : answers[i]
              const isCorrect = userAnswer === q.correct_answer_index
              const wasSkipped = userAnswer === undefined

              return (
                <Card key={i} className={`glass border-none ${isCorrect ? 'border-l-2 border-l-green-500' : wasSkipped ? 'border-l-2 border-l-yellow-500' : 'border-l-2 border-l-red-500'}`}>
                  <CardContent className="p-4 md:p-5 space-y-3">
                    <div className="flex items-start gap-2">
                      {isCorrect ? <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0 mt-0.5" /> : wasSkipped ? <Info className="h-4 w-4 text-yellow-400 shrink-0 mt-0.5" /> : <XCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />}
                      <p className="text-sm font-medium flex-1 leading-relaxed">
                        <span className="text-muted-foreground mr-1">Q{i + 1}.</span>{q.question_text}
                        {q.subject && <span className="ml-2 text-[10px] text-accent uppercase font-bold">{q.subject}</span>}
                      </p>
                    </div>
                    <div className="grid gap-1.5 pl-6">
                      {qOptions.map((opt: string, oi: number) => {
                        const isUserChoice = oi === userAnswer
                        const isCorrectChoice = oi === q.correct_answer_index
                        let style = "text-muted-foreground"
                        if (isCorrectChoice) style = "text-green-400 font-medium"
                        else if (isUserChoice && !isCorrectChoice) style = "text-red-400 font-medium line-through"
                        return (
                          <div key={oi} className={`text-xs flex items-start gap-2 ${style}`}>
                            <span className="w-4 h-4 rounded-full bg-white/5 flex items-center justify-center text-[10px] shrink-0 mt-0.5">{String.fromCharCode(65 + oi)}</span>
                            <span className="leading-relaxed">{opt}</span>
                          </div>
                        )
                      })}
                    </div>
                    {q.explanation && (
                      <p className="text-xs text-muted-foreground italic pl-6 pt-2 border-t border-white/5 leading-relaxed">{q.explanation}</p>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )
    }

    return (
      <div className="max-w-2xl mx-auto p-4 md:p-12 space-y-6 animate-in zoom-in-95 duration-500">
        <Card className="glass border-none text-center">
          <CardContent className="p-6 md:p-12 space-y-6">
            <Trophy className="h-14 w-14 md:h-16 md:w-16 text-primary mx-auto" />
            <h2 className="text-2xl md:text-3xl font-bold">{exam} Complete!</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-5 md:p-6 rounded-2xl bg-white/5"><p className="text-2xl md:text-3xl font-bold">{score}/{questions.length}</p><p className="text-xs text-muted-foreground uppercase mt-1">Score</p></div>
              <div className="p-5 md:p-6 rounded-2xl bg-white/5"><p className="text-2xl md:text-3xl font-bold">{Math.round(score/questions.length*100)}%</p><p className="text-xs text-muted-foreground uppercase mt-1">Accuracy</p></div>
            </div>
            <div className="flex flex-col gap-3 pt-4">
              <Button onClick={() => setShowReview(true)} variant="outline" className="w-full h-12 rounded-xl glass border-white/10 font-bold gap-2">
                <ListChecks className="h-5 w-5" /> Review Answers
              </Button>
              <Button onClick={() => window.location.reload()} className="w-full h-12 rounded-xl font-bold">Reattempt</Button>
              <Button variant="ghost" onClick={() => router.push('/pyq')} className="w-full">Back to PYQ</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const q = questions[currentIndex]
  const options = [q.option1, q.option2, q.option3, q.option4].filter(Boolean)
  const isPracticeLocked = mode === 'practice' && lockedAnswers[currentIndex] !== undefined
  const canGoNext = mode === 'practice' ? isPracticeLocked : true

  return (
    <div className="max-w-3xl mx-auto p-3 md:p-12 space-y-4 md:space-y-6 pb-24 md:pb-8">
      <header className="flex items-center justify-between gap-2">
        <Button variant="ghost" size="sm" onClick={() => router.push('/pyq')} className="gap-1.5 text-muted-foreground px-2 text-xs md:text-sm">
          <ArrowLeft className="h-4 w-4" /> <span className="hidden sm:inline">Exit</span>
        </Button>
        <div className="flex items-center gap-2 md:gap-4">
          {mode === 'exam' && <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border font-mono font-bold text-sm ${timeLeft < 60 ? 'bg-red-500/20 border-red-500 text-red-400 animate-pulse' : 'bg-white/5 border-white/10'}`}><Timer className="h-3.5 w-3.5" />{formatTime(timeLeft)}</div>}
          <span className="text-[10px] md:text-xs font-bold text-muted-foreground uppercase whitespace-nowrap">Q{currentIndex+1}/{questions.length}</span>
        </div>
      </header>
      <Progress value={(currentIndex+1)/questions.length*100} className="h-1.5 bg-white/5" />
      <Card className="glass border-none shadow-2xl">
        <CardHeader className="p-4 md:p-6">
          {q.subject && <p className="text-[10px] font-bold text-accent uppercase tracking-widest mb-2">{q.subject} {q.year ? `· ${q.year}` : '· Random Year'}</p>}
          <CardTitle className="text-lg md:text-xl leading-relaxed">{q.question_text}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 md:space-y-6 p-4 md:p-6 pt-0">
          <div className="grid gap-2.5 md:gap-3">
            {options.map((opt: string, i: number) => {
              const isSelected = mode === 'practice' ? selectedOption === i : answers[currentIndex] === i
              const isCorrect = i === q.correct_answer_index
              let styles = "bg-white/5 border-white/5 hover:bg-white/10"
              if (mode === 'practice' && isPracticeLocked) {
                if (isCorrect) styles = "bg-green-500/10 border-green-500/50 text-green-400"
                else if (isSelected) styles = "bg-red-500/10 border-red-500/50 text-red-400"
                else styles = "bg-white/5 border-white/5 opacity-40"
              } else if (mode !== 'practice' && isSelected) styles = "bg-primary/20 border-primary text-primary"
              return (
                <button key={i} disabled={mode === 'practice' && isPracticeLocked} onClick={() => handleAnswer(i)}
                  className={`p-3.5 md:p-4 rounded-xl border text-left transition-all flex items-center justify-between ${styles}`}>
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-xs font-bold shrink-0">{String.fromCharCode(65+i)}</span>
                    <span className="text-sm font-medium leading-snug">{opt}</span>
                  </div>
                  {mode === 'practice' && isPracticeLocked && isCorrect && <CheckCircle2 className="h-5 w-5 shrink-0 ml-2" />}
                  {mode === 'practice' && isPracticeLocked && isSelected && !isCorrect && <XCircle className="h-5 w-5 shrink-0 ml-2" />}
                </button>
              )
            })}
          </div>

          {mode === 'practice' && showExplanation && (
            <div className="space-y-4 animate-in slide-in-from-top-4 duration-500">
              <div className="p-4 md:p-5 rounded-2xl bg-accent/5 border border-accent/20">
                <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                  <p className="text-xs font-bold text-accent uppercase tracking-widest">Explanation</p>
                  <Button variant="outline" size="sm" className="h-7 text-[10px] glass gap-1.5" onClick={handleAskAi} disabled={isAiLoading}>
                    {isAiLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <MessageSquare className="h-3 w-3" />} Ask AI Tutor
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{q.explanation || "No explanation provided."}</p>
              </div>
              {aiExplanation && (
                <div className="p-4 md:p-5 rounded-2xl bg-primary/5 border border-primary/20 animate-in fade-in duration-500">
                  <p className="text-xs font-bold text-primary uppercase tracking-widest mb-3 flex items-center gap-2"><BrainCircuit className="h-3.5 w-3.5" /> AI Clinical Reasoning</p>
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{aiExplanation}</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="fixed md:relative bottom-0 left-0 right-0 md:bottom-auto p-3 md:p-0 bg-background/95 md:bg-transparent backdrop-blur-xl md:backdrop-blur-none border-t md:border-t-0 border-white/5 flex gap-2 z-20">
        <Button onClick={previousQuestion} disabled={currentIndex === 0} variant="outline" className="h-12 px-4 md:px-6 rounded-xl glass border-white/10 gap-1.5 font-bold disabled:opacity-30 shrink-0">
          <ArrowLeft className="h-4 w-4" /> <span className="hidden sm:inline">Previous</span>
        </Button>
        <Button onClick={nextQuestion} disabled={!canGoNext} className="flex-1 h-12 rounded-xl font-bold disabled:opacity-30">
          {currentIndex+1 === questions.length ? 'Submit' : 'Next'} <ChevronRight className="h-4 w-4 ml-1.5" />
        </Button>
      </div>
    </div>
  )
}

export default function PYQStartPage() {
  return <Suspense fallback={<div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>}><PYQSessionContent /></Suspense>
}
