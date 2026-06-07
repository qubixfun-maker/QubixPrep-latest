
"use client"

import { useMemo } from "react"
import { useUser, useDoc, useFirestore } from "@/firebase"
import { doc } from "firebase/firestore"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
  Lock
} from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import Link from "next/link"

export default function AdminDashboard() {
  const { user, loading: authLoading } = useUser()
  const db = useFirestore()
  
  const profileRef = useMemo(() => {
    if (!db || !user) return null
    return doc(db, 'users', user.uid)
  }, [db, user])

  const { data: profile, loading: profileLoading } = useDoc(profileRef)

  const content = [
    { name: "Cardiac Pathology.pdf", type: "PDF", size: "4.2 MB", uploads: 1240, status: "Published" },
    { name: "Neuro Pharmacology.mp4", type: "Video", size: "128 MB", uploads: 850, status: "Published" },
    { name: "Gross Anatomy - Upper Limb.pdf", type: "PDF", size: "15.8 MB", uploads: 2100, status: "Draft" },
  ];

  if (authLoading || profileLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
      </div>
    )
  }

  if (!user || (profile && (profile as any).role !== 'admin')) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center space-y-4 text-center p-6">
        <div className="w-16 h-16 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mb-4">
          <Lock className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-bold">Access Restricted</h1>
        <p className="text-muted-foreground max-w-md">
          You do not have the required permissions to access the Admin Control Center. 
          Please contact the system administrator if you believe this is an error.
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
            <ShieldAlert className="h-8 w-8 text-primary" /> Admin Control Center
          </h1>
          <p className="text-muted-foreground">Manage subjects, content, and user analytics.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="glass border-white/10 rounded-xl gap-2">
            <Edit className="h-4 w-4" /> Manage Subjects
          </Button>
          <Button className="rounded-xl bg-primary hover:bg-primary/90 gap-2 shadow-lg shadow-primary/20">
            <Upload className="h-4 w-4" /> Upload Content
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="glass border-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium uppercase tracking-widest text-muted-foreground">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold tracking-tight">12,482</span>
              <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                <Users className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass border-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium uppercase tracking-widest text-muted-foreground">Storage Used</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold tracking-tight">84.2 GB</span>
              <div className="h-10 w-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
                <BarChart3 className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass border-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium uppercase tracking-widest text-muted-foreground">Platform Uptime</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold tracking-tight">99.9%</span>
              <div className="h-10 w-10 rounded-xl bg-green-500/10 text-green-400 flex items-center justify-center">
                <Plus className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="glass border-none overflow-hidden">
        <CardHeader className="p-6 border-b border-white/5 flex flex-row items-center justify-between">
          <CardTitle className="text-xl font-bold">Recent Uploads</CardTitle>
          <Button variant="ghost" size="sm" className="text-muted-foreground">View All</Button>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-white/5">
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="py-4">Content Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Views/Access</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {content.map((item) => (
                <TableRow key={item.name} className="border-white/5 hover:bg-white/5 transition-colors">
                  <TableCell className="py-4 font-medium flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    {item.name}
                  </TableCell>
                  <TableCell>{item.type}</TableCell>
                  <TableCell>{item.size}</TableCell>
                  <TableCell>{item.uploads.toLocaleString()}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${item.status === 'Published' ? 'bg-green-500/10 text-green-400' : 'bg-orange-500/10 text-orange-400'}`}>
                      {item.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/10">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-destructive/10 text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
