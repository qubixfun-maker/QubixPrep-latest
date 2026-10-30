"use client"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { ArrowLeft, ChevronLeft, ChevronRight, Loader2, ZoomIn, ZoomOut } from "lucide-react"
import { useFirestore, useUser } from "@/firebase"
import { loadTop100List, loadTop100Image, type Top100Page } from "@/lib/top100-pages"

export default function Top100Viewer() {
  const { id } = useParams<{ id: string }>()
  const db = useFirestore()
  const { user } = useUser()
  const [pages, setPages] = useState<Top100Page[] | null>(null)
  const [src, setSrc] = useState("")
  const [err, setErr] = useState("")
  const [zoom, setZoom] = useState(false)

  useEffect(() => { if (db) loadTop100List(db).then(setPages).catch(() => setPages([])) }, [db])

  const { page, prev, next } = useMemo(() => {
    const list = pages || []
    const cur = list.find((p) => p.id === id)
    const same = cur ? list.filter((p) => p.subjectKey === cur.subjectKey) : []
    const i = same.findIndex((p) => p.id === id)
    return { page: cur, prev: i > 0 ? same[i - 1] : undefined, next: i >= 0 && i < same.length - 1 ? same[i + 1] : undefined }
  }, [pages, id])

  useEffect(() => {
    if (!db || !pages) return
    setSrc(""); setErr(""); setZoom(false)
    let live = true
    loadTop100Image(db, id, page?.updatedAt || 0)
      .then((s) => { if (live) setSrc(s) })
      .catch((e) => { if (live) setErr(e?.message === "not-found" ? "This topic is not available yet." : "Could not open this topic. Check your plan and internet connection, then try again.") })
    if (next) loadTop100Image(db, next.id, next.updatedAt || 0).catch(() => {}) // get the next topic ready
    return () => { live = false }
  }, [db, id, pages, page?.updatedAt, next?.id])

  // faint diagonal name on the sheet, so shared screenshots can be traced
  const mark = useMemo(() => {
    const t = (user?.email || user?.displayName || "QubixPrep").replace(/[<>&"']/g, "")
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="360" height="240"><text x="20" y="150" transform="rotate(-25 180 120)" font-family="sans-serif" font-size="20" font-weight="700" fill="rgba(0,0,0,0.08)">${t}</text></svg>`
    return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`
  }, [user])

  return (
    <div className="mx-auto max-w-3xl px-3 py-4 md:px-6">
      <div className="mb-3 flex items-center gap-2">
        <Link href="/top-100" aria-label="Back" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-border bg-card"><ArrowLeft className="h-5 w-5" /></Link>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-bold leading-tight">{page?.title || "Top 100"}</h1>
          {page && <p className="text-xs text-muted-foreground">{page.subject} · Topic {page.order}</p>}
        </div>
        <button onClick={() => setZoom((z) => !z)} aria-label="Zoom" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-border bg-card">
          {zoom ? <ZoomOut className="h-5 w-5" /> : <ZoomIn className="h-5 w-5" />}
        </button>
      </div>

      {!src && !err && <div className="flex justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}
      {err && <p className="rounded-2xl bg-secondary px-4 py-6 text-center text-sm">{err}</p>}

      {src && (
        <div className={`relative overflow-auto rounded-2xl border border-border bg-white ${zoom ? "max-h-[80vh]" : ""}`}
          onContextMenu={(e) => e.preventDefault()} style={{ WebkitTouchCallout: "none", userSelect: "none" } as React.CSSProperties}>
          <div className="relative" style={{ width: zoom ? "220%" : "100%" }}>
            <img src={src} alt={page?.title || "Topic"} draggable={false} onClick={() => setZoom((z) => !z)} className="block w-full select-none" />
            <div className="pointer-events-none absolute inset-0" style={{ backgroundImage: mark }} />
          </div>
        </div>
      )}

      <div className="mt-4 flex gap-3">
        {prev ? <Link href={`/top-100/${prev.id}`} className="flex flex-1 items-center gap-1 rounded-xl border border-border bg-card px-3 py-3 text-sm font-semibold"><ChevronLeft className="h-4 w-4 shrink-0" /><span className="truncate">{prev.title}</span></Link> : <span className="flex-1" />}
        {next ? <Link href={`/top-100/${next.id}`} className="flex flex-1 items-center justify-end gap-1 rounded-xl border border-border bg-card px-3 py-3 text-sm font-semibold"><span className="truncate">{next.title}</span><ChevronRight className="h-4 w-4 shrink-0" /></Link> : <span className="flex-1" />}
      </div>
    </div>
  )
}
