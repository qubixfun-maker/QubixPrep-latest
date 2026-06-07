
"use client"

import { useMemo, useState } from "react"
import { useUser, useDoc, useFirestore, useCollection } from "@/firebase"
import { doc, collection, setDoc, deleteDoc, query, orderBy } from "firebase/firestore"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  BarChart3, 
  Upload, 
  Users, 
  FileText, 
  Plus, 
  Trash2, 
  Edit,
  ShieldAlert,
  Loader2,
  Lock,
  PlusCircle,
  MoreVertical,
  CheckCircle2,
  AlertCircle
} from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

export default function AdminDashboard() {
  const { user, loading: authLoading } = useUser()
  const db = useFirestore()
  const { toast } = useToast()
  
  // State for form management
  const [newSubject, setNewSubject] = useState({ name: "", description: "", iconName: "Brain" })
  const [isAddingSubject, setIsAddingSubject] = useState(false)

  // Fetch real data
  const profileRef = useMemo(() => (!db || !user) ? null : doc(db, 'users', user.uid), [db, user])
  const { data: profile, loading: profileLoading } = useDoc(profileRef)

  const usersQuery = useMemo(() => (!db) ? null : query(collection(db, 'users'), orderBy('createdAt', 'desc')), [db])
  const { data: systemUsers, loading: usersLoading } = useCollection(usersQuery)

  const subjectsQuery = useMemo(() => (!db) ? null : collection(db, 'subjects'), [db])
  const { data: subjects, loading: subjectsLoading } = useCollection(subjectsQuery)

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

  async function handleDeleteSubject(id: string) {
    if (!db) return
    try {
      await deleteDoc(doc(db, 'subjects', id))
      toast({ title: "Subject Deleted" })
    } catch (e) {
      toast({ variant: "destructive", title: "Error" })
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
          <p className="text-muted-foreground">Manage subjects, content, and user roles.</p>
        </div>
        <div className="flex gap-3">
          <Dialog>
            <DialogTrigger asChild>
              <Button className="rounded-xl bg-primary hover:bg-primary/90 gap-2 shadow-lg shadow-primary/20">
                <PlusCircle className="h-4 w-4" /> Add New Subject
              </Button>
            </DialogTrigger>
            <DialogContent className="glass border-white/10">
              <DialogHeader>
                <DialogTitle>Create Medical Subject</DialogTitle>
                <CardDescription>Add a new top-level category to the library.</CardDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Subject Name</Label>
                  <Input id="name" placeholder="e.g. Neuroanatomy" className="glass border-white/10" value={newSubject.name} onChange={e => setNewSubject({...newSubject, name: e.target.value})} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="desc">Description</Label>
                  <Input id="desc" placeholder="Brief overview of the subject..." className="glass border-white/10" value={newSubject.description} onChange={e => setNewSubject({...newSubject, description: e.target.value})} />
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
            <CardTitle className="text-sm font-medium uppercase tracking-widest text-muted-foreground">Active Subjects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold tracking-tight">{subjects?.length || 0}</span>
              <div className="h-10 w-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
                <BarChart3 className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass border-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium uppercase tracking-widest text-muted-foreground">System Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold tracking-tight">Active</span>
              <div className="h-10 w-10 rounded-xl bg-green-500/10 text-green-400 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="subjects" className="space-y-6">
        <TabsList className="glass p-1 h-12 rounded-xl">
          <TabsTrigger value="subjects" className="rounded-lg px-8">Library Content</TabsTrigger>
          <TabsTrigger value="users" className="rounded-lg px-8">User Directory</TabsTrigger>
        </TabsList>

        <TabsContent value="subjects">
          <Card className="glass border-none overflow-hidden">
            <CardHeader className="p-6 border-b border-white/5">
              <CardTitle className="text-xl font-bold">Managed Subjects</CardTitle>
              <CardDescription>Subjects currently visible in the student library.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-white/5">
                  <TableRow className="border-white/5 hover:bg-transparent">
                    <TableHead className="py-4">Subject Name</TableHead>
                    <TableHead>Topics</TableHead>
                    <TableHead>Units</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subjectsLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                      </TableCell>
                    </TableRow>
                  ) : subjects?.map((item: any) => (
                    <TableRow key={item.id} className="border-white/5 hover:bg-white/5 transition-colors">
                      <TableCell className="py-4 font-bold flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                          <FileText className="h-4 w-4" />
                        </div>
                        {item.name}
                      </TableCell>
                      <TableCell>{item.topicCount || 0}</TableCell>
                      <TableCell>{item.unitCount || 0}</TableCell>
                      <TableCell>{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'N/A'}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/10">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 hover:bg-destructive/10 text-destructive"
                            onClick={() => handleDeleteSubject(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {subjects?.length === 0 && !subjectsLoading && (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center text-muted-foreground italic">
                        No subjects added yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card className="glass border-none overflow-hidden">
            <CardHeader className="p-6 border-b border-white/5">
              <CardTitle className="text-xl font-bold">System Users</CardTitle>
              <CardDescription>View and manage permissions for all registered medical students.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-white/5">
                  <TableRow className="border-white/5 hover:bg-transparent">
                    <TableHead className="py-4">Student Name</TableHead>
                    <TableHead>Email / UID</TableHead>
                    <TableHead>College</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usersLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                      </TableCell>
                    </TableRow>
                  ) : systemUsers?.map((u: any) => (
                    <TableRow key={u.uid} className="border-white/5 hover:bg-white/5 transition-colors">
                      <TableCell className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold text-xs uppercase">
                            {u.displayName?.charAt(0)}
                          </div>
                          <span className="font-medium">{u.displayName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{u.email}</TableCell>
                      <TableCell className="text-sm">{u.collegeName || 'Not Provided'}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${u.role === 'admin' ? 'bg-primary/20 text-primary' : 'bg-white/5 text-muted-foreground'}`}>
                          {u.role}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/10">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
