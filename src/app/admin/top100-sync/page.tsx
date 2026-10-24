"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useUser, useFirestore, useDoc } from "@/firebase"
import { collection, doc, getDoc, getDocs, writeBatch } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Loader2, ArrowLeft, RefreshCw } from "lucide-react"

export default function Top100SyncPage() {
  const { user } = useUser()
  const db = useFirestore()
  const profileRef = useMemo(() => (!db || !user ? null : doc(db, "users", user.uid)), [db, user])
  const { data: profile, loading } = useDoc(profileRef)
  const [running, setRunning] = useState(false)
  const [log, setLog] = useState<string[]>([])
  const add = (m: string) => setLog((l) => [...l, m])

  async function run() {
    if (!db) return
    setRunning(true)
    setLog([])
    try {
      add("Reading your Top 100 list...")
      const listSnap = await getDocs(collection(db, "top100"))
      const entries = listSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }))
      add(`${entries.length} topics in the list.`)

      const chapters = new Map<string, any>()
      const writes: { id: string; data: any }[] = []
      const missing: string[] = []

      for (const e of entries) {
        const key = `${e.subjectId}/${e.textbookId}__${e.chapterId}`
        if (!chapters.has(key)) {
          const snap = await getDoc(doc(db, "subjects", e.subjectId, "textNotes", `${e.textbookId}__${e.chapterId}`))
          chapters.set(key, snap.exists() ? snap.data() : null)
        }
        const ch = chapters.get(key)
        const topic = ch?.topics?.[Number(e.topicIndex)]
        if (!topic?.markdown) { missing.push(`${e.subjectName || e.subjectId}: ${e.name}`); continue }
        writes.push({
          id: e.id,
          data: {
            subjectId: e.subjectId, subjectName: e.subjectName || "", textbookId: e.textbookId, chapterId: e.chapterId, topicIndex: Number(e.topicIndex),
            name: topic.name || e.name, chapterTitle: ch?.chapterTitle || e.chapterTitle || "", markdown: topic.markdown,
            addedAt: e.addedAt || 0, syncedAt: Date.now(),
          },
        })
      }

      add(`Copying ${writes.length} notes...`)
      for (let i = 0; i < writes.length; i += 300) {
        const batch = writeBatch(db)
        writes.slice(i, i + 300).forEach((w) => batch.set(doc(db, "top100Notes", w.id), w.data))
        await batch.commit()
        add(`  ${Math.min(i + 300, writes.length)} / ${writes.length} saved`)
      }

      // Remove copies of topics that are no longer in the list.
      const inList = new Set(entries.map((e) => e.id))
      const copies = await getDocs(collection(db, "top100Notes"))
      const stale = copies.docs.filter((d) => !inList.has(d.id))
      for (let i = 0; i < stale.length; i += 300) {
        const batch = writeBatch(db)
        stale.slice(i, i + 300).forEach((d) => batch.delete(d.ref))
        await batch.commit()
      }
      if (stale.length) add(`Removed ${stale.length} old copies.`)

      if (missing.length) {
        add(`${missing.length} topics could not be copied (their note text was not found):`)
        missing.forEach((m) => add("  - " + m))
      }
      add("DONE.")
    } catch (e: any) {
      add("FAILED: " + (e?.message || e))
    } finally {
      setRunning(false)
    }
  }

  if (loading) return <div className="flex items-center justify-center py-24"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
  if ((profile as any)?.role !== "admin") return <div className="max-w-xl mx-auto p-8 text-center text-sm text-red-500">Admins only.</div>

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-8 space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/admin"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <h1 className="text-xl font-bold">Sync Top 100 notes</h1>
      </div>
      <p className="text-sm text-muted-foreground">
        Copies the note text of every topic in your Top 100 list into a private, fast store that only Scholar and Clinician members can read. Press it once now, and again whenever you edit the original notes. New topics added with the star are copied automatically.
      </p>
      <Button onClick={run} disabled={running} className="gap-2 font-bold">
        {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} Sync now
      </Button>
      {log.length > 0 && <pre className="rounded-xl border border-white/10 bg-white/5 p-4 text-xs whitespace-pre-wrap">{log.join("\n")}</pre>}
    </div>
  )
}
