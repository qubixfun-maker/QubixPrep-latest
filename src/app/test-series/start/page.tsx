
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
  Sparkles, 
  ChevronRight,
  BrainCircuit,
  Trophy,
  Timer,
  AlertTriangle,
  History
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

function QuizSessionContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { toast } = useToast()

  const subjects = searchParams.get('subjects')?.split(',') || []
  const count = parseInt(searchParams.get('count') || '25')
  const mode = searchParams.get('mode') || 'practice'

  const [questions, setQuestions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [showExplanation, setShowExplanation] = useState(false)
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)
  const [answers, setAnswers] = useState<Record<number, number>>({}) // index -> selectedOption
  const [timeLeft, setTimeLeft] = useState(count * 90) // 90 seconds per question

  useEffect(() => {
    async function loadQuestions() {
      if (subjects.length === 0) return
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from('questions')
          .select('*')
          .in('subject_id', subjects)
          .limit(500) // Pool size
        
        if (error) throw error

        // Randomize pool and take requested count
        const shuffled = (data || []).sort(() => 0.5 - Math.random())
        setQuestions(shuffled.slice(0, count))
      } catch (e: any) {
        toast({ variant: "destructive", title: "Load Error", description: e.message })
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
            setFinished(true)
            return 0
          }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [mode, finished, loading])

  if (loading) return <div className="h-screen flex flex-col items-center justify-center space-y-4"><Loader2 className="h-10 w-10 animate-spin text-primary" /><p className="text-xs font-bold uppercase tracking-widest animate-pulse">Building Simulation Pool...</p></div>

  if (questions.length === 0) return <div className="h-screen flex flex-col items-center justify-center p-6 text-center space-y-6"><AlertTriangle className="h-12 w-12 text-yellow-500" /><h2 className="text-2xl font-bold">No Questions Found</h2><p className="text-muted-foreground">Try selecting different subjects or check back later.</p><Button onClick={() => router.push('/test-series')}>Return to Builder</Button></div>

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s < 10 ? '0' : ''}${s}`
  }

  const currentQ = questions[currentIndex]
  const options = [currentQ.option1, currentQ.option2, currentQ.option3, currentQ.option4]
  
  const handleAnswer = (idx: number) => {
    if (mode === 'practice') {
      if (selectedOption !== null) return
      setSelectedOption(idx)
      setShowExplanation(true)
      if (idx === currentQ.correct_answer_index) setScore(s => s + 1)
    } else {
      setAnswers(prev => ({ ...prev, [currentIndex]: idx }))
    }
  }

  const nextQuestion = () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(c => c + 1)
      setSelectedOption(null)
      setShowExplanation(false)
    } else {
      if (mode === 'exam') {
        // Calculate exam score at end
        let finalScore = 0
        questions.forEach((q, i) => {
          if (answers[i] === q.correct_answer_index) finalScore++
        })
        setScore(finalScore)
      }
      setFinished(true)
    }
  }

  if (finished) {
    return (
      <div className="max-w-2xl mx-auto p-4 md:p-12 space-y-8 animate-in zoom-in-95 duration-500">
        <Card className="glass border-none overflow-hidden relative shadow-2xl">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-primary" />
          <CardContent className="p-12 text-center space-y-8">
            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary shadow-inner">
              <Trophy className="h-12 w-12" />
            </div>
            <div className="space-y-2">
              <h2 className="text-4xl font-bold tracking-tight">Assessment Complete!</h2>
              <p className="text-muted-foreground">Great effort! Review your clinical performance metrics below.</p>
            </div>
            <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
              <div className="p-6 rounded-2xl bg-white/5 border border-white/5 shadow-xl">
                <p className="text-3xl font-bold">{score}/{questions.length}</p>
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mt-1">Total Score</p>
              </div>
              <div className="p-6 rounded-2xl bg-white/5 border border-white/5 shadow-xl">
                <p className="text-3xl font-bold">{Math.round((score / questions.length) * 100)}%</p>
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mt-1">Accuracy</p>
              </div>
            </div>
            <div className="pt-6 flex flex-col gap-3">
              <Button onClick={() => window.location.reload()} className="w-full h-14 rounded-xl text-lg font-bold shadow-lg shadow-primary/20">Restart Simulation</Button>
              <Button variant="ghost" onClick={() => router.push('/test-series')} className="w-full h-12 rounded-xl text-muted-foreground hover:text-white">Back to Simulation Hub</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-12 space-y-8">
      <header className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => router.push('/test-series')} className="gap-2 text-muted-foreground hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Terminate
        </Button>
        <div className="flex items-center gap-6">
          {mode === 'exam' && (
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${timeLeft < 60 ? 'bg-red-500/20 border-red-500 text-red-400 animate-pulse' : 'bg-white/5 border-white/10'}`}>
              <Timer className="h-4 w-4" />
              <span className="font-mono font-bold">{formatTime(timeLeft)}</span>
            </div>
          )}
          <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
            Case {currentIndex + 1} of {questions.length}
          </div>
        </div>
      </header>

      <div className="space-y-6">
        <Progress value={((currentIndex + 1) / questions.length) * 100} className="h-1.5 bg-white/5" />
        
        <Card className="glass border-none shadow-2xl relative overflow-hidden">
          {mode === 'exam' && <div className="absolute top-0 left-0 h-full w-1 bg-primary" />}
          <CardHeader className="pb-8">
            <div className="flex items-center gap-2 text-[10px] font-bold text-accent uppercase tracking-widest mb-3">
              <BrainCircuit className="h-4 w-4" /> Clinical Case • {currentQ.subject_id}
            </div>
            <CardTitle className="text-2xl leading-relaxed font-semibold tracking-tight">{currentQ.question_text}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-3">
              {options.map((opt: string, i: number) => {
                const isSelected = mode === 'practice' ? selectedOption === i : answers[currentIndex] === i
                const isCorrect = i === currentQ.correct_answer_index
                
                let styles = "bg-white/5 border-white/5 hover:bg-white/10"
                if (mode === 'practice' && selectedOption !== null) {
                  if (isCorrect) styles = "bg-green-500/10 border-green-500/50 text-green-400"
                  else if (isSelected) styles = "bg-red-500/10 border-red-500/50 text-red-400"
                  else styles = "bg-white/5 border-white/5 opacity-50"
                } else if (mode === 'exam' && isSelected) {
                  styles = "bg-primary/20 border-primary text-primary"
                }

                return (
                  <button 
                    key={i} 
                    disabled={mode === 'practice' && selectedOption !== null}
                    onClick={() => handleAnswer(i)} 
                    className={`p-5 rounded-2xl border text-left transition-all flex items-center justify-between group shadow-sm ${styles}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-colors ${isSelected ? 'bg-white/10' : 'bg-white/5 text-muted-foreground'}`}>
                        {String.fromCharCode(65 + i)}
                      </div>
                      <span className="text-base font-medium">{opt}</span>
                    </div>
                    {mode === 'practice' && selectedOption !== null && isCorrect && <CheckCircle2 className="h-6 w-6 shrink-0" />}
                    {mode === 'practice' && selectedOption !== null && isSelected && !isCorrect && <XCircle className="h-6 w-6 shrink-0" />}
                  </button>
                )
              })}
            </div>

            {mode === 'practice' && showExplanation && (
              <div className="mt-8 p-6 rounded-2xl bg-accent/5 border border-accent/20 animate-in slide-in-from-top-4 duration-500">
                <div className="flex items-center gap-2 text-xs font-bold text-accent uppercase tracking-widest mb-3">
                  <Sparkles className="h-3.5 w-3.5" /> High-Yield Clinical Insight
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground italic leading-relaxed">{currentQ.explanation}</p>
                <div className="mt-6 pt-6 border-t border-accent/10">
                   <Button onClick={nextQuestion} className="w-full h-12 rounded-xl group bg-accent text-background hover:bg-accent/90">
                      Next Clinical Case <ChevronRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                   </Button>
                </div>
              </div>
            )}

            {(mode === 'exam' || (mode === 'practice' && !showExplanation)) && (
              <div className="pt-6 flex justify-end">
                <Button 
                  onClick={nextQuestion} 
                  disabled={mode === 'exam' ? answers[currentIndex] === undefined : selectedOption === null}
                  className="h-12 px-10 rounded-xl font-bold group"
                >
                  {currentIndex + 1 === questions.length ? 'Finalize Test' : 'Skip / Next'} 
                  <ChevronRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
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
