"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { collection } from "firebase/firestore"
import { Swords, Link2, Loader2, Trophy, Timer, Zap } from "lucide-react"
import { useCollection, useFirestore, useUser } from "@/firebase"
import { Button } from "@/components/ui/button"
import { arena, BADGES, earnedBadges, seasonBadge } from "@/lib/arena-client"
import { Avatar } from "@/components/arena/arena-bits"

type Mode = "duel" | "flash" | "coop" | "challenge"
const MODES: { id: Mode; title: string; sub: string; emoji: string; grad: string }[] = [
  { id: "duel", title: "QBank Duel", sub: "Live race, up to 6 friends", emoji: "⚔️", grad: "from-violet-600 to-fuchsia-500" },
  { id: "flash", title: "Flashcard Battle", sub: "Fastest recall wins", emoji: "🃏", grad: "from-emerald-500 to-teal-500" },
  { id: "coop", title: "Ward Round Co-op", sub: "Treat one patient as a team", emoji: "🩺", grad: "from-rose-500 to-orange-400" },
  { id: "challenge", title: "Challenge a Friend", sub: "Send a link, play any time", emoji: "🔗", grad: "from-sky-500 to-indigo-500" },
]
const dhm = (ms: number) => { const s = Math.max(0, Math.floor(ms / 1000)); return `${Math.floor(s / 86400)}d ${Math.floor((s % 86400) / 3600)}h ${Math.floor((s % 3600) / 60)}m` }

