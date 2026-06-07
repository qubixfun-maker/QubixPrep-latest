
"use client"

import { useMemo, useState } from "react"
import { useUser, useDoc, useFirestore, useCollection } from "@/firebase"
import { doc, collection, setDoc, deleteDoc, query, orderBy, increment, updateDoc, writeBatch } from "firebase/firestore"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  ShieldAlert,
  Loader2,
  Lock,
  Trash2,
  FileText,
  Network,
  Database,
  Upload,
  Plus
} from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

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
  
  const [isAddingTopic, setIsAddingTopic] = useState(false)
  const [isAddingMindmap, setIsAddingMindmap] = useState(false)
  const [isUploadingQBank, setIsUploadingQBank] = useState(false)
  const [uploading, setUploading] = useState(false)
  
  const [topicForm, setTopicForm] = useState({
    subjectId: "",
    unitName: "",
    title: "",
    importance: "Medium" as "Low" | "Medium" | "High" | "Essential",
    contentType: "pdf" as "pdf" | "video" | "image" | "csv",
    file: null as File | null
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

  // Fetch data
  const profileRef = useMemo(() => (!db || !user) ? null : doc(db, 'users', user.uid), [db, user])
  const { data: profile, loading: profileLoading } = useDoc(profileRef)

  const topicsQuery = useMemo(() => (!db) ? null : query(collection(db, 'all_topics'), orderBy('createdAt', 'desc')), [db])
  const { data: topics, loading: topicsLoading } = useCollection(topicsQuery)

  if (authLoading || profileLoading) return <div className="h-screen flex items-center justify-center"><Loader2 className="h-10 w-10 text-primary animate-spin" /></div>
  if (!user || (profile as any)?.role !== 'admin') return <div className="h-[80vh] flex flex-col items-center justify-center p-6 text-center"><Lock className="h-12 w-12 text-destructive mb-4" /><h1 className="text-2xl font-bold">Admin Required</h1><Link href="/"><Button className="mt-4">Back to Dashboard</Button></Link></div>

  async function handleAddTopic() {
    if (!db || !topicForm.subjectId || !topicForm.title || !topicForm.file) {
      toast({ variant: "destructive", title: "Missing Fields" })
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
      const topicRef = doc(db, 'subjects', subjectId, 'topics', topicId)

      const topicData = {
        id: topicId,
        subjectId: subjectId,
        unitName: topicForm.unitName,
        title: topicForm.title,
        contentUrl: publicUrl,
        storagePath: storagePath,
        contentType: topicForm.contentType,
        importance: topicForm.importance,
        createdAt: new Date().toISOString()
      }

      await setDoc(topicRef, topicData)
      await updateDoc(doc(db, 'subjects', subjectId), { topicCount: increment(1) })

      toast({ title: "Topic Published" })
      setTopicForm({ subjectId: "", unitName: "", title: "", importance: "Medium", contentType: "pdf", file: null })
      setIsAddingTopic(false)
    } catch (e: any) {
      toast({ variant: "destructive", title: "Upload Failed", description: e.message })
    } finally {
      setUploading(false)
    }
  }

  async function handleAddMindmap() {
    if (!db || !mindmapForm.subjectId || !mindmapForm.title || !mindmapForm.file) {
      toast({ variant: "destructive", title: "Missing Fields" })
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

      const mindmapId = fileId.replace(/\.[^/.]+$/, "").replace(/\s+/g, '-')
      const mmRef = doc(db, 'subjects', subjectId, 'mindmaps', mindmapId)

      const mmData = {
        id: mindmapId,
        subjectId: subjectId,
        unitName: mindmapForm.unitName,
        title: mindmapForm.title,
        imageUrl: publicUrl,
        storagePath: storagePath,
        createdAt: new Date().toISOString()
      }

      await setDoc(mmRef, mmData)
      await updateDoc(doc(db, 'subjects', subjectId), { mindmapCount: increment(1) })

      toast({ title: "Mindmap Published" })
      setMindmapForm({ subjectId: "", unitName: "", title: "", file: null })
      setIsAddingMindmap(false)
    } catch (e: any) {
      toast({ variant: "destructive", title: "Upload Failed", description: e.message })
    } finally {
      setUploading(false)
    }
  }

  async function handleUploadQBank() {
    if (!db || !qbankForm.subjectId || !qbankForm.file) {
      toast({ variant: "destructive", title: "Missing Fields" })
      return
    }

    setUploading(true)
    try {
      // 1. Upload CSV to Supabase Storage (qbank bucket)
      const subjectId = qbankForm.subjectId.toLowerCase().replace(/\s+/g, '-')
      const fileId = `${Date.now()}-${qbankForm.file.name.replace(/\s+/g, '_')}`
      const storagePath = `${subjectId}/${fileId}`
      
      const { error: uploadError } = await supabase.storage.from('qbank').upload(storagePath, qbankForm.file)
      if (uploadError) throw uploadError

      // 2. Parse and Import into Firestore
      const text = await qbankForm.file.text()
      const rows = text.split('\n').slice(1) // Skip header
      const batch = writeBatch(db)
      
      let count = 0
      for (const row of rows) {
        if (!row.trim()) continue
        
        // Support Tab-Separated (TSV) or Comma-Separated (CSV)
        const separator = row.includes('\t') ? '\t' : ','
        const columns = row.split(separator).map(s => s.trim().replace(/^"|"$/g, ''))
        
        if (columns.length < 9) continue // Skip invalid rows
        
        const unitName = columns[1]
        const topicName = columns[2]
        const questionText = columns[3]
        const options = [columns[4], columns[5], columns[6], columns[7]]
        const correctIdx = parseInt(columns[8])
        const correctAnswer = options[correctIdx] || options[0]
        const explanation = columns[9] || ""
        
        const qId = `${Date.now()}-${count}`
        const qRef = doc(db, 'subjects', subjectId, 'questions', qId)
        
        batch.set(qRef, {
          id: qId,
          subjectId,
          unitName,
          topicName,
          questionText,
          options,
          correctAnswer,
          explanation,
          createdAt: new Date().toISOString()
        })
        count++
      }
      
      await batch.commit()
      await updateDoc(doc(db, 'subjects', subjectId), { questionCount: increment(count) })
      
      toast({ title: "QBank Processed", description: `Uploaded original file and imported ${count} questions.` })
      setIsUploadingQBank(false)
      setQbankForm({ subjectId: "", file: null })
    } catch (e: any) {
      toast({ variant: "destructive", title: "Import Failed", description: e.message })
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-12 space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <ShieldAlert className="h-8 w-8 text-primary" /> Admin Command
          </h1>
          <p className="text-muted-foreground">Orchestrate clinical content and assessments.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Dialog open={isAddingTopic} onOpenChange={setIsAddingTopic}>
            <DialogTrigger asChild><Button className="rounded-xl">Upload Note</Button></DialogTrigger>
            <DialogContent className="glass">
              <DialogHeader><DialogTitle>Publish Medical Note</DialogTitle></DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2"><Label>Subject</Label><Select onValueChange={v => setTopicForm({...topicForm, subjectId: v})}><SelectTrigger><SelectValue placeholder="Select Subject" /></SelectTrigger><SelectContent>{MBBS_SUBJECTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
                <div className="grid gap-2"><Label>Unit Name</Label><Input value={topicForm.unitName} onChange={e => setTopicForm({...topicForm, unitName: e.target.value})} /></div>
                <div className="grid gap-2"><Label>Title</Label><Input value={topicForm.title} onChange={e => setTopicForm({...topicForm, title: e.target.value})} /></div>
                <div className="grid gap-2"><Label>File (PDF)</Label><Input type="file" accept=".pdf" onChange={e => setTopicForm({...topicForm, file: e.target.files?.[0] || null})} /></div>
              </div>
              <DialogFooter><Button onClick={handleAddTopic} disabled={uploading}>{uploading ? "Uploading..." : "Publish"}</Button></DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isAddingMindmap} onOpenChange={setIsAddingMindmap}>
            <DialogTrigger asChild><Button variant="secondary" className="rounded-xl">Upload Mindmap</Button></DialogTrigger>
            <DialogContent className="glass">
              <DialogHeader><DialogTitle>Publish Mindmap Image</DialogTitle></DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2"><Label>Subject</Label><Select onValueChange={v => setMindmapForm({...mindmapForm, subjectId: v})}><SelectTrigger><SelectValue placeholder="Select Subject" /></SelectTrigger><SelectContent>{MBBS_SUBJECTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
                <div className="grid gap-2"><Label>Unit Name</Label><Input value={mindmapForm.unitName} onChange={e => setMindmapForm({...mindmapForm, unitName: e.target.value})} /></div>
                <div className="grid gap-2"><Label>Title</Label><Input value={mindmapForm.title} onChange={e => setMindmapForm({...mindmapForm, title: e.target.value})} /></div>
                <div className="grid gap-2"><Label>Image File</Label><Input type="file" accept="image/*" onChange={e => setMindmapForm({...mindmapForm, file: e.target.files?.[0] || null})} /></div>
              </div>
              <DialogFooter><Button onClick={handleAddMindmap} disabled={uploading}>{uploading ? "Uploading..." : "Publish"}</Button></DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isUploadingQBank} onOpenChange={setIsUploadingQBank}>
            <DialogTrigger asChild><Button variant="outline" className="rounded-xl">Upload QBank (CSV/TSV)</Button></DialogTrigger>
            <DialogContent className="glass">
              <DialogHeader><DialogTitle>Import Medical Questions</DialogTitle></DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2"><Label>Subject</Label><Select onValueChange={v => setQbankForm({...qbankForm, subjectId: v})}><SelectTrigger><SelectValue placeholder="Select Subject" /></SelectTrigger><SelectContent>{MBBS_SUBJECTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
                <div className="grid gap-2">
                  <Label>CSV/TSV File</Label>
                  <Input type="file" accept=".csv,.tsv,.txt" onChange={e => setQbankForm({...qbankForm, file: e.target.files?.[0] || null})} />
                  <p className="text-[10px] text-muted-foreground leading-relaxed mt-2">
                    Format: Unit#, Unit Title, Topic, Question, Opt1, Opt2, Opt3, Opt4, CorrectIndex (0-3), Explanation
                  </p>
                </div>
              </div>
              <DialogFooter><Button onClick={handleUploadQBank} disabled={uploading}>{uploading ? "Processing Rows..." : "Import File"}</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="glass border-none">
          <CardHeader className="flex flex-row items-center gap-4">
            <div className="p-2 rounded-lg bg-primary/10 text-primary"><FileText className="h-5 w-5" /></div>
            <CardTitle className="text-lg">Notes</CardTitle>
          </CardHeader>
          <CardContent><p className="text-2xl font-bold">{(topics?.length || 0)}</p></CardContent>
        </Card>
        <Card className="glass border-none">
          <CardHeader className="flex flex-row items-center gap-4">
            <div className="p-2 rounded-lg bg-accent/10 text-accent"><Database className="h-5 w-5" /></div>
            <CardTitle className="text-lg">MCQs</CardTitle>
          </CardHeader>
          <CardContent><p className="text-2xl font-bold">Cloud</p></CardContent>
        </Card>
        <Card className="glass border-none">
          <CardHeader className="flex flex-row items-center gap-4">
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-500"><Network className="h-5 w-5" /></div>
            <CardTitle className="text-lg">Mindmaps</CardTitle>
          </CardHeader>
          <CardContent><p className="text-2xl font-bold">Live</p></CardContent>
        </Card>
      </div>
    </div>
  )
}
