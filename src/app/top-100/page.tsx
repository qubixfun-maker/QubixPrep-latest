"use client"
import { useMemo } from "react"
import Link from "next/link"
import { useCollection, useFirestore } from "@/firebase"
import { collection } from "firebase/firestore"
import { Loader2, ArrowRight } from "lucide-react"
import { useRequireAuth } from "@/hooks/use-require-auth"
import { useTopSearch } from "@/components/layout/top-search"
import { getSubjectYear } from "@/lib/subject-year"

const TONES = [
  { bg: "#ece3ff", ink: "#43299a", dot: "#7552ee" }, { bg: "#ffe6d6", ink: "#7a3512", dot: "#f08a4b" },
  { bg: "#d9f6ec", ink: "#17543f", dot: "#2fb08f" }, { bg: "#ffdfe9", ink: "#86233f", dot: "#e0558f" },
  { bg: "#dcedff", ink: "#1b4a80", dot: "#3b8ef0" }, { bg: "#fff2c6", ink: "#715000", dot: "#e0a400" },
]

export default function Top100Page() {
  const db = useFirestore()
  const [search] = useTopSearch("Search the 100 topics…")
  const ref = useMemo(() => (!db ? null : collection(db, "top100")), [db])
  const { data, loading } = useCollection(ref)
  const { checkingAuth } = useRequireAuth()

  const groups = useMemo(() => {
    const q = search.trim().toLowerCase()
    const list = ((data as any[]) || []).filter((t) => !q || `${t.name} ${t.subjectName}`.toLowerCase().includes(q))
    const by: Record<string, any[]> = {}
    list.forEach((t) => { (by[t.subjectName] = by[t.subjectName] || []).push(t) })
    Object.values(by).forEach((l) => l.sort((a, b) => (a.addedAt || 0) - (b.addedAt || 0)))
    return Object.entries(by)
      .sort((a, b) => getSubjectYear(a[0]).order - getSubjectYear(b[0]).order || a[0].localeCompare(b[0]))
      .map(([subject, items]) => ({ subject, items }))
  }, [data, search])

  if (checkingAuth) return <div className="h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 text-primary animate-spin" /></div>
  const total = ((data as any[]) || []).length
  let n = 0

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 md:px-8 md:py-10 space-y-8">
      <div className="relative overflow-hidden rounded-[28px] p-7 md:p-10 text-[#5a3a00] shadow-[0_12px_32px_-14px_rgba(60,40,120,0.35)]" style={{ background: "linear-gradient(135deg,#fff2c6,#ffd873)" }}>
        <div className="pointer-events-none absolute -right-10 -top-10 h-56 w-56 rounded-full bg-white/50 blur-2xl" />
        <div className="qp-float pointer-events-none absolute right-6 top-4 select-none text-[96px] leading-none drop-shadow-[0_14px_10px_rgba(40,20,80,0.25)]" aria-hidden>⭐</div>
        <span className="inline-block rounded-full bg-white/70 px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em]">Free for everyone</span>
        <h1 className="mt-3 max-w-[75%] text-3xl md:text-5xl font-black leading-[1.05] tracking-tight">100 Most Important Topics</h1>
        <p className="mt-2 max-w-[75%] text-sm md:text-base font-medium opacity-80">The must-know, high-yield topics. Start here, then go deeper.</p>
        <span className="mt-4 inline-block rounded-full bg-white/80 px-3.5 py-1.5 text-xs font-extrabold">{total} topic{total === 1 ? "" : "s"} so far</span>
      </div>

      {loading ? (
        <div className="h-48 flex items-center justify-center"><Loader2 className="h-8 w-8 text-primary animate-spin" /></div>
      ) : groups.length === 0 ? (
        <div className="rounded-2xl glass p-10 text-center text-muted-foreground">{total === 0 ? "Topics are being picked. Check back soon!" : "No topics match your search."}</div>
      ) : (
        groups.map((g, gi) => {
          const tone = TONES[gi % TONES.length]
          return (
            <section key={g.subject} className="space-y-3">
              <h2 className="inline-block rounded-xl px-4 py-2 text-lg font-black" style={{ background: tone.bg, color: tone.ink }}>{g.subject} <span className="opacity-60 text-sm">· {g.items.length}</span></h2>
              <div className="grid gap-3 md:grid-cols-2">
                {g.items.map((t) => {
                  n += 1
                  return (
                    <Link key={t.id} href={`/notes/${t.subjectId}/${t.textbookId}/${t.chapterId}/${t.topicIndex}`}
                      className="group flex items-center gap-3 rounded-2xl border border-border bg-card p-3.5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-black text-white" style={{ background: tone.dot }}>{n}</span>
                      <span className="min-w-0 flex-1">
                        <strong className="block truncate text-[15px]">{t.name}</strong>
                        <small className="block truncate text-muted-foreground">{t.chapterTitle}</small>
                      </span>
                      <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1" />
                    </Link>
                  )
                })}
              </div>
            </section>
          )
        })
      )}
    </div>
  )
}
