
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
  RefreshCw,
  Video,
  X,
  Upload
} from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

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

  // ALL hooks must be at the top level
  const profileRef = useMemo(() => (!db || !user) ? null : doc(db, 'users', user.uid), [db, user])
  const { data: profile, loading: profileLoading } = useDoc(profileRef)

  const subjectsQuery = useMemo(() => (!db) ? null : query(collection(db, 'subjects'), orderBy('name', 'asc')), [db])
  const { data: subjects, loading: subjectsLoading } = useCollection(subjectsQuery)

  const pdfTopics = useMemo(() => subjectContent.topics.filter(t => t.contentType === 'pdf'), [subjectContent.topics])
  const videoTopics = useMemo(() => subjectContent.topics.filter(t => t.contentType === 'video'), [subjectContent.topics])

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
      toast({ title: "Content Removed" })
    } catch (e: any) {
      toast({ variant: "destructive", title: "Deletion Error", description: e.message })
    }
  }

  async function handleDeleteMindmap(mm: any) {
    if (!db || !confirm(`Delete mindmap "${mm.title}"?`)) return
    try {
      const subjectId = mm.subjectId
      await deleteDoc(doc(db, 'subjects', subjectId, 'mindmaps', mm.id))
      await updateDoc(doc(db, 'subjects', subjectId), { mindmapCount: increment(-1) })
      
      if (mm.storagePath) {
        await supabase.storage.from('mindmaps').remove([mm.storagePath])
      }
      
      setSubjectContent(prev => ({ ...prev, mindmaps: prev.mindmaps.filter(m => m.id !== mm.id) }))
      toast({ title: "Mindmap Removed" })
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
      const storagePath = `mindmaps/${subjectId}/${fileId}`
      
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

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-12 space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <ShieldAlert className="h-8 w-8 text-primary" /> Command Center
          </h1>
          <p className="text-muted-foreground">Manage subjects, curriculum videos, and high-yield notes.</p>
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
              </div>

              <Tabs defaultValue="notes" className="w-full">
                <TabsList className="glass border-none h-12 p-1 rounded-xl mb-6 flex-wrap">
                  <TabsTrigger value="notes" className="rounded-lg gap-2 data-[state=active]:bg-primary"><FileText className="h-4 w-4" /> PDF Notes</TabsTrigger>
                  <TabsTrigger value="videos" className="rounded-lg gap-2 data-[state=active]:bg-primary"><Video className="h-4 w-4" /> Video Curriculum</TabsTrigger>
                  <TabsTrigger value="mindmaps" className="rounded-lg gap-2 data-[state=active]:bg-primary"><Network className="h-4 w-4" /> Mindmaps</TabsTrigger>
                  <TabsTrigger value="qbank" className="rounded-lg gap-2 data-[state=active]:bg-primary"><Database className="h-4 w-4" /> QBank</TabsTrigger>
                </TabsList>

                {loadingContent ? (
                  <div className="h-64 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                ) : (
                  <>
                    <TabsContent value="notes" className="space-y-3">
                      {pdfTopics.map((t) => (
                        <Card key={t.id} className="glass border-none hover:bg-white/5 transition-colors">
                          <CardContent className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                                <FileText className="h-5 w-5" />
                              </div>
                              <div>
                                <p className="font-bold text-sm">{t.title}</p>
                                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">{t.unitName || 'General'}</p>
                              </div>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteTopic(t)} className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                      {pdfTopics.length === 0 && <div className="text-center py-24 glass rounded-3xl text-muted-foreground">No PDF notes found for this subject.</div>}
                    </TabsContent>

                    <TabsContent value="videos" className="space-y-3">
                      {videoTopics.map((t) => (
                        <Card key={t.id} className="glass border-none hover:bg-white/5 transition-colors">
                          <CardContent className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="p-2.5 rounded-xl bg-secondary/10 text-secondary">
                                <Video className="h-5 w-5" />
                              </div>
                              <div>
                                <p className="font-bold text-sm">{t.title}</p>
                                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">{t.unitName || 'General'}</p>
                              </div>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteTopic(t)} className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                      {videoTopics.length === 0 && <div className="text-center py-24 glass rounded-3xl text-muted-foreground">No video lectures found for this subject.</div>}
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
                      {subjectContent.mindmaps.length === 0 && <div className="col-span-full text-center py-24 glass rounded-3xl text-muted-foreground">No mindmaps found.</div>}
                    </TabsContent>

                    <TabsContent value="qbank" className="space-y-4">
                      <div className="p-6 glass rounded-2xl">
                         <h4 className="font-bold mb-4 flex items-center gap-2 text-primary"><Database className="h-4 w-4" /> Assessment Data</h4>
                         <Accordion type="multiple" className="space-y-2">
                            {subjectContent.questions.length > 0 ? (
                              <AccordionItem value="all-questions" className="border-none bg-white/5 rounded-xl px-4">
                                <AccordionTrigger className="hover:no-underline">Questions Pool ({subjectContent.questions.length})</AccordionTrigger>
                                <AccordionContent className="space-y-2">
                                  {subjectContent.questions.slice(0, 50).map((q: any, i: number) => (
                                    <div key={i} className="text-xs p-2 rounded bg-black/20 border border-white/5 truncate">
                                      {q.question_text}
                                    </div>
                                  ))}
                                  {subjectContent.questions.length > 50 && <p className="text-[10px] text-muted-foreground italic">+ {subjectContent.questions.length - 50} more questions...</p>}
                                </AccordionContent>
                              </AccordionItem>
                            ) : (
                              <p className="text-center py-12 text-muted-foreground text-sm">No QBank data imported.</p>
                            )}
                         </Accordion>
                      </div>
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

      {/* Add Topic Modal */}
      <Dialog open={isAddingTopic} onOpenChange={setIsAddingTopic}>
        <DialogContent className="glass border-white/10 max-w-lg">
          <DialogHeader>
            <DialogTitle>Publish New Study Note</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Subject</Label>
              <Select onValueChange={(v) => setTopicForm({ ...topicForm, subjectId: v })}>
                <SelectTrigger className="glass border-white/10">
                  <SelectValue placeholder="Select Subject" />
                </SelectTrigger>
                <SelectContent className="glass border-white/10">
                  {subjects?.map((s: any) => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Unit Name</Label>
              <Input placeholder="e.g., CNS Anatomy" className="glass border-white/10" value={topicForm.unitName} onChange={(e) => setTopicForm({ ...topicForm, unitName: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Note Title</Label>
              <Input placeholder="e.g., Ventricular System" className="glass border-white/10" value={topicForm.title} onChange={(e) => setTopicForm({ ...topicForm, title: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>PDF Document</Label>
              <Input type="file" accept=".pdf" className="glass border-white/10 cursor-pointer" onChange={(e) => setTopicForm({ ...topicForm, file: e.target.files?.[0] || null })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsAddingTopic(false)}>Cancel</Button>
            <Button onClick={handleAddTopic} disabled={uploading}>{uploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} Publish Note</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Video Modal */}
      <Dialog open={isAddingVideo} onOpenChange={setIsAddingVideo}>
        <DialogContent className="glass border-white/10 max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Curriculum Video</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Subject</Label>
              <Select onValueChange={(v) => setVideoForm({ ...videoForm, subjectId: v })}>
                <SelectTrigger className="glass border-white/10">
                  <SelectValue placeholder="Select Subject" />
                </SelectTrigger>
                <SelectContent className="glass border-white/10">
                  {subjects?.map((s: any) => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Unit Name</Label>
              <Input placeholder="e.g., Physiology of Respiration" className="glass border-white/10" value={videoForm.unitName} onChange={(e) => setVideoForm({ ...videoForm, unitName: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Lecture Title</Label>
              <Input placeholder="e.g., Gas Exchange Mechanisms" className="glass border-white/10" value={videoForm.title} onChange={(e) => setVideoForm({ ...videoForm, title: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>YouTube URL</Label>
              <Input placeholder="https://youtube.com/watch?v=..." className="glass border-white/10" value={videoForm.url} onChange={(e) => setVideoForm({ ...videoForm, url: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsAddingVideo(false)}>Cancel</Button>
            <Button onClick={handleAddVideo} disabled={uploading}>{uploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} Add Video</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Mindmap Modal */}
      <Dialog open={isAddingMindmap} onOpenChange={setIsAddingMindmap}>
        <DialogContent className="glass border-white/10 max-w-lg">
          <DialogHeader>
            <DialogTitle>Upload Subject Mindmap</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Subject</Label>
              <Select onValueChange={(v) => setMindmapForm({ ...mindmapForm, subjectId: v })}>
                <SelectTrigger className="glass border-white/10">
                  <SelectValue placeholder="Select Subject" />
                </SelectTrigger>
                <SelectContent className="glass border-white/10">
                  {subjects?.map((s: any) => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Mindmap Title</Label>
              <Input placeholder="e.g., Coagulation Cascade" className="glass border-white/10" value={mindmapForm.title} onChange={(e) => setMindmapForm({ ...mindmapForm, title: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Image File (Visual Map)</Label>
              <Input type="file" accept="image/*" className="glass border-white/10 cursor-pointer" onChange={(e) => setMindmapForm({ ...mindmapForm, file: e.target.files?.[0] || null })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsAddingMindmap(false)}>Cancel</Button>
            <Button onClick={handleAddMindmap} disabled={uploading}>{uploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} Upload Map</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import QBank Modal */}
      <Dialog open={isUploadingQBank} onOpenChange={setIsUploadingQBank}>
        <DialogContent className="glass border-white/10 max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Upload className="h-5 w-5" /> Import Clinical QBank</DialogTitle>
            <DialogDescription>Select a CSV file containing MCQs and map it to a subject.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Target Subject</Label>
              <Select onValueChange={(v) => setQbankForm({ ...qbankForm, subjectId: v })}>
                <SelectTrigger className="glass border-white/10">
                  <SelectValue placeholder="Select Subject" />
                </SelectTrigger>
                <SelectContent className="glass border-white/10">
                  {subjects?.map((s: any) => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>CSV Dataset (QBank)</Label>
              <Input type="file" accept=".csv" className="glass border-white/10 cursor-pointer" />
              <p className="text-[10px] text-muted-foreground">Expected columns: unit_number, unit_title, topic_title, question_text, option1, option2, option3, option4, correct_answer_index, explanation</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsUploadingQBank(false)}>Cancel</Button>
            <Button disabled className="gap-2"><Upload className="h-4 w-4" /> Import Data</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
