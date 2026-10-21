"use client"

import { useTopSearch } from "@/components/layout/top-search"
import { useEffect, useMemo, useState } from "react"
import { useCollection, useFirestore } from "@/firebase"
import { collection } from "firebase/firestore"
import { Loader2, Lock, Star, Flame, Trophy } from "lucide-react"
import Link from "next/link"
import { useRequireAuth } from "@/hooks/use-require-auth"
import { usePlan } from "@/hooks/use-plan"
import { Scene, SETTINGS, SCENE_CSS } from "@/components/cases/ward-scenes"
import { PatientGlyph, moodOf } from "@/components/cases/ward-ui"
import { loadProgress, rankFor, type WardProgress } from "@/lib/ward-progress"

const GROUPS: Record<string, { emoji: string; grad: string }> = {
  Medicine: { emoji: "🫀", grad: "linear-gradient(135deg,#7c6fd6,#a78bfa)" },
  Surgery: { emoji: "🩹", grad: "linear-gradient(135deg,#0ea5a4,#34d399)" },
  "Obstetrics & Gynaecology": { emoji: "🤰", grad: "linear-gradient(135deg,#ec4899,#f9a8d4)" },
  Paediatrics: { emoji: "🧸", grad: "linear-gradient(135deg,#f59e0b,#fcd34d)" },
  "Emergency & Toxicology": { emoji: "🚑", grad: "linear-gradient(135deg,#ef4444,#fb923c)" },
  Orthopaedics: { emoji: "🦴", grad: "linear-gradient(135deg,#64748b,#94a3b8)" },
  ENT: { emoji: "👂", grad: "linear-gradient(135deg,#14b8a6,#5eead4)" },
  Ophthalmology: { emoji: "👁️", grad: "linear-gradient(135deg,#3b82f6,#7dd3fc)" },
  Dermatology: { emoji: "🧴", grad: "linear-gradient(135deg,#f472b6,#fbbf24)" },
  Psychiatry: { emoji: "🧠", grad: "linear-gradient(135deg,#8b5cf6,#f0abfc)" },
  "Community Medicine": { emoji: "🏘️", grad: "linear-gradient(135deg,#22c55e,#a3e635)" },
  "Forensic Medicine": { emoji: "🔬", grad: "linear-gradient(135deg,#475569,#818cf8)" },
  Anaesthesia: { emoji: "😷", grad: "linear-gradient(135deg,#06b6d4,#67e8f9)" },
  Haematology: { emoji: "🩸", grad: "linear-gradient(135deg,#be123c,#fb7185)" },
}
const DIFF: Record<string, string> = { easy: "bg-emerald-500", medium: "bg-amber-500", hard: "bg-rose-500", expert: "bg-gradient-to-r from-rose-600 to-orange-500" }

