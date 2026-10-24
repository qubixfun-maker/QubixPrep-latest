"use client"

import { use, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useDoc, useFirestore, useUser } from "@/firebase"
import { doc, getDoc } from "firebase/firestore"
import { ChevronLeft, Loader2 } from "lucide-react"
import { useRequireAuth } from "@/hooks/use-require-auth"
import { usePlan } from "@/hooks/use-plan"
import { getSubjectColor } from "@/lib/subject-colors"
import { getCached, putCached, removeCached, clearTop100Cache } from "@/lib/top100-cache"
import { NoteBody } from "@/components/notes/note-body"
import { UpgradeGate } from "@/components/upgrade-gate"

// Notes already opened in this visit open instantly when you come back to them (kept per account).
const seen = new Map<string, any>()

export default function Top100NotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const db = useFirestore()
  const { user } = useUser()
  const uid = user?.uid
  const { checkingAuth } = useRequireAuth()
  const { canAccessContent, loading: planLoading } = usePlan()
  const profileRef = useMemo(() => (!db || !uid ? null : doc(db, "users", uid)), [db, uid])
  const { data: profile, loading: profileLoading } = useDoc(profileRef)
  const entitled = !!canAccessContent || (profile as any)?.role === "admin"

  const [state, setState] = useState<"loading" | "ready" | "locked" | "missing" | "error">("loading")
  const [note, setNote] = useState<any>(null)

  useEffect(() => {
    if (!db || !uid || checkingAuth || planLoading || profileLoading) return
    let cancelled = false
    ;(async () => {
      const k = `${uid}:${id}`
      let shown = false
      // 1) show what is already on this device straight away (only for members whose plan is active)
      const mem = entitled ? seen.get(k) : null
      const saved = mem || (entitled ? await getCached(uid, id) : null)
      if (cancelled) return
      if (saved) { seen.set(k, saved); setNote(saved); setState("ready"); shown = true } else setState("loading")
      // 2) check with the server in the background; this is also what keeps the lock honest
      try {
        const snap = await getDoc(doc(db, "top100Notes", id))
        if (cancelled) return
        if (!snap.exists()) {
          seen.delete(k); removeCached(uid, id); setNote(null); setState("missing")
          return
        }
        const data = snap.data()
        seen.set(k, data); setNote(data); setState("ready")
        putCached(uid, id, data)
      } catch (e: any) {
        if (cancelled) return
        if (e?.code === "permission-denied") {
          seen.delete(k); clearTop100Cache(); setNote(null); setState("locked")
        } else if (!shown) {
          setState("error")
        } // offline with a saved copy: keep showing it
      }
    })()
    return () => { cancelled = true }
  }, [db, uid, id, checkingAuth, planLoading, profileLoading, entitled])

  if (checkingAuth || planLoading || profileLoading || state === "loading") {
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
          <NoteBody markdown={note.markdown || ""} borderClass={color.border} protectWith={user?.email || uid} />
        </>
      )}
    </div>
  )
}
