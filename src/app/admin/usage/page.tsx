"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { collection, doc, getCountFromServer, getDocs, limit, orderBy, query, Timestamp, where } from "firebase/firestore"
import { ArrowLeft, Activity, Inbox, Loader2, Lock, TrendingUp, Users, Crown, BookOpen } from "lucide-react"
import { BarChart, Bar, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { useDoc, useFirestore, useUser } from "@/firebase"

const IST = 5.5 * 3600 * 1000
const FEATURES: Record<string, string> = {
  "": "Home", dashboard: "Dashboard", qbank: "QBank", notes: "Notes", flashcards: "Flashcards", mindmaps: "Mind maps", cases: "Ward Round", arena: "Arena",
  review: "Daily Review", "my-progress": "My Progress", plan: "Study Plan", "grand-test": "Grand Test", search: "Search", faq: "Help & FAQ", support: "Support",
  pyq: "PYQ Series", "test-series": "Custom Quiz", "osce-stations": "OSCE", videos: "Videos", stories: "Med Stories", "top-100": "Top 100", "ai-tools": "AI Tools",
  jelly: "Jelly", profile: "Profile", pricing: "Pricing", "long-answers": "Long Answers", quickcards: "Quick Cards", "case-presentation": "Case Presentation", "prof-pyq": "Prof PYQ",
}
const MUST_TRACK = ["qbank", "notes", "flashcards", "mindmaps", "cases", "arena", "review", "my-progress", "plan", "grand-test", "search", "faq", "support", "pyq", "osce-stations", "stories", "top-100", "quickcards"]
const nice = (s: string) => FEATURES[s] ?? s.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())

/** Midnight (IST) of the day `back` days ago, as a Date. */
function istDay(back: number) {
  const t = Date.now() + IST
  const d = new Date(Math.floor(t / 86400000) * 86400000 - back * 86400000)
  return new Date(d.getTime() - IST)
}
const count = async (q: any) => (await getCountFromServer(q)).data().count as number

