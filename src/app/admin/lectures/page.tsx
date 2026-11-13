"use client"

import { useMemo, useRef, useState } from "react"
import Link from "next/link"
import { collection, doc, setDoc, updateDoc, deleteDoc, getDocs, deleteField, query, where } from "firebase/firestore"
import { ref as storageRef, uploadBytesResumable, deleteObject } from "firebase/storage"
import { useUser, useDoc, useCollection, useFirestore, useStorage } from "@/firebase"
import { compareSubjects } from "@/lib/subject-year"
import { Lecture, fmtDuration, sortLectures } from "@/lib/lectures"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Loader2, Lock, Upload, Trash2, FileText, Video, CheckCircle2, Link2 } from "lucide-react"

function probeDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file)
    const v = document.createElement("video")
    v.preload = "metadata"
    v.onloadedmetadata = () => { const d = Math.round(v.duration || 0); URL.revokeObjectURL(url); resolve(d) }
    v.onerror = () => { URL.revokeObjectURL(url); resolve(0) }
    v.src = url
  })
}

function uploadWithProgress(storage: any, path: string, file: File, onProgress: (pct: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const task = uploadBytesResumable(storageRef(storage, path), file, { contentType: file.type || undefined })
    task.on("state_changed", (s) => onProgress(Math.round((s.bytesTransferred / s.totalBytes) * 100)), reject, () => resolve())
  })
}

function NoteLinker({ lecture, db }: { lecture: Lecture; db: any }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [chapters, setChapters] = useState<{ docKey: string; title: string; topics: string[] }[]>([])
  const [docKey, setDocKey] = useState("")
  const [topicIndex, setTopicIndex] = useState("")
  const load = async () => {
    setOpen(true); setLoading(true)
    try {
      const snap = await getDocs(collection(db, "subjects", lecture.subjectId, "textNotes"))
      const list = snap.docs.map((d) => { const x: any = d.data(); return { docKey: d.id, title: x.chapterTitle || d.id, topics: (x.topics || []).map((t: any) => t.name as string) } })
      list.sort((a, b) => a.title.localeCompare(b.title, undefined, { numeric: true }))
      setChapters(list)
    } finally { setLoading(false) }
  }
  const ch = chapters.find((c) => c.docKey === docKey)
  const save = async () => {
    if (!ch || topicIndex === "") return
    const i = Number(topicIndex)
    await updateDoc(doc(db, "lectures", lecture.id), { noteRef: { docKey, topicIndex: i, label: ch.title + " › " + ch.topics[i] } })
    setOpen(false)
  }
  const unlink = async () => { await updateDoc(doc(db, "lectures", lecture.id), { noteRef: deleteField() }); setOpen(false) }
  return (
    <div className="w-full text-xs">
      {!open ? (
        <div className="flex items-center gap-2">
          <button onClick={load} className="inline-flex items-center gap-1 rounded-lg border px-2 py-1.5 hover:bg-muted"><Link2 className="h-3 w-3" /> {lecture.noteRef ? "Change linked note" : "Link a topic note"}</button>
          {lecture.noteRef && <><span className="text-muted-foreground truncate">Linked: {lecture.noteRef.label}</span><button onClick={unlink} className="text-destructive underline">Unlink</button></>}
        </div>
      ) : loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
        <div className="flex flex-wrap items-center gap-2">
          <select value={docKey} onChange={(e) => { setDocKey(e.target.value); setTopicIndex("") }} className="h-8 max-w-[16rem] rounded-md border bg-background px-2">
            <option value="">Chapter…</option>{chapters.map((c) => <option key={c.docKey} value={c.docKey}>{c.title}</option>)}
          </select>
          <select value={topicIndex} onChange={(e) => setTopicIndex(e.target.value)} disabled={!ch} className="h-8 max-w-[16rem] rounded-md border bg-background px-2">
            <option value="">Topic…</option>{(ch?.topics || []).map((t, i) => <option key={i} value={i}>{t}</option>)}
          </select>
          <Button size="sm" onClick={save} disabled={!ch || topicIndex === ""} className="h-8 rounded-lg text-xs">Save link</Button>
          <button onClick={() => setOpen(false)} className="underline">Cancel</button>
        </div>
      )}
    </div>
  )
}

