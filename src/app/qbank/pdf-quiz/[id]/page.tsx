"use client"

import { use, useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { useUser } from "@/firebase"
import { usePlan } from "@/hooks/use-plan"
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
  Timer,
  MessageSquare,
  Sparkles
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { clinicalTutorFlow } from "@/ai/flows/ai-clinical-tutor"
import { useRequireAuth } from "@/hooks/use-require-auth"

export default function PdfQuizPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: qbankId } = use(params)
  const { user } = useUser()
  const { toast } = useToast()
  const { checkingAuth } = useRequireAuth()
  const router = useRouter()
  const { canAccessAI } = usePlan()

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

  // AI State
  const [aiExplanation, setAiExplanation] = useState<string | null>(null)
  const [isAiLoading, setIsAiLoading] = useState(false)

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
      setAiExplanation(null)
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
      supabase.from('pdf_quiz_attempts').insert({
        user_id: user.uid,
        qbank_id: qbankId,
        question_id: currentQ.id,
        selected_answer: option,
        is_correct: isCorrect,
        time_taken_seconds: Math.floor((Date.now() - startTime) / 1000)
      }).then(() => {}) // non-blocking
    }
  }

  async function handleAskAi() {
    if (!user) { router.push('/signup'); return }
    if (!canAccessAI) { router.push('/pricing'); return }
    const currentQ = questions[currentIndex]
    const optsArr = [currentQ.option_a, currentQ.option_b, currentQ.option_c, currentQ.option_d]
    const correctIdx = ['a', 'b', 'c', 'd'].indexOf(currentQ.correct_answer?.toLowerCase() || 'a')
    
    setIsAiLoading(true)
    try {
      const result = await clinicalTutorFlow(currentQ.question_text, optsArr[correctIdx] || currentQ.correct_answer, currentQ.explanation, user?.uid)
      setAiExplanation(result)
    } catch (e: any) {
      toast({ variant: "destructive", title: "AI Error", description: e.message || "Tutor is currently in rounds." })
    } finally {
      setIsAiLoading(false)
    }
  }

  if (checkingAuth || loading) return <div className="h-screen flex flex-col items-center justify-center gap-4 bg-background"><Loader2 className="h-10 w-10 animate-spin text-primary" /><p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground animate-pulse">Initializing Simulation Hub...</p></div>

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
                <Button className="w-full h-14 rounded-xl text-lg font-bold bg-primary hover:bg-primary/90">Back to Hub</Button>
              </Link>
              <Button variant="ghost" onClick={() => window.location.reload()} className="w-full text-muted-foreground hover:text-white">Restart Simulation</Button>
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
  ].filter(o => o.val)

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-12 space-y-8">
      <header className="flex items-center justify-between">
        <Link href="/qbank">
          <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-white group">
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" /> Exit Simulation
          </Button>
        </Link>
        <div className="flex items-center gap-6">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all ${timeLeft < 20 ? 'bg-red-500/20 border-red-500 text-red-400 animate-pulse' : 'bg-white/5 border-white/10'}`}>
            <Timer className="h-4 w-4" />
            <span className="font-mono font-bold tracking-tighter">{timeLeft}s</span>
          </div>
          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
            Case {currentIndex + 1} of {questions.length}
          </div>
        </div>
      </header>

      <div className="space-y-6">
        <Progress value={((currentIndex + 1) / questions.length) * 100} className="h-1.5 bg-white/5" />
        
        <Card className="glass border-none shadow-2xl relative overflow-hidden">
          <CardHeader className="pb-10 pt-8 px-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-[10px] font-bold text-accent uppercase tracking-widest">
                <BrainCircuit className="h-4 w-4" /> AI OCR Extraction • {qbank?.subject || 'General'}
              </div>
              {currentQ.has_image && (
                <div className="px-2 py-0.5 rounded bg-yellow-500/10 text-yellow-500 text-[9px] font-bold uppercase border border-yellow-500/20">
                  Clinical Image Included
                </div>
              )}
            </div>
            <CardTitle className="text-2xl leading-relaxed font-semibold tracking-tight">
              {currentQ.question_text}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-8 px-8 pb-10">
            <div className="grid gap-3">
              {opts.map((opt) => {
                const isCorrect = opt.key.toLowerCase() === currentQ.correct_answer?.toLowerCase()
                const isSelected = opt.key.toLowerCase() === selectedOption?.toLowerCase()
                
                let styles = "bg-white/5 border-white/10 hover:bg-white/10 hover:border-primary/50"
                if (showExplanation) {
                  if (isCorrect) styles = "bg-green-500/10 border-green-500/50 text-green-400 shadow-[0_0_20px_rgba(34,197,94,0.1)]"
                  else if (isSelected) styles = "bg-red-500/10 border-red-500/50 text-red-400"
                  else styles = "bg-white/5 border-white/10 opacity-40 grayscale-[50%]"
                }

                return (
                  <button 
                    key={opt.key} 
                    disabled={showExplanation}
                    onClick={() => handleAnswer(opt.key)} 
                    className={`p-6 rounded-2xl border text-left transition-all flex items-center justify-between group ${styles}`}
                  >
                    <div className="flex items-center gap-5">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold uppercase transition-all shadow-inner ${isSelected ? 'bg-white/20 scale-110' : 'bg-white/5 text-muted-foreground group-hover:text-white'}`}>
                        {opt.key}
                      </div>
                      <span className="text-base font-medium leading-snug">{opt.val}</span>
                    </div>
                    {showExplanation && isCorrect && <CheckCircle2 className="h-6 w-6 shrink-0 animate-in zoom-in" />}
                    {showExplanation && isSelected && !isCorrect && <XCircle className="h-6 w-6 shrink-0 animate-in zoom-in" />}
                  </button>
                )
              })}
            </div>

            {showExplanation && (
              <div className="mt-10 space-y-4 animate-in slide-in-from-top-4 duration-500">
                <div className="p-7 rounded-[2rem] bg-accent/5 border border-accent/20 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                     <AlertCircle className="h-24 w-24" />
                  </div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-xs font-bold text-accent uppercase tracking-widest flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" /> Extracted Clinical Explanation
                    </h4>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-8 text-[10px] font-bold uppercase rounded-xl glass gap-2 border-primary/20 hover:bg-primary/10"
                      onClick={handleAskAi}
                      disabled={isAiLoading}
                    >
                      {isAiLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 text-primary" />}
                      Consult AI Tutor
                    </Button>
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground italic whitespace-pre-wrap">
                    {currentQ.explanation || "No clinical reasoning was provided in the source document for this specific case."}
                  </p>
                </div>

                {aiExplanation && (
                  <div className="p-7 rounded-[2rem] bg-primary/5 border border-primary/20 animate-in fade-in zoom-in-95 duration-500">
                     <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-widest mb-4">
                        <MessageSquare className="h-4 w-4" /> Qubix AI Insight
                     </div>
                     <div className="prose prose-invert max-w-none text-sm leading-relaxed text-foreground/80 whitespace-pre-wrap">
                        {aiExplanation}
                     </div>
                  </div>
                )}

                <div className="flex justify-end pt-6">
                  <Button onClick={handleNext} className="h-14 px-12 rounded-2xl font-bold group bg-primary hover:bg-primary/90 text-lg shadow-xl shadow-primary/20">
                    {currentIndex + 1 === questions.length ? 'Finish Assessment' : 'Next Case'} 
                    <ChevronRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
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
