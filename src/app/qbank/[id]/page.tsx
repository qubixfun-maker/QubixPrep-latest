"use client"

import { useMemo, use, useState, useEffect } from "react"
import { useDoc, useFirestore } from "@/firebase"
import { doc } from "firebase/firestore"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  ArrowLeft, 
  Sparkles, 
  ChevronRight,
  Info,
  BrainCircuit,
  Trophy
} from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

export default function QuizPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: subjectId } = use(params)
  
  const db = useFirestore()
  const { toast } = useToast()

  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [showExplanation, setShowExplanation] = useState(false)
  const [score, setScore] = useState(0)
  const [quizFinished, setQuizFinished] = useState(false)
  const [questions, setQuestions] = useState<any[]>([])
  const [qLoading, setQLoading] = useState(true)

  const subjectRef = useMemo(() => (!db ? null : doc(db, 'subjects', subjectId)), [db, subjectId])
  const { data: subject, loading: subjectLoading } = useDoc(subjectRef)

  useEffect(() => {
    async function fetchQuestions() {
      if (!subjectId) return
      setQLoading(true)
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('subject_id', subjectId)
        .order('created_at', { ascending: false })
      
      if (error) {
        toast({ variant: "destructive", title: "Fetch Error", description: error.message })
      } else {
        setQuestions(data || [])
      }
      setQLoading(false)
    }
    fetchQuestions()
  }, [subjectId, toast])

  if (subjectLoading || qLoading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>

  if (!questions || questions.length === 0) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center p-6 text-center">
        <Info className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-bold">No Questions Yet</h2>
        <p className="text-muted-foreground mt-2">The admin hasn't uploaded questions for this subject in Supabase yet.</p>
        <Link href="/qbank" className="mt-6"><Button>Back to QBank</Button></Link>
      </div>
    )
  }

  const currentQ = questions[currentIndex]
  const total = questions.length
  
  // Map Supabase columns to UI options
  const currentOptions = [currentQ.option1, currentQ.option2, currentQ.option3, currentQ.option4]
  const correctAnswer = currentOptions[currentQ.correct_answer_index]

  function handleAnswer(opt: string) {
    if (selectedOption) return
    setSelectedOption(opt)
    setShowExplanation(true)
    if (opt === correctAnswer) {
      setScore(s => s + 1)
    }
  }

  function nextQuestion() {
    if (currentIndex + 1 < total) {
      setCurrentIndex(c => c + 1)
      setSelectedOption(null)
      setShowExplanation(false)
    } else {
      setQuizFinished(true)
    }
  }

  if (quizFinished) {
    return (
      <div className="max-w-2xl mx-auto p-4 md:p-12 space-y-8 animate-in zoom-in-95 duration-500">
        <Card className="glass border-none overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-primary" />
          <CardContent className="p-12 text-center space-y-6">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary">
              <Trophy className="h-10 w-10" />
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-bold">Quiz Complete!</h2>
              <p className="text-muted-foreground">You mastered board-style clinical cases for {subject ? (subject as any).name : 'Subject'}.</p>
            </div>
            <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                <p className="text-2xl font-bold">{score}/{total}</p>
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Score</p>
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                <p className="text-2xl font-bold">{Math.round((score / total) * 100)}%</p>
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Accuracy</p>
              </div>
            </div>
            <div className="pt-6 flex flex-col gap-3">
              <Button onClick={() => window.location.reload()} className="w-full h-12 rounded-xl">Retake Quiz</Button>
              <Link href="/qbank" className="w-full"><Button variant="ghost" className="w-full">Back to QBank</Button></Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-12 space-y-8">
      <div className="flex items-center justify-between">
        <Link href="/qbank">
          <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-white">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
        </Link>
        <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
          Question {currentIndex + 1} of {total}
        </div>
      </div>

      <div className="space-y-6">
        <Card className="glass border-none">
          <CardHeader>
            <div className="flex items-center gap-2 text-[10px] font-bold text-primary uppercase tracking-widest mb-2">
              <BrainCircuit className="h-3 w-3" /> {currentQ.unit_title || 'Clinical Case'}
            </div>
            <CardTitle className="text-xl leading-relaxed">{currentQ.question_text}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              {currentOptions.map((opt: string, i: number) => {
                const isCorrect = opt === correctAnswer
                const isSelected = opt === selectedOption
                let styles = "bg-white/5 border-white/5"
                if (selectedOption) {
                  if (isCorrect) styles = "bg-green-500/10 border-green-500/50 text-green-400"
                  else if (isSelected) styles = "bg-red-500/10 border-red-500/50 text-red-400"
                  else styles = "bg-white/5 border-white/5 opacity-50"
                }
                
                return (
                  <button
                    key={i}
                    disabled={!!selectedOption}
                    onClick={() => handleAnswer(opt)}
                    className={`p-5 rounded-2xl border text-left transition-all flex items-center justify-between group ${styles}`}
                  >
                    <span className="text-sm font-medium">{opt}</span>
                    {selectedOption && isCorrect && <CheckCircle2 className="h-5 w-5 shrink-0" />}
                    {selectedOption && isSelected && !isCorrect && <XCircle className="h-5 w-5 shrink-0" />}
                  </button>
                )
              })}
            </div>

            {showExplanation && (
              <div className="mt-8 p-6 rounded-2xl bg-accent/5 border border-accent/20 animate-in slide-in-from-top-4 duration-500">
                <div className="flex items-center gap-2 text-xs font-bold text-accent uppercase tracking-widest mb-3">
                  <Sparkles className="h-3.5 w-3.5" /> High-Yield Explanation
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground italic">
                  {currentQ.explanation}
                </p>
                <div className="mt-6">
                  <Button onClick={nextQuestion} className="w-full h-12 rounded-xl group">
                    Next Question <ChevronRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
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
