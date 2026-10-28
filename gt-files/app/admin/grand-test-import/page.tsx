"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { collection, deleteDoc, doc, getDoc, setDoc, updateDoc } from "firebase/firestore"
import { AlertTriangle, ArrowLeft, CheckCircle2, Loader2, Trash2, Upload } from "lucide-react"
import { useCollection, useFirestore, useUser } from "@/firebase"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { parsePaperZip, type ParsedPaper } from "@/lib/grand-import"

type Item = { key: string; paper: ParsedPaper; free: boolean; state: "ready" | "bad" | "uploading" | "done" | "failed"; msg?: string }

function toDataUrl(bytes: Uint8Array, name: string): string {
  const ext = (name.split(".").pop() || "jpg").toLowerCase()
  const mime = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : ext === "gif" ? "image/gif" : "image/jpeg"
  let bin = ""
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  return `data:${mime};base64,${btoa(bin)}`
}
async function withRetry(fn: () => Promise<void>) { try { await fn() } catch { await new Promise((r) => setTimeout(r, 900)); await fn() } }
async function pool<T>(items: T[], size: number, fn: (x: T) => Promise<void>) {
  let i = 0
  await Promise.all(Array.from({ length: size }, async () => { while (i < items.length) { const x = items[i++]; await fn(x) } }))
}