export default function WardRoundHub() {
  const db = useFirestore()
  const { canAccessContent, loading: planLoading } = usePlan()
  const [search, setSearch] = useTopSearch("Search clinical cases…")
  const [group, setGroup] = useState("All")
  const [expertOnly, setExpertOnly] = useState(false)
  const [prog, setProg] = useState<WardProgress>({ xp: 0, done: {} })
  useEffect(() => { setProg(loadProgress()) }, [])

  const casesRef = useMemo(() => (!db ? null : collection(db, "cases")), [db])
  const { data: cases, loading } = useCollection(casesRef)

  const all = useMemo(() => ((cases as any[]) || []).slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0)), [cases])
  const q = search.trim().toLowerCase()
  const filtered = useMemo(() => all.filter((c) => (group === "All" || (c.specialty || "General") === group) && (!expertOnly || c.difficulty === "expert") && (!q || [c.title, c.specialty, c.topic].some((x) => String(x || "").toLowerCase().includes(q)))), [all, group, q, expertOnly])
  const groups = useMemo(() => {
    const m: Record<string, any[]> = {}
    filtered.forEach((c) => { (m[c.specialty || "General"] ||= []).push(c) })
    return Object.entries(m)
  }, [filtered])
  const counts = useMemo(() => { const m: Record<string, number> = {}; all.forEach((c) => { const k = c.specialty || "General"; m[k] = (m[k] || 0) + 1 }); return m }, [all])

  const daily = useMemo(() => (all.length ? all[Math.floor(Date.now() / 86400000) % all.length] : null), [all])
  const cleared = Object.keys(prog.done).filter((id) => all.some((c) => c.id === id)).length
  const starsTotal = Object.values(prog.done).reduce((s, d) => s + d.stars, 0)
  const rk = rankFor(prog.xp)

  const { checkingAuth } = useRequireAuth()
  if (checkingAuth || planLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>

  const locked = (c: any) => !canAccessContent && (c.tier === "paid" || !c.tier)

  const Tile = ({ c }: { c: any }) => {
    const pt = c.patient || {}
    const set = SETTINGS[c.setting] ? c.setting : "ward"
    const d = prog.done[c.id]
    const isLocked = locked(c)
    const body = (
      <div className={`group overflow-hidden rounded-3xl border border-black/5 bg-white shadow-sm transition-all ${isLocked ? "" : "hover:-translate-y-1 hover:shadow-xl"}`}>
        <div className="relative h-28 overflow-hidden">
          <Scene setting={set}><PatientGlyph scale={1.3} x={430} y={178} name={pt.name} age={pt.age} ageUnit={pt.ageUnit} sex={pt.sex} mood={moodOf(c.appearance, 100)} rr={18} /></Scene>
          <span className={`absolute left-2.5 top-2.5 rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-white shadow ${DIFF[c.difficulty] || "bg-slate-500"}`}>{c.difficulty}</span>
          <span className="absolute right-2.5 top-2.5 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-extrabold text-slate-700 shadow">{SETTINGS[set].emoji} {SETTINGS[set].label}</span>
          {isLocked && <div className="absolute inset-0 grid place-items-center bg-slate-900/40"><Lock className="h-6 w-6 text-white" /></div>}
        </div>
        <div className="space-y-2 p-4">
          <p className="line-clamp-2 min-h-[2.5rem] text-sm font-extrabold leading-snug text-slate-900">{c.title}</p>
          {c.difficulty === "expert" && <p className="text-[10px] font-extrabold uppercase tracking-wider text-rose-600">🔥 {c.stages?.length || 9} steps · procedures · timed</p>}
          <div className="flex items-center justify-between">
            <div className="flex gap-0.5">{[0, 1, 2].map((i) => <Star key={i} className={`h-4 w-4 ${d && i < d.stars ? "fill-amber-400 text-amber-400" : "text-slate-300"}`} />)}</div>
            <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${isLocked ? "bg-slate-100 text-slate-500" : d ? "bg-emerald-100 text-emerald-700" : "bg-primary/10 text-primary"}`}>{isLocked ? "Scholar" : d ? d.percent + "% · replay" : c.tier === "free" ? "Free · Play" : "Play"}</span>
          </div>
        </div>
      </div>
    )
    return isLocked ? <Link href="/pricing">{body}</Link> : <Link href={`/cases/${c.id}`}>{body}</Link>
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-3 md:p-8">
      <style>{SCENE_CSS}</style>

      {/* hero */}
      <div className="relative overflow-hidden rounded-[2rem] p-6 text-white shadow-xl md:p-9" style={{ background: "linear-gradient(120deg,#5b3fd1 0%,#c04cdb 55%,#ff8a5b 100%)" }}>
        <div className="relative z-10 grid gap-6 md:grid-cols-[1.2fr_1fr] md:items-center">
          <div className="space-y-3">
            <span className="inline-block rounded-full bg-white/20 px-3 py-1 text-[11px] font-black uppercase tracking-[0.2em]">New · Ward Round</span>
            <h1 className="text-4xl font-black leading-[1.05] tracking-tight md:text-5xl">Be the doctor.<br />Save the patient.</h1>
            <p className="max-w-md text-sm font-medium text-white/85">300 live patients across every subject, with 200 expert cases that add procedures, scans, lab reports, timed decisions and mid-case complications. Take the history, examine, investigate, diagnose and treat, while the monitor ticks and the patient's condition changes with every decision.</p>
          </div>
          <div className="rounded-3xl bg-white/15 p-4 backdrop-blur">
            <div className="flex items-center gap-3">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white/25 text-3xl">{rk.cur.emoji}</div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-white/70">Your rank</p>
                <p className="text-xl font-black leading-tight">{rk.cur.name}</p>
              </div>
              <div className="text-right"><p className="text-2xl font-black leading-none">{prog.xp}</p><p className="text-[10px] font-bold uppercase text-white/70">XP</p></div>
            </div>
            <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-white/25"><div className="h-full rounded-full bg-white transition-all" style={{ width: rk.pct + "%" }} /></div>
            <p className="mt-1 text-[11px] font-semibold text-white/80">{rk.next ? `${rk.toNext} XP to ${rk.next.name}` : "Top rank reached"}</p>
            <div className="mt-3 grid grid-cols-2 gap-2 text-center">
              <div className="rounded-xl bg-white/15 py-2"><p className="text-lg font-black">{cleared}<span className="text-xs font-bold text-white/70"> / {all.length || 300}</span></p><p className="text-[10px] font-bold uppercase text-white/70">Cases cleared</p></div>
              <div className="rounded-xl bg-white/15 py-2"><p className="flex items-center justify-center gap-1 text-lg font-black"><Star className="h-4 w-4 fill-yellow-300 text-yellow-300" />{starsTotal}</p><p className="text-[10px] font-bold uppercase text-white/70">Stars earned</p></div>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
      ) : all.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-black/15 bg-white p-12 text-center">
          <p className="text-5xl">🏥</p>
          <p className="mt-3 text-lg font-extrabold">The wards are being prepared</p>
          <p className="mt-1 text-sm text-muted-foreground">New patients arrive soon. Check back shortly.</p>
        </div>
      ) : (
        <>
          {daily && !q && group === "All" && !locked(daily) && (
            <Link href={`/cases/${daily.id}`} className="group flex items-center gap-4 overflow-hidden rounded-3xl border border-black/5 bg-white p-3 pr-5 shadow-md transition hover:shadow-xl">
              <div className="h-24 w-36 shrink-0 overflow-hidden rounded-2xl sm:w-48"><Scene setting={SETTINGS[daily.setting] ? daily.setting : "ward"}><PatientGlyph scale={1.3} x={430} y={178} name={daily.patient?.name} age={daily.patient?.age} ageUnit={daily.patient?.ageUnit} sex={daily.patient?.sex} mood={moodOf(daily.appearance, 100)} rr={18} /></Scene></div>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-widest text-orange-500"><Flame className="h-3.5 w-3.5" /> Case of the day</p>
                <p className="truncate text-base font-black text-slate-900">{daily.title}</p>
                <p className="text-xs font-semibold text-muted-foreground">{daily.specialty} · {daily.difficulty}</p>
              </div>
              <span className="hidden items-center gap-1 rounded-full bg-primary px-4 py-2 text-xs font-black text-white sm:flex"><Trophy className="h-3.5 w-3.5" /> Start</span>
            </Link>
          )}

          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
            <button onClick={() => setExpertOnly((v) => !v)} className={`flex shrink-0 items-center gap-1 rounded-full border px-4 py-2 text-xs font-extrabold transition ${expertOnly ? "border-rose-600 bg-gradient-to-r from-rose-600 to-orange-500 text-white shadow-md" : "border-rose-300 bg-rose-50 text-rose-700 hover:border-rose-500"}`}><Flame className="h-3.5 w-3.5" /> Expert only <span className="opacity-70">{all.filter((c) => c.difficulty === "expert").length}</span></button>
            {["All", ...Object.keys(counts).sort((a, b) => (GROUPS[a] ? Object.keys(GROUPS).indexOf(a) : 99) - (GROUPS[b] ? Object.keys(GROUPS).indexOf(b) : 99))].map((g) => (
              <button key={g} onClick={() => setGroup(g)} className={`shrink-0 rounded-full border px-4 py-2 text-xs font-extrabold transition ${group === g ? "border-primary bg-primary text-white shadow-md" : "border-black/10 bg-white text-slate-700 hover:border-primary/50"}`}>
                {g !== "All" && <span className="mr-1">{GROUPS[g]?.emoji || "🩺"}</span>}{g} <span className="opacity-60">{g === "All" ? all.length : counts[g]}</span>
              </button>
            ))}
          </div>

          {groups.length === 0 && <p className="py-12 text-center text-sm text-muted-foreground">No cases match your search.</p>}
          {groups.map(([g, list]) => {
            const gv = GROUPS[g] || { emoji: "🩺", grad: "linear-gradient(135deg,#7c6fd6,#a78bfa)" }
            const doneN = list.filter((c) => prog.done[c.id]).length
            return (
              <section key={g} className="space-y-3">
                <div className="flex items-center gap-3 rounded-2xl p-3 text-white shadow-md" style={{ background: gv.grad }}>
                  <span className="text-3xl drop-shadow">{gv.emoji}</span>
                  <div className="min-w-0 flex-1"><p className="text-lg font-black leading-tight">{g}</p><p className="text-[11px] font-bold text-white/85">{list.length} patients · {doneN} cleared</p></div>
                  <div className="h-2 w-24 overflow-hidden rounded-full bg-white/30"><div className="h-full rounded-full bg-white" style={{ width: (list.length ? (doneN / list.length) * 100 : 0) + "%" }} /></div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {list.map((c) => <Tile key={c.id} c={c} />)}
                </div>
              </section>
            )
          })}
        </>
      )}
    </div>
  )
}
