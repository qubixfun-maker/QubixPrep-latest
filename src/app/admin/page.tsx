
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
  ArrowUpCircle
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
  const [uploading, setUploading] = useState(false)
  const [topicForm, setTopicForm] = useState({
    subjectId: "",
    unitName: "",
    title: "",
    importance: "Medium" as "Low" | "Medium" | "High" | "Essential",
    contentType: "pdf" as "pdf" | "video" | "image" | "csv",
    file: null as File | null
  })

  // Fetch real data
  const profileRef = useMemo(() => (!db || !user) ? null : doc(db, 'users', user.uid), [db, user])
  const { data: profile, loading: profileLoading } = useDoc(profileRef)

  const usersQuery = useMemo(() => (!db) ? null : query(collection(db, 'users'), orderBy('createdAt', 'desc')), [db])
  const { data: systemUsers, loading: usersLoading } = useCollection(usersQuery)

  const subjectsQuery = useMemo(() => (!db) ? null : collection(db, 'subjects'), [db])
  const { data: subjects, loading: subjectsLoading } = useCollection(subjectsQuery)

  const topicsQuery = useMemo(() => (!db) ? null : query(collection(db, 'all_topics'), orderBy('createdAt', 'desc')), [db])
  const { data: topics, loading: topicsLoading } = useCollection(topicsQuery)

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
      const subjectRef = doc(db, 'subjects', subjectId)
      const subjectSnap = await getDoc(subjectRef)
      
      // Auto-initialize subject if it doesn't exist
      if (!subjectSnap.exists()) {
        await setDoc(subjectRef, {
          id: subjectId,
          name: topicForm.subjectId,
          description: `Study materials for ${topicForm.subjectId}`,
          iconName: "Brain",
          unitCount: 0,
          topicCount: 0,
          createdAt: new Date().toISOString()
        })
      }

      const fileId = `${Date.now()}-${topicForm.file.name.replace(/\s+/g, '_')}`
      const storagePath = `${subjectId}/${fileId}`
      
      // Upload to Supabase Storage (using bucket notes-pdf)
      const { data: uploadData, error: uploadError } = await supabase
        .storage
        .from('notes-pdf')
        .upload(storagePath, topicForm.file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) throw uploadError

      // Get Public URL
      const { data: { publicUrl } } = supabase
        .storage
        .from('notes-pdf')
        .getPublicUrl(storagePath)

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

      // Store metadata in Firestore
      await setDoc(topicRef, topicData)
      await setDoc(globalTopicRef, topicData)

      // Update subject counts
      await updateDoc(subjectRef, {
        topicCount: increment(1)
      })

      toast({ title: "Topic Published", description: "The note has been uploaded to Supabase and linked successfully." })
      setTopicForm({ subjectId: "", unitName: "", title: "", importance: "Medium", contentType: "pdf", file: null })
      setIsAddingTopic(false)
    } catch (e: any) {
      toast({ variant: "destructive", title: "Upload Failed", description: e.message })
    } finally {
      setUploading(false)
    }
  }

  async function handleDeleteTopic(topic: any) {
    if (!db) return
    try {
      if (topic.storagePath) {
        // Delete from Supabase Storage (using bucket notes-pdf)
        await supabase.storage.from('notes-pdf').remove([topic.storagePath])
      }

      await deleteDoc(doc(db, 'subjects', topic.subjectId, 'topics', topic.id))
      await deleteDoc(doc(db, 'all_topics', topic.id))

      await updateDoc(doc(db, 'subjects', topic.subjectId), {
        topicCount: increment(-1)
      })

      toast({ title: "Topic Deleted" })
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message })
    }
  }

  if (authLoading || profileLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
      </div>
    )
  }

  const isAdmin = profile && (profile as any).role === 'admin'

  if (!user || !isAdmin) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center space-y-4 text-center p-6">
        <div className="w-16 h-16 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mb-4">
          <Lock className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-bold">Access Restricted</h1>
        <p className="text-muted-foreground max-w-md">
          You do not have the required permissions to access the Admin Control Center.
        </p>
        <Link href="/">
          <Button variant="outline" className="rounded-xl glass border-white/10 mt-4">
            Return to Dashboard
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-12 space-y-8 animate-in fade-in duration-700">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <ShieldAlert className="h-8 w-8 text-primary" /> Qubix Control Center
          </h1>
          <p className="text-muted-foreground">Manage subjects, content library (Supabase), and student roles.</p>
        </div>
        <div className="flex gap-3">
          <Dialog open={isAddingTopic} onOpenChange={setIsAddingTopic}>
            <DialogTrigger asChild>
              <Button className="rounded-xl bg-accent text-background hover:bg-accent/90 gap-2 shadow-lg shadow-accent/20 h-12 px-6">
                <CloudUpload className="h-5 w-5" /> Upload to Supabase
              </Button>
            </DialogTrigger>
            <DialogContent className="glass border-white/10 max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                  <ArrowUpCircle className="h-6 w-6 text-accent" /> Publish Medical Topic
                </DialogTitle>
                <CardDescription>Upload a study resource to Supabase (notes-pdf) and link it to a subject.</CardDescription>
              </DialogHeader>
              <div className="grid md:grid-cols-2 gap-6 py-6">
                <div className="grid gap-2">
                  <Label>Target Subject</Label>
                  <Select onValueChange={(v) => setTopicForm({...topicForm, subjectId: v})}>
                    <SelectTrigger className="glass border-white/10 h-11">
                      <SelectValue placeholder="Select Subject" />
                    </SelectTrigger>
                    <SelectContent className="glass border-white/10">
                      {MBBS_SUBJECTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Unit Name</Label>
                  <Input placeholder="e.g. Unit 3: Histology" className="glass border-white/10 h-11" value={topicForm.unitName} onChange={e => setTopicForm({...topicForm, unitName: e.target.value})} />
                </div>
                <div className="grid gap-2 md:col-span-2">
                  <Label>Topic Title</Label>
                  <Input placeholder="e.g. Connective Tissue Types" className="glass border-white/10 h-11" value={topicForm.title} onChange={e => setTopicForm({...topicForm, title: e.target.value})} />
                </div>
                <div className="grid gap-2">
                  <Label>Content Type</Label>
                  <Select onValueChange={(v: any) => setTopicForm({...topicForm, contentType: v})} defaultValue="pdf">
                    <SelectTrigger className="glass border-white/10 h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="glass border-white/10">
                      <SelectItem value="pdf">PDF Document</SelectItem>
                      <SelectItem value="image">Medical Image</SelectItem>
                      <SelectItem value="video">Video Lecture</SelectItem>
                      <SelectItem value="csv">Q-Bank (CSV)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Importance Level</Label>
                  <Select onValueChange={(v: any) => setTopicForm({...topicForm, importance: v})} defaultValue="Medium">
                    <SelectTrigger className="glass border-white/10 h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="glass border-white/10">
                      <SelectItem value="Low">Low</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="High">High</SelectItem>
                      <SelectItem value="Essential">Essential (High-Yield)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2 md:col-span-2">
                  <Label>Resource File</Label>
                  <div className="border-2 border-dashed border-white/10 rounded-xl p-10 text-center hover:bg-white/5 transition-colors cursor-pointer relative group">
                    <input 
                      type="file" 
                      className="absolute inset-0 opacity-0 cursor-pointer" 
                      onChange={e => setTopicForm({...topicForm, file: e.target.files?.[0] || null})}
                    />
                    <div className="flex flex-col items-center gap-3">
                      <FileDown className={`h-10 w-10 transition-colors ${topicForm.file ? 'text-accent' : 'text-muted-foreground'}`} />
                      <p className="text-sm font-bold">{topicForm.file ? topicForm.file.name : "Click or drag to select file"}</p>
                      <p className="text-xs text-muted-foreground">Supported: PDF, JPG, PNG, MP4, CSV</p>
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter className="pt-4 border-t border-white/5">
                <Button 
                  onClick={handleAddTopic} 
                  disabled={uploading} 
                  className="w-full rounded-xl bg-primary hover:bg-primary/90 h-14 text-lg font-bold shadow-xl shadow-primary/20"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      Uploading to Supabase...
                    </>
                  ) : (
                    <>
                      <CloudUpload className="h-5 w-5 mr-2" />
                      Start Upload & Publish
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="rounded-xl glass border-white/10 gap-2 h-12">
                <PlusCircle className="h-4 w-4" /> Custom Subject
              </Button>
            </DialogTrigger>
            <DialogContent className="glass border-white/10">
              <DialogHeader>
                <DialogTitle>Create Custom Subject</DialogTitle>
                <CardDescription>Add a specialized category to the library.</CardDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Subject Name</Label>
                  <Input placeholder="e.g. Neuroanatomy" className="glass border-white/10" value={newSubject.name} onChange={e => setNewSubject({...newSubject, name: e.target.value})} />
                </div>
                <div className="grid gap-2">
                  <Label>Description</Label>
                  <Input placeholder="Brief overview of the subject..." className="glass border-white/10" value={newSubject.description} onChange={e => setNewSubject({...newSubject, description: e.target.value})} />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleAddSubject} disabled={isAddingSubject} className="w-full rounded-xl">
                  {isAddingSubject ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm Subject"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="glass border-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium uppercase tracking-widest text-muted-foreground">Registered Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold tracking-tight">{systemUsers?.length || 0}</span>
              <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                <Users className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass border-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium uppercase tracking-widest text-muted-foreground">Library Resources</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold tracking-tight">{topics?.length || 0}</span>
              <div className="h-10 w-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
                <BookOpen className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass border-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium uppercase tracking-widest text-muted-foreground">Active Subjects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold tracking-tight">{subjects?.length || 0}</span>
              <div className="h-10 w-10 rounded-xl bg-green-500/10 text-green-400 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="topics" className="space-y-6">
        <TabsList className="glass p-1 h-12 rounded-xl">
          <TabsTrigger value="topics" className="rounded-lg px-8">All Topics</TabsTrigger>
          <TabsTrigger value="subjects" className="rounded-lg px-8">Subject List</TabsTrigger>
        </TabsList>

        <TabsContent value="topics">
          <Card className="glass border-none overflow-hidden">
            <CardHeader className="p-6 border-b border-white/5 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold">Content Repository</CardTitle>
                <CardDescription>View and manage all uploaded study materials on Supabase.</CardDescription>
              </div>
              <Button onClick={() => setIsAddingTopic(true)} className="rounded-xl bg-accent text-background hover:bg-accent/90 gap-2">
                <CloudUpload className="h-4 w-4" /> New Supabase Upload
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-white/5">
                  <TableRow className="border-white/5">
                    <TableHead>Topic Title</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Importance</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topicsLoading ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-10"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></TableCell></TableRow>
                  ) : topics?.map((t: any) => (
                    <TableRow key={t.id} className="border-white/5 hover:bg-white/5 transition-colors">
                      <TableCell className="font-bold">
                        <div className="flex flex-col">
                          <span>{t.title}</span>
                          <span className="text-[10px] text-muted-foreground uppercase">{t.unitName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm capitalize">{t.subjectId}</TableCell>
                      <TableCell>
                        <span className="px-2 py-0.5 rounded bg-white/5 text-[10px] uppercase font-bold text-muted-foreground border border-white/5">
                          {t.contentType}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${t.importance === 'Essential' || t.importance === 'High' ? 'bg-red-500/10 text-red-400' : 'bg-blue-500/10 text-blue-400'}`}>
                          {t.importance}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                            <a href={t.contentUrl} target="_blank" rel="noopener noreferrer"><FileText className="h-4 w-4" /></a>
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => handleDeleteTopic(t)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!topicsLoading && topics?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-20 text-muted-foreground">
                        No topics uploaded yet. Start by uploading a note to Supabase.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subjects">
          <Card className="glass border-none overflow-hidden">
            <CardHeader className="p-6 border-b border-white/5">
              <CardTitle className="text-xl font-bold">Managed Subjects</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-white/5">
                  <TableRow className="border-white/5 hover:bg-transparent">
                    <TableHead className="py-4">Subject Name</TableHead>
                    <TableHead>Topics</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subjectsLoading ? (
                    <TableRow><TableCell colSpan={3} className="text-center py-10"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></TableCell></TableRow>
                  ) : subjects?.map((item: any) => (
                    <TableRow key={item.id} className="border-white/5 hover:bg-white/5">
                      <TableCell className="py-4 font-bold flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                          <FileText className="h-4 w-4" />
                        </div>
                        {item.name}
                      </TableCell>
                      <TableCell>{item.topicCount || 0}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-destructive/10 text-destructive" onClick={() => deleteDoc(doc(db, 'subjects', item.id))}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!subjectsLoading && subjects?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-20 text-muted-foreground">
                        No subjects created yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