export default function GrandTestImport() {
  const db = useFirestore()
  const { user } = useUser()
  const [items, setItems] = useState<Item[]>([])
  const [reading, setReading] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState("")
  const [prog, setProg] = useState({ done: 0, total: 0, label: "" })
  const [firstFree, setFirstFree] = useState(1)
  const [sure, setSure] = useState("")

  const listQuery = useMemo(() => (db ? collection(db, "grandPapers") : null), [db])
  const { data: live } = useCollection(listQuery)
  const uploaded = useMemo(() => ((live as any[]) || []).slice().sort((a, b) => (a.n || 0) - (b.n || 0)), [live])

  async function onFiles(list: FileList | null) {
    setErr("")
    const files = Array.from(list || []).filter((f) => /\.zip$/i.test(f.name))
    if (!files.length) return
    setReading(true); setItems([])
    const out: Item[] = []
    const seen = new Set<number>()
    for (const f of files.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))) {
      const paper = await parsePaperZip(f.name, await f.arrayBuffer())
      if (paper.n && seen.has(paper.n)) paper.errors.push(`Another selected file is also Grand Test ${paper.n}.`)
      seen.add(paper.n)
      out.push({ key: f.name, paper, free: paper.n === 1, state: paper.errors.length ? "bad" : "ready" })
      setItems([...out].sort((a, b) => a.paper.n - b.paper.n))
    }
    setItems([...out].sort((a, b) => a.paper.n - b.paper.n))
    setReading(false)
  }

  function applyFirstFree(k: number) {
    setFirstFree(k)
    setItems((xs) => xs.map((x) => ({ ...x, free: x.paper.n <= k })))
  }

  async function assertAdmin() {
    if (!db || !user) throw new Error("Sign in first.")
    const me = await getDoc(doc(db, "users", user.uid))
    if (me.data()?.role !== "admin") throw new Error("Only an admin account can do this.")
    return db
  }

  const ready = items.filter((x) => x.state === "ready" || x.state === "failed")

  async function run() {
    setErr("")
    setBusy(true)
    try {
      const fdb = await assertAdmin()
      let n = 0
      setProg({ done: 0, total: ready.length, label: "Starting" })
      for (const it of ready) {
        const p = it.paper
        const set = (state: Item["state"], msg?: string) => setItems((xs) => xs.map((x) => (x.key === it.key ? { ...x, state, msg } : x)))
        set("uploading")
        setProg({ done: n, total: ready.length, label: `${p.title}: images` })
        try {
          const names = Object.keys(p.images)
          await pool(names, 6, async (name) => {
            await withRetry(async () => { await setDoc(doc(fdb, "grandImages", name), { d: toDataUrl(p.images[name], name) }) })
          })
          setProg({ done: n, total: ready.length, label: `${p.title}: questions` })
          const now = Date.now()
          await withRetry(async () => { await setDoc(doc(fdb, "grandPaperQs", p.id), { n: p.n, free: it.free, qs: p.qs, credits: p.credits, imgs: names, updatedAt: now }) })
          await withRetry(async () => {
            await setDoc(doc(fdb, "grandPapers", p.id), { n: p.n, title: p.title, count: p.qs.length, durationMin: Math.round((p.qs.length * 210) / 200), free: it.free, subjects: p.subjects, hasImages: names.length > 0, imgCount: names.length, updatedAt: now })
          })
          set("done")
        } catch (e: any) { set("failed", e?.message || "Upload failed") }
        n++
        setProg({ done: n, total: ready.length, label: "" })
      }
    } catch (e: any) { setErr(e?.message || "Import failed.") }
    setBusy(false)
  }

  async function toggleFree(p: any) {
    setErr("")
    try {
      const fdb = await assertAdmin()
      const free = !p.free
      await updateDoc(doc(fdb, "grandPaperQs", p.id), { free })
      await updateDoc(doc(fdb, "grandPapers", p.id), { free })
    } catch (e: any) { setErr(e?.message || "Could not change this paper.") }
  }

  async function remove(p: any) {
    if (sure !== p.id) { setSure(p.id); return }
    setSure(""); setErr("")
    try {
      const fdb = await assertAdmin()
      const q = await getDoc(doc(fdb, "grandPaperQs", p.id))
      const imgs: string[] = (q.data() as any)?.imgs || []
      await pool(imgs, 6, async (name) => { await deleteDoc(doc(fdb, "grandImages", name)) })
      await deleteDoc(doc(fdb, "grandPapers", p.id))
      await deleteDoc(doc(fdb, "grandPaperQs", p.id))
    } catch (e: any) { setErr(e?.message || "Could not delete this paper.") }
  }

  const bad = items.filter((x) => x.state === "bad").length

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 md:p-12">
      <Link href="/admin" className="inline-flex items-center gap-1 text-sm text-muted-foreground"><ArrowLeft className="h-4 w-4" /> Admin</Link>
      <div>
        <h1 className="text-3xl font-bold">Grand Test papers</h1>
        <p className="text-sm text-muted-foreground">Upload your grandtestN_qbank.zip files. Every paper is checked first; a paper with a problem is never uploaded. Uploading the same number again replaces that paper.</p>
      </div>

      <div className="space-y-3 rounded-2xl bg-white/5 p-4">
        <h2 className="font-bold">1. Choose the zip files</h2>
        <p className="text-xs text-muted-foreground">Select all of them at once (press Ctrl + A in the file window). Your files stay on this device until you press Upload.</p>
        <input type="file" accept=".zip" multiple disabled={busy || reading} onChange={(e) => onFiles(e.target.files)} className="text-sm" />
        {reading && <p className="flex items-center gap-2 text-sm"><Loader2 className="h-4 w-4 animate-spin" /> Checking {items.length} so far…</p>}
      </div>

      {items.length > 0 && (
        <div className="space-y-3 rounded-2xl bg-white/5 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-bold">2. Check and choose free papers</h2>
            <label className="flex items-center gap-2 text-sm">First <input type="number" min={0} max={99} value={firstFree} disabled={busy} onChange={(e) => applyFirstFree(Math.max(0, Number(e.target.value) || 0))} className="w-14 rounded-lg border border-white/20 bg-transparent px-2 py-1 text-center" /> papers free</label>
          </div>
          <div className="space-y-2">
            {items.map((x) => (
              <div key={x.key} className={`rounded-xl border p-3 text-sm ${x.state === "bad" ? "border-red-500/40 bg-red-500/5" : "border-white/10"}`}>
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-bold">{x.paper.title} <span className="font-normal text-muted-foreground">· {x.paper.qs.length} questions · {Object.keys(x.paper.images).length} images · {x.paper.subjects.length} subjects</span></p>
                    <p className="truncate text-xs text-muted-foreground">{x.key}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    {x.state !== "bad" && <label className="flex items-center gap-1.5 text-xs font-bold"><input type="checkbox" checked={x.free} disabled={busy} onChange={(e) => setItems((xs) => xs.map((y) => (y.key === x.key ? { ...y, free: e.target.checked } : y)))} /> Free</label>}
                    {x.state === "uploading" && <Loader2 className="h-4 w-4 animate-spin" />}
                    {x.state === "done" && <CheckCircle2 className="h-5 w-5 text-green-400" />}
                    {(x.state === "bad" || x.state === "failed") && <AlertTriangle className="h-5 w-5 text-red-400" />}
                  </div>
                </div>
                {x.paper.errors.slice(0, 6).map((e, k) => <p key={k} className="mt-1 text-xs text-red-400">{e}</p>)}
                {x.paper.errors.length > 6 && <p className="mt-1 text-xs text-red-400">…and {x.paper.errors.length - 6} more problems.</p>}
                {x.msg && <p className="mt-1 text-xs text-red-400">{x.msg}</p>}
                {x.paper.warnings.slice(0, 3).map((e, k) => <p key={k} className="mt-1 text-xs text-amber-400">{e}</p>)}
                {x.paper.warnings.length > 3 && <p className="mt-1 text-xs text-amber-400">…and {x.paper.warnings.length - 3} more notes.</p>}
              </div>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">{ready.length} ready{bad ? `, ${bad} with problems (these will be skipped)` : ""}.</p>
          <Button onClick={run} disabled={busy || reading || ready.length === 0} className="h-12 w-full gap-2 rounded-xl font-bold">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Upload {ready.length} paper{ready.length === 1 ? "" : "s"}
          </Button>
          {busy && <div className="space-y-2"><p className="text-sm font-bold">{prog.label} ({prog.done} of {prog.total} papers done)</p><Progress value={prog.total ? (prog.done / prog.total) * 100 : 0} className="h-2" /></div>}
        </div>
      )}
      {err && <p className="text-sm text-red-400">{err}</p>}

      <div className="space-y-3 rounded-2xl bg-white/5 p-4">
        <h2 className="font-bold">Papers live for students ({uploaded.length})</h2>
        {uploaded.length === 0 && <p className="text-sm text-muted-foreground">Nothing uploaded yet.</p>}
        {uploaded.map((p: any) => (
          <div key={p.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 p-3 text-sm">
            <p className="min-w-0 truncate font-bold">{p.title} <span className="font-normal text-muted-foreground">· {p.count} questions</span></p>
            <div className="flex shrink-0 items-center gap-2">
              <button onClick={() => toggleFree(p)} className={`rounded-full px-3 py-1 text-xs font-black ${p.free ? "bg-green-500/20 text-green-300" : "bg-white/10 text-muted-foreground"}`}>{p.free ? "Free" : "Paid"}</button>
              <button onClick={() => remove(p)} className="rounded-full p-2 text-red-400 hover:bg-red-500/10" aria-label="Delete">{sure === p.id ? <span className="px-1 text-xs font-black">Sure?</span> : <Trash2 className="h-4 w-4" />}</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
