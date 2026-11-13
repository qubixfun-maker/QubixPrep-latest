"use client"

import { useEffect, useMemo, useRef, useState, use } from "react"
import Link from "next/link"
import { collection, doc, where, query, getDoc } from "firebase/firestore"
import { useCollection, useDoc, useFirestore, useUser } from "@/firebase"
import { useRequireAuth } from "@/hooks/use-require-auth"
import { usePlan } from "@/hooks/use-plan"
import { Lecture, fmtDuration, sortLectures } from "@/lib/lectures"
import { RichNoteView } from "@/components/notes/rich-note-view"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, FileText, Loader2, Lock, ExternalLink, EyeOff } from "lucide-react"

const SPEEDS = [0.75, 1, 1.25, 1.5, 2]
const NOTES_KEY = "qp-lecture-notes-open"
const posKey = (id: string) => `qp-lecture-pos-${id}`

export default function LectureWatchPage({ params }: { params: Promise<{ id: string; lectureId: string }> }) {
  const { id: subjectId, lectureId } = use(params)
  const db = useFirestore()
  const { user } = useUser()
  const { checkingAuth } = useRequireAuth()
  const { isAdmin } = usePlan() as any

  const lectureRef = useMemo(() => (!db ? null : doc(db, "lectures", lectureId)), [db, lectureId])
  const { data: lecture, loading: lectureLoading } = useDoc(lectureRef)
  const siblingsQ = useMemo(() => (!db ? null : query(collection(db, "lectures"), where("subjectId", "==", subjectId))), [db, subjectId])
  const { data: siblingsRaw } = useCollection(siblingsQ)
  const siblings = useMemo(() => sortLectures(((siblingsRaw || []) as any[]).filter((x) => x.status === "published" || isAdmin)) as Lecture[], [siblingsRaw, isAdmin])
  const idx = siblings.findIndex((x) => x.id === lectureId)
  const prev = idx > 0 ? siblings[idx - 1] : null
  const next = idx >= 0 && idx < siblings.length - 1 ? siblings[idx + 1] : null

  const [urls, setUrls] = useState<{ videoUrl: string | null; notesUrl: string | null } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [denied, setDenied] = useState(false)
  const [notesOpen, setNotesOpen] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [richNote, setRichNote] = useState<any>(null)
  const [notesTab, setNotesTab] = useState<"note" | "pdf">("note")
  const videoRef = useRef<HTMLVideoElement>(null)
  const lastSave = useRef(0)

  useEffect(() => {
    try { setNotesOpen(localStorage.getItem(NOTES_KEY) === "1") } catch {}
  }, [])
  const toggleNotes = () => {
    setNotesOpen((v) => {
      const nv = !v
      try { localStorage.setItem(NOTES_KEY, nv ? "1" : "0") } catch {}
      return nv
    })
  }

  useEffect(() => {
    if (!user) return
    let cancelled = false
    setUrls(null); setError(null); setDenied(false)
    ;(async () => {
      try {
        const idToken = await user.getIdToken()
        const res = await fetch("/api/lectures/access", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ idToken, lectureId }) })
        const data = await res.json().catch(() => ({}))
        if (cancelled) return
        if (res.status === 403) { setDenied(true); return }
        if (!res.ok) { setError(data.error || "Could not load this lecture."); return }
        setUrls(data)
      } catch (e: any) {
        if (!cancelled) setError("Could not load this lecture. Check your connection and try again.")
      }
    })()
    return () => { cancelled = true }
  }, [user, lectureId])

  // Optional linked topic note (new exam-notes format). Reading is gated by the notes database rule,
  // so a locked note simply does not show and the PDF (if any) is used instead.
  const noteRef = (lecture as any)?.noteRef as { docKey: string; topicIndex: number } | undefined
  useEffect(() => {
    setRichNote(null)
    if (!db || !user || !noteRef) return
    let cancelled = false
    getDoc(doc(db, "subjects", subjectId, "textNotes", noteRef.docKey))
      .then((snap) => {
        const t = snap.exists() ? (snap.data() as any).topics?.[noteRef.topicIndex] : null
        const r = t?.rich
        if (!cancelled && r && (r.status === "published" || isAdmin)) setRichNote(r)
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [db, user, subjectId, noteRef?.docKey, noteRef?.topicIndex, isAdmin])

  // Resume where the student stopped
  const onLoaded = () => {
    const v = videoRef.current
    if (!v) return
    try {
      const saved = Number(localStorage.getItem(posKey(lectureId)) || 0)
      if (saved > 5 && saved < v.duration - 10) v.currentTime = saved
    } catch {}
  }
  const onTime = () => {
    const v = videoRef.current
    if (!v) return
    const now = Date.now()
    if (now - lastSave.current < 4000) return
    lastSave.current = now
    try { localStorage.setItem(posKey(lectureId), String(Math.floor(v.currentTime))) } catch {}
  }
  const onEnded = () => { try { localStorage.removeItem(posKey(lectureId)) } catch {} }
  const setRate = (r: number) => { setSpeed(r); if (videoRef.current) videoRef.current.playbackRate = r }

  if (checkingAuth || lectureLoading) return <div className="h-screen flex items-center justify-center"><Loader2 className="h-10 w-10 text-primary animate-spin" /></div>
  const l = lecture as any
  if (!l) return <div className="max-w-xl mx-auto p-10 text-center text-muted-foreground">Lecture not found. <Link className="underline" href={`/videos/${subjectId}`}>Back</Link></div>

  const hasNotes = !!urls?.notesUrl || !!richNote
  const showNotes = notesOpen && hasNotes
  const tab: "note" | "pdf" = richNote && (notesTab === "note" || !urls?.notesUrl) ? "note" : "pdf"

  return (
    <div className={`mx-auto p-3 md:p-6 space-y-4 ${showNotes ? "max-w-[1700px]" : "max-w-5xl"}`}>
      <div className="flex items-center justify-between gap-3">
        <Link href={`/videos/${subjectId}`} className="text-xs font-bold uppercase tracking-widest text-secondary flex items-center gap-1 hover:underline w-fit">
          <ChevronLeft className="h-3 w-3" /> {l.subjectName || "Lectures"}
        </Link>
        {hasNotes && (
          <Button onClick={toggleNotes} variant={showNotes ? "default" : "outline"} className="h-10 rounded-xl gap-2 font-bold">
            {showNotes ? <EyeOff className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
            {showNotes ? "Hide notes" : "Show notes"}
          </Button>
        )}
      </div>

      <div>
        <h1 className="text-xl md:text-3xl font-bold tracking-tight">{l.title}</h1>
        <p className="text-sm text-muted-foreground mt-1">{l.order ? `Topic ${l.order}` : ""}{l.order && l.durationSec ? " · " : ""}{fmtDuration(l.durationSec)}</p>
      </div>

      {denied ? (
        <div className="rounded-3xl border-2 border-dashed p-10 text-center space-y-4">
          <Lock className="h-10 w-10 mx-auto text-muted-foreground" />
          <h2 className="text-xl font-bold">This lecture is for subscribers</h2>
          <p className="text-sm text-muted-foreground">Subscribe to unlock every video lecture with its notes.</p>
          <Link href="/pricing"><Button className="rounded-xl font-bold">See plans</Button></Link>
        </div>
      ) : error ? (
        <div className="rounded-2xl border p-6 text-center text-sm text-muted-foreground">{error}</div>
      ) : !urls ? (
        <div className="aspect-video rounded-2xl bg-muted flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : (
        <div className={showNotes ? "grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] items-start" : ""}>
          <div className="space-y-3">
            <div className="overflow-hidden rounded-2xl bg-black">
              <video ref={videoRef} src={urls.videoUrl || undefined} controls playsInline preload="metadata" controlsList="nodownload" onContextMenu={(e) => e.preventDefault()}
                onLoadedMetadata={onLoaded} onTimeUpdate={onTime} onEnded={onEnded} className="w-full aspect-video bg-black" />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground mr-1">Speed</span>
              {SPEEDS.map((r) => (
                <button key={r} onClick={() => setRate(r)} className={`h-8 px-3 rounded-lg text-xs font-bold border ${speed === r ? "bg-primary text-primary-foreground border-primary" : "bg-card"}`}>{r}x</button>
              ))}
              <div className="ml-auto flex gap-2">
                {prev && <Link href={`/videos/${subjectId}/${prev.id}`}><Button variant="outline" className="h-9 rounded-xl gap-1 text-xs"><ChevronLeft className="h-4 w-4" /> Previous</Button></Link>}
                {next && <Link href={`/videos/${subjectId}/${next.id}`}><Button variant="outline" className="h-9 rounded-xl gap-1 text-xs">Next <ChevronRight className="h-4 w-4" /></Button></Link>}
              </div>
            </div>
            {!hasNotes && <p className="text-xs text-muted-foreground">No notes attached to this lecture.</p>}
          </div>

          {showNotes && (
            <div className="rounded-2xl border bg-card overflow-hidden lg:sticky lg:top-4">
              <div className="flex items-center justify-between gap-2 px-4 py-2 border-b text-xs">
                <span className="font-bold flex items-center gap-2"><FileText className="h-4 w-4" /> Lecture notes</span>
                <div className="flex items-center gap-2">
                  {richNote && urls.notesUrl && (
                    <div className="flex overflow-hidden rounded-md border">
                      <button onClick={() => setNotesTab("note")} className={`px-2.5 py-1 font-bold ${tab === "note" ? "bg-primary text-primary-foreground" : ""}`}>Notes</button>
                      <button onClick={() => setNotesTab("pdf")} className={`px-2.5 py-1 font-bold ${tab === "pdf" ? "bg-primary text-primary-foreground" : ""}`}>PDF</button>
                    </div>
                  )}
                  {tab === "pdf" && urls.notesUrl && <a href={urls.notesUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 font-bold text-primary hover:underline">Open full <ExternalLink className="h-3 w-3" /></a>}
                </div>
              </div>
              {tab === "note" && richNote
                ? <div className="h-[75vh] overflow-y-auto bg-slate-50 p-2 lg:h-[calc(100vh-10rem)]"><RichNoteView note={richNote} subjectName={l.subjectName} topicNo={(lecture as any)?.noteRef?.topicIndex + 1} protectWith={isAdmin ? undefined : (user?.email || user?.uid || undefined)} allowPrint={false} /></div>
                : <iframe src={`${urls.notesUrl}#toolbar=0&navpanes=0&view=FitH`} title="Lecture notes" className="w-full h-[75vh] lg:h-[calc(100vh-10rem)] bg-white" />}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
