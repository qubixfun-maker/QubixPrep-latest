"use client"
import { useState } from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useUser } from "@/firebase"

type Item = { subjectId: string; docId: string; chapterTitle: string; failed: number; total: number }

export default function NotesRepairPage() {
  const { user } = useUser()
  const [busy, setBusy] = useState(false)
  const [items, setItems] = useState<Item[] | null>(null)
  const [log, setLog] = useState<string[]>([])
  const add = (m: string) => setLog((l) => [...l, m])

  async function call(body: any) {
    const idToken = await user!.getIdToken()
    const r = await fetch("/api/admin/repair-failed-notes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ idToken, ...body }) })
    const j = await r.json().catch(() => ({}))
    if (!r.ok) throw new Error(j.error || "Request failed")
    return j
  }

  async function scan() {
    if (!user) return
    setBusy(true); setLog([]); setItems(null)
    try {
      const j = await call({ mode: "scan" })
      setItems(j.items)
      add(`Scanned ${j.scanned} chapters. ${j.totalFailed} failed topics in ${j.items.length} chapters.`)
    } catch (e: any) { add("Error: " + e.message) }
    setBusy(false)
  }

  async function fixAll() {
    if (!user || !items) return
    setBusy(true)
    for (const it of items) {
      try {
        add(`Fixing "${it.chapterTitle}" (${it.failed} topics)…`)
        const j = await call({ mode: "fix", subjectId: it.subjectId, docId: it.docId })
        add(`  fixed ${j.fixed}, still failing ${j.remaining}`)
      } catch (e: any) { add("  Error: " + e.message) }
    }
    add("Finished. Press Scan again to see what is left.")
    setBusy(false)
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-6">
      <h1 className="text-2xl font-bold">Repair failed notes</h1>
      <p className="text-sm text-muted-foreground">Finds topics that show "Notes generation failed" and regenerates only those topics.</p>
      <div className="flex gap-2">
        <Button onClick={scan} disabled={busy || !user}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "1. Scan"}</Button>
        <Button onClick={fixAll} disabled={busy || !items || items.length === 0} variant="secondary">2. Fix all</Button>
      </div>
      {items && items.length > 0 && (
        <ul className="space-y-1 text-sm">
          {items.map((it) => <li key={it.subjectId + it.docId}>{it.subjectId} · {it.chapterTitle} — {it.failed}/{it.total} failed</li>)}
        </ul>
      )}
      <pre className="whitespace-pre-wrap rounded-lg bg-secondary p-3 text-xs">{log.join("\n") || "Nothing yet."}</pre>
    </div>
  )
}
