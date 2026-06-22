
"use client"

import { useMemo, useState, useEffect } from "react"
import { useUser, useDoc, useFirestore, useCollection } from "@/firebase"
import { doc, collection, query, orderBy, increment, updateDoc, deleteDoc, getDocs, setDoc, writeBatch } from "firebase/firestore"
import { supabase } from "@/lib/supabase"
import Papa from "papaparse"
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
  Upload,
  Layers,
  HelpCircle,
  Edit2,
  FileDown,
  AlertTriangle,
  Trophy,
  ShoppingBag
} from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
  const [isEditingQuestion, setIsEditingQuestion] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [loadingContent, setLoadingContent] = useState(false)
  const [isUploadingPYQ, setIsUploadingPYQ] = useState(false)
  const [isAddingProduct, setIsAddingProduct] = useState(false)
  const [productForm, setProductForm] = useState({
    title: "", description: "", price: "",
    category: "Notes Pack", buy_link: "", image_url: ""
  })
  
  const [topicForm, setTopicForm] = useState({
    subjectId: "",
    unitName: "",
    title: "",
    importance: "Medium" as "Low" | "Medium" | "High" | "Essential",
    tier: "free" as "free" | "paid",
    file: null as File | null
  })

  const [videoForm, setVideoForm] = useState({
    subjectId: "",
    unitName: "",
    title: "",
    url: "",
    importance: "Medium" as "Low" | "Medium" | "High" | "Essential",
    tier: "free" as "free" | "paid"
  })

  const [mindmapForm, setMindmapForm] = useState({
    subjectId: "",
    unitName: "",
    title: "",
    tier: "free" as "free" | "paid",
    file: null as File | null
  })

  const [qbankForm, setQbankForm] = useState({
    id: null as number | null,
    subjectId: "",
    unit_title: "",
    topic_title: "",
    question_text: "",
    option1: "",
    option2: "",
    option3: "",
    option4: "",
    correct_answer_index: "0",
    explanation: ""
  })

  const profileRef = useMemo(() => (!db || !user) ? null : doc(db, 'users', user.uid), [db, user])
  const { data: profile, loading: profileLoading } = useDoc(profileRef)

  const subjectsQuery = useMemo(() => (!db) ? null : query(collection(db, 'subjects'), orderBy('name', 'asc')), [db])
  const { data: subjects, loading: subjectsLoading } = useCollection(subjectsQuery)

  const pdfTopics = useMemo(() => subjectContent.topics.filter(t => t.contentType === 'pdf'), [subjectContent.topics])
  const videoTopics = useMemo(() => subjectContent.topics.filter(t => t.contentType === 'video'), [subjectContent.topics])

  const groupedQuestions = useMemo(() => {
    const groups: Record<string, Record<string, any[]>> = {}
    subjectContent.questions.forEach(q => {
      const unit = q.unit_title || "General Curriculum"
      const topic = q.topic_title || "General"
      if (!groups[unit]) groups[unit] = {}
      if (!groups[unit][topic]) groups[unit][topic] = []
      groups[unit][topic].push(q)
    })
    return Object.entries(groups).map(([unit, topics]) => ({
      unit,
      topics: Object.entries(topics).map(([topic, questions]) => ({ topic, questions }))
    }))
  }, [subjectContent.questions])

  const fetchSubjectDetails = async () => {
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

  useEffect(() => {
    fetchSubjectDetails()
  }, [activeSubject, db])

  if (authLoading || profileLoading) return <div className="h-screen flex items-center justify-center"><Loader2 className="h-10 w-10 text-primary animate-spin" /></div>
  if (!user || (profile as any)?.role !== 'admin') return <div className="h-[80vh] flex flex-col items-center justify-center p-6 text-center"><Lock className="h-12 w-12 text-destructive mb-4" /><h1 className="text-2xl font-bold">Admin Restricted</h1><Link href="/"><Button className="mt-4">Return Home</Button></Link></div>

  async function handleDeleteSubject(s: any) {
    if (!db || !confirm(`DANGER: This will delete the entire \"${s.name}\" subject record. Contents (topics, mindmaps) must be cleared first. Proceed?`)) return
    
    const subjectRef = doc(db, 'subjects', s.id)
    try {
      await deleteDoc(subjectRef)
      toast({ title: "Subject Removed" })
      setActiveSubject(null)
    } catch (e: any) {
      toast({ variant: "destructive", title: "Delete Failed", description: e.message })
    }
  }

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
    if (!db || !confirm(`Delete \"${topic.title}\"?`)) return
    
    const sId = topic.subjectId
    const topicRef = doc(db, 'subjects', sId, 'topics', topic.id)
    
    try {
      await deleteDoc(topicRef)
      await updateDoc(doc(db, 'subjects', sId), { topicCount: increment(-1) })
      
      if (topic.storagePath) {
        await supabase.storage.from('notes-pdf').remove([topic.storagePath])
      }
      
      setSubjectContent(prev => ({ ...prev, topics: prev.topics.filter(t => t.id !== topic.id) }))
      toast({ title: "Content Removed" })
    } catch (e: any) {
      toast({ variant: "destructive", title: "Delete Failed", description: e.message })
    }
  }

  async function handleDeleteMindmap(mm: any) {
    if (!db || !confirm(`Delete mindmap \"${mm.title}\"?`)) return
    
    const subjectId = mm.subjectId
    const mmRef = doc(db, 'subjects', subjectId, 'mindmaps', mm.id)
    
    try {
      await deleteDoc(mmRef)
      await updateDoc(doc(db, 'subjects', subjectId), { mindmapCount: increment(-1) })
      
      if (mm.storagePath) {
        await supabase.storage.from('mindmaps').remove([mm.storagePath])
      }
      
      setSubjectContent(prev => ({ ...prev, mindmaps: prev.mindmaps.filter(m => m.id !== mm.id) }))
      toast({ title: "Mindmap Removed" })
    } catch (e: any) {
      toast({ variant: "destructive", title: "Delete Failed", description: e.message })
    }
  }

  async function handleDeleteQuestion(qId: number) {
    if (!confirm("Are you sure you want to delete this clinical case?")) return
    
    // Optimistic Update
    const originalQuestions = [...subjectContent.questions]
    setSubjectContent(prev => ({ ...prev, questions: prev.questions.filter(q => q.id !== qId) }))

    try {
      const { error } = await supabase.from('questions').delete().eq('id', qId)
      if (error) {
        setSubjectContent(prev => ({ ...prev, questions: originalQuestions }))
        throw error
      }
      toast({ title: "Question Deleted" })
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message })
    }
  }

  async function handleDeleteTopicGroup(topicName: string) {
    if (!confirm(`DANGER: Delete ALL clinical cases in topic \"${topicName}\"?`)) return
    
    setLoadingContent(true)
    try {
      const { error } = await supabase
        .from('questions')
        .delete()
        .eq('subject_id', activeSubject?.toLowerCase().replace(/\s+/g, '-'))
        .eq('topic_title', topicName)
      
      if (error) throw error
      toast({ title: "Topic Cleared" })
      fetchSubjectDetails()
    } catch (e: any) {
      toast({ variant: "destructive", title: "Batch Error", description: e.message })
    } finally {
      setLoadingContent(false)
    }
  }

  async function handleDeleteUnit(unitName: string) {
    if (!confirm(`DANGER: Delete ALL clinical cases in unit \"${unitName}\"?`)) return

    setLoadingContent(true)
    try {
      const { error } = await supabase
        .from('questions')
        .delete()
        .eq('subject_id', activeSubject?.toLowerCase().replace(/\s+/g, '-'))
        .eq('unit_title', unitName)

      if (error) throw error
      toast({ title: "Unit Cleared" })
      fetchSubjectDetails()
    } catch (e: any) {
      toast({ variant: "destructive", title: "Batch Error", description: e.message })
    } finally {
      setLoadingContent(false)
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
        tier: topicForm.tier,
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
        tier: videoForm.tier,
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
        tier: mindmapForm.tier,
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

  async function handleSaveQuestion() {
    if (!qbankForm.subjectId || !qbankForm.question_text || !qbankForm.option1 || !qbankForm.option2) {
      toast({ variant: "destructive", title: "Incomplete Form" })
      return
    }

    setUploading(true)
    try {
      const subjectId = qbankForm.subjectId.toLowerCase().replace(/\s+/g, '-')
      const payload = {
        subject_id: subjectId,
        unit_title: qbankForm.unit_title,
        topic_title: qbankForm.topic_title,
        question_text: qbankForm.question_text,
        option1: qbankForm.option1,
        option2: qbankForm.option2,
        option3: qbankForm.option3,
        option4: qbankForm.option4,
        correct_answer_index: parseInt(qbankForm.correct_answer_index),
        explanation: qbankForm.explanation
      }

      if (qbankForm.id) {
        const { error } = await supabase.from('questions').update(payload).eq('id', qbankForm.id)
        if (error) throw error
        toast({ title: "Question Updated" })
      } else {
        const { error } = await supabase.from('questions').insert([payload])
        if (error) throw error
        toast({ title: "Question Added" })
      }
      setIsEditingQuestion(false)
      fetchSubjectDetails()
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message })
    } finally {
      setUploading(false)
    }
  }

  async function handleImportCSV(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !activeSubject) return
    setUploading(true)
    const subjectId = activeSubject.toLowerCase().replace(/\s+/g, '-')

    Papa.parse(file, {
      header: false,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const rows = (results.data as string[][]).slice(1)
          const newQuestions = rows.map(parts => {
            if (!parts || parts.length < 8 || !parts[2]) return null
            return {
              subject_id: subjectId,
              unit_title: parts[0]?.trim(),
              topic_title: parts[1]?.trim(),
              question_text: parts[2]?.trim(),
              option1: parts[3]?.trim(),
              option2: parts[4]?.trim(),
              option3: parts[5]?.trim(),
              option4: parts[6]?.trim(),
              correct_answer_index: parseInt(parts[7]) || 0,
              explanation: parts[8]?.trim() || ""
            }
          }).filter(Boolean)

          if (newQuestions.length === 0) throw new Error("No valid question rows found in file.")

          const { error } = await supabase.from('questions').insert(newQuestions)
          if (error) throw error

          toast({ title: "Import Successful", description: `Added ${newQuestions.length} clinical cases to ${activeSubject}.` })
          setIsUploadingQBank(false)
          fetchSubjectDetails()
        } catch (e: any) {
          toast({ variant: "destructive", title: "Import Failed", description: e.message })
        } finally {
          setUploading(false)
        }
      },
      error: (err) => {
        toast({ variant: "destructive", title: "Parse Error", description: err.message })
        setUploading(false)
      }
    })
  }

  async function handleImportPYQ(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)

    Papa.parse(file, {
      header: false,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const rows = (results.data as string[][]).slice(1)
          const questions = rows.map(parts => {
            if (!parts || parts.length < 8 || !parts[3]) return null
            return {
              exam_type: parts[0]?.trim(),
              year: parseInt(parts[1]),
              subject: parts[2]?.trim() || null,
              question_text: parts[3]?.trim(),
              option1: parts[4]?.trim(),
              option2: parts[5]?.trim(),
              option3: parts[6]?.trim() || null,
              option4: parts[7]?.trim() || null,
              correct_answer_index: parseInt(parts[8]) || 0,
              explanation: parts[9]?.trim() || null
            }
          }).filter(Boolean)

          if (questions.length === 0) throw new Error("No valid question rows found in file.")

          const { error } = await supabase.from('pyq_questions').insert(questions)
          if (error) throw error

          toast({ title: "PYQ Imported", description: `${questions.length} questions added.` })
          setIsUploadingPYQ(false)
        } catch (e: any) {
          toast({ variant: "destructive", title: "Import Failed", description: e.message })
        } finally {
          setUploading(false)
        }
      },
      error: (err) => {
        toast({ variant: "destructive", title: "Parse Error", description: err.message })
        setUploading(false)
      }
    })
  }

  async function handleAddProduct() {
    if (!productForm.title || !productForm.price || !productForm.buy_link) {
      toast({ variant: "destructive", title: "Missing fields" }); return
    }
    setUploading(true)
    try {
      const { error } = await supabase.from('products').insert([{
        title: productForm.title,
        description: productForm.description,
        price: parseFloat(productForm.price),
        category: productForm.category,
        buy_link: productForm.buy_link,
        image_url: productForm.image_url || null,
        is_active: true
      }])
      if (error) throw error
      toast({ title: "Product Added" })
      setIsAddingProduct(false)
      setProductForm({ title: "", description: "", price: "", category: "Notes Pack", buy_link: "", image_url: "" })
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message })
    } finally { setUploading(false) }
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
          <Button onClick={() => setIsUploadingPYQ(true)} variant="outline" className="rounded-xl gap-2 glass">
            <Trophy className="h-4 w-4" /> Upload PYQ
          </Button>
          <Button onClick={() => setIsAddingProduct(true)} variant="outline" className="rounded-xl gap-2 glass">
            <ShoppingBag className="h-4 w-4" /> Add Product
          </Button>
          <Button 
            onClick={() => {
              setQbankForm({
                id: null,
                subjectId: activeSubject || "",
                unit_title: "",
                topic_title: "",
                question_text: "",
                option1: "",
                option2: "",
                option3: "",
                option4: "",
                correct_answer_index: "0",
                explanation: ""
              })
              setIsEditingQuestion(true)
            }} 
            variant="outline" 
            className="rounded-xl gap-2 glass"
          >
            <Database className="h-4 w-4" /> Add Case
          </Button>
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
              <div key={s.id} className={`group relative ${activeSubject === s.name ? 'bg-primary/10' : ''}`}>
                <button 
                  onClick={() => setActiveSubject(s.name)}
                  className={`w-full p-4 flex items-center justify-between text-left hover:bg-white/5 transition-colors ${activeSubject === s.name ? 'border-r-2 border-primary' : ''}`}>
                  <div className="flex-1 min-w-0 pr-8">
                    <p className="font-bold text-sm group-hover:text-primary transition-colors truncate">{s.name}</p>
                    <div className="flex gap-2 mt-1">
                      <span className="text-[9px] text-muted-foreground uppercase">{s.topicCount || 0} Content</span>
                      <span className="text-[9px] text-muted-foreground uppercase">{s.questionCount || 0} MCQs</span>
                    </div>
                  </div>
                  <ChevronRight className={`h-4 w-4 transition-transform ${activeSubject === s.name ? 'rotate-90 text-primary' : 'opacity-10 group-hover:opacity-100'}`} />
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteSubject(s);
                  }}
                  className="absolute right-12 top-1/2 -translate-y-1/2 h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
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
                                <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${t.tier === 'paid' ? 'bg-primary/10 text-primary' : 'bg-green-500/10 text-green-400'}`}>
                                  {t.tier === 'paid' ? '👑 Paid' : '🆓 Free'}
                                </span>
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
                                <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${t.tier === 'paid' ? 'bg-primary/10 text-primary' : 'bg-green-500/10 text-green-400'}`}>
                                  {t.tier === 'paid' ? '👑 Paid' : '🆓 Free'}
                                </span>
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
                      <div className="flex items-center justify-between px-2">
                        <h4 className="font-bold flex items-center gap-2 text-primary">
                          <Database className="h-4 w-4" /> Curriculum-Based QBank
                        </h4>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="rounded-lg gap-2 text-[10px] font-bold uppercase tracking-widest glass"
                            onClick={() => {
                              setQbankForm({
                                id: null,
                                subjectId: activeSubject || "",
                                unit_title: "",
                                topic_title: "",
                                question_text: "",
                                option1: "",
                                option2: "",
                                option3: "",
                                option4: "",
                                correct_answer_index: "0",
                                explanation: ""
                              })
                              setIsEditingQuestion(true)
                            }}>
                            <Plus className="h-3 w-3" /> Add Case
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="rounded-lg gap-2 text-[10px] font-bold uppercase tracking-widest glass"
                            onClick={() => setIsUploadingQBank(true)}>
                            <Upload className="h-3 w-3" /> Bulk Import
                          </Button>
                        </div>
                      </div>

                      <div className="p-6 glass rounded-2xl">
                         {groupedQuestions.length > 0 ? (
                            <Accordion type="multiple" className="space-y-3">
                               {groupedQuestions.map((group, gIdx) => (
                                 <AccordionItem key={gIdx} value={`unit-${gIdx}`} className="border-none bg-white/5 rounded-xl overflow-hidden">
                                    <div className="flex items-center justify-between px-4">
                                        <AccordionTrigger className="flex-1 hover:no-underline py-4">
                                            <div className="flex items-center gap-3">
                                                <Layers className="h-4 w-4 text-accent" />
                                                <div className="flex flex-col items-start">
                                                    <span className="font-bold text-sm tracking-tight">{group.unit}</span>
                                                    <span className="text-[10px] text-muted-foreground uppercase">{group.topics.reduce((acc, t) => acc + t.questions.length, 0)} Cases in {group.topics.length} Topics</span>
                                                </div>
                                            </div>
                                        </AccordionTrigger>
                                        <div className="flex gap-1 shrink-0">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 px-2 rounded-lg text-[9px] font-bold uppercase hover:bg-primary/10 hover:text-primary gap-1"
                                                onClick={() => {
                                                    setQbankForm({
                                                        id: null,
                                                        subjectId: activeSubject || "",
                                                        unit_title: group.unit,
                                                        topic_title: "",
                                                        question_text: "",
                                                        option1: "",
                                                        option2: "",
                                                        option3: "",
                                                        option4: "",
                                                        correct_answer_index: "0",
                                                        explanation: ""
                                                    });
                                                    setIsEditingQuestion(true);
                                                }}>
                                                <Plus className="h-2.5 w-2.5" /> Add Case
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 px-2 rounded-lg text-[9px] font-bold uppercase hover:bg-destructive/10 hover:text-destructive gap-1"
                                                onClick={() => handleDeleteUnit(group.unit)}>
                                                <Trash2 className="h-2.5 w-2.5" /> Clear Unit
                                            </Button>
                                        </div>
                                    </div>
                                   <AccordionContent className="pb-4 px-4 space-y-6">
                                      {group.topics.map((topicGroup, tIdx) => (
                                        <div key={tIdx} className="space-y-3 pl-4 border-l border-white/10">
                                          <div className="flex items-center justify-between mb-2 bg-black/20 p-2 rounded-lg">
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                              <ChevronRight className="h-3 w-3 text-accent" /> {topicGroup.topic} ({topicGroup.questions.length} cases)
                                            </p>
                                            <div className="flex gap-1">
                                              <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                className="h-6 px-2 rounded-lg text-[9px] font-bold uppercase hover:bg-primary/10 hover:text-primary gap-1"
                                                onClick={() => {
                                                  setQbankForm({
                                                    id: null,
                                                    subjectId: activeSubject || "",
                                                    unit_title: group.unit,
                                                    topic_title: topicGroup.topic,
                                                    question_text: "",
                                                    option1: "",
                                                    option2: "",
                                                    option3: "",
                                                    option4: "",
                                                    correct_answer_index: "0",
                                                    explanation: ""
                                                  })
                                                  setIsEditingQuestion(true)
                                                }}>
                                                <Plus className="h-2.5 w-2.5" /> Add
                                              </Button>
                                              <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                className="h-6 px-2 rounded-lg text-[9px] font-bold uppercase hover:bg-destructive/10 hover:text-destructive gap-1"
                                                onClick={() => handleDeleteTopicGroup(topicGroup.topic)}>
                                                <Trash2 className="h-2.5 w-2.5" /> Clear Topic
                                              </Button>
                                            </div>
                                          </div>
                                          <div className="grid gap-2">
                                            {topicGroup.questions.map((q: any, qIdx: number) => (
                                              <div key={qIdx} className="p-3 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between group/item hover:bg-white/5 transition-colors">
                                                 <div className="flex items-start gap-3 flex-1 min-w-0">
                                                   <div className="w-5 h-5 rounded-lg bg-white/5 flex items-center justify-center shrink-0 mt-0.5">
                                                     <span className="text-[9px] font-bold text-muted-foreground">{qIdx + 1}</span>
                                                   </div>
                                                   <span className="text-[11px] text-muted-foreground group-hover/item:text-white transition-colors line-clamp-2">
                                                     {q.question_text}
                                                   </span>
                                                 </div>
                                                 <div className="flex items-center gap-1">
                                                   <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="h-7 w-7 rounded-lg text-muted-foreground hover:text-accent transition-all"
                                                    onClick={() => {
                                                      setQbankForm({
                                                        id: q.id,
                                                        subjectId: q.subject_id,
                                                        unit_title: q.unit_title || "",
                                                        topic_title: q.topic_title || "",
                                                        question_text: q.question_text,
                                                        option1: q.option1,
                                                        option2: q.option2,
                                                        option3: q.option3,
                                                        option4: q.option4,
                                                        correct_answer_index: q.correct_answer_index.toString(),
                                                        explanation: q.explanation || ""
                                                      })
                                                      setIsEditingQuestion(true)
                                                    }}>
                                                     <Edit2 className="h-3 w-3" />
                                                   </Button>
                                                   <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="h-7 w-7 rounded-lg text-muted-foreground hover:text-destructive transition-all"
                                                    onClick={() => handleDeleteQuestion(q.id)}>
                                                     <Trash2 className="h-3 w-3" />
                                                   </Button>
                                                 </div>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      ))}
                                   </AccordionContent>
                                 </AccordionItem>
                               ))}
                            </Accordion>
                         ) : (
                           <div className="text-center py-24 glass rounded-3xl text-muted-foreground border-2 border-dashed border-white/5">
                             <Database className="h-12 w-12 mx-auto mb-4 opacity-10" />
                             <p className="text-sm">No curriculum-based QBank data found.</p>
                             <p className="text-[10px] mt-1">Use the buttons above to upload clinical cases.</p>
                           </div>
                         )}
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

      <Dialog open={isUploadingPYQ} onOpenChange={setIsUploadingPYQ}>
        <DialogContent aria-describedby={undefined} className="glass border-white/10 max-w-md">
          <DialogHeader>
            <DialogTitle>Upload PYQ Questions</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-2">
              <p className="text-[10px] font-bold uppercase text-primary">Required CSV Headers</p>
              <p className="text-[9px] text-muted-foreground font-mono leading-tight">
                exam_type, year, subject, question_text, option1, option2, option3, option4, correct_answer_index, explanation
              </p>
              <p className="text-[9px] text-muted-foreground">exam_type: NEET PG / INICET / USMLE Step 1 / USMLE Step 2 / FMGE</p>
            </div>
            <Input type="file" accept=".csv" className="glass border-white/10 cursor-pointer h-14 pt-4" onChange={handleImportPYQ} disabled={uploading} />
            {uploading && <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 animate-pulse"><Loader2 className="h-4 w-4 animate-spin text-primary" /><span className="text-[10px] font-bold uppercase">Importing...</span></div>}
          </div>
          <DialogFooter><Button variant="ghost" onClick={() => setIsUploadingPYQ(false)}>Close</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddingProduct} onOpenChange={setIsAddingProduct}>
        <DialogContent aria-describedby={undefined} className="glass border-white/10 max-w-lg">
          <DialogHeader><DialogTitle>Add New Product</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input placeholder="e.g., NEET PG Notes Pack 2024" className="glass border-white/10"
                value={productForm.title} onChange={e => setProductForm({...productForm, title: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea placeholder="Brief description of the product..." className="glass border-white/10"
                value={productForm.description} onChange={e => setProductForm({...productForm, description: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Price (₹)</Label>
                <Input type="number" placeholder="499" className="glass border-white/10"
                  value={productForm.price} onChange={e => setProductForm({...productForm, price: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={productForm.category} onValueChange={v => setProductForm({...productForm, category: v})}>
                  <SelectTrigger className="glass border-white/10"><SelectValue /></SelectTrigger>
                  <SelectContent className="glass border-white/10">
                    {["Notes Pack", "Question Bank", "Flashcards", "Video Pack", "Combo Pack"].map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Buy Link (WhatsApp/Instamojo URL)</Label>
              <Input placeholder="https://wa.me/91..." className="glass border-white/10"
                value={productForm.buy_link} onChange={e => setProductForm({...productForm, buy_link: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Product Image URL (optional)</Label>
              <Input placeholder="https://..." className="glass border-white/10"
                value={productForm.image_url} onChange={e => setProductForm({...productForm, image_url: e.target.value})} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsAddingProduct(false)}>Cancel</Button>
            <Button onClick={handleAddProduct} disabled={uploading}>
              {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} Add Product
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Question Dialog */}
      <Dialog open={isEditingQuestion} onOpenChange={setIsEditingQuestion}>
        <DialogContent className="glass border-white/10 max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{qbankForm.id ? 'Edit Clinical Case' : 'Add New Clinical Case'}</DialogTitle>
          </DialogHeader>
          <div className="grid md:grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label>Subject</Label>
              <Select onValueChange={(v) => setQbankForm({ ...qbankForm, subjectId: v })} value={qbankForm.subjectId}>
                <SelectTrigger className="glass border-white/10">
                  <SelectValue placeholder="Select Subject" />
                </SelectTrigger>
                <SelectContent className="glass border-white/10">
                  {subjects?.map((s: any) => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Unit Title</Label>
              <Input placeholder="e.g., Neonatology" className="glass border-white/10" value={qbankForm.unit_title} onChange={(e) => setQbankForm({ ...qbankForm, unit_title: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Topic Title</Label>
              <Input placeholder="e.g., Routine Newborn Care" className="glass border-white/10" value={qbankForm.topic_title} onChange={(e) => setQbankForm({ ...qbankForm, topic_title: e.target.value })} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Question Vignette</Label>
              <Textarea placeholder="Describe the clinical presentation..." className="glass border-white/10 min-h-[100px]" value={qbankForm.question_text} onChange={(e) => setQbankForm({ ...qbankForm, question_text: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Option A</Label>
              <Input className="glass border-white/10" value={qbankForm.option1} onChange={(e) => setQbankForm({ ...qbankForm, option1: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Option B</Label>
              <Input className="glass border-white/10" value={qbankForm.option2} onChange={(e) => setQbankForm({ ...qbankForm, option2: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Option C</Label>
              <Input className="glass border-white/10" value={qbankForm.option3} onChange={(e) => setQbankForm({ ...qbankForm, option3: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Option D</Label>
              <Input className="glass border-white/10" value={qbankForm.option4} onChange={(e) => setQbankForm({ ...qbankForm, option4: e.target.value })} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Correct Answer Index (0-3)</Label>
              <Select onValueChange={(v) => setQbankForm({ ...qbankForm, correct_answer_index: v })} value={qbankForm.correct_answer_index}>
                <SelectTrigger className="glass border-white/10">
                  <SelectValue placeholder="Select Index" />
                </SelectTrigger>
                <SelectContent className="glass border-white/10">
                  <SelectItem value="0">Option A</SelectItem>
                  <SelectItem value="1">Option B</SelectItem>
                  <SelectItem value="2">Option C</SelectItem>
                  <SelectItem value="3">Option D</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>High-Yield Explanation</Label>
              <Textarea placeholder="Explain the clinical logic..." className="glass border-white/10 min-h-[100px]" value={qbankForm.explanation} onChange={(e) => setQbankForm({ ...qbankForm, explanation: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsEditingQuestion(false)}>Cancel</Button>
            <Button onClick={handleSaveQuestion} disabled={uploading}>{uploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} Save Case</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Import Dialog */}
      <Dialog open={isUploadingQBank} onOpenChange={setIsUploadingQBank}>
        <DialogContent className="glass border-white/10 max-w-md">
          <DialogHeader>
            <DialogTitle>Bulk QBank Import</DialogTitle>
            <DialogDescription>Select a formatted CSV file to import cases for {activeSubject}.</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
             <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-2">
                <p className="text-[10px] font-bold uppercase text-primary">Required CSV Headers</p>
                <p className="text-[9px] text-muted-foreground font-mono leading-tight">
                  unit_title, topic_title, question_text, option1, option2, option3, option4, correct_answer_index, explanation
                </p>
             </div>
             <div className="space-y-2">
                <Label>Clinical Data File (.csv)</Label>
                <div className="relative group">
                   <Input 
                    type="file" 
                    accept=".csv" 
                    className="glass border-white/10 cursor-pointer h-14 pt-4 pr-10" 
                    onChange={handleImportCSV}
                    disabled={uploading}/>
                   <FileDown className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground opacity-20 group-hover:opacity-100 transition-opacity" />
                </div>
             </div>
             {uploading && (
               <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/5 animate-pulse">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Processing Clinical Pool...</span>
               </div>
             )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsUploadingQBank(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Topic Modal */}
      <Dialog open={isAddingTopic} onOpenChange={setIsAddingTopic}>
        <DialogContent className="glass border-white/10 max-w-lg">
          <DialogHeader>
            <DialogTitle>Publish New Study Note</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Subject</Label>
              <Select value={topicForm.subjectId} onValueChange={(v) => setTopicForm({ ...topicForm, subjectId: v })}>
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
            <div className="space-y-2">
              <Label>Access Tier</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setTopicForm({ ...topicForm, tier: "free" })}
                  className={`p-3 rounded-xl border text-sm font-bold transition-all ${topicForm.tier === 'free' ? 'bg-green-500/10 border-green-500/40 text-green-400' : 'bg-white/5 border-white/10 text-muted-foreground'}`}
                >
                  🆓 Free
                </button>
                <button
                  type="button"
                  onClick={() => setTopicForm({ ...topicForm, tier: "paid" })}
                  className={`p-3 rounded-xl border text-sm font-bold transition-all ${topicForm.tier === 'paid' ? 'bg-primary/10 border-primary/40 text-primary' : 'bg-white/5 border-white/10 text-muted-foreground'}`}
                >
                  👑 Paid
                </button>
              </div>
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
              <Select value={videoForm.subjectId} onValueChange={(v) => setVideoForm({ ...videoForm, subjectId: v })}>
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
            <div className="space-y-2">
              <Label>Access Tier</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setVideoForm({ ...videoForm, tier: "free" })}
                  className={`p-3 rounded-xl border text-sm font-bold transition-all ${videoForm.tier === 'free' ? 'bg-green-500/10 border-green-500/40 text-green-400' : 'bg-white/5 border-white/10 text-muted-foreground'}`}
                >
                  🆓 Free
                </button>
                <button
                  type="button"
                  onClick={() => setVideoForm({ ...videoForm, tier: "paid" })}
                  className={`p-3 rounded-xl border text-sm font-bold transition-all ${videoForm.tier === 'paid' ? 'bg-primary/10 border-primary/40 text-primary' : 'bg-white/5 border-white/10 text-muted-foreground'}`}
                >
                  👑 Paid
                </button>
              </div>
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
              <Select value={mindmapForm.subjectId} onValueChange={(v) => setMindmapForm({ ...mindmapForm, subjectId: v })}>
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
            <div className="space-y-2">
              <Label>Access Tier</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setMindmapForm({ ...mindmapForm, tier: "free" })}
                  className={`p-3 rounded-xl border text-sm font-bold transition-all ${mindmapForm.tier === 'free' ? 'bg-green-500/10 border-green-500/40 text-green-400' : 'bg-white/5 border-white/10 text-muted-foreground'}`}
                >
                  🆓 Free
                </button>
                <button
                  type="button"
                  onClick={() => setMindmapForm({ ...mindmapForm, tier: "paid" })}
                  className={`p-3 rounded-xl border text-sm font-bold transition-all ${mindmapForm.tier === 'paid' ? 'bg-primary/10 border-primary/40 text-primary' : 'bg-white/5 border-white/10 text-muted-foreground'}`}
                >
                  👑 Paid
                </button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsAddingMindmap(false)}>Cancel</Button>
            <Button onClick={handleAddMindmap} disabled={uploading}>{uploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} Upload Map</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}