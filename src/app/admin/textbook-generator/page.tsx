"use client"

import { useState, useMemo } from "react"
import { useUser, useDoc, useFirestore, useCollection, useStorage } from "@/firebase"
import { doc, collection, query, orderBy } from "firebase/firestore"
import { ref as storageRef, uploadBytes } from "firebase/storage"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Lock, ArrowLeft, BookMarked, UploadCloud, CheckCircle2, FileText } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

export default function TextbookGeneratorPage() {
  const { user, loading: authLoading } = useUser()
  const db = useFirestore()
  const storage = useStorage()
  const { toast } = useToast()

  const profileRef = useMemo(() => (!db || !user) ? null : doc(db, 'users', user.uid), [db, user])
  const { data: profile, loading: profileLoading } = useDoc(profileRef)

  const textbooksQuery = useMemo(() => (!db) ? null : query(collection(db, 'textbooks'), orderBy('createdAt', 'desc')), [db])
  const { data: textbooks, loading: textbooksLoading } = useCollection(textbooksQuery)

  const [uploadTitle, setUploadTitle] = useState("")
  const [uploadAuthor, setUploadAuthor] = useState("")
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadStage, setUploadStage] = useState("")
  const [lastResult, setLastResult] = useState<{ chapters: any[] } | null>(null)

  if (authLoading || profileLoading) return <div className="h-screen flex items-center justify-center"><Loader2 className="h-10 w-10 text-primary animate-spin" /></div>
  if (!user || (profile as any)?.role !== 'admin') {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center p-6 text-center">
        <Lock className="h-12 w-12 text-destructive mb-4" />
        <h1 className="text-2xl font-bold">Admin Restricted</h1>
        <Link href="/"><Button className="mt-4">Return Home</Button></Link>
      </div>
    )
  }

  async function handleUploadAndIngest() {
    if (!storage || !uploadFile || !uploadTitle.trim() || !user) return
    setIsUploading(true)
    setLastResult(null)
    try {
      setUploadStage("Uploading PDF to storage...")
      const safeId = uploadTitle.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
      const storagePath = `textbooks-source/${safeId}-${Date.now()}.pdf`
      const fileRef = storageRef(storage, storagePath)
      await uploadBytes(fileRef, uploadFile)

      setUploadStage("Reading chapters and extracting text (this can take a few minutes for large books)...")
      const idToken = await user.getIdToken()
      const res = await fetch("/api/textbooks/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken, storagePath, title: uploadTitle.trim(), author: uploadAuthor.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Ingestion failed")

      setLastResult({ chapters: data.chapters })
      toast({ title: "Textbook Ready", description: `Detected ${data.chapters.length} chapters across ${data.totalPages} pages.` })
      setUploadTitle("")
      setUploadAuthor("")
      setUploadFile(null)
    } catch (e: any) {
      toast({ variant: "destructive", title: "Upload Failed", description: e.message })
    } finally {
      setIsUploading(false)
      setUploadStage("")
    }
  }

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-12 space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-3">
        <Link href="/admin"><Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button></Link>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BookMarked className="h-6 w-6 text-primary" /> Generate from Textbook
          </h1>
          <p className="text-sm text-muted-foreground">Upload a textbook once, then generate Long Answers content from it repeatedly.</p>
        </div>
      </div>

      <Card className="glass border-none">
        <CardHeader><CardTitle className="text-base">Upload a New Textbook</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">
            The PDF needs real bookmarks/chapters (e.g. "3. Cell Injury and Cellular Adaptations") for chapters to be auto-detected. Most published textbook PDFs have this built in.
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input placeholder="e.g., Textbook of Pathology" value={uploadTitle} onChange={(e) => setUploadTitle(e.target.value)} className="glass border-white/10" />
            </div>
            <div className="space-y-2">
              <Label>Author</Label>
              <Input placeholder="e.g., Harsh Mohan" value={uploadAuthor} onChange={(e) => setUploadAuthor(e.target.value)} className="glass border-white/10" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>PDF File</Label>
            <Input type="file" accept="application/pdf" onChange={(e) => setUploadFile(e.target.files?.[0] || null)} className="glass border-white/10 cursor-pointer h-14 pt-4" />
          </div>
          <Button onClick={handleUploadAndIngest} disabled={isUploading || !uploadFile || !uploadTitle.trim()} className="w-full h-12 gap-2">
            {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
            {isUploading ? (uploadStage || "Processing...") : "Upload & Process"}
          </Button>

          {lastResult && (
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-2 animate-in slide-in-from-bottom-2">
              <p className="text-xs font-bold text-primary flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5" /> Detected Chapters</p>
              <div className="max-h-48 overflow-y-auto space-y-1">
                {lastResult.chapters.map((c: any) => (
                  <div key={c.chapterId} className="text-xs text-muted-foreground flex justify-between">
                    <span>{c.title}</span>
                    <span>pages {c.startPage}-{c.endPage}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="glass border-none">
        <CardHeader><CardTitle className="text-base">Textbook Library</CardTitle></CardHeader>
        <CardContent>
          {textbooksLoading ? (
            <div className="py-8 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : textbooks && textbooks.length > 0 ? (
            <div className="space-y-2">
              {textbooks.map((tb: any) => (
                <div key={tb.id} className="p-4 rounded-xl glass border border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0"><FileText className="h-4 w-4" /></div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold truncate">{tb.title}</p>
                      <p className="text-xs text-muted-foreground">{tb.author ? tb.author + " - " : ""}{tb.chapterCount} chapters - {tb.totalPages} pages</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full shrink-0 ${tb.status === "ready" ? "bg-emerald-500/15 text-emerald-400" : "bg-amber-500/15 text-amber-400"}`}>
                    {tb.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">No textbooks uploaded yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
