"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { doc } from "firebase/firestore"
import { useUser, useDoc, useFirestore } from "@/firebase"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Loader2, Lock, Upload, Trash2, Eye, EyeOff, Square } from "lucide-react"

type Entry = { id: string; title: string; subject: string; subjectKey: string; chapter: number; status: string; sizeBytes: number }
type Job = { name: string; state: "waiting" | "uploading" | "done" | "failed"; msg?: string }

const keyOf = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")

export default function AdminTop100DocsPage() {
  const { user, loading: authLoading } = useUser()
  const db = useFirestore()
  const { toast } = useToast()
  const profileRef = useMemo(() => (!db || !user ? null : doc(db, "users", user.uid)), [db, user])
  const { data: profile, loading: profileLoading } = useDoc(profileRef)
  const isAdmin = (profile as any)?.role === "admin"

  const [subject, setSubject] = useState("Pathology")
  const [entries, setEntries] = useState<Entry[] | null>(null)
  const [jobs, setJobs] = useState<Job[]>([])
  const [running, setRunning] = useState(false)
  const stopRef = useRef(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const load = useCallback(async () => {
    if (!user) return
    try {
      const idToken = await user.getIdToken()
      const res = await fetch("/api/top100/list", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ idToken }) })
      const out = await res.json()
      setEntries(out.docs || [])
    } catch { setEntries([]) }
  }, [user])
  useEffect(() => { if (isAdmin) load() }, [isAdmin, load])

  const call = async (body: any) => {
    const idToken = await user!.getIdToken()
    const res = await fetch("/api/admin/top100-docs", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` }, body: JSON.stringify(body) })
    const out = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(out.error || `Failed (${res.status})`)
    return out
  }

  const upload = async (files: File[]) => {
    const list = files.filter((f) => /\.html?$/i.test(f.name)).sort((a, b) => a.name.localeCompare(b.name))
    if (!list.length) { toast({ title: "No HTML files chosen", variant: "destructive" }); return }
    if (!subject.trim()) { toast({ title: "Type the subject name first", variant: "destructive" }); return }
    stopRef.current = false; setRunning(true)
    setJobs(list.map((f) => ({ name: f.name, state: "waiting" })))
    const set = (i: number, j: Partial<Job>) => setJobs((js) => js.map((x, k) => (k === i ? { ...x, ...j } : x)))
    for (let i = 0; i < list.length; i++) {
      if (stopRef.current) break
      set(i, { state: "uploading" })
      try {
        const html = await list[i].text()
        const out = await call({ action: "upload", fileName: list[i].name, subject: subject.trim(), subjectKey: keyOf(subject), html })
        set(i, { state: "done", msg: out.title })
      } catch (e: any) { set(i, { state: "failed", msg: e?.message }) }
    }
    setRunning(false)
    if (fileRef.current) fileRef.current.value = ""
    await load()
    toast({ title: "Upload finished" })
  }

  const toggle = async (e: Entry) => {
    try { await call({ action: "status", id: e.id, status: e.status === "published" ? "hidden" : "published" }); await load() }
    catch (x: any) { toast({ title: "Failed", description: x?.message, variant: "destructive" }) }
  }
  const remove = async (e: Entry) => {
    if (!confirm(`Delete "${e.title}"? This removes the file.`)) return
    try { await call({ action: "delete", id: e.id }); await load() }
    catch (x: any) { toast({ title: "Failed", description: x?.message, variant: "destructive" }) }
  }

  if (authLoading || profileLoading) return <div className="flex h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  if (!isAdmin) return <div className="mx-auto max-w-md p-10 text-center"><Lock className="mx-auto mb-3 h-8 w-8 text-muted-foreground" /><p className="text-sm text-muted-foreground">Admins only.</p></div>

  const done = jobs.filter((j) => j.state === "done").length
  const failed = jobs.filter((j) => j.state === "failed").length

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 md:p-8">
      <div className="flex items-center gap-3">
        <Link href="/admin"><Button variant="ghost" size="icon" className="rounded-full"><ArrowLeft className="h-5 w-5" /></Button></Link>
        <div>
          <h1 className="text-2xl font-bold">Top 100 Topics: upload sheets</h1>
          <p className="text-sm text-muted-foreground">These sheets are what students see in Top 100 Topics. Uploading a file again replaces that sheet.</p>
        </div>
      </div>

      <div className="space-y-3 rounded-2xl border bg-card p-4">
        <label className="block text-sm font-bold">Subject of these files</label>
        <input value={subject} onChange={(e) => setSubject(e.target.value)} disabled={running} className="w-full rounded-lg border bg-background px-3 py-2 text-sm" />
        <input ref={fileRef} type="file" accept=".html,.htm,text/html" multiple disabled={running} className="hidden" onChange={(e) => upload(Array.from(e.target.files || []))} />
        <div className="flex flex-wrap items-center gap-2">
          <Button disabled={running} onClick={() => fileRef.current?.click()} className="rounded-lg gap-2"><Upload className="h-4 w-4" /> Choose HTML files (select all)</Button>
          {running && <Button variant="outline" onClick={() => { stopRef.current = true }} className="rounded-lg gap-2"><Square className="h-4 w-4" /> Stop</Button>}
          {jobs.length > 0 && <span className="text-sm font-semibold">{done}/{jobs.length} uploaded{failed ? `, ${failed} failed` : ""}</span>}
        </div>
        {jobs.length > 0 && (
          <ul className="max-h-64 space-y-1 overflow-auto text-xs">
            {jobs.map((j) => (
              <li key={j.name} className={j.state === "failed" ? "text-red-600" : j.state === "done" ? "text-emerald-700" : "text-muted-foreground"}>
                {j.state === "uploading" ? "⏳" : j.state === "done" ? "✓" : j.state === "failed" ? "✗" : "·"} {j.name}{j.msg ? ` — ${j.msg}` : ""}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="space-y-2">
        <h2 className="text-sm font-black uppercase tracking-widest text-primary">Uploaded sheets {entries ? `(${entries.length})` : ""}</h2>
        {entries === null && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
        {entries?.length === 0 && <p className="text-sm text-muted-foreground">Nothing uploaded yet.</p>}
        {entries?.map((e) => (
          <div key={e.id} className="flex items-center gap-3 rounded-xl border bg-card px-3 py-2 text-sm">
            <span className="w-10 shrink-0 text-xs font-bold text-muted-foreground">{e.chapter ? `Ch ${e.chapter}` : "–"}</span>
            <span className={`min-w-0 flex-1 truncate ${e.status === "published" ? "" : "text-muted-foreground line-through"}`}>{e.title}</span>
            <span className="shrink-0 text-xs text-muted-foreground">{e.subject} · {(e.sizeBytes / 1024).toFixed(0)} KB</span>
            <Link href={`/top-100/${e.id}`} className="shrink-0 text-xs font-bold text-primary">Open</Link>
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => toggle(e)} aria-label={e.status === "published" ? "Hide from students" : "Show to students"}>{e.status === "published" ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}</Button>
            <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => remove(e)} aria-label="Delete"><Trash2 className="h-4 w-4" /></Button>
          </div>
        ))}
      </div>
    </div>
  )
}
