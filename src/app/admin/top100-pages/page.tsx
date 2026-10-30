"use client"
import { useRef, useState } from "react"
import JSZip from "jszip"
import { doc, setDoc } from "firebase/firestore"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useFirestore } from "@/firebase"

// Upload a "top100 zip" (manifest.json + one image per topic). Re-uploading the same subject overwrites its topics.
export default function Top100PagesImport() {
  const db = useFirestore()
  const input = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [log, setLog] = useState<string[]>([])
  const add = (m: string) => setLog((l) => [...l, m])

  async function run(file: File) {
    if (!db) return
    setBusy(true); setLog([])
    try {
      const zip = await JSZip.loadAsync(file)
      const mf = zip.file("manifest.json")
      if (!mf) throw new Error("manifest.json not found in this zip")
      const m = JSON.parse(await mf.async("string"))
      if (!m.subject || !m.subjectKey || !Array.isArray(m.pages)) throw new Error("manifest.json is not in the expected format")
      add(`${m.subject}: ${m.pages.length} topics`)
      let n = 0
      for (const p of m.pages) {
        const f = zip.file(p.file)
        if (!f) { add(`  missing image ${p.file}`); continue }
        const id = `${m.subjectKey}-${String(p.order).padStart(2, "0")}`
        const data = await f.async("base64")
        await setDoc(doc(db, "top100Images", id), { data, mime: "image/webp", w: p.w || 0, h: p.h || 0 })
        await setDoc(doc(db, "top100Pages", id), { subject: m.subject, subjectKey: m.subjectKey, order: p.order, title: p.title, updatedAt: Date.now() })
        n++
        if (n % 10 === 0) add(`  ${n} / ${m.pages.length} uploaded…`)
      }
      add(`Done. ${n} topics uploaded.`)
    } catch (e: any) { add("Error: " + (e?.message || "failed")) }
    setBusy(false)
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-6">
      <h1 className="text-2xl font-bold">Top 100 topic sheets</h1>
      <p className="text-sm text-muted-foreground">Choose the zip for one subject (for example <b>top100-physiology.zip</b>). Each topic becomes a card in Top 100 Topics.</p>
      <input ref={input} type="file" accept=".zip" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) run(f); e.target.value = "" }} />
      <Button disabled={busy || !db} onClick={() => input.current?.click()}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Choose zip and upload"}</Button>
      <pre className="whitespace-pre-wrap rounded-lg bg-secondary p-3 text-xs">{log.join("\n") || "Nothing yet."}</pre>
    </div>
  )
}
