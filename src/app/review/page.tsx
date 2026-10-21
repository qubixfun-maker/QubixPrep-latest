"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Loader2, Layers, XCircle, CheckCircle2, Trash2, ChevronDown, Sparkles, NotebookPen, RotateCcw } from "lucide-react"
import { useFirestore, useUser } from "@/firebase"
import { useRequireAuth } from "@/hooks/use-require-auth"
import { loadDue, loadNotebook, removeSrs, type SrsItem } from "@/lib/study"

const cap = (s: string) => (s || "").replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
function dueText(ms: number) {
  const d = ms - Date.now()
  if (d <= 0) return "due now"
  const h = d / 3600000
  return h < 1 ? "in " + Math.max(1, Math.round(d / 60000)) + " min" : h < 24 ? "in " + Math.round(h) + " h" : "in " + Math.round(h / 24) + " d"
}

export default function ReviewHome() {
  const db = useFirestore()
  const { user } = useUser()
  const { checkingAuth } = useRequireAuth()
  const [due, setDue] = useState<SrsItem[] | null>(null)
  const [book, setBook] = useState<SrsItem[] | null>(null)
  const [open, setOpen] = useState<string | null>(null)

  const reload = useCallback(async () => {
    if (!db || !user) return
    try { const [d, b] = await Promise.all([loadDue(db, user.uid), loadNotebook(db, user.uid)]); setDue(d); setBook(b) } catch { setDue([]); setBook([]) }
  }, [db, user])
  useEffect(() => { reload() }, [reload])

  const cards = useMemo(() => (due || []).filter((i) => i.kind === "flashcard"), [due])
  const qs = useMemo(() => (due || []).filter((i) => i.kind === "qbank"), [due])

  if (checkingAuth || due === null) return <div className="flex h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>

  const total = cards.length + qs.length

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 md:p-10">
      <div className="keep-dark relative overflow-hidden rounded-[2rem] p-7 text-white shadow-xl md:p-10" style={{ background: "linear-gradient(120deg,#4338ca 0%,#7c3aed 55%,#db2777 100%)" }}>
        <div aria-hidden className="pointer-events-none absolute -right-10 -top-14 h-64 w-64 rounded-full bg-white/15 blur-3xl" />
        <div className="relative space-y-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-[11px] font-black uppercase tracking-[0.2em]"><RotateCcw className="h-3 w-3" /> Spaced repetition</span>
          <h1 className="text-3xl font-black tracking-tight md:text-5xl">Daily review</h1>
          <p className="max-w-lg text-sm font-medium text-white/90 md:text-base">Cards you missed and questions you got wrong come back right when you are about to forget them. Five focused minutes a day beats a long cram.</p>
          <p className="text-4xl font-black">{total} <span className="text-base font-bold text-white/80">due now</span></p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link href={cards.length ? "/review/cards" : "#"} className={`group rounded-3xl border border-border bg-card p-5 shadow-sm transition ${cards.length ? "hover:-translate-y-1 hover:border-primary/50 hover:shadow-lg" : "pointer-events-none opacity-60"}`}>
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-violet-100 text-violet-600"><Layers className="h-6 w-6" /></span>
          <p className="mt-3 text-3xl font-black">{cards.length}</p>
          <p className="font-extrabold">Flashcards due</p>
          <p className="text-sm text-muted-foreground">{cards.length ? "Start the full-screen review" : "Grade cards in Flashcards to build this list"}</p>
        </Link>
        <Link href={qs.length ? "/review/quiz" : "#"} className={`group rounded-3xl border border-border bg-card p-5 shadow-sm transition ${qs.length ? "hover:-translate-y-1 hover:border-primary/50 hover:shadow-lg" : "pointer-events-none opacity-60"}`}>
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-rose-100 text-rose-600"><XCircle className="h-6 w-6" /></span>
          <p className="mt-3 text-3xl font-black">{qs.length}</p>
          <p className="font-extrabold">Missed questions due</p>
          <p className="text-sm text-muted-foreground">{qs.length ? "Retry the ones you got wrong" : "Wrong QBank answers are saved here automatically"}</p>
        </Link>
      </div>

      {total === 0 && (
        <div className="flex items-center gap-3 rounded-3xl border border-emerald-300 bg-emerald-50 p-5 text-emerald-800"><Sparkles className="h-6 w-6 shrink-0" /><div><p className="font-extrabold">You are all caught up</p><p className="text-sm">Nothing is due right now. Study <Link href="/flashcards" className="font-bold underline">flashcards</Link> or practise <Link href="/qbank" className="font-bold underline">QBank</Link> to add to tomorrow's review.</p></div></div>
      )}

      <p className="flex items-center gap-2 text-sm font-black"><NotebookPen className="h-4 w-4 text-primary" /> Missed-question notebook ({book?.length ?? 0})</p>

      {book && book.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">No missed questions yet. Every QBank question you get wrong is saved here with its explanation.</div>
      ) : (
        <div className="space-y-2.5">
          {(book || []).map((it) => {
            const q = it.q!
            const isOpen = open === it.id
            return (
              <div key={it.id} className="rounded-2xl border border-border bg-card shadow-sm">
                <button onClick={() => setOpen(isOpen ? null : it.id)} className="flex w-full items-start justify-between gap-3 p-4 text-left">
                  <div className="min-w-0">
                    <p className="line-clamp-2 text-sm font-bold">{q.question}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{cap(it.subjectId)}{q.topic ? " · " + q.topic : ""} · review {dueText(it.due)} · missed {it.lapses}×</p>
                  </div>
                  <ChevronDown className={`mt-1 h-5 w-5 shrink-0 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
                </button>
                {isOpen && (
                  <div className="space-y-3 border-t border-border p-4 text-sm">
                    <ul className="space-y-1.5">
                      {q.options.map((o, i) => <li key={i} className={`flex items-start gap-2 rounded-xl px-3 py-2 ${i === q.correct ? "bg-emerald-50 font-bold text-emerald-800" : "bg-secondary/60"}`}>{i === q.correct && <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />}<span>{o}</span></li>)}
                    </ul>
                    {q.explanation && <p className="rounded-xl bg-secondary p-3 text-muted-foreground">{q.explanation}</p>}
                    <button onClick={async () => { if (db && user) { await removeSrs(db, user.uid, it.id); reload() } }} className="inline-flex items-center gap-1.5 rounded-full border border-rose-300 px-3 py-1.5 text-xs font-bold text-rose-600"><Trash2 className="h-3 w-3" /> I know this, remove it</button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
