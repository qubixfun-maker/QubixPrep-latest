"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { collection, doc, getDocs } from "firebase/firestore"
import { useUser, useDoc, useCollection, useFirestore } from "@/firebase"
import { compareSubjects } from "@/lib/subject-year"
import { RichNoteView } from "@/components/notes/rich-note-view"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Loader2, Lock, Wand2, Eye, Trash2, ChevronDown, ChevronRight, Square, Save } from "lucide-react"

type Row = { docKey: string; textbookId: string; chapterId: string; chapterTitle: string; topics: { name: string; rich?: any }[] }

export default function AdminRichNotesPage() {
  const { user, loading: authLoading } = useUser()
  const db = useFirestore()
  const { toast } = useToast()
  const profileRef = useMemo(() => (!db || !user ? null : doc(db, "users", user.uid)), [db, user])
  const { data: profile, loading: profileLoading } = useDoc(profileRef)
  const isAdmin = (profile as any)?.role === "admin"

  const subjectsQ = useMemo(() => (!db ? null : collection(db, "subjects")), [db])
  const { data: rawSubjects } = useCollection(subjectsQ)
  const subjects = useMemo(() => [...((rawSubjects || []) as any[])].sort((a, b) => compareSubjects(a.name, b.name)), [rawSubjects])

  const [subjectId, setSubjectId] = useState("")
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState<Record<string, boolean>>({})
  const [busy, setBusy] = useState<Record<string, boolean>>({})
  const [bulk, setBulk] = useState<{ done: number; total: number; failed: number } | null>(null)
  const stopRef = useRef(false)
  const [preview, setPreview] = useState<{ row: Row; index: number } | null>(null)
  const [json, setJson] = useState("")
  const [showJson, setShowJson] = useState(false)

  const load = useCallback(async () => {
    if (!db || !subjectId) { setRows([]); return }
    setLoading(true)
    try {
      const snap = await getDocs(collection(db, "subjects", subjectId, "textNotes"))
      const list: Row[] = snap.docs.map((d) => {
        const x: any = d.data()
        const [textbookId, ...rest] = d.id.split("__")
        return { docKey: d.id, textbookId, chapterId: rest.join("__"), chapterTitle: x.chapterTitle || d.id, topics: (x.topics || []).map((t: any) => ({ name: t.name, rich: t.rich })) }
      })
      list.sort((a, b) => a.textbookId.localeCompare(b.textbookId) || a.chapterTitle.localeCompare(b.chapterTitle, undefined, { numeric: true }))
      setRows(list)
    } catch (e: any) {
      toast({ title: "Could not load notes", description: e?.message, variant: "destructive" })
    } finally { setLoading(false) }
  }, [db, subjectId, toast])
  useEffect(() => { load() }, [load])

  if (authLoading || profileLoading) return <div className="flex justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  if (!user || !isAdmin) {
    return <div className="max-w-md mx-auto py-24 text-center space-y-4"><Lock className="h-10 w-10 mx-auto text-muted-foreground" /><p className="text-muted-foreground">Admin access required.</p><Link href="/"><Button variant="outline">Back home</Button></Link></div>
  }

  const call = async (body: any) => {
    const idToken = await user.getIdToken()
    const res = await fetch("/api/admin/rich-notes/convert", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` }, body: JSON.stringify({ subjectId, ...body }) })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.error || "Request failed")
    return data
  }
  const key = (r: Row, i: number) => `${r.docKey}:${i}`
  const patchRow = (r: Row, i: number, rich: any | undefined) =>
    setRows((rs) => rs.map((x) => (x.docKey === r.docKey ? { ...x, topics: x.topics.map((t, k) => (k === i ? { ...t, rich } : t)) } : x)))

  const convert = async (r: Row, i: number, quiet = false) => {
    const k = key(r, i)
    setBusy((b) => ({ ...b, [k]: true }))
    try {
      const out = await call({ action: "convert", textbookId: r.textbookId, chapterId: r.chapterId, topicIndex: i })
      patchRow(r, i, out.rich)
      if (!quiet) toast({ title: "Converted (draft)", description: r.topics[i].name })
      return true
    } catch (e: any) {
      if (!quiet) toast({ title: "Conversion failed", description: e?.message, variant: "destructive" })
      return false
    } finally { setBusy((b) => ({ ...b, [k]: false })) }
  }
  const setStatus = async (r: Row, i: number, status: "draft" | "published") => {
    try { await call({ action: "status", textbookId: r.textbookId, chapterId: r.chapterId, topicIndex: i, status }); patchRow(r, i, { ...r.topics[i].rich, status }) }
    catch (e: any) { toast({ title: "Failed", description: e?.message, variant: "destructive" }) }
  }
  const remove = async (r: Row, i: number) => {
    if (!confirm(`Remove the new-format version of "${r.topics[i].name}"? The original note stays.`)) return
    try { await call({ action: "remove", textbookId: r.textbookId, chapterId: r.chapterId, topicIndex: i }); patchRow(r, i, undefined) }
    catch (e: any) { toast({ title: "Failed", description: e?.message, variant: "destructive" }) }
  }
  const saveJson = async () => {
    if (!preview) return
    try {
      const parsed = JSON.parse(json)
      await call({ action: "save", textbookId: preview.row.textbookId, chapterId: preview.row.chapterId, topicIndex: preview.index, rich: parsed })
      toast({ title: "Saved" })
      await load()
      setShowJson(false); setPreview(null)
    } catch (e: any) { toast({ title: "Could not save", description: e?.message, variant: "destructive" }) }
  }

  const runBulk = async (targets: { r: Row; i: number }[]) => {
    if (targets.length === 0) return
    if (!confirm(`Convert ${targets.length} topic${targets.length === 1 ? "" : "s"} to the new format (saved as drafts)? Originals are not changed.`)) return
    stopRef.current = false
    setBulk({ done: 0, total: targets.length, failed: 0 })
    let next = 0, done = 0, failed = 0
    const worker = async () => {
      while (!stopRef.current) {
        const idx = next++
        if (idx >= targets.length) return
        const ok = await convert(targets[idx].r, targets[idx].i, true)
        done++; if (!ok) failed++
        setBulk({ done, total: targets.length, failed })
      }
    }
    await Promise.all([worker(), worker()])
    toast({ title: "Bulk conversion finished", description: `${done - failed} converted, ${failed} failed.` })
    setBulk(null)
  }
  const unconverted = (r: Row) => r.topics.map((t, i) => ({ r, i, t })).filter((x) => !x.t.rich).map(({ r, i }) => ({ r, i }))
  const allUnconverted = rows.flatMap(unconverted)
  const counts = rows.reduce((a, r) => { r.topics.forEach((t) => { if (t.rich) a[t.rich.status === "published" ? "pub" : "draft"]++; a.all++ }); return a }, { all: 0, pub: 0, draft: 0 })

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin" aria-label="Back" className="grid h-10 w-10 place-items-center rounded-full border bg-card"><ArrowLeft className="h-5 w-5" /></Link>
        <div>
          <h1 className="text-2xl font-bold">Rich Notes converter</h1>
          <p className="text-sm text-muted-foreground">Rewrites existing notes into the new exam-notes format. Originals are never changed; students see a converted note only after you publish it.</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} className="h-10 rounded-md border bg-background px-3 text-sm">
          <option value="">Choose subject…</option>
          {subjects.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        {subjectId && !loading && <span className="text-xs text-muted-foreground">{counts.all} topics · {counts.pub} published · {counts.draft} draft</span>}
        {subjectId && allUnconverted.length > 0 && !bulk && <Button size="sm" onClick={() => runBulk(allUnconverted)} className="rounded-lg gap-2"><Wand2 className="h-4 w-4" /> Convert all {allUnconverted.length} remaining</Button>}
        {bulk && (
          <div className="flex items-center gap-3 text-sm"><Loader2 className="h-4 w-4 animate-spin" /> {bulk.done}/{bulk.total} done{bulk.failed ? `, ${bulk.failed} failed` : ""}
            <Button size="sm" variant="outline" onClick={() => { stopRef.current = true }} className="gap-1"><Square className="h-3 w-3" /> Stop</Button></div>
        )}
      </div>

      {loading && <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin" /></div>}

      <div className="space-y-3">
        {rows.map((r) => {
          const isOpen = !!open[r.docKey]
          const todo = unconverted(r)
          return (
            <div key={r.docKey} className="rounded-xl border bg-card">
              <div className="flex items-center gap-2 px-4 py-3">
                <button onClick={() => setOpen((o) => ({ ...o, [r.docKey]: !isOpen }))} className="flex flex-1 items-center gap-2 text-left">
                  {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  <span className="font-semibold text-sm">{r.chapterTitle}</span>
                  <span className="text-xs text-muted-foreground">{r.topics.filter((t) => t.rich).length}/{r.topics.length} converted</span>
                </button>
                {todo.length > 0 && !bulk && <Button size="sm" variant="outline" className="rounded-lg text-xs" onClick={() => runBulk(todo)}>Convert {todo.length}</Button>}
              </div>
              {isOpen && (
                <div className="divide-y border-t">
                  {r.topics.map((t, i) => {
                    const st = t.rich ? (t.rich.status === "published" ? "published" : "draft") : "none"
                    return (
                      <div key={i} className="flex flex-wrap items-center gap-2 px-4 py-2.5 text-sm">
                        <span className="min-w-0 flex-1 truncate">{i + 1}. {t.name}</span>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${st === "published" ? "bg-emerald-100 text-emerald-800" : st === "draft" ? "bg-amber-100 text-amber-800" : "bg-muted text-muted-foreground"}`}>{st === "none" ? "original only" : st}</span>
                        <Button size="sm" variant="outline" className="rounded-lg text-xs gap-1" disabled={!!busy[key(r, i)] || !!bulk} onClick={() => convert(r, i)}>
                          {busy[key(r, i)] ? <Loader2 className="h-3 w-3 animate-spin" /> : <Wand2 className="h-3 w-3" />} {t.rich ? "Redo" : "Convert"}
                        </Button>
                        {t.rich && <>
                          <Button size="sm" variant="outline" className="rounded-lg text-xs gap-1" onClick={() => { setPreview({ row: r, index: i }); setJson(JSON.stringify((({ status, convertedAt, ...n }) => n)(t.rich), null, 2)); setShowJson(false) }}><Eye className="h-3 w-3" /> Preview</Button>
                          <Button size="sm" className="rounded-lg text-xs" onClick={() => setStatus(r, i, st === "published" ? "draft" : "published")}>{st === "published" ? "Unpublish" : "Publish"}</Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => remove(r, i)} aria-label="Remove"><Trash2 className="h-4 w-4" /></Button>
                        </>}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
        {subjectId && !loading && rows.length === 0 && <p className="text-sm text-muted-foreground">No notes found for this subject.</p>}
      </div>

      <Dialog open={!!preview} onOpenChange={(o) => { if (!o) setPreview(null) }}>
        <DialogContent className="max-h-[92vh] max-w-4xl overflow-y-auto">
          <DialogHeader><DialogTitle className="flex items-center justify-between gap-3">Preview <Button size="sm" variant="outline" onClick={() => setShowJson((v) => !v)}>{showJson ? "Back to preview" : "Edit text (advanced)"}</Button></DialogTitle></DialogHeader>
          {preview && (showJson ? (
            <div className="space-y-2">
              <textarea value={json} onChange={(e) => setJson(e.target.value)} spellCheck={false} className="h-[60vh] w-full rounded-md border bg-background p-3 font-mono text-xs" />
              <Button onClick={saveJson} className="gap-2"><Save className="h-4 w-4" /> Save changes</Button>
            </div>
          ) : (
            <RichNoteView note={preview.row.topics[preview.index].rich} subjectName={(subjects.find((s: any) => s.id === subjectId) as any)?.name} topicNo={preview.index + 1} allowPrint />
          ))}
        </DialogContent>
      </Dialog>
    </div>
  )
}
