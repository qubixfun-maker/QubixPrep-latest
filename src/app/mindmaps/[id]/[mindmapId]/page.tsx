"use client"

import { useEffect, useMemo, useState, use } from "react"
import { useDoc, useFirestore, useUser } from "@/firebase"
import { doc, getDoc, setDoc } from "firebase/firestore"
import { ChevronLeft, Loader2, Share2, Bookmark, Flag, HelpCircle, X } from "lucide-react"
import Link from "next/link"
import MindMapCanvas from "@/components/mindmap/MindMapCanvas"
import { useRequireAuth } from "@/hooks/use-require-auth"
import { getSubjectColor } from "@/lib/subject-colors"

function readList(key: string): string[] {
  try { return JSON.parse(localStorage.getItem(key) || "[]") } catch { return [] }
}
function writeList(key: string, list: string[]) {
  try { localStorage.setItem(key, JSON.stringify(list)) } catch {}
}

export default function MindmapViewPage({ params }: { params: Promise<{ id: string; mindmapId: string }> }) {
  const { id: subjectId, mindmapId } = use(params)
  const db = useFirestore()
  const { user } = useUser()

  const mmRef = useMemo(() => (!db ? null : doc(db, 'subjects', subjectId, 'mindmaps', mindmapId)), [db, subjectId, mindmapId])
  const { data: mindmap, loading } = useDoc(mmRef)
  const subjectRef = useMemo(() => (!db ? null : doc(db, 'subjects', subjectId)), [db, subjectId])
  const { data: subject } = useDoc(subjectRef)

  const { checkingAuth } = useRequireAuth()
  const color = getSubjectColor(subjectId)

  const [saved, setSaved] = useState(false)
  const [flagged, setFlagged] = useState(false)
  const [help, setHelp] = useState(false)
  const [note, setNote] = useState("")
  useEffect(() => {
    setSaved(readList("mm-saved").includes(mindmapId))
    setFlagged(readList("mm-revise").includes(mindmapId))
  }, [mindmapId])
  useEffect(() => {
    if (!db || !user) return
    getDoc(doc(db, "users", user.uid, "progress", "mindmapMarks")).then((snap) => {
      const d: any = snap.exists() ? snap.data() : {}
      const merge = (key: string, remote: string[]) => { const m = Array.from(new Set([...readList(key), ...(remote || [])])); writeList(key, m); return m }
      const s = merge("mm-saved", d.saved), r = merge("mm-revise", d.revise)
      setSaved(s.includes(mindmapId)); setFlagged(r.includes(mindmapId))
    }).catch(() => {})
  }, [db, user, mindmapId])

  function flash(msg: string) { setNote(msg); setTimeout(() => setNote(""), 1800) }
  function toggleList(key: string, on: boolean, set: (v: boolean) => void, onMsg: string, offMsg: string) {
    const list = readList(key).filter((x) => x !== mindmapId)
    if (!on) list.push(mindmapId)
    writeList(key, list); set(!on); flash(!on ? onMsg : offMsg)
    if (db && user) setDoc(doc(db, "users", user.uid, "progress", "mindmapMarks"), { [key === "mm-saved" ? "saved" : "revise"]: list }, { merge: true }).catch(() => {})
  }
  async function share() {
    const url = typeof window !== "undefined" ? window.location.href : ""
    try {
      if (navigator.share) { await navigator.share({ title: (mindmap as any)?.title || "Mind map", url }); return }
    } catch { return }
    try { await navigator.clipboard.writeText(url); flash("Link copied") } catch { flash("Copy the address bar link to share") }
  }

  if (checkingAuth || loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 text-primary animate-spin" /></div>

  if (!mindmap) {
    return (
      <div className="max-w-2xl mx-auto p-4 md:p-12 space-y-6">
        <Link href={`/mindmaps/${subjectId}`} className={`text-xs font-bold uppercase tracking-widest ${color.text} flex items-center gap-1 w-fit hover:underline`}>
          <ChevronLeft className="h-3 w-3" /> Back
        </Link>
        <div className="text-center py-16 text-muted-foreground rounded-2xl glass border-none">Mind map not found.</div>
      </div>
    )
  }

  const mm = mindmap as any
  const subjectName = (subject as any)?.name || ""
  const tile = "grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-slate-200/80 bg-white/90 shadow-[0_4px_16px_rgba(30,41,59,.1)] backdrop-blur transition active:scale-95 hover:bg-white sm:h-14 sm:w-14"

  return (
    <div className="fixed inset-0 z-[70] bg-[#f3f4f8] text-slate-900">
      <div className="absolute inset-0">
        {mm.type === "radial" && mm.data ? (
          <MindMapCanvas root={{ name: mm.data.centralTopic, branches: mm.data.branches }} />
        ) : mm.imageUrl ? (
          <div className="flex h-full items-center justify-center overflow-auto p-4 pt-28"><img src={mm.imageUrl} alt={mm.title} className="max-w-full rounded-2xl" /></div>
        ) : (
          <div className="flex h-full items-center justify-center text-slate-500">This mind map has no content.</div>
        )}
      </div>

      {/* header */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center gap-2.5 px-3 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:gap-3 sm:px-5" style={{ background: "linear-gradient(180deg, rgba(243,244,248,.96) 55%, rgba(243,244,248,0))" }}>
        <Link href={`/mindmaps/${subjectId}`} aria-label="Back" className={`pointer-events-auto ${tile}`}><ChevronLeft className="h-6 w-6 text-slate-700" /></Link>
        <div className="pointer-events-none min-w-0 flex-1 px-1">
          <h1 className="truncate text-xl font-extrabold leading-tight tracking-tight sm:text-2xl">{mm.title}</h1>
          {subjectName && <p className="truncate text-sm font-medium text-slate-500 sm:text-base">{subjectName}</p>}
        </div>
        <button onClick={share} aria-label="Share" className={`pointer-events-auto ${tile}`}><Share2 className="h-5 w-5 text-sky-600" /></button>
        <button onClick={() => toggleList("mm-saved", saved, setSaved, "Saved", "Removed from saved")} aria-label="Bookmark" className={`pointer-events-auto ${tile}`}><Bookmark className={`h-5 w-5 ${saved ? "fill-slate-700 text-slate-700" : "text-slate-500"}`} /></button>
        <button onClick={() => toggleList("mm-revise", flagged, setFlagged, "Marked for revision", "Revision mark removed")} aria-label="Mark for revision" className={`pointer-events-auto ${tile}`}><Flag className={`h-5 w-5 ${flagged ? "fill-amber-500 text-amber-500" : "text-amber-500"}`} /></button>
        <button onClick={() => setHelp(true)} aria-label="Help" className="pointer-events-auto grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-indigo-600 text-white shadow-[0_8px_22px_rgba(79,70,229,.45)] transition active:scale-95 sm:h-14 sm:w-14"><HelpCircle className="h-6 w-6" /></button>
      </div>

      {note && <div className="pointer-events-none absolute left-1/2 top-24 z-30 -translate-x-1/2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-lg">{note}</div>}

      {help && (
        <div onClick={() => setHelp(false)} className="absolute inset-0 z-40 grid place-items-center bg-slate-900/40 p-5 backdrop-blur-sm">
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl">
            <div className="mb-3 flex items-center justify-between"><p className="text-lg font-extrabold">How to use this map</p><button onClick={() => setHelp(false)} aria-label="Close" className="grid h-9 w-9 place-items-center rounded-full bg-slate-100"><X className="h-4 w-4" /></button></div>
            <ul className="space-y-2.5 text-sm text-slate-600">
              <li><b className="text-slate-800">Drag</b> to move around, <b className="text-slate-800">pinch</b> or scroll to zoom.</li>
              <li><b className="text-slate-800">Tap a dot</b> (or its name) to open or close its sub-topics. The orange dot marks nodes with sub-topics.</li>
              <li><b className="text-emerald-600">Green page button</b> shows or hides the short notes under each node.</li>
              <li><b className="text-sky-600">Arrows</b> expand or collapse the whole map. The frame button fits it to your screen.</li>
              <li><b className="text-slate-800">Bookmark</b> and <b className="text-amber-500">flag</b> save this map on this device for later revision.</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
