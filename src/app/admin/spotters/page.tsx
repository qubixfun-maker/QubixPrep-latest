"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { collection, deleteDoc, doc, getDocs, serverTimestamp, setDoc } from "firebase/firestore"
import { deleteObject, getDownloadURL, ref as storageRef, uploadBytes } from "firebase/storage"
import { ArrowLeft, Check, FileArchive, Loader2, Lock, Trash2, TriangleAlert, Upload, Microscope } from "lucide-react"
import { useDoc, useFirestore, useStorage, useUser } from "@/firebase"
import { readZip, type ZipEntry } from "@/lib/spotters/zip"
import { fromDoc, toDoc, validateSpot, clearSpotsCache } from "@/lib/spotters/remote"
import type { Spot } from "@/lib/spotters/types"

const MIME: Record<string, string> = { webp: "image/webp", jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", gif: "image/gif" }
const MAX_IMG = 6 * 1024 * 1024

type Row = { spot: Spot; files: string[]; problems: string[]; replaces: boolean }
type Stored = Spot & { paths?: string[] }

export default function AdminSpottersPage() {
  const { user, loading: authLoading } = useUser()
  const db = useFirestore()
  const storage = useStorage()
  const profileRef = useMemo(() => (!db || !user ? null : doc(db, "users", user.uid)), [db, user])
  const { data: profile, loading: profileLoading } = useDoc(profileRef)
  const isAdmin = !authLoading && !profileLoading && !!user && (profile as any)?.role === "admin"

  const [stored, setStored] = useState<Stored[] | null>(null)
  const [err, setErr] = useState("")
  const [zipName, setZipName] = useState("")
  const [entries, setEntries] = useState<Map<string, ZipEntry> | null>(null)
  const [rows, setRows] = useState<Row[] | null>(null)
  const [note, setNote] = useState("")
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState<{ done: number; total: number; label: string } | null>(null)
  const [result, setResult] = useState<{ ok: number; failed: string[] } | null>(null)
  const [confirmDel, setConfirmDel] = useState<string | null>(null)
  const input = useRef<HTMLInputElement>(null)

  const loadStored = useCallback(async () => {
    if (!db) return
    try {
      const snap = await getDocs(collection(db, "spotters"))
      setStored(snap.docs.map((d) => ({ ...(fromDoc(d.data()) as Spot), paths: (d.data() as any).paths || [] })).filter((x) => x.id).sort((a, b) => a.name.localeCompare(b.name)))
    } catch (e: any) {
      setStored([])
      setErr("Could not read uploaded items. Deploy the Firestore rules first (firebase deploy --only firestore:rules). " + (e?.message || ""))
    }
  }, [db])
  useEffect(() => { if (isAdmin) loadStored() }, [isAdmin, loadStored])

  /** Finds a file in the zip by its exact path, or by file name as a fallback. */
  const find = useCallback((map: Map<string, ZipEntry>, f: string) => {
    const clean = f.replace(/^\.?\//, "").replace(/\\/g, "/")
    if (map.has(clean.toLowerCase())) return map.get(clean.toLowerCase())!
    const base = clean.split("/").pop()!.toLowerCase()
    for (const [k, v] of map) if (k.split("/").pop() === base) return v
    return null
  }, [])

  async function onPick(file: File | null) {
    setRows(null); setEntries(null); setResult(null); setNote(""); setErr("")
    if (!file) return
    setZipName(file.name); setBusy(true)
    try {
      const list = await readZip(file)
      const map = new Map<string, ZipEntry>()
      list.forEach((e) => { if (!/(^|\/)(__MACOSX|\.)/.test(e.name)) map.set(e.name.toLowerCase(), e) })
      const jsonEntry = [...map.entries()].find(([k]) => k.split("/").pop() === "spotters.json")
      if (!jsonEntry) throw new Error("spotters.json was not found inside the zip. See the format notes below.")
      let raw: any
      try { raw = JSON.parse(new TextDecoder().decode(await jsonEntry[1].read())) } catch { throw new Error("spotters.json is not valid JSON.") }
      const items: any[] = Array.isArray(raw) ? raw : Array.isArray(raw?.items) ? raw.items : []
      if (!items.length) throw new Error("spotters.json has no items.")

      const have = new Set((stored || []).map((s) => s.id))
      const seen = new Set<string>()
      const out: Row[] = []
      const bad: string[] = []
      for (const it of items) {
        const { spot, error } = validateSpot(it)
        if (!spot) { bad.push(error); continue }
        const problems: string[] = []
        if (seen.has(spot.id)) problems.push("Same id used twice in the zip")
        seen.add(spot.id)
        const files: string[] = []
        for (const im of spot.imgs) {
          const e = find(map, im.f)
          if (!e) problems.push(`Image missing in zip: ${im.f}`)
          else {
            const ext = e.name.split(".").pop()!.toLowerCase()
            if (!MIME[ext]) problems.push(`Unsupported image type: ${im.f}`)
            else if (e.size > MAX_IMG) problems.push(`Image is over 6 MB: ${im.f}`)
          }
          files.push(im.f)
        }
        out.push({ spot, files, problems, replaces: have.has(spot.id) })
      }
      setEntries(map); setRows(out)
      if (bad.length) setNote(`${bad.length} item(s) in spotters.json were skipped: ${bad.slice(0, 5).join(" | ")}${bad.length > 5 ? " ..." : ""}`)
    } catch (e: any) {
      setErr(e?.message || "Could not read this zip.")
    } finally { setBusy(false) }
  }

  const good = (rows || []).filter((r) => !r.problems.length)
  const flagged = (rows || []).filter((r) => r.problems.length)

  async function upload() {
    if (!db || !storage || !user || !entries || !good.length) return
    setBusy(true); setResult(null); setErr("")
    const failed: string[] = []
    let ok = 0
    const total = good.reduce((n, r) => n + r.spot.imgs.length, 0) + good.length
    let done = 0
    const tick = (label: string) => setProgress({ done: ++done, total, label })
    setProgress({ done: 0, total, label: "Starting" })
    for (const r of good) {
      try {
        const old = (stored || []).find((s) => s.id === r.spot.id)
        const stamp = Date.now()
        const paths: string[] = []
        const imgs: { f: string; cap?: string }[] = []
        for (let j = 0; j < r.spot.imgs.length; j++) {
          const im = r.spot.imgs[j]
          const e = find(entries, im.f)!
          const ext = e.name.split(".").pop()!.toLowerCase()
          const bytes = await e.read()
          const path = `spotters/${r.spot.id}/${j + 1}-${stamp}.${ext}`
          await uploadBytes(storageRef(storage, path), new Blob([bytes as any], { type: MIME[ext] }), { contentType: MIME[ext] })
          imgs.push({ f: await getDownloadURL(storageRef(storage, path)), ...(im.cap ? { cap: im.cap } : {}) })
          paths.push(path)
          tick(`${r.spot.name} (photo ${j + 1})`)
        }
        await setDoc(doc(db, "spotters", r.spot.id), { ...toDoc({ ...r.spot, imgs }), paths, uploadedAt: serverTimestamp(), uploadedBy: user.uid })
        tick(r.spot.name)
        ok++
        // old photos are no longer used
        for (const p of old?.paths || []) { try { await deleteObject(storageRef(storage, p)) } catch {} }
      } catch (e: any) {
        failed.push(`${r.spot.name}: ${e?.message || "failed"}`)
      }
    }
    clearSpotsCache()
    setResult({ ok, failed }); setProgress(null); setBusy(false)
    setRows(null); setEntries(null); setZipName(""); if (input.current) input.current.value = ""
    loadStored()
  }

  async function remove(s: Stored) {
    if (!db || !storage) return
    setBusy(true)
    try {
      await deleteDoc(doc(db, "spotters", s.id))
      for (const p of s.paths || []) { try { await deleteObject(storageRef(storage, p)) } catch {} }
      clearSpotsCache()
      setConfirmDel(null)
      await loadStored()
    } catch (e: any) { setErr(e?.message || "Could not delete.") } finally { setBusy(false) }
  }

  if (authLoading || profileLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
  if (!isAdmin) return <div className="flex h-[80vh] flex-col items-center justify-center p-6 text-center"><Lock className="mb-4 h-12 w-12 text-destructive" /><h1 className="text-2xl font-bold">Admin Restricted</h1><Link href="/" className="mt-4 font-bold text-primary underline">Return home</Link></div>

  const tile = "rounded-3xl border border-border bg-card p-4 shadow-sm"
  const pct = progress ? Math.round((progress.done / Math.max(1, progress.total)) * 100) : 0

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 md:p-10">
      <div className="flex items-center gap-3">
        <Link href="/admin" aria-label="Back" className="grid h-10 w-10 place-items-center rounded-full border border-border bg-card"><ArrowLeft className="h-5 w-5" /></Link>
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-black"><Microscope className="h-6 w-6 text-primary" /> Spot &amp; Identify uploads</h1>
          <p className="text-sm text-muted-foreground">Upload a zip of photos and notes. It appears in the app straight away, with no code change.</p>
        </div>
      </div>

      {err && <div className="flex gap-2 rounded-2xl border border-red-300 bg-red-50 p-3 text-sm text-red-800"><TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" /><span>{err}</span></div>}
      {result && (
        <div className={"rounded-2xl border p-3 text-sm " + (result.failed.length ? "border-amber-300 bg-amber-50 text-amber-900" : "border-emerald-300 bg-emerald-50 text-emerald-900")}>
          <p className="flex items-center gap-2 font-bold"><Check className="h-4 w-4" /> {result.ok} item(s) uploaded. Open Spot &amp; Identify to see them.</p>
          {result.failed.map((f, i) => <p key={i} className="mt-1">Failed: {f}</p>)}
        </div>
      )}

      <section className={tile + " space-y-3"}>
        <h2 className="font-black">1. Choose the zip</h2>
        <label className="flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-border p-6 text-center hover:bg-secondary/50">
          <FileArchive className="h-8 w-8 text-primary" />
          <span className="text-sm font-bold">{zipName || "Tap to pick a .zip file"}</span>
          <input ref={input} type="file" accept=".zip,application/zip" className="hidden" disabled={busy} onChange={(e) => onPick(e.target.files?.[0] || null)} />
        </label>
        {busy && !progress && <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Reading...</p>}
        {note && <p className="rounded-xl bg-amber-50 p-2 text-xs text-amber-900">{note}</p>}
      </section>

      {rows && (
        <section className={tile + " space-y-3"}>
          <h2 className="font-black">2. Check, then upload</h2>
          <p className="text-sm"><b>{good.length}</b> item(s) ready{flagged.length ? <>, <b className="text-red-700">{flagged.length}</b> with problems (these are skipped)</> : null}. {good.filter((g) => g.replaces).length > 0 && <>{good.filter((g) => g.replaces).length} will replace an item that is already uploaded.</>}</p>
          <div className="max-h-72 space-y-1.5 overflow-auto rounded-2xl bg-secondary/40 p-2 text-sm">
            {rows.map((r) => (
              <div key={r.spot.id} className="rounded-xl bg-card p-2">
                <p className="flex items-center gap-2 font-bold">{r.problems.length ? <TriangleAlert className="h-4 w-4 shrink-0 text-red-600" /> : <Check className="h-4 w-4 shrink-0 text-emerald-600" />}<span className="line-clamp-1">{r.spot.name}</span><span className="ml-auto shrink-0 text-xs font-normal text-muted-foreground">{r.spot.group} · {r.spot.imgs.length} photo(s){r.replaces ? " · replaces" : ""}</span></p>
                {r.problems.map((p, i) => <p key={i} className="ml-6 text-xs text-red-700">{p}</p>)}
              </div>
            ))}
          </div>
          {progress ? (
            <div className="space-y-1">
              <div className="h-2.5 overflow-hidden rounded-full bg-secondary"><div className="h-full bg-primary transition-all" style={{ width: pct + "%" }} /></div>
              <p className="text-xs text-muted-foreground">{pct}% · {progress.label}. Keep this page open.</p>
            </div>
          ) : (
            <button onClick={upload} disabled={busy || !good.length} className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 font-bold text-white disabled:opacity-50"><Upload className="h-4 w-4" /> Upload {good.length} item(s)</button>
          )}
        </section>
      )}

      <section className={tile + " space-y-3"}>
        <h2 className="font-black">Uploaded so far {stored ? `(${stored.length})` : ""}</h2>
        {!stored ? <Loader2 className="h-5 w-5 animate-spin text-primary" /> : stored.length === 0 ? <p className="text-sm text-muted-foreground">Nothing uploaded yet. The built-in items that came with the app are not listed here.</p> : (
          <div className="max-h-96 space-y-1.5 overflow-auto">
            {stored.map((s) => (
              <div key={s.id} className="flex items-center gap-3 rounded-xl bg-secondary/40 p-2 text-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.imgs[0]?.f} alt="" className="h-12 w-12 shrink-0 rounded-lg bg-black object-cover" />
                <div className="min-w-0 flex-1"><p className="line-clamp-1 font-bold">{s.name}</p><p className="line-clamp-1 text-xs text-muted-foreground">{s.subject} · {s.group} · {s.topic}</p></div>
                {confirmDel === s.id ? (
                  <div className="flex gap-1.5"><button onClick={() => remove(s)} disabled={busy} className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white">Delete</button><button onClick={() => setConfirmDel(null)} className="rounded-lg border border-border px-3 py-1.5 text-xs font-bold">Cancel</button></div>
                ) : (
                  <button onClick={() => setConfirmDel(s.id)} aria-label="Delete" className="grid h-8 w-8 place-items-center rounded-lg border border-border text-red-600"><Trash2 className="h-4 w-4" /></button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className={tile + " space-y-2 text-sm"}>
        <h2 className="font-black">Zip format</h2>
        <p>The zip must contain a file named <code className="rounded bg-secondary px-1">spotters.json</code> and the photos. Photos can be in any folder; <code className="rounded bg-secondary px-1">f</code> is the path inside the zip. webp, jpg, png and gif are accepted, up to 6 MB each.</p>
        <pre className="overflow-auto rounded-2xl bg-secondary p-3 text-xs leading-relaxed">{`[
  {
    "id": "sur-allis",                 // unique, small letters and dashes
    "name": "Allis tissue forceps",
    "subject": "Surgery",
    "group": "Instruments",            // Instruments | Gross specimens | Pathology slides | Histology slides | any new name
    "topic": "Forceps",
    "labelled": false,                 // true if the answer is written on the photo
    "imgs": [{ "f": "images/allis.webp", "cap": "Optional caption" }],
    "identify": ["Point 1", "Point 2", "Point 3"],
    "about": "A short paragraph.",
    "points": ["Use or clinical point"],
    "viva": ["Question? — Answer"],
    "mcq": [["Question", "Correct", "Wrong 1", "Wrong 2", "Wrong 3", "Explanation"]]
  }
]`}</pre>
        <p className="text-xs text-muted-foreground">Uploading an item with an id that already exists replaces it. Only upload photos you own or have the right to use.</p>
      </section>
    </div>
  )
}
