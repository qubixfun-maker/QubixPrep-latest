"use client"

import { useState, useEffect, useMemo } from "react"
import { supabase } from "@/lib/supabase"
import { useUser, useCollection, useFirestore } from "@/firebase"
import { collection } from "firebase/firestore"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { 
  Loader2, 
  FileUp, 
  PlayCircle, 
  Trash2, 
  ShieldCheck, 
  Database, 
  AlertCircle,
  BookOpen,
  ChevronDown
} from "lucide-react"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

export function MyPdfQbanks() {
  const { user } = useUser()
  const db = useFirestore()
  const { toast } = useToast()
  
  const [qbanks, setQbanks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [selectedSubject, setSelectedSubject] = useState<string>("General")

  const subjectsQuery = useMemo(() => (!db ? null : collection(db, 'subjects')), [db])
  const { data: subjects } = useCollection(subjectsQuery)

  useEffect(() => {
    if (user) fetchQBanks()
  }, [user])

  async function fetchQBanks() {
    try {
      const { data, error } = await supabase
        .from('pdf_qbanks')
        .select('*')
        .eq('user_id', user?.uid)
        .order('created_at', { ascending: false });
      
      if (error) throw error
      setQbanks(data || [])
    } catch (e: any) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !user) return

    setUploading(true)
    setUploadProgress(10)
    
    const formData = new FormData()
    formData.append('file', file)
    formData.append('userId', user.uid)
    formData.append('subject', selectedSubject)

    try {
      const response = await fetch('/api/qbank/upload', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to process PDF library.')
      }
      
      toast({ 
        title: "Extraction Successful", 
        description: `Successfully analyzed and extracted ${result.count} clinical cases.` 
      })
      fetchQBanks()
    } catch (e: any) {
      toast({ 
        variant: "destructive", 
        title: "AI Extraction Error", 
        description: e.message 
      })
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this QBank and all extracted questions?")) return
    try {
      await supabase.from('pdf_questions').delete().eq('qbank_id', id)
      await supabase.from('pdf_qbanks').delete().eq('id', id)
      fetchQBanks()
      toast({ title: "Library Removed" })
    } catch (e: any) {
      toast({ variant: "destructive", title: "Deletion Failed" })
    }
  }

  if (loading) return <div className="h-64 flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col lg:flex-row gap-6">
        <Card className="flex-1 glass border-none">
          <CardHeader>
            <div className="flex items-center justify-between mb-2">
               <CardTitle>AI Extraction Vault</CardTitle>
               <div className="flex items-center gap-2">
                 <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">Assign to Subject:</span>
                 <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                    <SelectTrigger className="h-8 w-[160px] glass text-xs font-bold border-white/10">
                      <SelectValue placeholder="Select Subject" />
                    </SelectTrigger>
                    <SelectContent className="glass border-white/10">
                      <SelectItem value="General">General/Manual</SelectItem>
                      {subjects?.map((s: any) => (
                        <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                 </Select>
               </div>
            </div>
            <CardDescription>Upload MCQ PDFs. Our Vision AI will extract cases and clinical logic automatically into your private library.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="border-2 border-dashed border-white/10 rounded-2xl p-10 flex flex-col items-center justify-center text-center space-y-4 hover:border-primary/50 transition-colors cursor-pointer relative group">
              <input 
                type="file" 
                accept=".pdf" 
                className="absolute inset-0 opacity-0 cursor-pointer" 
                onChange={handleFileUpload}
                disabled={uploading}
              />
              <div className="p-5 rounded-full bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                <FileUp className="h-10 w-10" />
              </div>
              <div className="space-y-1">
                <p className="font-bold text-lg">Drop PDF or Click to Upload</p>
                <p className="text-xs text-muted-foreground">Standardized Clinical Format (Marrow, Pre-PLAB, UWorld)</p>
              </div>
            </div>

            {uploading && (
              <div className="space-y-3 p-4 rounded-xl bg-primary/5 border border-primary/20">
                <div className="flex justify-between text-[11px] font-bold uppercase tracking-widest">
                  <span className="flex items-center gap-2 text-primary animate-pulse">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Analyzing Vision Patterns...
                  </span>
                  <span>Server-Side OCR Active</span>
                </div>
                <Progress value={uploadProgress} className="h-1.5" />
                <p className="text-[10px] text-muted-foreground italic text-center">Do not close this tab. Processing typically takes 1-2 minutes per batch.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:w-96 glass border-none bg-accent/5">
          <CardHeader>
            <CardTitle className="text-xs uppercase tracking-[0.2em] text-accent flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" /> Extraction Protocol
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 text-[11px] leading-relaxed text-muted-foreground">
            <div className="space-y-3">
               <div className="flex gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 shrink-0" />
                  <p><span className="text-white font-bold">OCR Bypass:</span> Vision-based extraction allows processing of encrypted PDFs where normal text selection is blocked.</p>
               </div>
               <div className="flex gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 shrink-0" />
                  <p><span className="text-white font-bold">Smart Merge:</span> Automatically links question vignettes with their solutions across different pages.</p>
               </div>
               <div className="flex gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 shrink-0" />
                  <p><span className="text-white font-bold">Data Privacy:</span> Extracted questions are visible only to you and never added to the global curriculum.</p>
               </div>
            </div>
            <div className="pt-4 mt-4 border-t border-white/5 flex items-center justify-between text-white font-bold">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-accent" /> {qbanks.length} Libraries Ready
              </div>
              <span className="text-[9px] uppercase tracking-widest text-muted-foreground">Sync Secure</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6">
        <div className="flex items-center justify-between px-2">
           <h3 className="text-xl font-bold flex items-center gap-3">
             <Database className="h-6 w-6 text-primary" /> Your Extracted Libraries
           </h3>
        </div>

        {qbanks.length === 0 ? (
          <div className="text-center py-24 glass rounded-[2rem] text-muted-foreground border-2 border-dashed border-white/5">
            <AlertCircle className="h-16 w-16 mx-auto mb-4 opacity-10" />
            <p className="text-lg font-medium">No custom libraries found.</p>
            <p className="text-sm mt-2">Upload your first study PDF to begin AI extraction.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {qbanks.map((q) => (
              <Card key={q.id} className="glass border-none hover:bg-white/5 transition-all group relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-primary/20 group-hover:bg-primary transition-colors" />
                <CardContent className="p-6 flex items-center justify-between">
                  <div className="flex items-center gap-5">
                    <div className="p-3.5 rounded-2xl bg-primary/10 text-primary shadow-inner">
                      <BookOpen className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-base line-clamp-1 mb-1">{q.file_name}</h4>
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="px-2 py-0.5 rounded bg-accent/10 text-accent text-[9px] font-bold uppercase tracking-widest">{q.subject}</span>
                        <span className="text-[10px] text-muted-foreground font-medium">{q.total_questions} Clinical Cases</span>
                        <span className="text-[10px] text-muted-foreground opacity-30">•</span>
                        <span className="text-[10px] text-muted-foreground">{new Date(q.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link href={`/qbank/pdf-quiz/${q.id}`}>
                      <Button variant="secondary" size="sm" className="rounded-xl h-10 px-5 gap-2 font-bold shadow-lg">
                        <PlayCircle className="h-4 w-4" /> Start
                      </Button>
                    </Link>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(q.id)} className="h-10 w-10 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
