"use client"

import { useMemo, use, useState, useEffect } from "react"
import ReactMarkdown from "react-markdown"
import { useDoc, useFirestore, useUser } from "@/firebase"
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
  FileText,
  Zap,
  MessageSquare,
  Eye,
  Lock
} from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { clinicalTutorFlow } from "@/ai/flows/ai-clinical-tutor"
import { usePlan } from '@/hooks/use-plan'
import { UpgradeGate } from '@/components/upgrade-gate'

export default function QuizSubjectCurriculumPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: subjectId } = use(params)
  
  const db = useFirestore()
  const { user } = useUser()
  const { toast } = useToast()
  const { isFree } = usePlan()

  const [questions, setQuestions] = useState<any[]>([])
  const [qLoading, setQLoading] = useState(true)
  
  // Selection state
  const [selectedTopicQuestions, setSelectedTopicQuestions] = useState<any[] | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [sessionAnswers, setSessionAnswers] = useState<Record<number, number>>({})
  const [showExplanation, setShowExplanation] = useState(false)
  const [score, setScore] = useState(0)
  const [quizFinished, setQuizFinished] = useState(false)
  const [reviewMode, setReviewMode] = useState(false)

  // AI State
  const [aiExplanation, setAiExplanation] = useState<string | null>(null)
  const [isAiLoading, setIsAiLoading] = useState(false)

  const subjectRef = useMemo(() => (!db ? null : doc(db, 'users', subjectId)), [db, subjectId])
  const { data: subject, loading: subjectLoading } = useDoc(subjectRef)

  useEffect(() => {
    async function fetchQuestions() {
      if (!subjectId) return
      setQLoading(true)
      try {
        const res = await fetch('/api/questions?subject_id=' + subjectId)
        const json = await res.json()
        setQuestions(json.data || [])
      } catch (e) {
        console.error('QBank fetch error:', e)
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
    setSessionAnswers({})
    setShowExplanation(false)
    setScore(0)
    setQuizFinished(false)
    setReviewMode(false)
    setAiExplanation(null)
  }

  async function handleAskAi() {
    if (!selectedTopicQuestions) return
    const currentQ = selectedTopicQuestions[currentIndex]
    setIsAiLoading(true)
    try {
      const result = await clinicalTutorFlow(currentQ.question_text, [currentQ.option1, currentQ.option2, currentQ.option3, currentQ.option4][currentQ.correct_answer_index], currentQ.explanation, user?.uid)
      setAiExplanation(result)
    } catch (e: any) {
      toast({ variant: "destructive", title: "AI Error", description: e.message || "Could not reach the clinical tutor." })
    } finally {
      setIsAiLoading(false)
    }
  }

  if (selectedTopicQuestions) {
    if (quizFinished) {
      if (reviewMode) return (
        <div className="max-w-3xl mx-auto p-4 md:p-8 space-y-6 animate-in fade-in duration-500">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Eye className="h-6 w-6 text-primary" /> Answer Review
            </h2>
            <Button variant="ghost" onClick={() => setReviewMode(false)} className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Back to Results
            </Button>
          </div>
          <div className="space-y-4">
            {questions.map((q: any, i: number) => {
              const userAnswer = sessionAnswers[i]
              const isCorrect = userAnswer === q.correct_answer_index
              const options = [q.option1, q.option2, q.option3, q.option4].filter(Boolean)
              return (
                <Card key={i} className={`glass border-none overflow-hidden ${isCorrect ? 'border-l-4 border-l-green-500' : 'border-l-4 border-l-red-500'}`}>
                  <CardContent className="p-5 space-y-4">
                    <div className="flex items-start gap-3">
                      <div className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${isCorrect ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        {isCorrect ? '✓' : '✗'}
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{q.unit_title} · Q{i+1}</p>
                        <p className="font-medium text-sm leading-relaxed">{q.question_text}</p>
                      </div>
                    </div>
                    <div className="grid gap-2 pl-10">
                      {options.map((opt: string, oi: number) => {
                        const isUserAnswer = userAnswer === oi
                        const isCorrectAnswer = q.correct_answer_index === oi
                        let style = "bg-white/5 border-white/5 text-muted-foreground"
                        if (isCorrectAnswer) style = "bg-green-500/10 border-green-500/30 text-green-400"
                        else if (isUserAnswer && !isCorrectAnswer) style = "bg-red-500/10 border-red-500/30 text-red-400"
                        return (
                          <div key={oi} className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${style}`}>
                            <span className="font-bold">{String.fromCharCode(65+oi)}.</span>
                            <span>{opt}</span>
                            {isCorrectAnswer && <span className="ml-auto text-[9px] font-bold uppercase">Correct</span>}
                            {isUserAnswer && !isCorrectAnswer && <span className="ml-auto text-[9px] font-bold uppercase">Your Answer</span>}
                          </div>
                        )
                      })}
                    </div>
                    {q.explanation && (
                      <div className="pl-10 p-3 rounded-xl bg-accent/5 border border-accent/20">
                        <p className="text-[10px] font-bold text-accent uppercase tracking-widest mb-1">Explanation</p>
                        <p className="text-xs text-muted-foreground leading-relaxed">{q.explanation}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )

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
                <Button 
                  variant="outline" 
                  onClick={() => setReviewMode(true)}
                  className="w-full rounded-xl h-12 glass border-white/10 gap-2"
                >
                  <Eye className="h-4 w-4" /> Review Answers
                </Button>
                <Button variant="ghost" onClick={() => setSelectedTopicQuestions(null)} className="w-full">Return to Curriculum</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    const currentQ = selectedTopicQuestions[currentIndex]
    const currentOptions = [currentQ.option1, currentQ.option2, currentQ.option3, currentQ.option4]

    const handleAnswer = (optionIndex: number) => {
      if (selectedOption !== null) return
      setSelectedOption(optionIndex)
      setSessionAnswers(prev => ({ ...prev, [currentIndex]: optionIndex }))
      setShowExplanation(true)
      if (optionIndex === currentQ.correct_answer_index) setScore(s => s + 1)
    }

    const nextQuestion = () => {
      if (currentIndex + 1 < selectedTopicQuestions.length) {
        setCurrentIndex(c => c + 1)
        setSelectedOption(null)
        setShowExplanation(false)
        setAiExplanation(null)
      } else {
        setQuizFinished(true)
      }
    }

    const previousQuestion = () => {
      if (currentIndex > 0) {
        const prevIndex = currentIndex - 1
        setCurrentIndex(prevIndex)
        const prevAnswer = sessionAnswers[prevIndex]
        setSelectedOption(prevAnswer !== undefined ? prevAnswer : null)
        setShowExplanation(prevAnswer !== undefined)
        setAiExplanation(null)
      }
    }

    return (
      <div className="max-w-4xl mx-auto p-4 md:p-12 space-y-8">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={previousQuestion}
            disabled={currentIndex === 0}
            className="gap-2 text-muted-foreground hover:text-white disabled:opacity-30">
            <ArrowLeft className="h-4 w-4" /> Prev
          </Button>
          <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
            {currentIndex + 1} / {selectedTopicQuestions.length}
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
                  const isCorrect = i === currentQ.correct_answer_index
                  const isSelected = i === selectedOption
                  let styles = "bg-white/5 border-white/5"
                  if (selectedOption !== null) {
                    if (isCorrect) styles = "bg-green-500/10 border-green-500/50 text-green-400"
                    else if (isSelected) styles = "bg-red-500/10 border-red-500/50 text-red-400"
                    else styles = "bg-white/5 border-white/5 opacity-50"
                  }
                  return (
                    <button key={i} disabled={selectedOption !== null} onClick={() => handleAnswer(i)} className={`p-5 rounded-2xl border text-left transition-all flex items-center justify-between group ${styles}`}>
                      <span className="text-sm font-medium">{opt}</span>
                      {selectedOption !== null && isCorrect && <CheckCircle2 className="h-5 w-5 shrink-0" />}
                      {selectedOption !== null && isSelected && !isCorrect && <XCircle className="h-5 w-5 shrink-0" />}
                    </button>
                  )
                })}
              </div>
              {showExplanation && (
                <div className="mt-8 space-y-4">
                  <div className="p-6 rounded-2xl bg-accent/5 border border-accent/20 animate-in slide-in-from-top-4 duration-500">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2 text-xs font-bold text-accent uppercase tracking-widest"><Sparkles className="h-3.5 w-3.5" /> High-Yield Explanation</div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-7 text-[10px] font-bold uppercase rounded-lg glass gap-1.5"
                        onClick={handleAskAi}
                        disabled={isAiLoading}
                      >
                        {isAiLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <BrainCircuit className="h-3 w-3" />}
                        {isAiLoading ? "Consulting AI..." : "Ask AI Tutor"}
                      </Button>
                    </div>
                    <p className="text-sm leading-relaxed text-muted-foreground italic"
                      dangerouslySetInnerHTML={{
                        __html: (currentQ.explanation || "")
                          .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
                          .replace(/\*(.+?)\*/g, "<em>$1</em>")
                          .replace(/\n/g, "<br/>")
                      }}
                    />
                  </div>

                  {aiExplanation && (
                    <div className="p-6 rounded-2xl bg-primary/5 border border-primary/20 animate-in fade-in zoom-in-95 duration-500">
                       <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-widest mb-3">
                          <MessageSquare className="h-3.5 w-3.5" /> AI Clinical Reasoning
                       </div>
                       <div className="prose prose-invert max-w-none text-sm leading-relaxed text-foreground/80 whitespace-pre-wrap">
                          <ReactMarkdown>{aiExplanation}</ReactMarkdown>
                       </div>
                    </div>
                  )}

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
            {isFree ? (
              <>
                {groupedQBank.slice(0, 1).map((unit, uIdx) => (
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
                {groupedQBank.slice(1).map((unit, uIdx) => (
                  <AccordionItem key={`locked-${uIdx}`} value={`locked-unit-${uIdx}`} className="border-none glass rounded-3xl px-4 overflow-hidden opacity-60">
                    <div className="flex items-center justify-between py-6 cursor-not-allowed">
                      <div className="flex flex-col items-start text-left">
                        <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.2em] mb-1">Unit {uIdx + 2}</span>
                        <span className="text-2xl font-bold tracking-tight text-muted-foreground">{unit.title}</span>
                        <span className="text-xs text-muted-foreground mt-1">{Object.keys(unit.topics).length} topics &middot; Upgrade to unlock</span>
                      </div>
                      <Lock className="h-5 w-5 text-muted-foreground shrink-0" />
                    </div>
                  </AccordionItem>
                ))}
                {groupedQBank.length > 1 && (
                  <UpgradeGate type="content" title={`${groupedQBank.length - 1} more units locked`} description="Upgrade to Scholar to access all QBank units." />
                )}
              </>
            ) : (
              groupedQBank.map((unit, uIdx) => (
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
              ))
            )}
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
