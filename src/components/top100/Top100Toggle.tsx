"use client"
import { useMemo, useState } from "react"
import { useUser, useFirestore, useDoc } from "@/firebase"
import { doc, setDoc, deleteDoc } from "firebase/firestore"
import { Star, Loader2 } from "lucide-react"

type Props = { subjectId: string; subjectName: string; textbookId: string; chapterId: string; topicIndex: number; name: string; chapterTitle: string }

/** Admin-only button on a note topic: adds / removes it from the "100 Most Important Topics" list. */
export function Top100Toggle(p: Props) {
  const { user } = useUser()
  const db = useFirestore()
  const [busy, setBusy] = useState(false)
  const profileRef = useMemo(() => (!db || !user ? null : doc(db, "users", user.uid)), [db, user])
  const { data: profile } = useDoc(profileRef)
  const id = `${p.subjectId}__${p.textbookId}__${p.chapterId}__${p.topicIndex}`
  const ref = useMemo(() => (!db ? null : doc(db, "top100", id)), [db, id])
  const { data: entry } = useDoc(ref)
  if ((profile as any)?.role !== "admin" || !ref) return null
  const on = !!entry
  const toggle = async () => {
    setBusy(true)
    try {
      if (on) await deleteDoc(ref)
      else await setDoc(ref, { subjectId: p.subjectId, subjectName: p.subjectName, textbookId: p.textbookId, chapterId: p.chapterId, topicIndex: p.topicIndex, name: p.name, chapterTitle: p.chapterTitle, addedAt: Date.now() })
    } finally { setBusy(false) }
  }
  return (
    <button onClick={toggle} disabled={busy}
      className={`mt-4 inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-extrabold transition-all ${on ? "bg-[#ffd873] text-[#5a3a00] shadow-md" : "bg-white border border-border text-muted-foreground hover:border-primary hover:text-primary"}`}>
      {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Star className={`h-3.5 w-3.5 ${on ? "fill-current" : ""}`} />}
      {on ? "In Top 100 · tap to remove" : "Add to Top 100"}
    </button>
  )
}
