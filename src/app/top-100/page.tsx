"use client"
import { SubjectArtCard } from "@/components/subjects/SubjectArtCard"
import { useEffect, useMemo } from "react"
import Link from "next/link"
import { useCollection, useDoc, useFirestore, useUser } from "@/firebase"
import { collection, doc } from "firebase/firestore"
import { Loader2, ArrowRight, Lock } from "lucide-react"
import { useRequireAuth } from "@/hooks/use-require-auth"
import { useTopSearch } from "@/components/layout/top-search"
import { getSubjectYear } from "@/lib/subject-year"
import { usePlan } from "@/hooks/use-plan"
import { clearTop100Cache } from "@/lib/top100-cache"

const TONES = [
  { bg: "#ece3ff", ink: "#43299a", dot: "#7552ee" }, { bg: "#ffe6d6", ink: "#7a3512", dot: "#f08a4b" },
  { bg: "#d9f6ec", ink: "#17543f", dot: "#2fb08f" }, { bg: "#ffdfe9", ink: "#86233f", dot: "#e0558f" },
  { bg: "#dcedff", ink: "#1b4a80", dot: "#3b8ef0" }, { bg: "#fff2c6", ink: "#715000", dot: "#e0a400" },
]

export default function Top100Page() {
  const db = useFirestore()
  const { user } = useUser()
  const [search] = useTopSearch("Search the 100 topics…")
  const { canAccessContent, loading: planLoading } = usePlan()
  const profileRef = useMemo(() => (!db || !user ? null : doc(db, "users", user.uid)), [db, user])
  const { data: profile, loading: profileLoading } = useDoc(profileRef)
  const unlocked = !!canAccessContent || (profile as any)?.role === "admin"
  // a member whose plan has ended must not keep reading saved notes offline
  useEffect(() => { if (!planLoading && !profileLoading && !unlocked) clearTop100Cache() }, [planLoading, profileLoading, unlocked])

  const ref = useMemo(() => (!db ? null : collection(db, "top100")), [db])
  const { data, loading } = useCollection(ref)
  const packsRef = useMemo(() => (!db ? null : collection(db, "notePacks")), [db])
  const { data: packsRaw, loading: packsLoading } = useCollection(packsRef)
  const YEARS = ["1st", "2nd", "3rd"]
  const packs = useMemo(() => {
    const q = search.trim().toLowerCase()
    return ((packsRaw as any[]) || [])
      .filter((p) => p.active !== false && p.packType !== "combo" && (!q || String(p.title).toLowerCase().includes(q)))
      .sort((a, b) => YEARS.indexOf(a.year) - YEARS.indexOf(b.year))
  }, [packsRaw, search])
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

  if (checkingAuth || planLoading) return <div className="h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 text-primary animate-spin" /></div>
  const total = ((data as any[]) || []).length
  let n = 0

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 md:px-8 md:py-10 space-y-8">
      <div className="relative overflow-hidden rounded-[28px] p-7 md:p-10 text-[#5a3a00] shadow-[0_12px_32px_-14px_rgba(60,40,120,0.35)]" style={{ background: "linear-gradient(135deg,#fff2c6,#ffd873)" }}>
        <div className="pointer-events-none absolute -right-10 -top-10 h-56 w-56 rounded-full bg-white/50 blur-2xl" />
        <div className="qp-float pointer-events-none absolute right-6 top-4 select-none text-[96px] leading-none drop-shadow-[0_14px_10px_rgba(40,20,80,0.25)]" aria-hidden>⭐</div>
        <span className="inline-block rounded-full bg-white/70 px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em]">Scholar &amp; Clinician</span>
        <h1 className="mt-3 max-w-[75%] text-3xl md:text-5xl font-black leading-[1.05] tracking-tight">100 Most Important Topics</h1>
        <p className="mt-2 max-w-[75%] text-sm md:text-base font-medium opacity-80">The must-know, high-yield topics. Start here, then go deeper.</p>
      </div>

      {!unlocked && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#f0d88a] bg-[#fff8e0] p-5 text-[#5a3a00]">
          <div>
            <p className="font-extrabold flex items-center gap-2"><Lock className="h-4 w-4" /> Unlock all 100 topics</p>
            <p className="text-sm opacity-80">You can see the list. Full notes and the year-wise PDFs come with Scholar (₹999/year).</p>
          </div>
          <Link href="/pricing" className="inline-flex items-center gap-2 rounded-full bg-[#5a3a00] px-5 py-2.5 text-sm font-extrabold text-white">
            See plans <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}

      {(packsLoading || packs.length > 0) && (
        packsLoading ? (
          <div className="h-24 flex items-center justify-center"><Loader2 className="h-6 w-6 text-primary animate-spin" /></div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {packs.map((p: any) => (
              <SubjectArtCard key={p.id} href={unlocked ? `/notes-packs/${p.id}` : "/pricing"} newTab={unlocked} cta={unlocked ? "Read" : "Unlock with Scholar"}
                name={String(p.title).replace(/\s*\d+\s+(most\s+)?important.*$/i, "").trim() || p.title}
                subtitle={`100 most important topics${p.year ? " · " + p.year + " year" : ""}`} />
            ))}
          </div>
        )
      )}

      {loading ? (
        <div className="h-48 flex items-center justify-center"><Loader2 className="h-8 w-8 text-primary animate-spin" /></div>
      ) : groups.length === 0 ? (
        packs.length > 0 ? null : <div className="rounded-2xl glass p-10 text-center text-muted-foreground">{total === 0 ? "Topics are being picked. Check back soon!" : "No topics match your search."}</div>
      ) : (
        groups.map((g, gi) => {
          const tone = TONES[gi % TONES.length]
          return (
            <section key={g.subject} className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full" style={{ background: tone.dot }} />
                <h2 className="text-lg font-black tracking-tight">{g.subject}</h2>
                <span className="rounded-full px-2 py-0.5 text-[10px] font-black" style={{ background: tone.bg, color: tone.ink }}>{g.items.length}</span>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {g.items.map((t: any) => {
                  n += 1
                  const row = (
                    <div className="flex items-center gap-3 rounded-xl border border-border bg-white px-4 py-3 shadow-sm transition-all hover:shadow-md" style={{ opacity: unlocked ? 1 : 0.85 }}>
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-black" style={{ background: tone.bg, color: tone.ink }}>{n}</span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold">{t.name}</p>
                        {t.chapterTitle && <p className="truncate text-xs text-muted-foreground">{t.chapterTitle}</p>}
                      </div>
                      {unlocked ? <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" /> : <Lock className="h-4 w-4 shrink-0 text-muted-foreground" />}
                    </div>
                  )
                  return unlocked
                    ? <Link key={t.id} href={`/top-100/${t.id}`}>{row}</Link>
                    : <Link key={t.id} href="/pricing">{row}</Link>
                })}
              </div>
            </section>
          )
        })
      )}
    </div>
  )
}