export default function ArenaHub() {
  const router = useRouter()
  const db = useFirestore()
  const { user, loading: authLoading } = useUser()
  const subjectsQuery = useMemo(() => (!db ? null : collection(db, "subjects")), [db])
  const { data: subjects } = useCollection(subjectsQuery)
  const [mode, setMode] = useState<Mode>("duel")
  const [subjectId, setSubjectId] = useState("")
  const [qCount, setQCount] = useState(10)
  const [challengeType, setChallengeType] = useState<"qbank" | "flashcards">("qbank")
  const [code, setCode] = useState("")
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState("")
  const [board, setBoard] = useState<any>(null)
  const [tab, setTab] = useState<"season" | "all">("season")
  const [now, setNow] = useState(Date.now())

  useEffect(() => { if (!authLoading && !user) router.replace("/login?next=/arena") }, [authLoading, user, router])
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 30000); return () => clearInterval(t) }, [])
  useEffect(() => { if (user) arena(user, "leaderboard").then(setBoard).catch(() => setBoard({ error: true })) }, [user])

  const subs = useMemo(() => [...((subjects as any[]) || [])].sort((a, b) => String(a.name).localeCompare(String(b.name))), [subjects])
  useEffect(() => { if (!subjectId && subs.length) setSubjectId(subs[0].id) }, [subs, subjectId])

  const create = async () => {
    if (!user) return
    setErr(""); setBusy(true)
    try {
      let body: any
      if (mode === "coop") body = { kind: "coop" }
      else if (mode === "challenge") body = { kind: "duel", mode: "async", source: { type: challengeType, subjectId }, qCount }
      else body = { kind: "duel", mode: "live", source: { type: mode === "flash" ? "flashcards" : "qbank", subjectId }, qCount }
      const r = await arena(user, "create", body)
      router.push(`/arena/room/${r.code}`)
    } catch (e: any) { setErr(e.message); setBusy(false) }
  }
  const join = () => { const c = code.trim().toUpperCase(); if (c.length >= 4) router.push(`/arena/room/${c}`) }

  if (authLoading || !user) return <div className="flex h-screen items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>

  const season = board?.season
  const me = board?.me
  const rows: any[] = (tab === "season" ? board?.seasonTop : board?.allTop) || []
  const earned = earnedBadges(me)
  const medals: string[] = (me?.badges || []).filter((b: string) => seasonBadge(b))
  const needsSubject = mode !== "coop"

  return (
    <div className="mx-auto max-w-5xl space-y-5 overflow-x-clip p-3 pb-28 md:space-y-6 md:p-8 md:pb-8">
      <div className="keep-dark relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-violet-700 via-fuchsia-600 to-orange-500 p-5 text-white shadow-2xl sm:p-7 md:p-10">
        <div className="pointer-events-none absolute -right-6 -top-6 text-[6rem] opacity-20 sm:text-[9rem]">⚔️</div>
        <p className="text-xs font-black uppercase tracking-[0.3em] opacity-80">Multiplayer</p>
        <h1 className="mt-1 text-3xl font-black sm:text-4xl md:text-5xl">The Arena</h1>
        <p className="mt-2 max-w-lg text-sm opacity-90 md:text-base">Race your friends on real MBBS questions, battle on flashcards, or treat a patient as a team. Earn XP, climb the season ladder, collect badges.</p>
        {season && (
          <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-xs font-extrabold backdrop-blur">
            <Timer className="h-4 w-4" /> Season {season.number + 1} ends in {dhm(season.end - now)}
          </div>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_340px] [&>*]:min-w-0">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {MODES.map((m) => (
              <button key={m.id} onClick={() => setMode(m.id)} className={`rounded-3xl bg-gradient-to-br p-4 text-left text-white shadow-md transition-all ${m.grad} ${mode === m.id ? "scale-[1.02] ring-4 ring-primary/40" : "opacity-80 hover:opacity-100"}`}>
                <span className="text-3xl">{m.emoji}</span>
                <p className="mt-2 text-sm font-black leading-tight">{m.title}</p>
                <p className="text-[11px] font-semibold opacity-90">{m.sub}</p>
              </button>
            ))}
          </div>

          <div className="space-y-4 rounded-3xl border border-black/5 bg-white p-5 shadow-sm">
            <p className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground">Set up your game</p>
            {mode === "challenge" && (
              <div className="flex gap-2">
                {([["qbank", "Questions"], ["flashcards", "Flashcards"]] as const).map(([k, l]) => (
                  <button key={k} onClick={() => setChallengeType(k)} className={`flex-1 rounded-xl border-2 py-2 text-sm font-bold ${challengeType === k ? "border-primary bg-primary/10 text-primary" : "border-black/10"}`}>{l}</button>
                ))}
              </div>
            )}
            {needsSubject && (
              <label className="block space-y-1.5">
                <span className="text-sm font-bold">Subject</span>
                <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} className="h-11 w-full rounded-xl border border-black/10 bg-white px-3 text-sm font-semibold">
                  {subs.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </label>
            )}
            {needsSubject && (
              <div className="space-y-1.5">
                <span className="text-sm font-bold">Questions</span>
                <div className="flex gap-2">{[5, 10, 15, 20].map((n) => <button key={n} onClick={() => setQCount(n)} className={`flex-1 rounded-xl border-2 py-2 text-sm font-black ${qCount === n ? "border-primary bg-primary/10 text-primary" : "border-black/10"}`}>{n}</button>)}</div>
              </div>
            )}
            {mode === "coop" && <p className="rounded-2xl bg-rose-50 p-3 text-sm font-semibold text-rose-800">A random Ward Round patient is picked. You vote together on every step (max 4 doctors).</p>}
            <Button disabled={busy || (needsSubject && !subjectId)} onClick={create} className="h-13 w-full rounded-2xl py-4 text-base font-black">
              {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Swords className="mr-2 h-5 w-5" /> Create room</>}
            </Button>
            {err && <p className="text-sm font-bold text-rose-600">{err}</p>}
          </div>

          <div className="rounded-3xl border border-black/5 bg-white p-5 shadow-sm">
            <p className="mb-3 text-xs font-extrabold uppercase tracking-widest text-muted-foreground">Got a code?</p>
            <div className="flex gap-2">
              <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} onKeyDown={(e) => e.key === "Enter" && join()} maxLength={6} placeholder="ABC123" className="h-12 min-w-0 flex-1 rounded-xl border border-black/10 px-2 text-center text-lg font-black uppercase tracking-[0.2em] sm:px-4 sm:tracking-[0.3em]" />
              <Button onClick={join} disabled={code.trim().length < 4} className="h-12 shrink-0 rounded-xl px-4 font-black sm:px-6"><Link2 className="mr-1.5 h-4 w-4" /> Join</Button>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-3xl border border-black/5 bg-white p-5 shadow-sm">
            <p className="mb-3 text-xs font-extrabold uppercase tracking-widest text-muted-foreground">Your stats</p>
            {me ? (
              <div className="grid grid-cols-3 gap-2 text-center">
                {[["XP", me.xp], ["Season", me.seasonXp], ["Rank", me.seasonRank ? "#" + me.seasonRank : "–"], ["Played", me.played], ["Wins", me.wins], ["Co-op", me.coop]].map(([l, v]) => (
                  <div key={l as string} className="rounded-2xl bg-slate-50 py-2.5"><p className="text-lg font-black">{v}</p><p className="text-[10px] font-extrabold uppercase text-muted-foreground">{l}</p></div>
                ))}
              </div>
            ) : <p className="text-sm text-muted-foreground">Play your first game to appear on the ladder.</p>}
          </div>

          <div className="rounded-3xl border border-black/5 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <p className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-widest text-muted-foreground"><Trophy className="h-4 w-4" /> Leaderboard</p>
              <div className="flex gap-1 rounded-full bg-slate-100 p-0.5 text-[11px] font-extrabold">
                {(["season", "all"] as const).map((t) => <button key={t} onClick={() => setTab(t)} className={`rounded-full px-3 py-1 ${tab === t ? "bg-white shadow" : "text-muted-foreground"}`}>{t === "season" ? "Season" : "All-time"}</button>)}
              </div>
            </div>
            {!board ? <Loader2 className="mx-auto my-6 h-6 w-6 animate-spin text-primary" /> : board.error ? <p className="text-sm text-rose-600">Could not load the leaderboard.</p> : rows.length === 0 ? <p className="py-4 text-center text-sm text-muted-foreground">No one here yet. Be the first!</p> : (
              <ol className="space-y-1.5">
                {rows.slice(0, 15).map((r, i) => (
                  <li key={r.uid} className={`flex items-center gap-2.5 rounded-xl px-2 py-1.5 ${r.uid === user.uid ? "bg-primary/10" : ""}`}>
                    <span className="w-6 text-center text-sm font-black">{i < 3 ? ["🥇", "🥈", "🥉"][i] : i + 1}</span>
                    <Avatar name={r.name} i={i} size={28} />
                    <span className="min-w-0 flex-1 truncate text-sm font-bold">{r.name}</span>
                    <span className="flex items-center gap-1 text-xs font-black text-primary"><Zap className="h-3 w-3" />{r.xp}</span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-black/5 bg-white p-5 shadow-sm">
        <p className="mb-3 text-xs font-extrabold uppercase tracking-widest text-muted-foreground">Badges</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Object.entries(BADGES).map(([id, b]) => {
            const on = earned.includes(id)
            return <div key={id} className={`rounded-2xl border p-3 text-center ${on ? "border-amber-300 bg-amber-50" : "border-black/5 bg-slate-50 opacity-50 grayscale"}`}><p className="text-3xl">{b.emoji}</p><p className="mt-1 text-xs font-black">{b.name}</p><p className="text-[10px] text-muted-foreground">{b.hint}</p></div>
          })}
          {medals.map((id) => { const b = seasonBadge(id)!; return <div key={id} className="rounded-2xl border border-amber-300 bg-amber-50 p-3 text-center"><p className="text-3xl">{b.emoji}</p><p className="mt-1 text-xs font-black">{b.name}</p><p className="text-[10px] text-muted-foreground">{b.hint}</p></div> })}
        </div>
      </div>
    </div>
  )
}
