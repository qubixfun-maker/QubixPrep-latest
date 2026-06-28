"use client"

import { useState, useMemo } from "react"
import { useUser, useDoc, useFirestore, useCollection } from "@/firebase"
import { doc, collection, query, orderBy } from "firebase/firestore"
import { generateQBankQuestions, type QBankQuestion } from "@/ai/flows/ai-qbank-generator"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Sparkles, Lock, ArrowLeft, CheckCircle2, X, Wand2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

const QUESTION_COUNT_OPTIONS = [5, 10, 15, 20, 25, 30]

export default function QBankGeneratorPage() {
  const { user, loading: authLoading } = useUser()
  const db = useFirestore()
  const { toast } = useToast()

  const profileRef = useMemo(() => (!db || !user) ? null : doc(db, 'users', user.uid), [db, user])
  const { data: profile, loading: profileLoading } = useDoc(profileRef)

  const subjectsQuery = useMemo(() => (!db) ? null : query(collection(db, 'subjects'), orderBy('name', 'asc')), [db])
  const { data: subjects } = useCollection(subjectsQuery)

  const [subject, setSubject] = useState("")
  const [topic, setTopic] = useState("")
  const [unitName, setUnitName] = useState("")
  const [numQuestions, setNumQuestions] = useState(10)
  const [generated, setGenerated] = useState<QBankQuestion[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  if (authLoading || profileLoading) return <div className="h-screen flex items-center justify-center"><Loader2 className="h-10 w-10 text-primary animate-spin" /></div>
  if (!user || (profile as any)?.role !== 'admin') {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center p-6 text-center">
        <Lock className="h-12 w-12 text-destructive mb-4" />
        <h1 className="text-2xl font-bold">Admin Restricted</h1>
        <Link href="/"><Button className="mt-4">Return Home</Button></Link>
      </div>
    )
  }

  async function handleGenerate() {
    if (!subject || !topic.trim()) {
      toast({ variant: "destructive", title: "Missing fields", description: "Select a subject and enter a topic." })
      return
    }
    setIsGenerating(true)
    setGenerated([])
    try {
      const result = await generateQBankQuestions({ subject, unitName: unitName.trim(), topic: topic.trim(), numQuestions })
      if (result.questions.length === 0) {
        toast({ variant: "destructive", title: "Generation Failed", description: result.error || "AI returned no usable questions. Try again." })
      } else if (result.questions.length < numQuestions) {
        setGenerated(result.questions)
        toast({ title: "Partial Success", description: `Only ${result.questions.length} of ${numQuestions} requested questions were generated. Review and save what you have, or try again for more.` })
      } else {
        setGenerated(result.questions)
        toast({ title: "Generated", description: `${result.questions.length} questions ready to review.` })
      }
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message })
    } finally {
      setIsGenerating(false)
    }
  }

  function removeQuestion(index: number) {
    setGenerated(prev => prev.filter((_, i) => i !== index))
  }

  async function handleSaveAll() {
    if (!subject || generated.length === 0) return
    setIsSaving(true)
    try {
      const subjectId = subject.toLowerCase().replace(/\s+/g, '-')
      const payload = generated.map(q => ({
        subject_id: subjectId,
        unit_title: unitName.trim() || null,
        topic_title: q.topic_title || topic.trim(),
        question_text: q.question_text,
        option1: q.option1,
        option2: q.option2,
        option3: q.option3,
        option4: q.option4,
        correct_answer_index: q.correct_answer_index,
        explanation: q.explanation
      }))
      const { error } = await supabase.from('questions').insert(payload)
      if (error) throw error
      toast({ title: "Saved", description: `${payload.length} questions added to ${subject}.` })
      setGenerated([])
      setTopic("")
    } catch (e: any) {
      toast({ variant: "destructive", title: "Save Failed", description: e.message })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-12 space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-3">
        <Link href="/admin"><Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button></Link>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Wand2 className="h-6 w-6 text-primary" /> AI QBank Generator
          </h1>
          <p className="text-sm text-muted-foreground">Generate board-style MCQs instantly from a topic name.</p>
        </div>
      </div>

      <Card className="glass border-none">
        <CardHeader><CardTitle className="text-base">Generation Settings</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Subject</Label>
              <Select value={subject} onValueChange={setSubject}>
                <SelectTrigger className="glass border-white/10"><SelectValue placeholder="Select Subject" /></SelectTrigger>
                <SelectContent className="glass border-white/10">
                  {subjects?.map((s: any) => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Unit Name (optional)</Label>
              <Input placeholder="e.g., Unit 3 - Renal System" value={unitName} onChange={(e) => setUnitName(e.target.value)} className="glass border-white/10" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Topic</Label>
            <Input placeholder="e.g., Glomerular Filtration, Diabetic Ketoacidosis..." value={topic} onChange={(e) => setTopic(e.target.value)} className="glass border-white/10" />
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Number of Questions</Label>
            <div className="flex flex-wrap gap-2">
              {QUESTION_COUNT_OPTIONS.map((count) => (
                <button
                  key={count}
                  onClick={() => setNumQuestions(count)}
                  className={`h-9 px-4 rounded-lg text-sm font-bold transition-all ${
                    numQuestions === count ? 'bg-primary text-white' : 'glass border border-white/10 text-muted-foreground hover:text-white'
                  }`}
                >
                  {count}
                </button>
              ))}
            </div>
          </div>

          <Button onClick={handleGenerate} disabled={isGenerating || !subject || !topic.trim()} className="w-full h-12 gap-2">
            {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {isGenerating ? "Generating..." : `Generate ${numQuestions} Questions`}
          </Button>
        </CardContent>
      </Card>

      {generated.length > 0 && (
        <div className="space-y-4 animate-in slide-in-from-bottom-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Review ({generated.length} questions)</h2>
            <Button onClick={handleSaveAll} disabled={isSaving} className="gap-2">
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              {isSaving ? "Saving..." : `Save All ${generated.length} to QBank`}
            </Button>
          </div>

          {generated.map((q, i) => (
            <Card key={i} className="glass border-none">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-medium flex-1">{i + 1}. {q.question_text}</p>
                  <button onClick={() => removeQuestion(i)} className="text-muted-foreground hover:text-destructive shrink-0">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[q.option1, q.option2, q.option3, q.option4].map((opt, oi) => (
                    <div key={oi} className={`p-2 rounded-lg ${oi === q.correct_answer_index ? 'bg-green-500/10 text-green-400 border border-green-500/30' : 'bg-white/5 text-muted-foreground'}`}>
                      {String.fromCharCode(65 + oi)}. {opt}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground italic">{q.explanation}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
