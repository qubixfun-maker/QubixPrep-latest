"use client"

import { useMemo, useRef, useState } from "react"
import { doc, getDoc, setDoc } from "firebase/firestore"
import { useFirestore, useUser } from "@/firebase"
import { listZip, readZipItem, readQuestionsXlsx, type PyqQ, type ZipItem } from "@/lib/pyq/zip-import"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Loader2, Upload } from "lucide-react"

const MIME: Record<string, string> = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", gif: "image/gif" }

function toDataUrl(blob: Blob): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader()
    r.onload = () => res(String(r.result))
    r.onerror = () => rej(r.error)
    r.readAsDataURL(blob)
  })
}

async function pool<T>(items: T[], size: number, fn: (x: T) => Promise<void>, tick: () => void) {
  let i = 0
  await Promise.all(Array.from({ length: size }, async () => {
    while (i < items.length) { const x = items[i++]; await fn(x); tick() }
  }))
}

async function withRetry(fn: () => Promise<void>) {
  try { await fn() } catch { await new Promise((r) => setTimeout(r, 800)); await fn() }
}

export default function PyqImportPage() {
  const db = useFirestore()
  const { user } = useUser()
  const input = useRef<HTMLInputElement>(null)
  const [zip, setZip] = useState<File | null>(null)
  const [qs, setQs] = useState<PyqQ[] | null>(null)
  const [imgs, setImgs] = useState<Map<string, ZipItem>>(new Map())
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState("")
  const [done, setDone] = useState(false)
  const [prog, setProg] = useState({ label: "", done: 0, total: 0 })

  const needed = useMemo(() => {
    const s = new Set<string>()
    ;(qs || []).forEach((q) => [...q.qimgs, ...q.eimgs].forEach((n) => s.add(n)))
    return [...s]
  }, [qs])
  const missing = useMemo(() => needed.filter((n) => !imgs.has(n)), [needed, imgs])
  const problems = useMemo(() => (qs || []).filter((q) => q.options.length < 2 || q.correct < 0 || q.correct >= q.options.length).length, [qs])

  async function onPick(file: File | null) {
    setErr(""); setDone(false); setQs(null); setImgs(new Map()); setZip(null)
    if (!file) return
    setBusy(true)
    setProg({ label: "Reading the zip", done: 0, total: 1 })
    try {
      const items = await listZip(file)
      const x = items.find((i) => /\.xlsx$/i.test(i.name) && !i.name.includes("/"))
        || items.find((i) => /\.xlsx$/i.test(i.name))
      if (!x) throw new Error("No .xlsx spreadsheet was found inside this zip.")
      const list = await readQuestionsXlsx(await readZipItem(file, x))
      if (!list.length) throw new Error("The spreadsheet has no questions.")
      const m = new Map<string, ZipItem>()
      items.forEach((i) => { const n = i.name.split("/").pop() || ""; if (MIME[n.split(".").pop()?.toLowerCase() || ""]) m.set(n, i) })
      setZip(file); setQs(list); setImgs(m)
    } catch (e: any) { setErr(e?.message || "Could not read this zip.") }
    setBusy(false)
  }

  async function run() {
    if (!db || !user || !qs || !zip) return
    const fdb = db
    const file = zip
    setBusy(true); setErr(""); setDone(false)
    try {
      const me = await getDoc(doc(fdb, "users", user.uid))
      if (me.data()?.role !== "admin") throw new Error("Only an admin account can import. Sign in as admin.")

      const failed: string[] = []
      let n = 0
      setProg({ label: "Uploading images", done: 0, total: needed.length })
      await pool(needed, 6, async (name) => {
        try {
          await withRetry(async () => {
            const it = imgs.get(name)!
            const bytes = await readZipItem(file, it)
            const type = MIME[name.split(".").pop()!.toLowerCase()]
            const d = await toDataUrl(new Blob([bytes as any], { type }))
            await setDoc(doc(fdb, "pyqImages", name), { d })
          })
        } catch { failed.push(name) }
      }, () => { n++; setProg({ label: "Uploading images", done: n, total: needed.length }) })
      if (failed.length) throw new Error(`${failed.length} images failed (for example ${failed[0]}). Press Import again. Finished images are simply overwritten.`)

      n = 0
      setProg({ label: "Uploading questions", done: 0, total: qs.length })
      await pool(qs, 10, async (q) => {
        const { id, ...rest } = q
        await withRetry(async () => { await setDoc(doc(fdb, "pyqQuestions", id), { ...rest, hasQImg: q.qimgs.length > 0 }) })
      }, () => { n++; setProg({ label: "Uploading questions", done: n, total: qs.length }) })

      setProg({ label: "Saving filter index", done: 0, total: 1 })
      const rows = qs.map((q) => `${q.id}|${q.exam}|${q.year}|${q.subject}|${q.qimgs.length > 0 ? 1 : 0}`)
      await setDoc(doc(fdb, "pyqMeta", "facets"), { rows, count: rows.length, updatedAt: Date.now() })
      setProg({ label: "Saving filter index", done: 1, total: 1 })
      setDone(true)
    } catch (e: any) { setErr(e?.message || "Import failed.") }
    setBusy(false)
  }

  const ready = !!qs && missing.length === 0 && !busy

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-12 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">PYQ Import</h1>
        <p className="text-sm text-muted-foreground">Upload the PYQ zip (the spreadsheet plus the images folder). It is safe to upload again; the same questions are simply overwritten.</p>
      </div>

      <label className="flex flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-white/15 p-8 text-center cursor-pointer hover:bg-white/5">
        <Upload className="h-6 w-6" />
        <span className="text-sm font-bold">{zip ? zip.name : "Tap to pick the PYQ .zip file"}</span>
        <input ref={input} type="file" accept=".zip,application/zip" className="hidden" disabled={busy} onChange={(e) => onPick(e.target.files?.[0] || null)} />
      </label>

      {qs && (
        <div className="rounded-2xl bg-white/5 p-4 text-sm space-y-1">
          <p className="text-green-400 font-bold">{qs.length} questions and {needed.length} images found.</p>
          {missing.length > 0 && <p className="text-red-400">{missing.length} images the questions need are missing from the zip, for example {missing[0]}.</p>}
          {problems > 0 && <p className="text-yellow-400">{problems} questions look odd (fewer than 2 options or a bad answer). They are imported as they are.</p>}
        </div>
      )}

      <Button onClick={run} disabled={!ready} className="w-full h-12 rounded-xl font-bold gap-2">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Import
      </Button>

      {busy && (
        <div className="space-y-2">
          <p className="text-sm font-bold">{prog.label}: {prog.done} / {prog.total}</p>
          <Progress value={prog.total ? (prog.done / prog.total) * 100 : 0} className="h-2" />
        </div>
      )}
      {err && <p className="text-sm text-red-400">{err}</p>}
      {done && <p className="text-sm font-bold text-green-400">Done. {qs?.length} questions and {needed.length} images are live. Open /pyq to check.</p>}
    </div>
  )
}
