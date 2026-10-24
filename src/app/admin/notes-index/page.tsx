"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useUser, useFirestore, useDoc } from "@/firebase"
import { collection, doc, getDocs, updateDoc, writeBatch } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Loader2, ArrowLeft, RefreshCw } from "lucide-react"
import { buildEntry, decideFree, indexIdOf } from "@/lib/notes-index"

type Row = { id: string; subjectId: string; chapterTitle: string; topicCount: number; free: boolean }

export default function NotesIndexPage() {
  const { user } = useUser()
  const db = useFirestore()
  const profileRef = useMemo(() => (!db || !user ? null : doc(db, "users", user.uid)), [db, user])
  const { data: profile, loading } = useDoc(profileRef)
  const [running, setRunning] = useState(false)
  const [log, setLog] = useState<string[]>([])
  const [rows, setRows] = useState<Row[]>([])
  const [names, setNames] = useState<Record<string, string>>({})
  const add = (m: string) => setLog((l) => [...l, m])

  async function loadRows() {
    if (!db) return
    const [idx, subs] = await Promise.all([getDocs(collection(db, "notesIndex")), getDocs(collection(db, "subjects"))])
    const nm: Record<string, string> = {}
    subs.forEach((s) => { nm[s.id] = String((s.data() as any).name || s.id) })
    setNames(nm)
    setRows(idx.docs.map((d) => { const x = d.data() as any; return { id: d.id, subjectId: x.subjectId, chapterTitle: x.chapterTitle, topicCount: x.topicCount || 0, free: !!x.free } }))
  }
  useEffect(() => { if ((profile as any)?.role === "admin") loadRows().catch(() => {}) }, [db, profile])

  async function rebuild() {
    if (!db) return
    setRunning(true); setLog([])
    try {
      add("Reading existing free-sample choices...")
      const oldIdx = await getDocs(collection(db, "notesIndex"))
      const oldFree = new Map<string, boolean>()
      oldIdx.forEach((d) => oldFree.set(d.id, !!(d.data() as any).free))

      const subs = await getDocs(collection(db, "subjects"))
      const writes: { id: string; data: any }[] = []
      for (const s of subs.docs) {
        const notes = await getDocs(collection(db, "subjects", s.id, "textNotes"))
        const chapters = notes.docs.map((n) => ({ id: n.id, title: String((n.data() as any).chapterTitle || n.id), data: n.data() }))
        const existing: Record<string, boolean | undefined> = {}
        chapters.forEach((c) => { const k = indexIdOf(s.id, c.id); existing[c.id] = oldFree.has(k) ? oldFree.get(k) : undefined })
        const free = decideFree(chapters, existing)
        chapters.forEach((c) => {
          const e = buildEntry(s.id, c.id, c.data, free[c.id])
          if (e) writes.push({ id: indexIdOf(s.id, c.id), data: e })
        })
        add(`${(s.data() as any).name || s.id}: ${chapters.length} chapters`)
      }
      for (let i = 0; i < writes.length; i += 300) {
        const b = writeBatch(db)
        writes.slice(i, i + 300).forEach((w) => b.set(doc(db, "notesIndex", w.id), w.data))
        await b.commit()
      }
      const keep = new Set(writes.map((w) => w.id))
      const stale = oldIdx.docs.filter((d) => !keep.has(d.id))
      for (let i = 0; i < stale.length; i += 300) {
        const b = writeBatch(db)
        stale.slice(i, i + 300).forEach((d) => b.delete(d.ref))
        await b.commit()
      }
      add(`Saved ${writes.length} chapters${stale.length ? `, removed ${stale.length} old` : ""}. DONE.`)
      await loadRows()
    } catch (e: any) {
      add("FAILED: " + (e?.message || e))
    } finally { setRunning(false) }
  }

  async function toggle(r: Row) {
    if (!db) return
    setRows((rs) => rs.map((x) => (x.id === r.id ? { ...x, free: !r.free } : x)))
    try { await updateDoc(doc(db, "notesIndex", r.id), { free: !r.free }) }
    catch { setRows((rs) => rs.map((x) => (x.id === r.id ? { ...x, free: r.free } : x))) }
  }

  const grouped = useMemo(() => {
    const g: Record<string, Row[]> = {}
    rows.forEach((r) => { (g[r.subjectId] = g[r.subjectId] || []).push(r) })
    Object.values(g).forEach((l) => l.sort((a, b) => String(a.chapterTitle).localeCompare(String(b.chapterTitle))))
    return Object.entries(g).sort((a, b) => (names[a[0]] || a[0]).localeCompare(names[b[0]] || b[0]))
  }, [rows, names])

  if (loading) return <div className="flex items-center justify-center py-24"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
  if ((profile as any)?.role !== "admin") return <div className="max-w-xl mx-auto p-8 text-center text-sm text-red-500">Admins only.</div>

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-8 space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/admin"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <h1 className="text-xl font-bold">Notes index and free samples</h1>
      </div>
      <p className="text-sm text-muted-foreground">
        The notes lists read from this light index. Press Rebuild after you add or edit notes. A subject seen for the first time gets its first 2 chapters (A to Z) as free samples; your own choices below are never changed by a rebuild. Tick a chapter to make it a free sample for students without a plan.
      </p>
      <Button onClick={rebuild} disabled={running} className="gap-2 font-bold">
        {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} Rebuild index
      </Button>
      {log.length > 0 && <pre className="rounded-xl border border-white/10 bg-white/5 p-4 text-xs whitespace-pre-wrap">{log.join("\n")}</pre>}
      {grouped.map(([sid, list]) => (
        <section key={sid} className="space-y-1">
          <h2 className="text-sm font-black pt-3">{names[sid] || sid} <span className="text-muted-foreground font-medium">({list.filter((r) => r.free).length} free of {list.length})</span></h2>
          {list.map((r) => (
            <label key={r.id} className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm cursor-pointer">
              <input type="checkbox" checked={r.free} onChange={() => toggle(r)} />
              <span className="flex-1 truncate">{r.chapterTitle}</span>
              <span className="text-xs text-muted-foreground">{r.topicCount} topics</span>
            </label>
          ))}
        </section>
      ))}
    </div>
  )
}
