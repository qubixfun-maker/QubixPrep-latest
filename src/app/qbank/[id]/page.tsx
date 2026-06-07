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
  Trophy,
  PlayCircle,
  FileText
} from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

export default function QuizSubjectCurriculumPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: subjectId } = use(params)
  
  const db = useFirestore()
  const { toast } = useToast()

  const [questions, setQuestions] = useState<any[]>([])
  const [qLoading, setQLoading] = useState(true)
  
  // Selection state
  const [selectedTopicQuestions, setSelectedTopicQuestions] = useState<any[] | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [showExplanation, setShowExplanation] = useState(false)
  const [score, setScore] = useState(0)
  const [quizFinished, setQuizFinished] = useState(false)

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
        .order('unit_number', { ascending: true })
      
      if (error) {
        toast({ variant: "destructive", title: "Fetch Error", description: error.message })
      } else {
        setQuestions(data || [])
      }
      setQLoading(false)
    }
    fetchQuestions()
  }, [subjectId, toast])

  const groupedQBank = useMemo(() => {
    const units: Record<string, { title: string, topics: Record<string, any[]> }> = {}
    questions.forEach(q => {
      const uTitle = q.unit_title || "General Curriculum"
      const tTitle = q.topic_title || "General"
      if (!units[uTitle]) units[uTitle] = { title: uTitle, topics: {} }
      if (!units[uTitle].topics[tTitle]) units[uTitle].topics[tTitle] = []
      units[uTitle].topics[tTitle].push(q)
    })
    return Object.values(units)
  }, [questions])

  if (subjectLoading || qLoading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>

  // Quiz Interaction Logic
  const startTopicQuiz = (topicQs: any[]) => {
    setSelectedTopicQuestions(topicQs)
    setCurrentIndex(0)
    setSelectedOption(null)
    setShowExplanation(false)
    setScore(0)
    setQuizFinished(false)
  }

  if (selectedTopicQuestions) {
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
                <h2 className="text-3xl font-bold">Concept Mastered!</h2>
                <p className="text-muted-foreground">Assessment session for {selectedTopicQuestions[0].topic_title} complete.</p>
              </div>
              <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                  <p className="text-2xl font-bold">{score}/{selectedTopicQuestions.length}</p>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Score</p>
                </div>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                  <p className="text-2xl font-bold">{Math.round((score / selectedTopicQuestions.length) * 100)}%</p>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Accuracy</p>
                </div>
              </div>
              <div className="pt-6 flex flex-col gap-3">
                <Button onClick={() => startTopicQuiz(selectedTopicQuestions)} className="w-full h-12 rounded-xl">Retake Assessment</Button>
                <Button variant="ghost" onClick={() => setSelectedTopicQuestions(null)} className="w-full">Return to Curriculum</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    const currentQ = selectedTopicQuestions[currentIndex]
    const currentOptions = [currentQ.option1, currentQ.option2, currentQ.option3, currentQ.option4]
    const correctAnswer = currentOptions[currentQ.correct_answer_index]

    const handleAnswer = (opt: string) => {
      if (selectedOption) return
      setSelectedOption(opt)
      setShowExplanation(true)
      if (opt === correctAnswer) setScore(s => s + 1)
    }

    const nextQuestion = () => {
      if (currentIndex + 1 < selectedTopicQuestions.length) {
        setCurrentIndex(c => c + 1)
        setSelectedOption(null)
        setShowExplanation(false)
      } else {
        setQuizFinished(true)
      }
    }

    return (
      <div className="max-w-4xl mx-auto p-4 md:p-12 space-y-8">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => setSelectedTopicQuestions(null)} className="gap-2 text-muted-foreground hover:text-white">
            <ArrowLeft className="h-4 w-4" /> Exit
          </Button>
          <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
            Case {currentIndex + 1} of {selectedTopicQuestions.length}
          </div>
        </div>

        <div className="space-y-6">
          <Card className="glass border-none">
            <CardHeader>
              <div className="flex items-center gap-2 text-[10px] font-bold text-primary uppercase tracking-widest mb-2">
                <BrainCircuit className="h-3 w-3" /> {currentQ.topic_title}
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
                    <button key={i} disabled={!!selectedOption} onClick={() => handleAnswer(opt)} className={`p-5 rounded-2xl border text-left transition-all flex items-center justify-between group ${styles}`}>
                      <span className="text-sm font-medium">{opt}</span>
                      {selectedOption && isCorrect && <CheckCircle2 className="h-5 w-5 shrink-0" />}
                      {selectedOption && isSelected && !isCorrect && <XCircle className="h-5 w-5 shrink-0" />}
                    </button>
                  )
                })}
              </div>
              {showExplanation && (
                <div className="mt-8 p-6 rounded-2xl bg-accent/5 border border-accent/20 animate-in slide-in-from-top-4 duration-500">
                  <div className="flex items-center gap-2 text-xs font-bold text-accent uppercase tracking-widest mb-3"><Sparkles className="h-3.5 w-3.5" /> High-Yield Explanation</div>
                  <p className="text-sm leading-relaxed text-muted-foreground italic">{currentQ.explanation}</p>
                  <div className="mt-6">
                    <Button onClick={nextQuestion} className="w-full h-12 rounded-xl group">
                      Next Case <ChevronRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
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

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-12 space-y-12 animate-in slide-in-from-bottom-4 duration-700">
      <div className="glass rounded-3xl p-8 md:p-12 border-primary/20">
        <Link href="/qbank" className="text-xs font-bold uppercase tracking-widest text-accent flex items-center gap-1 mb-4 hover:underline">
          <ArrowLeft className="h-3 w-3" /> Back to QBank
        </Link>
        <h1 className="text-5xl font-bold tracking-tighter capitalize">{subject ? (subject as any).name : 'Subject'} Curriculum</h1>
        <p className="text-muted-foreground text-lg mt-4">Select a unit to view topics and begin clinical assessments.</p>
      </div>

      <div className="space-y-6">
        {groupedQBank.length > 0 ? (
          <Accordion type="multiple" className="space-y-4">
            {groupedQBank.map((unit, uIdx) => (
              <AccordionItem key={uIdx} value={`unit-${uIdx}`} className="border-none glass rounded-3xl px-4 overflow-hidden">
                <AccordionTrigger className="hover:no-underline py-6">
                  <div className="flex flex-col items-start text-left">
                    <span className="text-[10px] text-accent font-bold uppercase tracking-[0.2em] mb-1">Unit {uIdx + 1}</span>
                    <span className="text-2xl font-bold tracking-tight">{unit.title}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-6 pt-2 space-y-3">
                  {Object.entries(unit.topics).map(([topicTitle, topicQs], tIdx) => (
                    <div 
                      key={tIdx} 
                      onClick={() => startTopicQuiz(topicQs)}
                      className="group flex items-center justify-between p-5 rounded-2xl bg-white/5 border border-white/5 hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-4">
                         <div className="p-3 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                           <FileText className="h-5 w-5" />
                         </div>
                         <div>
                           <p className="font-bold text-base">{topicTitle}</p>
                           <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest mt-0.5">{topicQs.length} Clinical Cases</p>
                         </div>
                      </div>
                      <PlayCircle className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  ))}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        ) : (
          <div className="text-center py-20 text-muted-foreground border-2 border-dashed border-white/5 rounded-3xl">
            Curriculum content for this subject is being curated.
          </div>
        )}
      </div>
    </div>
  )
}