export default function UsagePage() {
  const { user, loading: authLoading } = useUser()
  const db = useFirestore()
  const profileRef = useMemo(() => (!db || !user ? null : doc(db, "users", user.uid)), [db, user])
  const { data: profile, loading: profileLoading } = useDoc(profileRef)
  const isAdmin = !authLoading && !profileLoading && !!user && (profile as any)?.role === "admin"

  const [days, setDays] = useState<7 | 30>(7)
  const [people, setPeople] = useState<any>(null)
  const [signups, setSignups] = useState<{ label: string; n: number }[]>([])
  const [content, setContent] = useState<any[] | null>(null)
  const [queue, setQueue] = useState<{ support: number; reports: number } | null>(null)
  const [usage, setUsage] = useState<any>(null)
  const [busy, setBusy] = useState(false)

  // People, signups, content and inbox counts: only cheap count() queries.
  useEffect(() => {
    if (!isAdmin || !db) return
    let dead = false
    ;(async () => {
      const users = collection(db, "users")
      const [total, basic, pro, admins, dau, wau, mau] = await Promise.all([
        count(users), count(query(users, where("plan", "==", "basic"))), count(query(users, where("plan", "==", "pro"))), count(query(users, where("role", "==", "admin"))),
        count(query(users, where("lastActiveAt", ">=", Timestamp.fromDate(istDay(0))))), count(query(users, where("lastActiveAt", ">=", Timestamp.fromDate(istDay(6))))), count(query(users, where("lastActiveAt", ">=", Timestamp.fromDate(istDay(29))))),
      ])
      const buckets = await Promise.all(Array.from({ length: 30 }, (_, i) => {
        const back = 29 - i, s = istDay(back), e = istDay(back - 1)
        return count(query(users, where("createdAt", ">=", s.toISOString()), where("createdAt", "<", e.toISOString()))).then((n) => ({ label: new Date(s.getTime() + IST).toLocaleDateString("en-IN", { day: "2-digit", month: "short", timeZone: "UTC" }), n }))
      }))
      if (dead) return
      setPeople({ total, basic, pro, admins, dau, wau, mau }); setSignups(buckets)

      const [sTot, sDone, rTot, rDone] = await Promise.all([count(collection(db, "supportRequests")), count(query(collection(db, "supportRequests"), where("status", "==", "done"))), count(collection(db, "questionReports")), count(query(collection(db, "questionReports"), where("status", "==", "done")))]).catch(() => [0, 0, 0, 0])
      if (!dead) setQueue({ support: sTot - sDone, reports: rTot - rDone })

      const subs = await getDocs(collection(db, "subjects"))
      const rows = await Promise.all(subs.docs.map(async (s) => {
        const c = (name: string) => count(collection(db, "subjects", s.id, name)).catch(() => 0)
        const [notes, maps, decks, qs] = await Promise.all([c("textNotes"), c("mindmaps"), c("flashcardDecks"), c("qbankQuestions")])
        return { id: s.id, name: (s.data() as any).name || s.id, notes, maps, decks, qs }
      }))
      if (!dead) setContent(rows.sort((a, b) => a.name.localeCompare(b.name)))
    })().catch((e) => console.error("[usage]", e))
    return () => { dead = true }
  }, [isAdmin, db])

  // Feature usage: group the most recent page views on this device (bounded read).
  useEffect(() => {
    if (!isAdmin || !db) return
    let dead = false
    setBusy(true)
    getDocs(query(collection(db, "pageViews"), where("timestamp", ">=", Timestamp.fromDate(istDay(days - 1))), orderBy("timestamp", "desc"), limit(4000))).then((snap) => {
      if (dead) return
      const by = new Map<string, { views: number; users: Set<string> }>()
      const everyone = new Set<string>()
      snap.forEach((d) => {
        const x = d.data() as any
        const seg = String(x.path || "/").split("/")[1] || ""
        const f = by.get(seg) || { views: 0, users: new Set<string>() }
        f.views++; if (x.userId) { f.users.add(x.userId); everyone.add(x.userId) }
        by.set(seg, f)
      })
      const rows = [...by.entries()].map(([seg, f]) => ({ seg, name: nice(seg), views: f.views, users: f.users.size })).sort((a, b) => b.views - a.views)
      setUsage({ rows, total: snap.size, capped: snap.size >= 4000, people: everyone.size, unused: MUST_TRACK.filter((s) => !by.has(s)).map(nice) })
    }).catch((e) => console.error("[usage]", e)).finally(() => !dead && setBusy(false))
    return () => { dead = true }
  }, [isAdmin, db, days])

  if (authLoading || profileLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
  if (!isAdmin) return <div className="flex h-[80vh] flex-col items-center justify-center p-6 text-center"><Lock className="mb-4 h-12 w-12 text-destructive" /><h1 className="text-2xl font-bold">Admin Restricted</h1><Link href="/" className="mt-4 font-bold text-primary underline">Return home</Link></div>

  const free = people ? Math.max(0, people.total - people.basic - people.pro) : 0
  const sign = signups.slice(-days)
  const newInRange = sign.reduce((s, d) => s + d.n, 0)
  const maxViews = Math.max(1, ...(usage?.rows || []).map((r: any) => r.views))
  const tile = "rounded-3xl border border-border bg-card p-4 shadow-sm"
  const totals = (content || []).reduce((t, r) => ({ notes: t.notes + r.notes, maps: t.maps + r.maps, decks: t.decks + r.decks, qs: t.qs + r.qs }), { notes: 0, maps: 0, decks: 0, qs: 0 })

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/admin" aria-label="Back" className="grid h-10 w-10 place-items-center rounded-full border border-border bg-card"><ArrowLeft className="h-5 w-5" /></Link>
          <div><h1 className="flex items-center gap-2 text-2xl font-black"><TrendingUp className="h-6 w-6 text-primary" /> Usage and growth</h1><p className="text-sm text-muted-foreground">Who is joining, who is active, and which features students actually use.</p></div>
        </div>
        <div className="flex gap-1.5">{([7, 30] as const).map((d) => <button key={d} onClick={() => setDays(d)} className={`rounded-full border px-4 py-1.5 text-sm font-bold ${days === d ? "border-primary bg-primary text-white" : "border-border bg-card"}`}>Last {d} days</button>)}</div>
      </div>

      {!people ? <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div> : (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className={tile}><Users className="h-5 w-5 text-primary" /><p className="mt-2 text-3xl font-black">{people.total}</p><p className="text-xs font-bold text-muted-foreground">Registered students</p></div>
            <div className={tile}><TrendingUp className="h-5 w-5 text-emerald-600" /><p className="mt-2 text-3xl font-black">+{newInRange}</p><p className="text-xs font-bold text-muted-foreground">New in last {days} days</p></div>
            <div className={tile}><Activity className="h-5 w-5 text-violet-600" /><p className="mt-2 text-3xl font-black">{people.dau} <span className="text-base font-bold text-muted-foreground">today</span></p><p className="text-xs font-bold text-muted-foreground">{people.wau} this week · {people.mau} this month</p></div>
            <div className={tile}><Crown className="h-5 w-5 text-amber-500" /><p className="mt-2 text-3xl font-black">{people.basic + people.pro}</p><p className="text-xs font-bold text-muted-foreground">Paid ({people.basic} Scholar, {people.pro} Pro) · {free} free</p></div>
          </div>
          <p className="-mt-3 text-xs text-muted-foreground">Active counts use each student's last-active time, which updates at most once an hour, so treat them as approximate. Stickiness (today ÷ this month): <b>{people.mau ? Math.round((people.dau / people.mau) * 100) : 0}%</b>.</p>

          <section className={tile + " space-y-3"}>
            <h2 className="font-black">New students per day</h2>
            <div className="h-56"><ResponsiveContainer width="100%" height="100%"><BarChart data={sign}><CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" /><XAxis dataKey="label" tick={{ fontSize: 11 }} interval={days === 7 ? 0 : 3} /><YAxis tick={{ fontSize: 11 }} allowDecimals={false} /><Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "0.5rem", fontSize: "12px" }} /><Bar dataKey="n" name="New students" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div>
          </section>
        </>
      )}

      <section className={tile + " space-y-4"}>
        <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="font-black">What students use</h2>{usage && <p className="text-xs text-muted-foreground">{usage.total.toLocaleString("en-IN")} page views from {usage.people} students{usage.capped ? " (the 4,000 most recent)" : ""}</p>}</div>
        {busy || !usage ? <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div> : usage.rows.length === 0 ? <p className="text-sm text-muted-foreground">No page views in this period.</p> : (
          <ul className="space-y-2.5">{usage.rows.slice(0, 16).map((r: any) => (
            <li key={r.seg}><div className="flex items-baseline justify-between gap-3 text-sm"><span className="font-bold">{r.name}</span><span className="text-xs font-semibold text-muted-foreground">{r.views.toLocaleString("en-IN")} views · {r.users} student{r.users === 1 ? "" : "s"}</span></div><div className="mt-1 h-2.5 overflow-hidden rounded-full bg-secondary"><div className="h-full rounded-full bg-primary" style={{ width: (r.views / maxViews) * 100 + "%" }} /></div></li>
          ))}</ul>
        )}
        {usage && usage.unused.length > 0 && <div className="rounded-2xl bg-amber-50 p-3 text-sm text-amber-900"><p className="font-extrabold">Not opened at all in this period</p><p className="mt-1">{usage.unused.join(", ")}. These may need a nudge, a clearer sidebar spot, or a mention in a notification.</p></div>}
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <section className={tile + " space-y-3"}>
          <h2 className="flex items-center gap-2 font-black"><Inbox className="h-5 w-5 text-teal-600" /> Waiting for you</h2>
          {queue ? (<div className="grid grid-cols-2 gap-3 text-center"><Link href="/admin/inbox" className="rounded-2xl bg-secondary p-4"><p className="text-3xl font-black">{queue.support}</p><p className="text-xs font-bold text-muted-foreground">Open messages</p></Link><Link href="/admin/inbox" className="rounded-2xl bg-secondary p-4"><p className="text-3xl font-black">{queue.reports}</p><p className="text-xs font-bold text-muted-foreground">Open question reports</p></Link></div>) : <Loader2 className="h-5 w-5 animate-spin text-primary" />}
        </section>
        <section className={tile + " space-y-3"}>
          <h2 className="flex items-center gap-2 font-black"><BookOpen className="h-5 w-5 text-indigo-600" /> Content on the platform</h2>
          {content ? (<div className="grid grid-cols-2 gap-3 text-center">{[["Notes", totals.notes], ["Mind maps", totals.maps], ["Flashcard decks", totals.decks], ["Questions", totals.qs]].map(([l, n]) => <div key={l as string} className="rounded-2xl bg-secondary p-3"><p className="text-2xl font-black">{(n as number).toLocaleString("en-IN")}</p><p className="text-xs font-bold text-muted-foreground">{l}</p></div>)}</div>) : <Loader2 className="h-5 w-5 animate-spin text-primary" />}
        </section>
      </div>

      {content && (
        <section className={tile + " space-y-3"}>
          <h2 className="font-black">Content by subject <span className="text-xs font-semibold text-muted-foreground">(zeros show where students find nothing)</span></h2>
          <div className="overflow-x-auto"><table className="w-full min-w-[460px] text-sm"><thead><tr className="text-left text-xs font-black uppercase tracking-wider text-muted-foreground"><th className="py-2 pr-3">Subject</th><th className="px-2 text-right">Notes</th><th className="px-2 text-right">Maps</th><th className="px-2 text-right">Decks</th><th className="pl-2 text-right">Questions</th></tr></thead>
            <tbody>{content.map((r) => <tr key={r.id} className="border-t border-border"><td className="py-2 pr-3 font-bold">{r.name}</td>{[r.notes, r.maps, r.decks, r.qs].map((n, i) => <td key={i} className={`px-2 text-right tabular-nums ${i === 3 ? "pl-2" : ""} ${n === 0 ? "font-black text-rose-600" : ""}`}>{n.toLocaleString("en-IN")}</td>)}</tr>)}</tbody></table></div>
        </section>
      )}
    </div>
  )
}
