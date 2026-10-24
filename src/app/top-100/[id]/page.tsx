"use client"

import { use, useEffect, useState } from "react"
import Link from "next/link"
import { useFirestore } from "@/firebase"
import { doc, getDoc } from "firebase/firestore"
import { ChevronLeft, Loader2 } from "lucide-react"
import { useRequireAuth } from "@/hooks/use-require-auth"
import { getSubjectColor } from "@/lib/subject-colors"
import { NoteBody } from "@/components/notes/note-body"
import { UpgradeGate } from "@/components/upgrade-gate"

// Notes already opened in this visit open instantly when you come back to them.
const seen = new Map<string, any>()

export default function Top100NotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const db = useFirestore()
  const { checkingAuth } = useRequireAuth()
  const [state, setState] = useState<"loading" | "ready" | "locked" | "missing" | "error">(seen.has(id) ? "ready" : "loading")
  const [note, setNote] = useState<any>(seen.get(id) || null)

  useEffect(() => {
    if (!db || checkingAuth) return
    if (seen.has(id)) { setNote(seen.get(id)); setState("ready"); return }
    let cancelled = false
    setState("loading")
    getDoc(doc(db, "top100Notes", id))
      .then((snap) => {
        if (cancelled) return
        if (!snap.exists()) { setState("missing"); return }
        const data = snap.data()
        seen.set(id, data)
        setNote(data)
        setState("ready")
      })
      .catch((e: any) => {
        if (cancelled) return
        setState(e?.code === "permission-denied" ? "locked" : "error")
      })
    return () => { cancelled = true }
  }, [db, id, checkingAuth])

  if (checkingAuth || state === "loading") {
    return <div className="h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 text-primary animate-spin" /></div>
  }

  const color = getSubjectColor(note?.subjectName || "")

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-12 space-y-8">
      <Link href="/top-100" className="text-xs font-bold uppercase tracking-widest flex items-center gap-1 hover:underline w-fit text-primary">
        <ChevronLeft className="h-3 w-3" /> Back to the 100 topics
      </Link>

      {state === "locked" && (
        <UpgradeGate type="content" title="The 100 Most Important Topics are for members" description="Get Scholar (₹999/year) to read all 100 high-yield topics with full notes." />
      )}
      {state === "missing" && <div className="text-center py-16 text-muted-foreground rounded-2xl glass border-none">This topic is not available yet.</div>}
      {state === "error" && <div className="text-center py-16 text-muted-foreground rounded-2xl glass border-none">Could not load this topic. Check your connection and try again.</div>}

      {state === "ready" && note && (
        <>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{note.name}</h1>
            <p className="text-muted-foreground mt-2">{note.chapterTitle || ""} &middot; {note.subjectName || ""}</p>
          </div>
          <NoteBody markdown={note.markdown || ""} borderClass={color.border} />
        </>
      )}
    </div>
  )
}