export default function AdminLecturesPage() {
  const { user, loading: authLoading } = useUser()
  const db = useFirestore()
  const storage = useStorage()
  const { toast } = useToast()
  const profileRef = useMemo(() => (!db || !user ? null : doc(db, "users", user.uid)), [db, user])
  const { data: profile, loading: profileLoading } = useDoc(profileRef)
  const isAdmin = (profile as any)?.role === "admin"

  const subjectsQ = useMemo(() => (!db ? null : collection(db, "subjects")), [db])
  const { data: rawSubjects } = useCollection(subjectsQ)
  const subjects = useMemo(() => [...((rawSubjects || []) as any[])].sort((a, b) => compareSubjects(a.name, b.name)), [rawSubjects])

  const [subjectId, setSubjectId] = useState("")
  const [title, setTitle] = useState("")
  const [order, setOrder] = useState("")
  const [free, setFree] = useState(false)
  const [video, setVideo] = useState<File | null>(null)
  const [notes, setNotes] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [vPct, setVPct] = useState(0)
  const [nPct, setNPct] = useState(0)
  const videoInput = useRef<HTMLInputElement>(null)
  const notesInput = useRef<HTMLInputElement>(null)

  const lecturesQ = useMemo(() => (!db || !subjectId ? null : query(collection(db, "lectures"), where("subjectId", "==", subjectId))), [db, subjectId])
  const { data: rawLectures } = useCollection(lecturesQ)
  const lectures = useMemo(() => sortLectures((rawLectures || []) as any[]) as Lecture[], [rawLectures])

  if (authLoading || profileLoading) return <div className="flex justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  if (!user || !isAdmin) {
    return (
      <div className="max-w-md mx-auto py-24 text-center space-y-4">
        <Lock className="h-10 w-10 mx-auto text-muted-foreground" />
        <p className="text-muted-foreground">Admin access required.</p>
        <Link href="/"><Button variant="outline">Back home</Button></Link>
      </div>
    )
  }

  const subjectName = subjects.find((s: any) => s.id === subjectId)?.name || ""
  const canUpload = !!subjectId && title.trim() && video && !busy

  const upload = async () => {
    if (!db || !storage || !video) return
    setBusy(true); setVPct(0); setNPct(0)
    try {
      const id = doc(collection(db, "lectures")).id
      const durationSec = await probeDuration(video)
      const videoExt = (video.name.split(".").pop() || "mp4").toLowerCase()
      const videoPath = `lectures/${id}/video.${videoExt}`
      await uploadWithProgress(storage, videoPath, video, setVPct)
      let notesPath: string | undefined
      if (notes) {
        notesPath = `lectures/${id}/notes.pdf`
        await uploadWithProgress(storage, notesPath, notes, setNPct)
      }
      const data: any = {
        subjectId, subjectName, title: title.trim(), order: Number(order) || 0, durationSec, videoPath,
        free, status: "published", sizeBytes: video.size, createdAt: Date.now(),
      }
      if (notesPath) data.notesPath = notesPath
      await setDoc(doc(db, "lectures", id), data)
      toast({ title: "Lecture uploaded", description: title.trim() })
      setTitle(""); setOrder(""); setFree(false); setVideo(null); setNotes(null)
      if (videoInput.current) videoInput.current.value = ""
      if (notesInput.current) notesInput.current.value = ""
    } catch (e: any) {
      toast({ title: "Upload failed", description: e?.message || "Check Storage rules and your connection.", variant: "destructive" })
    } finally { setBusy(false) }
  }

  const patch = async (l: Lecture, p: Partial<Lecture>) => { if (db) await updateDoc(doc(db, "lectures", l.id), p as any) }
  const remove = async (l: Lecture) => {
    if (!db || !storage) return
    if (!confirm(`Delete "${l.title}" and its files?`)) return
    for (const p of [l.videoPath, l.notesPath]) { if (p) { try { await deleteObject(storageRef(storage, p)) } catch {} } }
    await deleteDoc(doc(db, "lectures", l.id))
  }
  const replaceNotes = async (l: Lecture, file: File | undefined) => {
    if (!db || !storage || !file) return
    try {
      const path = `lectures/${l.id}/notes.pdf`
      await uploadWithProgress(storage, path, file, () => {})
      await updateDoc(doc(db, "lectures", l.id), { notesPath: path })
      toast({ title: "Notes updated", description: l.title })
    } catch (e: any) { toast({ title: "Notes upload failed", description: e?.message, variant: "destructive" }) }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      <div className="flex items-center gap-3">
        <Link href="/admin" aria-label="Back" className="grid h-10 w-10 place-items-center rounded-full border bg-card"><ArrowLeft className="h-5 w-5" /></Link>
        <div>
          <h1 className="text-2xl font-bold">Video Lectures</h1>
          <p className="text-sm text-muted-foreground">Upload a lecture video with optional notes PDF. Students can show the notes beside the video.</p>
        </div>
      </div>

      <div className="rounded-2xl border bg-card p-5 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Subject</Label>
            <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} className="h-10 w-full rounded-md border bg-background px-3 text-sm">
              <option value="">Choose subject…</option>
              {subjects.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label>Topic number (order)</Label>
            <Input value={order} onChange={(e) => setOrder(e.target.value.replace(/\D/g, ""))} placeholder="e.g. 4" inputMode="numeric" />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Lecture title</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Transport Across the Cell Membrane" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="flex items-center gap-2"><Video className="h-4 w-4" /> Video file (mp4)</Label>
            <input ref={videoInput} type="file" accept="video/mp4,video/*" onChange={(e) => setVideo(e.target.files?.[0] || null)} className="block w-full text-sm" />
            {video && <p className="text-xs text-muted-foreground">{(video.size / 1048576).toFixed(1)} MB</p>}
          </div>
          <div className="space-y-1.5">
            <Label className="flex items-center gap-2"><FileText className="h-4 w-4" /> Notes PDF (optional)</Label>
            <input ref={notesInput} type="file" accept="application/pdf" onChange={(e) => setNotes(e.target.files?.[0] || null)} className="block w-full text-sm" />
            {notes && <p className="text-xs text-muted-foreground">{(notes.size / 1048576).toFixed(1)} MB</p>}
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={free} onChange={(e) => setFree(e.target.checked)} /> Free preview (watchable without a subscription)</label>

        {busy && (
          <div className="space-y-2 text-xs">
            <div>Video {vPct}%<div className="h-2 rounded bg-muted overflow-hidden"><div className="h-full bg-primary" style={{ width: `${vPct}%` }} /></div></div>
            {notes && <div>Notes {nPct}%<div className="h-2 rounded bg-muted overflow-hidden"><div className="h-full bg-primary" style={{ width: `${nPct}%` }} /></div></div>}
            <p className="text-muted-foreground">Keep this tab open until it finishes.</p>
          </div>
        )}
        <Button onClick={upload} disabled={!canUpload} className="h-11 rounded-xl gap-2 font-bold">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Upload lecture
        </Button>
      </div>

      {subjectId && (
        <div className="space-y-3">
          <h2 className="font-bold">{subjectName}: {lectures.length} lecture{lectures.length === 1 ? "" : "s"}</h2>
          <div className="rounded-2xl border divide-y bg-card overflow-hidden">
            {lectures.length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">Nothing uploaded for this subject yet.</p>}
            {lectures.map((l) => (
              <div key={l.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-secondary/10 text-sm font-bold text-secondary">{l.order || "-"}</div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold truncate">{l.title}</p>
                  <p className="text-xs text-muted-foreground">{fmtDuration(l.durationSec)} · {l.notesPath ? "notes attached" : "no notes"} · {l.status}</p>
                </div>
                <label className="text-xs flex items-center gap-1"><input type="checkbox" checked={!!l.free} onChange={(e) => patch(l, { free: e.target.checked })} /> Free</label>
                <Button variant="outline" size="sm" onClick={() => patch(l, { status: l.status === "published" ? "draft" : "published" })} className="rounded-lg text-xs">
                  {l.status === "published" ? "Unpublish" : "Publish"}
                </Button>
                <label className="text-xs rounded-lg border px-2 py-1.5 cursor-pointer hover:bg-muted">
                  {l.notesPath ? "Replace notes" : "Add notes"}
                  <input type="file" accept="application/pdf" className="hidden" onChange={(e) => replaceNotes(l, e.target.files?.[0])} />
                </label>
                <Button variant="ghost" size="icon" onClick={() => remove(l)} className="text-destructive" aria-label="Delete"><Trash2 className="h-4 w-4" /></Button>
                <NoteLinker lecture={l} db={db} />
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Order numbers decide the sequence students see.</p>
        </div>
      )}
    </div>
  )
}
