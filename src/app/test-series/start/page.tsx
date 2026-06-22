"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { useState, useEffect, Suspense } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  ArrowLeft, 
  ArrowRight,
  Sparkles, 
  ChevronRight,
  BrainCircuit,
  Trophy,
  Timer,
  AlertTriangle,
  MessageSquare,
  Activity,
  ListChecks,
  Info
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { clinicalTutorFlow } from "@/ai/flows/ai-clinical-tutor"
import { analyzeTestPerformance } from "@/ai/flows/ai-performance-analyzer"

function QuizSessionContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { toast } = useToast()

  const subjects = searchParams.get('subjects')?.split(',') || []
  const units = searchParams.get('units')?.split(',').filter(Boolean) || []
  const topics = searchParams.get('topics')?.split(',').filter(Boolean) || []
  const count = parseInt(searchParams.get('count') || '25')
  const mode = searchParams.get('mode') || 'practice'
  const timeLimitMins = parseInt(searchParams.get('time') || '30')

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
  const [timeLeft, setTimeLeft] = useState(timeLimitMins * 60)

  // AI State
  const [aiExplanation, setAiExplanation] = useState<string | null>(null)
  const [isAiLoading, setIsAiLoading] = useState(false)
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  useEffect(() => {
    async function loadQuestions() {
      if (subjects.length === 0) return
      setLoading(true)
      try {
        let query = supabase
          .from('questions')
          .select('*')
          .in('subject_id', subjects)

        if (units.length > 0) {
          query = query.in('unit_title', units)
        }
        if (topics.length > 0) {
          query = query.in('topic_title', topics)
        }
        
        const { data, error } = await query.limit(Math.max(count + 200, 2000))
        
        if (error) throw error

        const shuffled = (data || []).sort(() => 0.5 - Math.random())
        setQuestions(shuffled.slice(0, count))
      } catch (e: any) {
        toast({ variant: "destructive", title: "Simulation Error", description: e.message })
      } finally {
        setLoading(false)
      }
    }
    loadQuestions()
  }, [searchParams, toast])

  useEffect(() => {
    if (mode === 'exam' && !finished && !loading) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 0) {
            handleSubmitExam()
            return 0
          }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [mode, finished, loading])

  function handleSubmitExam() {
    let finalScore = 0
    questions.forEach((q, i) => {
      if (answers[i] === q.correct_answer_index) finalScore++
    })
    setScore(finalScore)
    setFinished(true)
  }

  async function handleAskAi() {
    const currentQ = questions[currentIndex]
    const options = [currentQ.option1, currentQ.option2, currentQ.option3, currentQ.option4]
    setIsAiLoading(true)
    try {
      const result = await clinicalTutorFlow(currentQ.question_text, options[currentQ.correct_answer_index], currentQ.explanation)
      setAiExplanation(result)
    } catch (e: any) {
      toast({ variant: "destructive", title: "AI Error", description: e.message || "Tutor unavailable." })
    } finally {
      setIsAiLoading(false)
    }
  }

  async function handleAnalyzePerformance() {
    setIsAnalyzing(true)
    try {
      const resultData = questions.map((q, i) => ({
        topic: q.topic_title || "General",
        isCorrect: mode === 'exam' ? answers[i] === q.correct_answer_index : true,
        question: q.question_text
      }))
      const result = await analyzeTestPerformance(resultData)
      setAiAnalysis(result)
    } catch (e: any) {
      toast({ variant: "destructive", title: "Analysis Error", description: e.message })
    } finally {
      setIsAnalyzing(false)
    }
  }

  if (loading) return <div className="h-screen flex flex-col items-center justify-center space-y-4 px-4 text-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /><p className="text-xs font-bold uppercase tracking-widest animate-pulse">Filtering Clinical Pool...</p></div>

  if (questions.length === 0) return <div className="h-screen flex flex-col items-center justify-center p-6 text-center space-y-6"><AlertTriangle className="h-12 w-12 text-yellow-500" /><h2 className="text-2xl font-bold">No Cases Found</h2><p className="text-muted-foreground">The filter criteria was too narrow. Try expanding your subject or unit selection.</p><Button onClick={() => router.push('/test-series')}>Adjust Filters</Button></div>

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    return `${h > 0 ? h + ':' : ''}${m < 10 && h > 0 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`
  }

  const goToQuestion = (index: number) => {
    if (index < 0 || index >= questions.length) return
    setCurrentIndex(index)
    if (mode === 'practice') {
      const locked = lockedAnswers[index]
      setSelectedOption(locked !== undefined ? locked : null)
      setShowExplanation(locked !== undefined)
    }
    setAiExplanation(null)
  }

  const currentQ = questions[currentIndex]
  const options = [currentQ.option1, currentQ.option2, currentQ.option3, currentQ.option4]
  
  const handleAnswer = (idx: number) => {
    if (mode === 'practice') {
      if (lockedAnswers[currentIndex] !== undefined) return
      setSelectedOption(idx)
      setShowExplanation(true)
      setLockedAnswers(prev => ({ ...prev, [currentIndex]: idx }))
      setAnswers(prev => ({ ...prev, [currentIndex]: idx }))
      if (idx === currentQ.correct_answer_index) setScore(s => s + 1)
    } else {
      setAnswers(prev => ({ ...prev, [currentIndex]: idx }))
    }
  }

  const nextQuestion = () => {
    if (currentIndex + 1 < questions.length) {
      goToQuestion(currentIndex + 1)
    } else {
      if (mode === 'exam') handleSubmitExam()
      else setFinished(true)
    }
  }

  const previousQuestion = () => {
    goToQuestion(currentIndex - 1)
  }

  if (finished) {
    if (showReview) {
      return (
        <div className="max-w-3xl mx-auto p-4 md:p-12 space-y-6 animate-in fade-in duration-500">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => setShowReview(false)} className="gap-2 text-muted-foreground hover:text-white px-2">
              <ArrowLeft className="h-4 w-4" /> Back to Results
            </Button>
            <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Review Answers</h2>
          </div>

          <div className="space-y-4">
            {questions.map((q, i) => {
              const qOptions = [q.option1, q.option2, q.option3, q.option4]
              const userAnswer = mode === 'practice' ? lockedAnswers[i] : answers[i]
              const isCorrect = userAnswer === q.correct_answer_index
              const wasSkipped = userAnswer === undefined

              return (
                <Card key={i} className={`glass border-none ${isCorrect ? 'border-l-2 border-l-green-500' : wasSkipped ? 'border-l-2 border-l-yellow-500' : 'border-l-2 border-l-red-500'}`}>
                  <CardContent className="p-4 md:p-5 space-y-3">
                    <div className="flex items-start gap-2">
                      {isCorrect ? (
                        <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0 mt-0.5" />
                      ) : wasSkipped ? (
                        <Info className="h-4 w-4 text-yellow-400 shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                      )}
                      <p className="text-sm font-medium flex-1 leading-relaxed">
                        <span className="text-muted-foreground mr-1">Q{i + 1}.</span>{q.question_text}
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
                            <span className="w-4 h-4 rounded-full bg-white/5 flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                              {String.fromCharCode(65 + oi)}
                            </span>
                            <span className="leading-relaxed">{opt}</span>
                          </div>
                        )
                      })}
                    </div>

                    {q.explanation && (
                      <p className="text-xs text-muted-foreground italic pl-6 pt-2 border-t border-white/5 leading-relaxed">
                        {q.explanation}
                      </p>
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
      <div className="max-w-3xl mx-auto p-4 md:p-12 space-y-6 md:space-y-8 animate-in zoom-in-95 duration-500">
        <Card className="glass border-none overflow-hidden relative shadow-2xl">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-primary" />
          <CardContent className="p-6 md:p-12 text-center space-y-6 md:space-y-8">
            <div className="w-20 h-20 md:w-24 md:h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary">
              <Trophy className="h-10 w-10 md:h-12 md:w-12" />
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Session Results</h2>
              <p className="text-muted-foreground text-sm md:text-base">Assessment complete. Review your mastery levels.</p>
            </div>
            <div className="grid grid-cols-2 gap-3 md:gap-4 max-w-sm mx-auto">
              <div className="p-4 md:p-6 rounded-2xl bg-white/5 border border-white/5">
                <p className="text-2xl md:text-3xl font-bold">{score}/{questions.length}</p>
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mt-1">Total Cases</p>
              </div>
              <div className="p-4 md:p-6 rounded-2xl bg-white/5 border border-white/10">
                <p className="text-2xl md:text-3xl font-bold">{Math.round((score / questions.length) * 100)}%</p>
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mt-1">Accuracy</p>
              </div>
            </div>

            <div className="space-y-3">
              <Button
                onClick={() => setShowReview(true)}
                variant="outline"
                className="w-full h-12 md:h-14 rounded-xl glass border-white/10 font-bold gap-2"
              >
                <ListChecks className="h-5 w-5" /> Review Answers
              </Button>

              <Button 
                onClick={handleAnalyzePerformance} 
                disabled={isAnalyzing}
                className="w-full h-12 md:h-14 rounded-xl bg-accent text-background font-bold gap-2"
              >
                {isAnalyzing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Activity className="h-5 w-5" />}
                Get AI Mastery Insights
              </Button>

              {aiAnalysis && (
                <div className="p-5 md:p-8 rounded-3xl bg-white/5 border border-white/10 text-left animate-in slide-in-from-bottom-4">
                   <div className="flex items-center gap-2 text-xs font-bold text-accent uppercase tracking-widest mb-4 md:mb-6">
                      <BrainCircuit className="h-4 w-4" /> AI Performance Audit
                   </div>
                   <div className="prose prose-invert max-w-none text-sm leading-relaxed text-foreground/80 whitespace-pre-wrap">
                      {aiAnalysis}
                   </div>
                </div>
              )}
            </div>

            <div className="pt-4 md:pt-6 flex flex-col gap-3">
              <Button onClick={() => window.location.reload()} className="w-full h-12 md:h-14 rounded-xl text-base md:text-lg font-bold">Restart Test</Button>
              <Button variant="ghost" onClick={() => router.push('/test-series')} className="w-full h-12 rounded-xl text-muted-foreground hover:text-white">Back to Simulation Hub</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const canGoNext = mode === 'exam' ? true : selectedOption !== null
  const isPracticeLocked = mode === 'practice' && lockedAnswers[currentIndex] !== undefined

  return (
    <div className="max-w-4xl mx-auto p-3 md:p-12 space-y-4 md:space-y-8 pb-24 md:pb-8">
      <header className="flex items-center justify-between gap-2">
        <Button variant="ghost" size="sm" onClick={() => router.push('/test-series')} className="gap-1.5 md:gap-2 text-muted-foreground hover:text-white px-2 md:px-3 text-xs md:text-sm">
          <ArrowLeft className="h-4 w-4" /> <span className="hidden sm:inline">End Session</span>
        </Button>
        <div className="flex items-center gap-2 md:gap-6">
          {mode === 'exam' && (
            <div className={`flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-full border text-sm ${timeLeft < 60 ? 'bg-red-500/20 border-red-500 text-red-400 animate-pulse' : 'bg-white/5 border-white/10'}`}>
              <Timer className="h-3.5 w-3.5 md:h-4 md:w-4" />
              <span className="font-mono font-bold">{formatTime(timeLeft)}</span>
            </div>
          )}
          <div className="text-[10px] md:text-xs font-bold text-muted-foreground uppercase tracking-widest whitespace-nowrap">
            {currentIndex + 1}/{questions.length}
          </div>
        </div>
      </header>

      <div className="space-y-4 md:space-y-6">
        <Progress value={((currentIndex + 1) / questions.length) * 100} className="h-1.5 bg-white/5" />
        
        <Card className="glass border-none shadow-2xl relative overflow-hidden">
          <CardHeader className="pb-4 md:pb-8 p-4 md:p-6">
            <div className="flex items-center gap-2 text-[10px] font-bold text-accent uppercase tracking-widest mb-2 md:mb-3 flex-wrap">
              <BrainCircuit className="h-3.5 w-3.5 md:h-4 md:w-4 shrink-0" /> {currentQ.unit_title} • {currentQ.topic_title}
            </div>
            <CardTitle className="text-lg md:text-2xl leading-relaxed font-semibold tracking-tight">{currentQ.question_text}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 md:space-y-6 p-4 md:p-6 pt-0">
            <div className="grid gap-2 md:gap-3">
              {options.map((opt: string, i: number) => {
                const isSelected = mode === 'practice' ? selectedOption === i : answers[currentIndex] === i
                const isCorrect = i === currentQ.correct_answer_index
                
                let styles = "bg-white/5 border-white/5 hover:bg-white/10"
                if (mode === 'practice' && isPracticeLocked) {
                  if (isCorrect) styles = "bg-green-500/10 border-green-500/50 text-green-400"
                  else if (isSelected) styles = "bg-red-500/10 border-red-500/50 text-red-400"
                  else styles = "bg-white/5 border-white/5 opacity-50"
                } else if (mode === 'exam' && isSelected) {
                  styles = "bg-primary/20 border-primary text-primary"
                }

                return (
                  <button 
                    key={i} 
                    disabled={mode === 'practice' && isPracticeLocked}
                    onClick={() => handleAnswer(i)} 
                    className={`p-3.5 md:p-5 rounded-xl md:rounded-2xl border text-left transition-all flex items-center justify-between group ${styles}`}
                  >
                    <div className="flex items-center gap-3 md:gap-4 min-w-0">
                      <div className={`w-7 h-7 md:w-8 md:h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-colors shrink-0 ${isSelected ? 'bg-white/10' : 'bg-white/5 text-muted-foreground'}`}>
                        {String.fromCharCode(65 + i)}
                      </div>
                      <span className="text-sm md:text-base font-medium leading-snug">{opt}</span>
                    </div>
                    {mode === 'practice' && isPracticeLocked && isCorrect && <CheckCircle2 className="h-5 w-5 md:h-6 md:w-6 shrink-0 ml-2" />}
                    {mode === 'practice' && isPracticeLocked && isSelected && !isCorrect && <XCircle className="h-5 w-5 md:h-6 md:w-6 shrink-0 ml-2" />}
                  </button>
                )
              })}
            </div>

            {mode === 'practice' && showExplanation && (
              <div className="mt-6 md:mt-8 space-y-3 md:space-y-4">
                <div className="p-4 md:p-6 rounded-xl md:rounded-2xl bg-accent/5 border border-accent/20 animate-in slide-in-from-top-4 duration-500">
                  <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-accent uppercase tracking-widest">
                      <Sparkles className="h-3.5 w-3.5" /> Clinical Correlation
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-7 text-[10px] font-bold uppercase glass gap-1.5"
                      onClick={handleAskAi}
                      disabled={isAiLoading}
                    >
                      {isAiLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <MessageSquare className="h-3 w-3" />}
                      {isAiLoading ? "Asking Tutor..." : "Ask AI Tutor"}
                    </Button>
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground italic">{currentQ.explanation}</p>
                </div>

                {aiExplanation && (
                  <div className="p-4 md:p-6 rounded-xl md:rounded-2xl bg-primary/5 border border-primary/20 animate-in fade-in zoom-in-95 duration-500">
                     <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-widest mb-3">
                        <BrainCircuit className="h-3.5 w-3.5" /> AI Clinical Reasoning
                     </div>
                     <div className="prose prose-invert max-w-none text-sm leading-relaxed text-foreground/80 whitespace-pre-wrap">
                        {aiExplanation}
                     </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Navigation footer - fixed on mobile, inline on desktop */}
      <div className="fixed md:relative bottom-0 left-0 right-0 md:bottom-auto p-3 md:p-0 bg-background/95 md:bg-transparent backdrop-blur-xl md:backdrop-blur-none border-t md:border-t-0 border-white/5 flex gap-2 z-20">
        {mode === 'exam' && (
          <Button
            onClick={previousQuestion}
            disabled={currentIndex === 0}
            variant="outline"
            className="h-12 px-4 md:px-6 rounded-xl glass border-white/10 gap-1.5 md:gap-2 font-bold disabled:opacity-30 shrink-0"
          >
            <ArrowLeft className="h-4 w-4" /> <span className="hidden sm:inline">Previous</span>
          </Button>
        )}
        <Button 
          onClick={nextQuestion} 
          disabled={!canGoNext}
          className="flex-1 h-12 rounded-xl font-bold group disabled:opacity-30"
        >
          {currentIndex + 1 === questions.length ? (mode === 'exam' ? 'Submit Exam' : 'Finish') : 'Next'}
          <ChevronRight className="h-4 w-4 ml-1.5 md:ml-2 group-hover:translate-x-1 transition-transform" />
        </Button>
      </div>
    </div>
  )
}

export default function TestSessionPage() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>}>
      <QuizSessionContent />
    </Suspense>
  )
}
