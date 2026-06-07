
"use client"

import { useMemo, useState, useEffect } from "react"
import { useUser, useDoc, useFirestore, useCollection } from "@/firebase"
import { doc, collection, query, orderBy, increment, updateDoc, deleteDoc, getDocs, setDoc } from "firebase/firestore"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  ShieldAlert,
  Loader2,
  Lock,
  FileText,
  Network,
  Database,
  Plus,
  Trash2,
  ChevronRight,
  BookOpen,
  Layout,
  UploadCloud,
  AlertTriangle,
  RefreshCw,
  FolderOpen,
  ChevronDown,
  Video,
  Link as LinkIcon
} from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

const MBBS_SUBJECTS = [
  "Anatomy", "Physiology", "Biochemistry", 
  "Pathology", "Microbiology", "Pharmacology", "Forensic Medicine", "Community Medicine",
  "Ophthalmology", "ENT", 
  "General Medicine", "General Surgery", "Obstetrics & Gynecology", "Pediatrics",
  "Orthopedics", "Dermatology", "Psychiatry", "Radiology", "Anesthesia"
]

export default function AdminDashboard() {
  const { user, loading: authLoading } = useUser()
  const db = useFirestore()
  const { toast } = useToast()
  
  const [activeSubject, setActiveSubject] = useState<string | null>(null)
  const [subjectContent, setSubjectContent] = useState<{
    topics: any[],
    mindmaps: any[],
    questions: any[]
  }>({ topics: [], mindmaps: [], questions: [] })
  
  const [isAddingTopic, setIsAddingTopic] = useState(false)
  const [isAddingVideo, setIsAddingVideo] = useState(false)
  const [isAddingMindmap, setIsAddingMindmap] = useState(false)
  const [isUploadingQBank, setIsUploadingQBank] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [loadingContent, setLoadingContent] = useState(false)
  
  const [topicForm, setTopicForm] = useState({
    subjectId: "",
    unitName: "",
    title: "",
    importance: "Medium" as "Low" | "Medium" | "High" | "Essential",
    file: null as File | null
  })

  const [videoForm, setVideoForm] = useState({
    subjectId: "",
    unitName: "",
    title: "",
    url: "",
    importance: "Medium" as "Low" | "Medium" | "High" | "Essential"
  })

  const [mindmapForm, setMindmapForm] = useState({
    subjectId: "",
    unitName: "",
    title: "",
    file: null as File | null
  })

  const [qbankForm, setQbankForm] = useState({
    subjectId: "",
    file: null as File | null
  })

  // Fetch Subject List
  const profileRef = useMemo(() => (!db || !user) ? null : doc(db, 'users', user.uid), [db, user])
  const { data: profile, loading: profileLoading } = useDoc(profileRef)

  const subjectsQuery = useMemo(() => (!db) ? null : query(collection(db, 'subjects'), orderBy('name', 'asc')), [db])
  const { data: subjects, loading: subjectsLoading } = useCollection(subjectsQuery)

  // Group questions by Unit and Topic
  const groupedQBank = useMemo(() => {
    const units: Record<string, { title: string, topics: Record<string, any[]> }> = {}
    
    subjectContent.questions.forEach(q => {
      const uTitle = q.unit_title || "General"
      const tTitle = q.topic_title || "General"
      
      if (!units[uTitle]) {
        units[uTitle] = { title: uTitle, topics: {} }
      }
      
      if (!units[uTitle].topics[tTitle]) {
        units[uTitle].topics[tTitle] = []
      }
      
      units[uTitle].topics[tTitle].push(q)
    })
    
    return Object.values(units)
  }, [subjectContent.questions])

  // Load content for active subject
  useEffect(() => {
    async function fetchSubjectDetails() {
      if (!db || !activeSubject) return
      setLoadingContent(true)
      try {
        const subjectId = activeSubject.toLowerCase().replace(/\s+/g, '-')
        
        const topicsSnap = await getDocs(collection(db, 'subjects', subjectId, 'topics'))
        const topics = topicsSnap.docs.map(d => ({ ...d.data(), id: d.id }))
        
        const mindmapsSnap = await getDocs(collection(db, 'subjects', subjectId, 'mindmaps'))
        const mindmaps = mindmapsSnap.docs.map(d => ({ ...d.data(), id: d.id }))
        
        const { data: questions, error } = await supabase
          .from('questions')
          .select('*')
          .eq('subject_id', subjectId)
          .order('unit_number', { ascending: true })
          .order('created_at', { ascending: true })
        
        if (error) throw error

        setSubjectContent({ topics, mindmaps, questions: questions || [] })
      } catch (e: any) {
        toast({ variant: "destructive", title: "Sync Error", description: e.message })
      } finally {
        setLoadingContent(false)
      }
    }
    fetchSubjectDetails()
  }, [activeSubject, db, toast])

  if (authLoading || profileLoading) return <div className="h-screen flex items-center justify-center"><Loader2 className="h-10 w-10 text-primary animate-spin" /></div>
  if (!user || (profile as any)?.role !== 'admin') return <div className="h-[80vh] flex flex-col items-center justify-center p-6 text-center"><Lock className="h-12 w-12 text-destructive mb-4" /><h1 className="text-2xl font-bold">Admin Restricted</h1><Link href="/"><Button className="mt-4">Return Home</Button></Link></div>

  async function handleSyncCounters() {
    if (!db || !activeSubject) return
    setLoadingContent(true)
    try {
      const subjectId = activeSubject.toLowerCase().replace(/\s+/g, '-')
      
      const { count, error } = await supabase
        .from('questions')
        .select('*', { count: 'exact', head: true })
        .eq('subject_id', subjectId)
      
      if (error) throw error

      await updateDoc(doc(db, 'subjects', subjectId), { 
        questionCount: count || 0 
      })

      toast({ title: "Counters Synced", description: `Updated MCQ count to ${count || 0} for ${activeSubject}.` })
    } catch (e: any) {
      toast({ variant: "destructive", title: "Sync Failed", description: e.message })
    } finally {
      setLoadingContent(false)
    }
  }

  async function handleDeleteTopic(topic: any) {
    if (!db || !confirm(`Delete "${topic.title}"?`)) return
    try {
      const sId = topic.subjectId
      await deleteDoc(doc(db, 'subjects', sId, 'topics', topic.id))
      await updateDoc(doc(db, 'subjects', sId), { topicCount: increment(-1) })
      
      if (topic.storagePath) {
        await supabase.storage.from('notes-pdf').remove([topic.storagePath])
      }
      
      setSubjectContent(prev => ({ ...prev, topics: prev.topics.filter(t => t.id !== topic.id) }))
      toast({ title: "Topic Deleted" })
    } catch (e: any) {
      toast({ variant: "destructive", title: "Deletion Error", description: e.message })
    }
  }

  async function handleDeleteMindmap(mm: any) {
    if (!db || !confirm(`Delete mindmap "${mm.title}"?`)) return
    try {
      const sId = mm.subjectId
      await deleteDoc(doc(db, 'subjects', sId, 'mindmaps', mm.id))
      await updateDoc(doc(db, 'subjects', sId), { mindmapCount: increment(-1) })
      
      if (mm.storagePath) {
        await supabase.storage.from('mindmaps').remove([mm.storagePath])
      }
      
      setSubjectContent(prev => ({ ...prev, mindmaps: prev.mindmaps.filter(m => m.id !== mm.id) }))
      toast({ title: "Mindmap Deleted" })
    } catch (e: any) {
      toast({ variant: "destructive", title: "Deletion Error", description: e.message })
    }
  }

  async function handleDeleteQuestion(qId: string, subjectId: string) {
    if (!db || !confirm("Delete this clinical case?")) return
    try {
      const { error } = await supabase.from('questions').delete().eq('id', qId)
      if (error) throw error
      
      await updateDoc(doc(db, 'subjects', subjectId), { questionCount: increment(-1) })
      setSubjectContent(prev => ({ ...prev, questions: prev.questions.filter(q => q.id !== qId) }))
      toast({ title: "Case Removed" })
    } catch (e: any) {
      toast({ variant: "destructive", title: "Deletion Error", description: e.message })
    }
  }

  async function handleAddTopic() {
    if (!db || !topicForm.subjectId || !topicForm.title || !topicForm.file) {
      toast({ variant: "destructive", title: "Missing Information" })
      return
    }

    setUploading(true)
    try {
      const subjectId = topicForm.subjectId.toLowerCase().replace(/\s+/g, '-')
      const fileId = `${Date.now()}-${topicForm.file.name.replace(/\s+/g, '_')}`
      const storagePath = `${subjectId}/${fileId}`
      
      const { error: uploadError } = await supabase.storage.from('notes-pdf').upload(storagePath, topicForm.file)
      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage.from('notes-pdf').getPublicUrl(storagePath)

      const topicId = fileId.replace(/\.[^/.]+$/, "").replace(/\s+/g, '-')
      const subjectRef = doc(db, 'subjects', subjectId)
      const topicRef = doc(db, 'subjects', subjectId, 'topics', topicId)

      await setDoc(subjectRef, {
        id: subjectId,
        name: topicForm.subjectId,
        iconName: "BookOpen",
        topicCount: increment(1)
      }, { merge: true })

      await setDoc(topicRef, {
        id: topicId,
        subjectId: subjectId,
        unitName: topicForm.unitName,
        title: topicForm.title,
        contentUrl: publicUrl,
        storagePath: storagePath,
        contentType: "pdf",
        importance: topicForm.importance,
        createdAt: new Date().toISOString()
      })

      toast({ title: "Note Published" })
      setIsAddingTopic(false)
      setActiveSubject(topicForm.subjectId)
    } catch (e: any) {
      toast({ variant: "destructive", title: "Upload Failed", description: e.message })
    } finally {
      setUploading(false)
    }
  }

  async function handleAddVideo() {
    if (!db || !videoForm.subjectId || !videoForm.title || !videoForm.url) {
      toast({ variant: "destructive", title: "Missing Information" })
      return
    }

    setUploading(true)
    try {
      const subjectId = videoForm.subjectId.toLowerCase().replace(/\s+/g, '-')
      const topicId = `vid-${Date.now()}`
      
      const subjectRef = doc(db, 'subjects', subjectId)
      const topicRef = doc(db, 'subjects', subjectId, 'topics', topicId)

      await setDoc(subjectRef, {
        id: subjectId,
        name: videoForm.subjectId,
        iconName: "Video",
        topicCount: increment(1)
      }, { merge: true })

      await setDoc(topicRef, {
        id: topicId,
        subjectId: subjectId,
        unitName: videoForm.unitName,
        title: videoForm.title,
        contentUrl: videoForm.url,
        contentType: "video",
        importance: videoForm.importance,
        createdAt: new Date().toISOString()
      })

      toast({ title: "Video Added" })
      setIsAddingVideo(false)
      setActiveSubject(videoForm.subjectId)
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message })
    } finally {
      setUploading(false)
    }
  }

  async function handleAddMindmap() {
    if (!db || !mindmapForm.subjectId || !mindmapForm.title || !mindmapForm.file) {
      toast({ variant: "destructive", title: "Missing Information" })
      return
    }

    setUploading(true)
    try {
      const subjectId = mindmapForm.subjectId.toLowerCase().replace(/\s+/g, '-')
      const fileId = `${Date.now()}-${mindmapForm.file.name.replace(/\s+/g, '_')}`
      const storagePath = `${subjectId}/${fileId}`
      
      const { error: uploadError } = await supabase.storage.from('mindmaps').upload(storagePath, mindmapForm.file)
      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage.from('mindmaps').getPublicUrl(storagePath)

      const mmId = fileId.replace(/\.[^/.]+$/, "").replace(/\s+/g, '-')
      const subjectRef = doc(db, 'subjects', subjectId)
      const mmRef = doc(db, 'subjects', subjectId, 'mindmaps', mmId)

      await setDoc(subjectRef, {
        id: subjectId,
        name: mindmapForm.subjectId,
        iconName: "Network",
        mindmapCount: increment(1)
      }, { merge: true })

      await setDoc(mmRef, {
        id: mmId,
        subjectId: subjectId,
        unitName: mindmapForm.unitName,
        title: mindmapForm.title,
        imageUrl: publicUrl,
        storagePath: storagePath,
        createdAt: new Date().toISOString()
      })

      toast({ title: "Mindmap Added" })
      setIsAddingMindmap(false)
      setActiveSubject(mindmapForm.subjectId)
    } catch (e: any) {
      toast({ variant: "destructive", title: "Upload Failed", description: e.message })
    } finally {
      setUploading(false)
    }
  }

  async function handleImportQBank() {
    if (!db || !qbankForm.subjectId || !qbankForm.file) {
      toast({ variant: "destructive", title: "Selection Required" })
      return
    }

    setUploading(true)
    try {
      const subjectId = qbankForm.subjectId.toLowerCase().replace(/\s+/g, '-')
      const text = await qbankForm.file.text()
      const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0)
      
      if (lines.length < 2) throw new Error("File empty.")

      const questionsToInsert = []
      for (let i = 1; i < lines.length; i++) {
        let columns = lines[i].split('\t')
        if (columns.length < 9) columns = lines[i].split(',')
        
        const cleanCols = columns.map(c => c.trim().replace(/^"(.*)"$/, '$1'))
        if (cleanCols.length < 9) continue

        questionsToInsert.push({
          subject_id: subjectId,
          unit_number: parseInt(cleanCols[0]) || 0,
          unit_title: cleanCols[1],
          topic_title: cleanCols[2],
          question_text: cleanCols[3],
          option1: cleanCols[4],
          option2: cleanCols[5],
          option3: cleanCols[6],
          option4: cleanCols[7],
          correct_answer_index: parseInt(cleanCols[8]) || 0,
          explanation: cleanCols[9] || "",
          created_at: new Date().toISOString()
        })
      }

      if (questionsToInsert.length === 0) throw new Error("No valid data rows found.")

      const { error } = await supabase.from('questions').insert(questionsToInsert)
      if (error) throw error

      const subjectRef = doc(db, 'subjects', subjectId)
      await setDoc(subjectRef, {
        id: subjectId,
        name: qbankForm.subjectId,
        questionCount: increment(questionsToInsert.length)
      }, { merge: true })

      toast({ title: "Import Successful", description: `${questionsToInsert.length} cases added.` })
      setIsUploadingQBank(false)
      setActiveSubject(qbankForm.subjectId)
    } catch (e: any) {
      toast({ variant: "destructive", title: "Import Failed", description: e.message })
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-12 space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <ShieldAlert className="h-8 w-8 text-primary" /> Command Center
          </h1>
          <p className="text-muted-foreground">Manage subjects, curriculum videos, and notes.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button onClick={() => setIsAddingTopic(true)} className="rounded-xl gap-2"><Plus className="h-4 w-4" /> New Note</Button>
          <Button onClick={() => setIsAddingVideo(true)} variant="secondary" className="rounded-xl gap-2"><Video className="h-4 w-4" /> Add Video</Button>
          <Button onClick={() => setIsAddingMindmap(true)} variant="outline" className="rounded-xl gap-2 glass"><Network className="h-4 w-4" /> New Mindmap</Button>
          <Button onClick={() => setIsUploadingQBank(true)} variant="outline" className="rounded-xl gap-2 glass"><Database className="h-4 w-4" /> Import QBank</Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-8">
        <Card className="lg:col-span-1 glass border-none h-fit overflow-hidden">
          <div className="p-4 border-b border-white/5 bg-white/5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <Layout className="h-3 w-3" /> Library Index
            </p>
          </div>
          <div className="max-h-[600px] overflow-y-auto scrollbar-hide">
            {subjectsLoading ? (
              <div className="p-12 flex justify-center"><Loader2 className="h-6 w-6 animate-spin opacity-20" /></div>
            ) : subjects?.map((s: any) => (
              <button 
                key={s.id}
                onClick={() => setActiveSubject(s.name)}
                className={`w-full p-4 flex items-center justify-between text-left hover:bg-white/5 transition-colors group ${activeSubject === s.name ? 'bg-primary/10 border-r-2 border-primary' : ''}`}
              >
                <div>
                  <p className="font-bold text-sm group-hover:text-primary transition-colors">{s.name}</p>
                  <div className="flex gap-2 mt-1">
                    <span className="text-[9px] text-muted-foreground uppercase">{s.topicCount || 0} Content</span>
                    <span className="text-[9px] text-muted-foreground uppercase">{s.questionCount || 0} MCQs</span>
                  </div>
                </div>
                <ChevronRight className={`h-4 w-4 transition-transform ${activeSubject === s.name ? 'rotate-90 text-primary' : 'opacity-10 group-hover:opacity-100'}`} />
              </button>
            ))}
          </div>
        </Card>

        <div className="lg:col-span-3 space-y-6">
          {activeSubject ? (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <h2 className="text-2xl font-bold flex items-center gap-3">
                    <BookOpen className="h-6 w-6 text-primary" /> {activeSubject}
                  </h2>
                  <Button variant="ghost" size="sm" onClick={handleSyncCounters} className="h-8 px-3 rounded-lg gap-2 text-[10px] font-bold uppercase tracking-tighter hover:bg-primary/10 hover:text-primary">
                    <RefreshCw className="h-3 w-3" /> Sync Counters
                  </Button>
                </div>
                <Badge variant="outline" className="glass text-[10px] uppercase font-bold tracking-widest">{activeSubject.toLowerCase().replace(/\s+/g, '-')}</Badge>
              </div>

              <Tabs defaultValue="content" className="w-full">
                <TabsList className="glass border-none h-12 p-1 rounded-xl mb-6">
                  <TabsTrigger value="content" className="rounded-lg gap-2 data-[state=active]:bg-primary"><FileText className="h-4 w-4" /> Curriculum</TabsTrigger>
                  <TabsTrigger value="mindmaps" className="rounded-lg gap-2 data-[state=active]:bg-primary"><Network className="h-4 w-4" /> Mindmaps</TabsTrigger>
                  <TabsTrigger value="qbank" className="rounded-lg gap-2 data-[state=active]:bg-primary"><Database className="h-4 w-4" /> QBank</TabsTrigger>
                </TabsList>

                {loadingContent ? (
                  <div className="h-64 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                ) : (
                  <>
                    <TabsContent value="content" className="space-y-3">
                      {subjectContent.topics.map((t) => (
                        <Card key={t.id} className="glass border-none hover:bg-white/5 transition-colors">
                          <CardContent className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                                {t.contentType === 'video' ? <Video className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                              </div>
                              <div>
                                <p className="font-bold text-sm">{t.title}</p>
                                <div className="flex items-center gap-2">
                                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">{t.unitName || 'General'}</p>
                                  <Badge variant="outline" className="text-[8px] h-4 uppercase">{t.contentType}</Badge>
                                </div>
                              </div>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteTopic(t)} className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                      {subjectContent.topics.length === 0 && <div className="text-center py-24 glass rounded-3xl text-muted-foreground">No curriculum content found.</div>}
                    </TabsContent>

                    <TabsContent value="mindmaps" className="grid md:grid-cols-2 gap-4">
                      {subjectContent.mindmaps.map((mm) => (
                        <Card key={mm.id} className="glass border-none overflow-hidden group">
                          <div className="aspect-video relative">
                            <img src={mm.imageUrl} alt={mm.title} className="w-full h-full object-cover opacity-50 group-hover:opacity-80 transition-opacity" />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Button variant="destructive" size="sm" onClick={() => handleDeleteMindmap(mm)} className="rounded-xl"><Trash2 className="h-4 w-4 mr-2" /> Delete</Button>
                            </div>
                          </div>
                          <div className="p-3 bg-card"><p className="text-sm font-bold truncate">{mm.title}</p></div>
                        </Card>
                      ))}
                    </TabsContent>

                    <TabsContent value="qbank" className="space-y-4">
                      <Accordion type="multiple" className="space-y-4">
                        {groupedQBank.map((unit, uIdx) => (
                          <AccordionItem key={uIdx} value={`unit-${uIdx}`} className="border-none glass rounded-2xl px-2">
                            <AccordionTrigger className="hover:no-underline py-4 px-4 flex-1">
                              <div className="flex flex-col items-start text-left">
                                <span className="text-[10px] text-accent font-bold uppercase tracking-widest">Unit {uIdx + 1}</span>
                                <span className="text-sm font-bold">{unit.title}</span>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="pb-4 px-2 space-y-4">
                              {Object.entries(unit.topics).map(([topicTitle, questions], tIdx) => (
                                <div key={tIdx} className="p-3 rounded-xl bg-white/5 border border-white/5">
                                  <p className="text-xs font-bold mb-2">{topicTitle} ({questions.length} MCQs)</p>
                                  <div className="space-y-2">
                                    {questions.slice(0, 3).map(q => (
                                      <div key={q.id} className="flex items-center justify-between text-[10px] text-muted-foreground">
                                        <p className="truncate flex-1 pr-4">{q.question_text}</p>
                                        <Button variant="ghost" size="icon" onClick={() => handleDeleteQuestion(q.id, q.subject_id)} className="h-6 w-6"><Trash2 className="h-3 w-3" /></Button>
                                      </div>
                                    ))}
                                    {questions.length > 3 && <p className="text-[9px] italic text-muted-foreground">...and {questions.length - 3} more</p>}
                                  </div>
                                </div>
                              ))}
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    </TabsContent>
                  </>
                )}
              </Tabs>
            </div>
          ) : (
            <div className="h-[500px] flex flex-col items-center justify-center glass rounded-3xl text-center space-y-4">
              <Layout className="h-16 w-16 text-muted-foreground opacity-10" />
              <p className="font-bold text-xl">Select a Subject to Manage Content</p>
            </div>
          )}
        </div>
      </div>

      {/* MODALS */}
      <Dialog open={isAddingTopic} onOpenChange={setIsAddingTopic}>
        <DialogContent className="glass border-none sm:max-w-md">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Plus className="h-5 w-5 text-primary" /> Publish Medical Note</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label className="text-xs uppercase font-bold text-muted-foreground">Subject</Label>
              <Select onValueChange={v => setTopicForm({...topicForm, subjectId: v})}>
                <SelectTrigger className="glass"><SelectValue placeholder="Select Subject" /></SelectTrigger>
                <SelectContent className="glass">{MBBS_SUBJECTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid gap-2"><Label className="text-xs uppercase font-bold text-muted-foreground">Unit Name</Label><Input placeholder="Unit Title" className="glass" value={topicForm.unitName} onChange={e => setTopicForm({...topicForm, unitName: e.target.value})} /></div>
            <div className="grid gap-2"><Label className="text-xs uppercase font-bold text-muted-foreground">Topic Title</Label><Input placeholder="Topic Title" className="glass" value={topicForm.title} onChange={e => setTopicForm({...topicForm, title: e.target.value})} /></div>
            <div className="grid gap-2">
              <Label className="text-xs uppercase font-bold text-muted-foreground">Yield Importance</Label>
              <Select onValueChange={(v: any) => setTopicForm({...topicForm, importance: v})}>
                <SelectTrigger className="glass"><SelectValue placeholder="Select Yield Level" /></SelectTrigger>
                <SelectContent className="glass">
                  <SelectItem value="Low">Low Yield</SelectItem>
                  <SelectItem value="Medium">Medium Yield</SelectItem>
                  <SelectItem value="High">High Yield</SelectItem>
                  <SelectItem value="Essential">Essential (Must Know)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2"><Label className="text-xs uppercase font-bold text-muted-foreground">PDF Document</Label><Input type="file" accept=".pdf" className="glass h-auto py-2" onChange={e => setTopicForm({...topicForm, file: e.target.files?.[0] || null})} /></div>
          </div>
          <DialogFooter><Button className="w-full rounded-xl" onClick={handleAddTopic} disabled={uploading}>{uploading ? "Publishing..." : "Publish to Library"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddingVideo} onOpenChange={setIsAddingVideo}>
        <DialogContent className="glass border-none sm:max-w-md">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Video className="h-5 w-5 text-secondary" /> Add Video Lecture</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label className="text-xs uppercase font-bold text-muted-foreground">Subject</Label>
              <Select onValueChange={v => setVideoForm({...videoForm, subjectId: v})}>
                <SelectTrigger className="glass"><SelectValue placeholder="Select Subject" /></SelectTrigger>
                <SelectContent className="glass">{MBBS_SUBJECTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid gap-2"><Label className="text-xs uppercase font-bold text-muted-foreground">Unit Name</Label><Input placeholder="Unit Title" className="glass" value={videoForm.unitName} onChange={e => setVideoForm({...videoForm, unitName: e.target.value})} /></div>
            <div className="grid gap-2"><Label className="text-xs uppercase font-bold text-muted-foreground">Video Title</Label><Input placeholder="Video Title" className="glass" value={videoForm.title} onChange={e => setVideoForm({...videoForm, title: e.target.value})} /></div>
            <div className="grid gap-2"><Label className="text-xs uppercase font-bold text-muted-foreground">YouTube URL</Label><div className="relative"><LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="https://youtube.com/watch?v=..." className="glass pl-10" value={videoForm.url} onChange={e => setVideoForm({...videoForm, url: e.target.value})} /></div></div>
          </div>
          <DialogFooter><Button className="w-full rounded-xl bg-secondary" onClick={handleAddVideo} disabled={uploading}>{uploading ? "Saving..." : "Add to Curriculum"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddingMindmap} onOpenChange={setIsAddingMindmap}>
        <DialogContent className="glass border-none sm:max-w-md">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Network className="h-5 w-5 text-secondary" /> Add Visual Mindmap</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label className="text-xs uppercase font-bold text-muted-foreground">Subject</Label>
              <Select onValueChange={v => setMindmapForm({...mindmapForm, subjectId: v})}>
                <SelectTrigger className="glass"><SelectValue placeholder="Select Subject" /></SelectTrigger>
                <SelectContent className="glass">{MBBS_SUBJECTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid gap-2"><Label className="text-xs uppercase font-bold text-muted-foreground">Unit Name</Label><Input className="glass" value={mindmapForm.unitName} onChange={e => setMindmapForm({...mindmapForm, unitName: e.target.value})} /></div>
            <div className="grid gap-2"><Label className="text-xs uppercase font-bold text-muted-foreground">Mindmap Title</Label><Input className="glass" value={mindmapForm.title} onChange={e => setMindmapForm({...mindmapForm, title: e.target.value})} /></div>
            <div className="grid gap-2"><Label className="text-xs uppercase font-bold text-muted-foreground">Image File</Label><Input type="file" accept="image/*" className="glass h-auto py-2" onChange={e => setMindmapForm({...mindmapForm, file: e.target.files?.[0] || null})} /></div>
          </div>
          <DialogFooter><Button className="w-full rounded-xl bg-secondary" onClick={handleAddMindmap} disabled={uploading}>{uploading ? "Uploading..." : "Add Mindmap"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isUploadingQBank} onOpenChange={setIsUploadingQBank}>
        <DialogContent className="glass border-none sm:max-w-md">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Database className="h-5 w-5 text-accent" /> Import QBank Data</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label className="text-xs uppercase font-bold text-muted-foreground">Target Subject</Label>
              <Select onValueChange={v => setQbankForm({...qbankForm, subjectId: v})}>
                <SelectTrigger className="glass"><SelectValue placeholder="Select Subject" /></SelectTrigger>
                <SelectContent className="glass">{MBBS_SUBJECTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label className="text-xs uppercase font-bold text-muted-foreground">CSV File (Tab-Separated)</Label>
              <Input type="file" accept=".csv,.txt" className="glass h-auto py-2" onChange={e => setQbankForm({...qbankForm, file: e.target.files?.[0] || null})} />
            </div>
          </div>
          <DialogFooter><Button className="w-full rounded-xl bg-accent text-background" onClick={handleImportQBank} disabled={uploading}>{uploading ? "Processing..." : "Import Cases"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
