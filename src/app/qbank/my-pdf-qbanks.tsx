"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useUser } from "@/firebase"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Loader2, FileUp, PlayCircle, Trash2, ShieldCheck, Database, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

export function MyPdfQbanks() {
  const { user } = useUser()
  const { toast } = useToast()
  const [qbanks, setQbanks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

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
    formData.append('subject', 'Manual Extraction')

    try {
      const response = await fetch('/api/qbank/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) throw new Error('Failed to process PDF')
      
      const result = await response.json()
      toast({ title: "Extraction Successful", description: `Found ${result.count} clinical cases.` })
      fetchQBanks()
    } catch (e: any) {
      toast({ variant: "destructive", title: "Extraction Failed", description: e.message })
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
      toast({ title: "QBank Removed" })
    } catch (e: any) {
      toast({ variant: "destructive", title: "Deletion Failed" })
    }
  }

  if (loading) return <div className="h-64 flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row gap-6">
        <Card className="flex-1 glass border-none">
          <CardHeader>
            <CardTitle>Upload Marrow-style PDF</CardTitle>
            <CardDescription>Upload question bank PDFs. AI will extract MCQs and solutions automatically.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed border-white/10 rounded-2xl p-8 flex flex-col items-center justify-center text-center space-y-4 hover:border-primary/50 transition-colors cursor-pointer relative group">
              <input 
                type="file" 
                accept=".pdf" 
                className="absolute inset-0 opacity-0 cursor-pointer" 
                onChange={handleFileUpload}
                disabled={uploading}
              />
              <div className="p-4 rounded-full bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                <FileUp className="h-8 w-8" />
              </div>
              <div className="space-y-1">
                <p className="font-bold">Click or drag PDF to begin extraction</p>
                <p className="text-xs text-muted-foreground">Supports Question 1: and Solution format</p>
              </div>
            </div>

            {uploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold uppercase">
                  <span className="flex items-center gap-2"><Loader2 className="h-3 w-3 animate-spin" /> AI Extraction in Progress...</span>
                  <span>Processing Pages</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="md:w-80 glass border-none bg-accent/5">
          <CardHeader>
            <CardTitle className="text-sm uppercase tracking-widest text-accent flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" /> Secure Extraction
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-xs leading-relaxed text-muted-foreground">
            <p>• Questions extracted exactly as written.</p>
            <p>• Automated solution matching via OCR logic.</p>
            <p>• Vision-based processing for high accuracy.</p>
            <div className="pt-4 flex items-center gap-2 text-white font-bold">
              <Database className="h-4 w-4" /> {qbanks.length} Banks Active
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4">
        <h3 className="text-lg font-bold flex items-center gap-2 px-2">
          <Database className="h-5 w-5 text-primary" /> Extracted Libraries
        </h3>
        {qbanks.length === 0 ? (
          <div className="text-center py-20 glass rounded-3xl text-muted-foreground border-2 border-dashed border-white/5">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-10" />
            <p>No custom QBanks yet. Upload your first PDF to get started.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {qbanks.map((q) => (
              <Card key={q.id} className="glass border-none hover:bg-white/5 transition-all group">
                <CardContent className="p-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-primary/10 text-primary">
                      <Database className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="font-bold line-clamp-1">{q.file_name}</h4>
                      <div className="flex items-center gap-3 text-[10px] text-muted-foreground uppercase font-bold tracking-widest mt-1">
                        <span className="text-accent">{q.total_questions} Questions</span>
                        <span>•</span>
                        <span>{new Date(q.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link href={`/qbank/pdf-quiz/${q.id}`}>
                      <Button variant="secondary" size="sm" className="rounded-lg h-9 gap-2">
                        <PlayCircle className="h-4 w-4" /> Start
                      </Button>
                    </Link>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(q.id)} className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10">
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