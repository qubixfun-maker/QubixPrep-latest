"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Loader2 } from "lucide-react"
import { useFirestore, useUser } from "@/firebase"
import { useRequireAuth } from "@/hooks/use-require-auth"
import { gradeSrs, loadDue, type SrsItem } from "@/lib/study"
import ImmersiveDeck from "@/components/flashcards/ImmersiveDeck"

export default function ReviewCards() {
  const db = useFirestore()
  const { user } = useUser()
  const { checkingAuth } = useRequireAuth()
  const [items, setItems] = useState<SrsItem[] | null>(null)

  useEffect(() => {
    if (!db || !user) return
    loadDue(db, user.uid).then((d) => setItems(d.filter((i) => i.kind === "flashcard"))).catch(() => setItems([]))
  }, [db, user])

  const byId = useMemo(() => Object.fromEntries((items || []).map((i) => [i.id, i])), [items])

  if (checkingAuth || items === null) return <div className="flex h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  if (items.length === 0) return <div className="mx-auto max-w-md space-y-3 p-10 text-center"><p className="text-xl font-extrabold">No flashcards due</p><Link href="/review" className="font-bold text-primary underline">Back to review</Link></div>

  return (
    <ImmersiveDeck
      key={items.length}
      cards={items.map((i) => ({ id: i.id, front: i.front || "", back: i.back || "" }))}
      subject="Daily review"
      unit={`${items.length} cards due`}
      backHref="/review"
      onGrade={(c, ok) => { const it = c.id ? byId[c.id] : null; if (it && db && user) gradeSrs(db, user.uid, it, ok).catch(() => {}) }}
    />
  )
}
