"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Loader2, Lock, Check, Trash2, Mail } from "lucide-react"
import { collection, doc, orderBy, query, updateDoc, deleteDoc } from "firebase/firestore"
import { useCollection, useDoc, useFirestore, useUser } from "@/firebase"

type Tab = "support" | "reports"

export default function AdminInbox() {
  const db = useFirestore()
  const { user, loading: authLoading } = useUser()
  const profileRef = useMemo(() => (!db || !user ? null : doc(db, "users", user.uid)), [db, user])
  const { data: profile, loading: profLoading } = useDoc(profileRef)
  const isAdmin = (profile as any)?.role === "admin"
  const [tab, setTab] = useState<Tab>("support")
  const [showDone, setShowDone] = useState(false)

  const supportQ = useMemo(() => (!db || !isAdmin ? null : query(collection(db, "supportRequests"), orderBy("createdAt", "desc"))), [db, isAdmin])
  const reportsQ = useMemo(() => (!db || !isAdmin ? null : query(collection(db, "questionReports"), orderBy("createdAt", "desc"))), [db, isAdmin])
  const { data: support } = useCollection(supportQ)
  const { data: reports } = useCollection(reportsQ)

  if (authLoading || profLoading) return <div className="flex h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  if (!isAdmin) return <div className="flex h-[60vh] flex-col items-center justify-center gap-3 text-center"><Lock className="h-10 w-10 text-destructive" /><p className="text-xl font-bold">Admin only</p><Link href="/" className="text-primary underline">Home</Link></div>

  const rows = ((tab === "support" ? support : reports) as any[] | null) || []
  const list = rows.filter((r) => showDone || r.status !== "done")
  const col = tab === "support" ? "supportRequests" : "questionReports"
  const when = (r: any) => { try { return r.createdAt?.toDate?.().toLocaleString("en-IN") || "" } catch { return "" } }

  return (
    <div className="mx-auto max-w-4xl space-y-5 p-4 md:p-8">
      <div className="flex items-center gap-3">
        <Link href="/admin" className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-card"><ArrowLeft className="h-4 w-4" /></Link>
        <h1 className="text-2xl font-black">Support inbox</h1>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {([["support", `Messages (${(support as any[] | null)?.filter((r) => r.status !== "done").length ?? 0})`], ["reports", `Question reports (${(reports as any[] | null)?.filter((r) => r.status !== "done").length ?? 0})`]] as [Tab, string][]).map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} className={`rounded-full border px-4 py-2 text-xs font-extrabold ${tab === id ? "border-primary bg-primary text-white" : "border-border bg-card"}`}>{label}</button>
        ))}
        <label className="ml-auto flex items-center gap-2 text-xs font-bold text-muted-foreground"><input type="checkbox" checked={showDone} onChange={(e) => setShowDone(e.target.checked)} /> Show resolved</label>
      </div>

      {list.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-card p-10 text-center text-muted-foreground">Nothing here. All clear.</div>
      ) : (
        <div className="space-y-3">
          {list.map((r) => (
            <div key={r.id} className={`space-y-2 rounded-2xl border bg-card p-4 shadow-sm ${r.status === "done" ? "opacity-60" : "border-border"}`}>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 font-extrabold text-primary">{tab === "support" ? r.topic : r.reason}</span>
                {r.plan && <span className="rounded-full bg-secondary px-2.5 py-0.5 font-bold">{r.plan}</span>}
                <span className="text-muted-foreground">{when(r)}</span>
              </div>
              {tab === "support" ? (
                <p className="whitespace-pre-wrap text-sm">{r.message}</p>
              ) : (
                <div className="space-y-1 text-sm">
                  <p className="font-bold">{r.subjectName || r.subjectId} · {r.topic}</p>
                  <p className="rounded-xl bg-secondary p-3">{r.question}</p>
                  {r.note && <p><b>Student note:</b> {r.note}</p>}
                  {r.subjectId && <Link href={`/qbank/${r.subjectId}`} className="text-xs font-bold text-primary underline">Open this subject's QBank</Link>}
                </div>
              )}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-xs text-muted-foreground">{r.name || ""} {r.email || ""}</span>
                <span className="ml-auto flex gap-2">
                  {r.email && <a href={`mailto:${r.email}?subject=${encodeURIComponent("Re: your QubixPrep message")}`} className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs font-bold"><Mail className="h-3 w-3" /> Reply</a>}
                  {r.status !== "done" && <button onClick={() => updateDoc(doc(db!, col, r.id), { status: "done" })} className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white"><Check className="h-3 w-3" /> Resolve</button>}
                  <button onClick={() => deleteDoc(doc(db!, col, r.id))} className="inline-flex items-center gap-1 rounded-full border border-rose-300 px-3 py-1.5 text-xs font-bold text-rose-600"><Trash2 className="h-3 w-3" /> Delete</button>
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
