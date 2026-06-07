
"use client"

import { useMemo, useState } from "react"
import { useUser, useDoc, useFirestore, useCollection } from "@/firebase"
import { doc, collection, setDoc, deleteDoc, query, orderBy, increment, updateDoc, getDoc } from "firebase/firestore"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Users, 
  FileText, 
  Trash2, 
  ShieldAlert,
  Loader2,
  Lock,
  PlusCircle,
  CheckCircle2,
  BookOpen,
  CloudUpload,
  FileDown,
  ArrowUpCircle,
  Network
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
  
  // State for Subject management
  const [newSubject, setNewSubject] = useState({ name: "", description: "", iconName: "Brain" })
  const [isAddingSubject, setIsAddingSubject] = useState(false)

  // State for Topic management
  const [isAddingTopic, setIsAddingTopic] = useState(false)
  const [isAddingMindmap, setIsAddingMindmap] = useState(false)
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

  // Fetch real data
  const profileRef = useMemo(() => (!db || !user) ? null : doc(db, 'users', user.uid), [db, user])
  const { data: profile, loading: profileLoading } = useDoc(profileRef)

  const subjectsQuery = useMemo(() => (!db) ? null : collection(db, 'subjects'), [db])
  const { data: subjects, loading: subjectsLoading } = useCollection(subjectsQuery)

  const topicsQuery = useMemo(() => (!db) ? null : query(collection(db, 'all_topics'), orderBy('createdAt', 'desc')), [db])
  const { data: topics, loading: topicsLoading } = useCollection(topicsQuery)

  const mindmapsQuery = useMemo(() => (!db) ? null : query(collection(db, 'all_mindmaps'), orderBy('createdAt', 'desc')), [db])
  const { data: mindmaps, loading: mindmapsLoading } = useCollection(mindmapsQuery)

  async function handleAddSubject() {
    if (!db || !newSubject.name) return
    setIsAddingSubject(true)
    const subjectId = newSubject.name.toLowerCase().replace(/\s+/g, '-')
    const subjectRef = doc(db, 'subjects', subjectId)
    
    try {
      await setDoc(subjectRef, {
        ...newSubject,
        id: subjectId,
        unitCount: 0,
        topicCount: 0,
        mindmapCount: 0,
        createdAt: new Date().toISOString()
      }, { merge: true })
      
      toast({ title: "Subject Added", description: `${newSubject.name} has been added to the library.` })
      setNewSubject({ name: "", description: "", iconName: "Brain" })
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Failed to add subject." })
    } finally {
      setIsAddingSubject(false)
    }
  }

  async function handleAddTopic() {
    if (!db || !topicForm.subjectId || !topicForm.title || !topicForm.file) {
      toast({ variant: "destructive", title: "Missing Fields", description: "Please fill all fields and select a file." })
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
      const globalTopicRef = doc(db, 'all_topics', topicId)

      const topicData = {
        id: topicId,
        subjectId: subjectId,
        unitName: topicForm.unitName,
        title: topicForm.title,
        contentUrl: publicUrl,
        storagePath: storagePath,
        contentType: topicForm.contentType,
        importance: topicForm.importance,
        status: 'published',
        createdAt: new Date().toISOString()
      }

      await setDoc(topicRef, topicData)
      await setDoc(globalTopicRef, topicData)
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
      const globalMmRef = doc(db, 'all_mindmaps', mindmapId)

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
      await setDoc(globalMmRef, mmData)
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

  async function handleDeleteTopic(topic: any) {
    if (!db) return
    try {
      await supabase.storage.from('notes-pdf').remove([topic.storagePath])
      await deleteDoc(doc(db, 'subjects', topic.subjectId, 'topics', topic.id))
      await deleteDoc(doc(db, 'all_topics', topic.id))
      await updateDoc(doc(db, 'subjects', topic.subjectId), { topicCount: increment(-1) })
      toast({ title: "Topic Deleted" })
    } catch (e: any) { toast({ variant: "destructive", title: "Error", description: e.message }) }
  }

  async function handleDeleteMindmap(mm: any) {
    if (!db) return
    try {
      await supabase.storage.from('mindmaps').remove([mm.storagePath])
      await deleteDoc(doc(db, 'subjects', mm.subjectId, 'mindmaps', mm.id))
      await deleteDoc(doc(db, 'all_mindmaps', mm.id))
      await updateDoc(doc(db, 'subjects', mm.subjectId), { mindmapCount: increment(-1) })
      toast({ title: "Mindmap Deleted" })
    } catch (e: any) { toast({ variant: "destructive", title: "Error", description: e.message }) }
  }

  if (authLoading || profileLoading) return <div className="h-screen flex items-center justify-center"><Loader2 className="h-10 w-10 text-primary animate-spin" /></div>
  if (!user || (profile as any)?.role !== 'admin') return <div className="h-[80vh] flex flex-col items-center justify-center p-6 text-center"><Lock className="h-12 w-12 text-destructive mb-4" /><h1 className="text-2xl font-bold">Admin Required</h1><Link href="/"><Button className="mt-4">Back to Dashboard</Button></Link></div>

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-12 space-y-8 animate-in fade-in duration-700">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <ShieldAlert className="h-8 w-8 text-primary" /> Content Orchestrator
          </h1>
          <p className="text-muted-foreground">Manage your MBBS study materials across Notes and Mindmaps.</p>
        </div>
        <div className="flex gap-3">
          <Dialog open={isAddingTopic} onOpenChange={setIsAddingTopic}>
            <DialogTrigger asChild><Button className="rounded-xl h-12 px-6">Upload Note</Button></DialogTrigger>
            <DialogContent className="glass max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Publish Medical Note</DialogTitle></DialogHeader>
              <div className="grid md:grid-cols-2 gap-6 py-6">
                <div className="grid gap-2"><Label>Subject</Label><Select onValueChange={v => setTopicForm({...topicForm, subjectId: v})}><SelectTrigger><SelectValue placeholder="Select Subject" /></SelectTrigger><SelectContent>{MBBS_SUBJECTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
                <div className="grid gap-2"><Label>Unit</Label><Input value={topicForm.unitName} onChange={e => setTopicForm({...topicForm, unitName: e.target.value})} /></div>
                <div className="grid gap-2 md:col-span-2"><Label>Title</Label><Input value={topicForm.title} onChange={e => setTopicForm({...topicForm, title: e.target.value})} /></div>
                <div className="grid gap-2 md:col-span-2"><Label>File</Label><Input type="file" onChange={e => setTopicForm({...topicForm, file: e.target.files?.[0] || null})} /></div>
              </div>
              <DialogFooter><Button onClick={handleAddTopic} disabled={uploading} className="w-full h-12">{uploading ? "Uploading..." : "Publish Note"}</Button></DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isAddingMindmap} onOpenChange={setIsAddingMindmap}>
            <DialogTrigger asChild><Button variant="secondary" className="rounded-xl h-12 px-6">Upload Mindmap</Button></DialogTrigger>
            <DialogContent className="glass max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Publish Mindmap Image</DialogTitle></DialogHeader>
              <div className="grid md:grid-cols-2 gap-6 py-6">
                <div className="grid gap-2"><Label>Subject</Label><Select onValueChange={v => setMindmapForm({...mindmapForm, subjectId: v})}><SelectTrigger><SelectValue placeholder="Select Subject" /></SelectTrigger><SelectContent>{MBBS_SUBJECTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
                <div className="grid gap-2"><Label>Unit</Label><Input value={mindmapForm.unitName} onChange={e => setMindmapForm({...mindmapForm, unitName: e.target.value})} /></div>
                <div className="grid gap-2 md:col-span-2"><Label>Title</Label><Input value={mindmapForm.title} onChange={e => setMindmapForm({...mindmapForm, title: e.target.value})} /></div>
                <div className="grid gap-2 md:col-span-2"><Label>Image (JPG/PNG)</Label><Input type="file" accept="image/*" onChange={e => setMindmapForm({...mindmapForm, file: e.target.files?.[0] || null})} /></div>
              </div>
              <DialogFooter><Button onClick={handleAddMindmap} disabled={uploading} className="w-full h-12">{uploading ? "Uploading..." : "Publish Mindmap"}</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="topics" className="space-y-6">
        <TabsList className="glass p-1 h-12 rounded-xl">
          <TabsTrigger value="topics" className="rounded-lg px-8">Notes Repository</TabsTrigger>
          <TabsTrigger value="mindmaps" className="rounded-lg px-8">Mindmap Gallery</TabsTrigger>
        </TabsList>

        <TabsContent value="topics">
          <Card className="glass border-none overflow-hidden">
            <CardHeader><CardTitle>Global Notes</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow><TableHead>Title</TableHead><TableHead>Subject</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                <TableBody>
                  {topicsLoading ? <TableRow><TableCell colSpan={3} className="text-center"><Loader2 className="animate-spin mx-auto" /></TableCell></TableRow> : topics?.map((t: any) => (
                    <TableRow key={t.id}><TableCell>{t.title}</TableCell><TableCell>{t.subjectId}</TableCell><TableCell className="text-right"><Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteTopic(t)}><Trash2 className="h-4 w-4" /></Button></TableCell></TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mindmaps">
          <Card className="glass border-none overflow-hidden">
            <CardHeader><CardTitle>Subject Mindmaps</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow><TableHead>Mindmap Title</TableHead><TableHead>Subject</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                <TableBody>
                  {mindmapsLoading ? <TableRow><TableCell colSpan={3} className="text-center"><Loader2 className="animate-spin mx-auto" /></TableCell></TableRow> : mindmaps?.map((m: any) => (
                    <TableRow key={m.id}><TableCell>{m.title}</TableCell><TableCell>{m.subjectId}</TableCell><TableCell className="text-right"><Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteMindmap(m)}><Trash2 className="h-4 w-4" /></Button></TableCell></TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
