"use client"

import { useState, useMemo } from "react"
import { useUser, useDoc, useFirestore, useCollection } from "@/firebase"
import { doc, collection, query, orderBy, setDoc, serverTimestamp } from "firebase/firestore"
import { formatLongAnswers } from "@/ai/flows/ai-long-answers-formatter"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Sparkles, Lock, ArrowLeft, Save, FileText } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

export default function LongAnswersAdminPage() {
  const { user, loading: authLoading } = useUser()
  const db = useFirestore()
  const { toast } = useToast()

  const profileRef = useMemo(() => (!db || !user) ? null : doc(db, 'users', user.uid), [db, user])
  const { data: profile, loading: profileLoading } = useDoc(profileRef)

  const subjectsQuery = useMemo(() => (!db) ? null : query(collection(db, 'subjects'), orderBy('name', 'asc')), [db])
  const { data: subjects } = useCollection(subjectsQuery)

  const [subject, setSubject] = useState("")
  const [chapter, setChapter] = useState("")
  const [sectionType, setSectionType] = useState<"long-essays" | "short-essays">("long-essays")
  const [rawText, setRawText] = useState("")
  const [generatedHtml, setGeneratedHtml] = useState("")
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
    if (!subject || !chapter.trim() || !rawText.trim()) {
      toast({ variant: "destructive", title: "Missing fields", description: "Select a subject, enter a chapter name, and paste your questions/answers." })
      return
    }
    setIsGenerating(true)
    setGeneratedHtml("")
    try {
      const result = await formatLongAnswers({ rawText, subject, chapter: chapter.trim(), sectionType })
      if (result.error || !result.html) {
        toast({ variant: "destructive", title: "Formatting Failed", description: result.error || "AI returned no usable content. Try again." })
      } else {
        setGeneratedHtml(result.html)
        toast({ title: "Formatted", description: "Review the preview below, then save." })
      }
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message })
    } finally {
      setIsGenerating(false)
    }
  }

  async function handleSave() {
    if (!db || !subject || !chapter.trim() || !generatedHtml) return
    setIsSaving(true)
    try {
      const subjectId = subject.toLowerCase().replace(/\s+/g, '-')
      const chapterId = chapter.trim().toLowerCase().replace(/\s+/g, '-')

      const chapterRef = doc(db, 'subjects', subjectId, 'essayChapters', chapterId)
      await setDoc(chapterRef, { title: chapter.trim(), subjectId, updatedAt: serverTimestamp() }, { merge: true })

      const sectionRef = doc(db, 'subjects', subjectId, 'essayChapters', chapterId, 'sections', sectionType)
      await setDoc(sectionRef, {
        sectionType,
        html: generatedHtml,
        updatedAt: serverTimestamp()
      }, { merge: true })

      toast({ title: "Saved", description: `${sectionType === 'long-essays' ? 'Long Essays' : 'Short Essays'} saved to ${chapter.trim()}.` })
      setRawText("")
      setGeneratedHtml("")
    } catch (e: any) {
      toast({ variant: "destructive", title: "Save Failed", description: e.message })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-12 space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-3">
        <Link href="/admin"><Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button></Link>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" /> Long Answers Builder
          </h1>
          <p className="text-sm text-muted-foreground">Paste your questions and rough answers, let AI format them, review, and publish.</p>
        </div>
      </div>

      <Card className="glass border-none">
        <CardHeader><CardTitle className="text-base">Content Settings</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
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
              <Label>Chapter</Label>
              <Input placeholder="e.g., Axilla and Brachial Plexus" value={chapter} onChange={(e) => setChapter(e.target.value)} className="glass border-white/10" />
            </div>
            <div className="space-y-2">
              <Label>Section</Label>
              <Select value={sectionType} onValueChange={(v: any) => setSectionType(v)}>
                <SelectTrigger className="glass border-white/10"><SelectValue /></SelectTrigger>
                <SelectContent className="glass border-white/10">
                  <SelectItem value="long-essays">Long Essays</SelectItem>
                  <SelectItem value="short-essays">Short Essays</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Paste Questions + Your Rough Answers</Label>
            <p className="text-[10px] text-muted-foreground">
              Use this format per question - repeat-frequency in brackets is optional:{" "}
              <span className="font-mono">Q1 [asked 3x: 2015, 2018, 2022] Describe the boundaries and contents of the axilla. [your rough answer text...]</span>
            </p>
            <Textarea
              placeholder="Q1 [asked 3x: 2015, 2018, 2022] Describe the boundaries and contents of the axilla.
The axilla is a pyramidal space...

Q2 Describe the brachial plexus.
..."
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              className="glass border-white/10 min-h-[300px] font-mono text-sm"
            />
          </div>

          <Button onClick={handleGenerate} disabled={isGenerating || !subject || !chapter.trim() || !rawText.trim()} className="w-full h-12 gap-2">
            {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {isGenerating ? "Formatting..." : "Format with AI"}
          </Button>
        </CardContent>
      </Card>

      {generatedHtml && (
        <div className="space-y-4 animate-in slide-in-from-bottom-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Preview</h2>
            <Button onClick={handleSave} disabled={isSaving} className="gap-2">
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {isSaving ? "Saving..." : "Save & Publish"}
            </Button>
          </div>
          <Card className="glass border-none">
            <CardContent className="p-6">
              <div dangerouslySetInnerHTML={{ __html: generatedHtml }} />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
