"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, CheckCircle2, Loader2, XCircle } from "lucide-react"
import { useFirestore, useUser } from "@/firebase"
import { useRequireAuth } from "@/hooks/use-require-auth"
import { gradeSrs, loadDue, type SrsItem } from "@/lib/study"

export default function ReviewQuiz() {
  const db = useFirestore()
  const { user } = useUser()
  const { checkingAuth } = useRequireAuth()
  const [items, setItems] = useState<SrsItem[] | null>(null)
  const [i, setI] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)
  const [right, setRight] = useState(0)

  useEffect(() => {
    if (!db || !user) return
    loadDue(db, user.uid).then((d) => setItems(d.filter((x) => x.kind === "qbank"))).catch(() => setItems([]))
  }, [db, user])

  if (checkingAuth || items === null) return <div className="flex h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  if (items.length === 0) return <div className="mx-auto max-w-md space-y-3 p-10 text-center"><p className="text-xl font-extrabold">No missed questions due</p><Link href="/review" className="font-bold text-primary underline">Back to review</Link></div>

  const done = i >= items.length
  if (done) {
    return (
      <div className="mx-auto max-w-md space-y-4 p-6 pt-16 text-center">
        <p className="text-5xl">🎯</p>
        <h1 className="text-3xl font-black">Review complete</h1>
        <p className="text-muted-foreground">You got <b className="text-emerald-600">{right}</b> of {items.length} right this time. The ones you missed will come back soon.</p>
        <Link href="/review" className="inline-block rounded-full bg-primary px-6 py-3 font-extrabold text-white">Back to review</Link>
      </div>
    )
  }

  const it = items[i], q = it.q!
  function pick(n: number) {
    if (picked !== null || !db || !user) return
    setPicked(n)
    const ok = n === q.correct
    if (ok) setRight((r) => r + 1)
    gradeSrs(db, user.uid, it, ok).catch(() => {})
  }
  function next() { setPicked(null); setI((x) => x + 1) }

  return (
    <div className="mx-auto max-w-2xl space-y-5 p-4 md:p-8">
      <div className="flex items-center justify-between">
        <Link href="/review" className="inline-flex items-center gap-1 text-sm font-bold text-muted-foreground"><ArrowLeft className="h-4 w-4" /> Back</Link>
        <span className="font-mono text-xs font-bold text-muted-foreground">{i + 1} / {items.length}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-secondary"><div className="h-full rounded-full bg-primary transition-all" style={{ width: ((i + (picked !== null ? 1 : 0)) / items.length) * 100 + "%" }} /></div>
      {q.topic && <span className="inline-block rounded-full bg-secondary px-3 py-1 text-[11px] font-black uppercase tracking-wider text-primary">{q.topic}</span>}
      <h1 className="text-xl font-extrabold leading-snug md:text-2xl">{q.question}</h1>
      <div className="space-y-2.5">
        {q.options.map((o, n) => {
          const state = picked === null ? "" : n === q.correct ? "border-emerald-400 bg-emerald-50 text-emerald-900" : n === picked ? "border-rose-400 bg-rose-50 text-rose-900" : "opacity-60"
          return (
            <button key={n} onClick={() => pick(n)} disabled={picked !== null} className={`flex w-full items-center justify-between gap-3 rounded-2xl border-2 p-4 text-left font-semibold transition ${picked === null ? "border-border bg-card hover:border-primary/60" : state}`}>
              <span>{o}</span>
              {picked !== null && n === q.correct && <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />}
              {picked !== null && n === picked && n !== q.correct && <XCircle className="h-5 w-5 shrink-0 text-rose-600" />}
            </button>
          )
        })}
      </div>
      {picked !== null && (
        <div className="space-y-3">
          {q.explanation && <p className="rounded-2xl bg-secondary p-4 text-sm leading-relaxed text-muted-foreground">{q.explanation}</p>}
          <button onClick={next} className="h-12 w-full rounded-2xl bg-primary text-base font-extrabold text-white shadow">{i + 1 >= items.length ? "Finish" : "Next question"}</button>
        </div>
      )}
    </div>
  )
}
