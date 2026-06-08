"use client"

import { use, useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import { useUser } from "@/firebase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  ArrowLeft, 
  Clock, 
  ChevronRight, 
  Trophy, 
  AlertCircle,
  BrainCircuit,
  Timer
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

export default function PdfQuizPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: qbankId } = use(params)
  const { user } = useUser()
  const { toast } = useToast()

  const [questions, setQuestions] = useState<any[]>([])
  const [qbank, setQbank] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [showExplanation, setShowExplanation] = useState(false)
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)
  
  const [timeLeft, setTimeLeft] = useState(90)
  const [startTime, setStartTime] = useState<number>(Date.now())

  useEffect(() => {
    if (qbankId) fetchQuizData()
  }, [qbankId])

  async function fetchQuizData() {
    try {
      const { data: qData } = await supabase.from('pdf_qbanks').select('*').eq('id', qbankId).single()
      setQbank(qData)

      const { data: questions, error } = await supabase
        .from('pdf_questions')
        .select('*')
        .eq('qbank_id', qbankId)
        .order('question_number', { ascending: true })
      
      if (error) throw error
      setQuestions(questions || [])
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error loading quiz" })
    } finally {
      setLoading(false)
    }
  }

  const handleNext = useCallback(() => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(prev => prev + 1)
      setSelectedOption(null)
      setShowExplanation(false)
      setTimeLeft(90)
      setStartTime(Date.now())
    } else {
      setFinished(true)
    }
  }, [currentIndex, questions.length])

  useEffect(() => {
    if (loading || finished || showExplanation) return
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 0) {
          handleAnswer(null)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [loading, finished, showExplanation])

  async function handleAnswer(option: string | null) {
    if (selectedOption !== null || showExplanation) return
    
    setSelectedOption(option)
    setShowExplanation(true)
    
    const currentQ = questions[currentIndex]
    const isCorrect = option?.toLowerCase() === currentQ.correct_answer?.toLowerCase()
    
    if (isCorrect) setScore(s => s + 1)

    // Save attempt
    if (user) {
      await supabase.from('pdf_quiz_attempts').insert({
        user_id: user.uid,
        qbank_id: qbankId,
        question_id: currentQ.id,
        selected_answer: option,
        is_correct: isCorrect,
        time_taken_seconds: Math.floor((Date.now() - startTime) / 1000)
      })
    }
  }

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>

  if (questions.length === 0) return (
    <div className="h-screen flex flex-col items-center justify-center p-6 text-center space-y-6">
      <AlertCircle className="h-16 w-16 text-muted-foreground opacity-20" />
      <h2 className="text-2xl font-bold">No questions found in this library.</h2>
      <Link href="/qbank"><Button variant="outline">Back to Hub</Button></Link>
    </div>
  )

  if (finished) {
    return (
      <div className="max-w-2xl mx-auto p-4 md:p-12 space-y-8 animate-in zoom-in-95 duration-500">
        <Card className="glass border-none overflow-hidden relative shadow-2xl">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-primary" />
          <CardContent className="p-12 text-center space-y-8">
            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary">
              <Trophy className="h-12 w-12" />
            </div>
            <div className="space-y-2">
              <h2 className="text-4xl font-bold tracking-tight">Simulation Results</h2>
              <p className="text-muted-foreground">{qbank?.file_name}</p>
            </div>
            <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
              <div className="p-6 rounded-2xl bg-white/5 border border-white/5">
                <p className="text-3xl font-bold">{score}/{questions.length}</p>
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mt-1">Total Score</p>
              </div>
              <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                <p className="text-3xl font-bold">{Math.round((score / questions.length) * 100)}%</p>
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mt-1">Accuracy</p>
              </div>
            </div>
            <div className="pt-6 flex flex-col gap-3">
              <Link href="/qbank" className="w-full">
                <Button className="w-full h-14 rounded-xl text-lg font-bold">Back to Hub</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const currentQ = questions[currentIndex]
  const opts = [
    { key: 'a', val: currentQ.option_a },
    { key: 'b', val: currentQ.option_b },
    { key: 'c', val: currentQ.option_c },
    { key: 'd', val: currentQ.option_d }
  ]

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-12 space-y-8">
      <header className="flex items-center justify-between">
        <Link href="/qbank">
          <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-white">
            <ArrowLeft className="h-4 w-4" /> Exit Simulation
          </Button>
        </Link>
        <div className="flex items-center gap-6">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${timeLeft < 20 ? 'bg-red-500/20 border-red-500 text-red-400 animate-pulse' : 'bg-white/5 border-white/10'}`}>
            <Timer className="h-4 w-4" />
            <span className="font-mono font-bold">{timeLeft}s</span>
          </div>
          <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
            Case {currentIndex + 1} of {questions.length}
          </div>
        </div>
      </header>

      <div className="space-y-6">
        <Progress value={((currentIndex + 1) / questions.length) * 100} className="h-1.5 bg-white/5" />
        
        <Card className="glass border-none shadow-2xl relative overflow-hidden">
          <CardHeader className="pb-8">
            <div className="flex items-center gap-2 text-[10px] font-bold text-accent uppercase tracking-widest mb-3">
              <BrainCircuit className="h-4 w-4" /> Extracted MCQ • Marrow Format
            </div>
            <CardTitle className="text-2xl leading-relaxed font-semibold tracking-tight">
              Q{currentQ.question_number}: {currentQ.question_text}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-3">
              {opts.map((opt) => {
                const isCorrect = opt.key.toLowerCase() === currentQ.correct_answer?.toLowerCase()
                const isSelected = opt.key.toLowerCase() === selectedOption?.toLowerCase()
                
                let styles = "bg-white/5 border-white/5 hover:bg-white/10"
                if (showExplanation) {
                  if (isCorrect) styles = "bg-green-500/10 border-green-500/50 text-green-400"
                  else if (isSelected) styles = "bg-red-500/10 border-red-500/50 text-red-400"
                  else styles = "bg-white/5 border-white/5 opacity-50"
                }

                return (
                  <button 
                    key={opt.key} 
                    disabled={showExplanation}
                    onClick={() => handleAnswer(opt.key)} 
                    className={`p-5 rounded-2xl border text-left transition-all flex items-center justify-between group ${styles}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold uppercase transition-colors ${isSelected ? 'bg-white/10' : 'bg-white/5 text-muted-foreground'}`}>
                        {opt.key}
                      </div>
                      <span className="text-base font-medium">{opt.val}</span>
                    </div>
                    {showExplanation && isCorrect && <CheckCircle2 className="h-6 w-6 shrink-0" />}
                    {showExplanation && isSelected && !isCorrect && <XCircle className="h-6 w-6 shrink-0" />}
                  </button>
                )
              })}
            </div>

            {showExplanation && (
              <div className="mt-8 space-y-4 animate-in slide-in-from-top-4 duration-500">
                <div className="p-6 rounded-2xl bg-accent/5 border border-accent/20">
                  <h4 className="text-xs font-bold text-accent uppercase tracking-widest mb-3 flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Clinical Explanation
                  </h4>
                  <p className="text-sm leading-relaxed text-muted-foreground italic whitespace-pre-wrap">
                    {currentQ.explanation || "No explanation extracted for this case."}
                  </p>
                </div>
                <div className="flex justify-end pt-4">
                  <Button onClick={handleNext} className="h-12 px-10 rounded-xl font-bold group bg-primary">
                    {currentIndex + 1 === questions.length ? 'Finish Assessment' : 'Next Case'} 
                    <ChevronRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}