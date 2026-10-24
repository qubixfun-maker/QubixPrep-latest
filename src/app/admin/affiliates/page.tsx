"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useUser } from "@/firebase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { Loader2, ArrowLeft, Gift, AlertTriangle, Copy, Download, ChevronDown, ChevronUp } from "lucide-react"

const rupees = (n: number) => "₹" + Number(n || 0).toLocaleString("en-IN")
const day = (d: any) => (d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "")
const when = (d: any) => (d ? new Date(d).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }) : "")
const PRICE: Record<string, number> = { basic: 999, pro: 1499 }
const planName = (p: string) => (p === "pro" ? "Clinician" : p === "basic" ? "Scholar" : p || "a plan")

type Tab = "overview" | "payouts" | "sales" | "affiliates" | "activity"
type Flag = { level: "high" | "watch"; text: string }

function normEmail(e?: string) {
  if (!e) return ""
  const lower = e.toLowerCase().trim()
  let [local, domain] = lower.split("@")
  if (!domain) return lower
  local = local.split("+")[0]
  if (domain === "gmail.com" || domain === "googlemail.com") { local = local.replace(/\./g, ""); domain = "gmail.com" }
  return local + "@" + domain
}
const lettersOf = (e?: string) => String(e || "").split("@")[0].replace(/[^a-z]/gi, "").toLowerCase()

export default function AdminAffiliatesPage() {
  const { user } = useUser()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [data, setData] = useState<{ affiliates: any[]; referrals: any[]; payouts: any[]; audit: any[] }>({ affiliates: [], referrals: [], payouts: [], audit: [] })
  const [tab, setTab] = useState<Tab>("overview")
  const [period, setPeriod] = useState<"7" | "30" | "all">("30")
  const [filter, setFilter] = useState<"all" | "review" | "hold">("all")
  const [search, setSearch] = useState("")
  const [open, setOpen] = useState<number | null>(null)
  const [working, setWorking] = useState<string | null>(null)

  const api = useCallback(
    async (init?: RequestInit) => {
      if (!user) throw new Error("Please sign in.")
      const token = await user.getIdToken()
      const res = await fetch("/api/affiliate/admin", { ...init, headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` } })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || json.error) throw new Error(json.error || "Something went wrong.")
      return json
    },
    [user]
  )

  const load = useCallback(async () => {
    if (!user) return
    setError("")
    try {
      const j = await api()
      setData({ affiliates: j.affiliates || [], referrals: j.referrals || [], payouts: j.payouts || [], audit: j.audit || [] })
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [user, api])

  useEffect(() => { load() }, [load])

  async function act(key: string, body: any, okMessage: string) {
    setWorking(key)
    try {
      await api({ method: "POST", body: JSON.stringify(body) })
      toast({ title: okMessage })
      await load()
    } catch (e: any) {
      toast({ variant: "destructive", title: "Failed", description: e.message })
    } finally {
      setWorking(null)
    }
  }

  const byId = useMemo(() => {
    const m: Record<string, any> = {}
    data.affiliates.forEach((a) => { m[a.id] = a })
    return m
  }, [data.affiliates])

  // ---- warning signs per affiliate ----
  const flags = useMemo(() => {
    const out: Record<string, Flag[]> = {}
    const add = (id: any, f: Flag) => { (out[id] = out[id] || []).push(f) }

    const upiOwners: Record<string, Set<string>> = {}
    const noteUpi = (id: any, upi?: string) => {
      const k = String(upi || "").toLowerCase().trim()
      if (!k) return
      ;(upiOwners[k] = upiOwners[k] || new Set()).add(String(id))
    }
    data.affiliates.forEach((a) => noteUpi(a.id, a.upiId))
    data.payouts.forEach((p) => noteUpi(p.affiliateId, p.upiId))

    data.affiliates.forEach((a) => {
      const mine = data.referrals.filter((r) => String(r.affiliateId) === String(a.id) && r.status !== "cancelled")
      const own = normEmail(a.email)
      const ownLetters = lettersOf(a.email)
      const lookAlike = mine.filter((r) => normEmail(r.email) === own || (ownLetters.length >= 5 && lettersOf(r.email) === ownLetters))
      if (lookAlike.length) add(a.id, { level: "high", text: `${lookAlike.length} referred email${lookAlike.length > 1 ? "s look" : " looks"} like the affiliate's own` })

      const upis = new Set<string>()
      if (a.upiId) upis.add(String(a.upiId).toLowerCase().trim())
      data.payouts.filter((p) => String(p.affiliateId) === String(a.id)).forEach((p) => upis.add(String(p.upiId).toLowerCase().trim()))
      let shared = false
      upis.forEach((u) => { if (upiOwners[u] && upiOwners[u].size > 1) shared = true })
      if (shared) add(a.id, { level: "high", text: "Same UPI id used by another affiliate" })

      const times = mine.filter((r) => r.status === "completed" && r.orderId && r.creditedAt).map((r) => new Date(r.creditedAt).getTime()).sort((x, y) => x - y)
      for (let i = 0; i + 2 < times.length; i++) {
        if (times[i + 2] - times[i] <= 24 * 3600 * 1000) { add(a.id, { level: "watch", text: "3 or more sales within 24 hours" }); break }
      }
      const quick = mine.filter((r) => r.status === "completed" && r.orderId && r.creditedAt && new Date(r.creditedAt).getTime() - new Date(r.createdAt).getTime() < 10 * 60 * 1000)
      if (quick.length >= 2) add(a.id, { level: "watch", text: `${quick.length} students bought within 10 minutes of signing up` })

      if (a.pendingAmount < 0) add(a.id, { level: "watch", text: `Balance is negative (${rupees(a.pendingAmount)}) after cancelled sales` })
    })
    return out
  }, [data])

  // ---- numbers ----
  const cutoff = period === "all" ? 0 : Date.now() - Number(period) * 24 * 3600 * 1000
  const sold = useMemo(() => data.referrals.filter((r) => r.status === "completed" && new Date(r.creditedAt || r.createdAt).getTime() >= cutoff), [data.referrals, cutoff])
  const signups = useMemo(() => data.referrals.filter((r) => new Date(r.createdAt).getTime() >= cutoff), [data.referrals, cutoff])
  const cancelled = useMemo(() => data.referrals.filter((r) => r.status === "cancelled" && new Date(r.createdAt).getTime() >= cutoff).length, [data.referrals, cutoff])
  const revenue = sold.filter((r) => r.orderId).reduce((s, r) => s + (PRICE[r.plan] || 0), 0)
  const commission = sold.reduce((s, r) => s + r.amount, 0)
  const owed = data.affiliates.reduce((s, a) => s + Math.max(0, a.pendingAmount), 0)
  const waiting = data.payouts.filter((p) => p.status === "processing")
  const waitingTotal = waiting.reduce((s, p) => s + p.amount, 0)
  const paidTotal = data.affiliates.reduce((s, a) => s + a.paidOut, 0)
  const reviewCount = data.affiliates.filter((a) => (flags[a.id] || []).length > 0).length
  const onHold = data.affiliates.filter((a) => a.status === "suspended").length
  const conversion = signups.length ? Math.round((sold.length / signups.length) * 100) : 0

  const trend = useMemo(() => {
    const days: { label: string; signups: number; sales: number }[] = []
    for (let i = 29; i >= 0; i--) {
      const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - i)
      days.push({ label: d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }), signups: 0, sales: 0 })
    }
    const idx = (t: any) => {
      const d = new Date(t); d.setHours(0, 0, 0, 0)
      return 29 - Math.round((new Date().setHours(0, 0, 0, 0) - d.getTime()) / 86400000)
    }
    data.referrals.forEach((r) => {
      const a = idx(r.createdAt); if (a >= 0 && a < 30) days[a].signups++
      if (r.status === "completed" && r.orderId && r.creditedAt) { const b = idx(r.creditedAt); if (b >= 0 && b < 30) days[b].sales++ }
    })
    return days
  }, [data.referrals])
  const maxBar = Math.max(1, ...trend.map((d) => Math.max(d.signups, d.sales)))

  const leaderboard = useMemo(() => {
    const m: Record<string, number> = {}
    sold.forEach((r) => { m[r.affiliateId] = (m[r.affiliateId] || 0) + 1 })
    return Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 5)
  }, [sold])

  async function copy(text: string) {
    try { await navigator.clipboard.writeText(text); toast({ title: "Copied", description: text }) } catch { toast({ title: "Copy this", description: text }) }
  }

  function downloadCsv(name: string, rows: (string | number)[][]) {
    const csv = rows.map((r) => r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(",")).join("\n")
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }))
    const a = document.createElement("a"); a.href = url; a.download = name; a.click(); URL.revokeObjectURL(url)
  }

  const Chips = ({ id }: { id: any }) => (
    <>
      {(flags[id] || []).map((f, i) => (
        <span key={i} className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${f.level === "high" ? "bg-red-500/15 text-red-500" : "bg-amber-500/15 text-amber-500"}`}>
          <AlertTriangle className="h-3 w-3" /> {f.text}
        </span>
      ))}
    </>
  )

  if (loading) return <div className="flex items-center justify-center py-24"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
  if (error) return <div className="max-w-xl mx-auto p-8 text-center text-sm text-red-500">{error}</div>

  const q = search.trim().toLowerCase()
  const affiliateList = data.affiliates
    .filter((a) => filter === "all" || (filter === "hold" ? a.status === "suspended" : (flags[a.id] || []).length > 0))
    .filter((a) => !q || [a.name, a.email, a.code, a.upiId].some((v) => String(v || "").toLowerCase().includes(q)))
  const sales = data.referrals.filter((r) => r.status === "completed" || r.status === "cancelled")

  const tile = (label: string, value: string, sub?: string, tone?: string) => (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className={`text-xl font-bold ${tone || ""}`}>{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
      {sub && <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  )

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/admin"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
          <h1 className="text-xl font-bold flex items-center gap-2"><Gift className="h-5 w-5 text-primary" /> Affiliates</h1>
        </div>
        <div className="flex gap-1">
          {(["7", "30", "all"] as const).map((p) => (
            <Button key={p} size="sm" variant={period === p ? "default" : "outline"} onClick={() => setPeriod(p)}>{p === "all" ? "All time" : `${p} days`}</Button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {([
          ["overview", "Overview"],
          ["payouts", `Payouts (${waiting.length})`],
          ["sales", `Sales (${sales.length})`],
          ["affiliates", `Affiliates (${data.affiliates.length})`],
          ["activity", "Activity log"],
        ] as [Tab, string][]).map(([k, label]) => (
          <Button key={k} variant={tab === k ? "default" : "outline"} size="sm" onClick={() => setTab(k)}>{label}</Button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="space-y-6">
          {(waiting.length > 0 || reviewCount > 0) && (
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm space-y-1">
              {waiting.length > 0 && <p><b>{waiting.length}</b> payout request{waiting.length > 1 ? "s" : ""} waiting, {rupees(waitingTotal)} in total. <button className="underline" onClick={() => setTab("payouts")}>Open</button></p>}
              {reviewCount > 0 && <p><b>{reviewCount}</b> affiliate{reviewCount > 1 ? "s" : ""} with warning signs. <button className="underline" onClick={() => { setFilter("review"); setTab("affiliates") }}>Review</button></p>}
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {tile("Signups through links", String(signups.length))}
            {tile("Plans sold", String(sold.length), `${conversion}% of signups`)}
            {tile("Revenue from affiliates", rupees(revenue), "new yearly plans only")}
            {tile("Commission earned", rupees(commission), revenue ? `${Math.round((commission / revenue) * 100)}% of that revenue` : undefined)}
            {tile("You owe affiliates", rupees(owed), "unpaid balances", owed > 0 ? "text-amber-500" : "")}
            {tile("Waiting for approval", rupees(waitingTotal), `${waiting.length} request${waiting.length === 1 ? "" : "s"}`)}
            {tile("Paid out so far", rupees(paidTotal))}
            {tile("Cancelled / on hold", `${cancelled} / ${onHold}`, "sales cancelled, affiliates on hold")}
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="font-bold text-sm">Last 30 days</p>
              <p className="text-[10px] text-muted-foreground"><span className="inline-block h-2 w-2 rounded-sm bg-white/30 mr-1" />signups <span className="inline-block h-2 w-2 rounded-sm bg-primary ml-3 mr-1" />plans sold</p>
            </div>
            <div className="flex items-end gap-[3px] h-28">
              {trend.map((d, i) => (
                <div key={i} className="flex-1 flex items-end gap-px h-full" title={`${d.label}: ${d.signups} signups, ${d.sales} sold`}>
                  <div className="flex-1 bg-white/30 rounded-t-sm" style={{ height: `${(d.signups / maxBar) * 100}%`, minHeight: d.signups ? 2 : 0 }} />
                  <div className="flex-1 bg-primary rounded-t-sm" style={{ height: `${(d.sales / maxBar) * 100}%`, minHeight: d.sales ? 2 : 0 }} />
                </div>
              ))}
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground mt-1"><span>{trend[0].label}</span><span>{trend[29].label}</span></div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-2">
            <p className="font-bold text-sm">Top affiliates ({period === "all" ? "all time" : `last ${period} days`})</p>
            {leaderboard.length === 0 && <p className="text-sm text-muted-foreground">No sales in this period.</p>}
            {leaderboard.map(([id, n], i) => (
              <div key={id} className="flex items-center justify-between text-sm">
                <span>{i + 1}. {byId[id]?.name || byId[id]?.email || "Affiliate"} <span className="text-xs text-muted-foreground">({byId[id]?.code})</span></span>
                <span className="font-bold">{n} sold</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "payouts" && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Pay the UPI id yourself, then press Mark paid. Check the warning signs before paying.</p>
            {waiting.length > 0 && (
              <Button size="sm" variant="outline" className="gap-1" onClick={() => downloadCsv("payouts-waiting.csv", [["Name", "UPI", "Amount"], ...waiting.map((p) => [byId[p.affiliateId]?.name || byId[p.affiliateId]?.email || "", p.upiId, p.amount])])}>
                <Download className="h-3 w-3" /> CSV
              </Button>
            )}
          </div>
          {data.payouts.length === 0 && <p className="text-sm text-muted-foreground">No payout requests yet.</p>}
          {data.payouts.map((p) => {
            const a = byId[p.affiliateId]
            return (
              <div key={p.id} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-bold">
                      {rupees(p.amount)} <span className="font-normal text-muted-foreground">to</span> {p.upiId}{" "}
                      <button className="text-muted-foreground hover:text-foreground align-middle" onClick={() => copy(p.upiId)} aria-label="Copy UPI id"><Copy className="h-3 w-3 inline" /></button>
                    </p>
                    <p className="text-xs text-muted-foreground">{a?.name || a?.email || "Affiliate"} ({a?.code}) · asked {when(p.createdAt)} · balance {rupees(a?.pendingAmount)} · lifetime earned {rupees(a?.totalEarned)}</p>
                  </div>
                  {p.status === "processing" ? (
                    <div className="flex gap-2">
                      <Button size="sm" disabled={working === `a${p.id}`} onClick={() => act(`a${p.id}`, { payoutId: p.id, action: "approved" }, "Marked as paid")}>Mark paid</Button>
                      <Button size="sm" variant="outline" disabled={working === `r${p.id}`} onClick={() => act(`r${p.id}`, { payoutId: p.id, action: "rejected" }, "Rejected")}>Reject</Button>
                    </div>
                  ) : (
                    <span className={p.status === "approved" ? "text-green-500 font-bold" : "text-red-500"}>{p.status === "approved" ? "Paid" : "Rejected"}</span>
                  )}
                </div>
                {p.status === "processing" && (flags[p.affiliateId] || []).length > 0 && <div className="flex flex-wrap gap-1"><Chips id={p.affiliateId} /></div>}
              </div>
            )
          })}
        </div>
      )}

      {tab === "sales" && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">If you refund a student, press Cancel to take the commission back from the affiliate.</p>
            {sales.length > 0 && (
              <Button size="sm" variant="outline" className="gap-1" onClick={() => downloadCsv("affiliate-sales.csv", [["Date", "Student", "Plan", "Affiliate", "Code", "Commission", "Status"], ...sales.map((r) => [day(r.creditedAt || r.createdAt), r.email, planName(r.plan), byId[r.affiliateId]?.name || "", byId[r.affiliateId]?.code || "", r.amount, r.status])])}>
                <Download className="h-3 w-3" /> CSV
              </Button>
            )}
          </div>
          {sales.length === 0 && <p className="text-sm text-muted-foreground">No commissions yet.</p>}
          {sales.map((r) => {
            const a = byId[r.affiliateId]
            return (
              <div key={r.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm">
                <div>
                  <p className="font-medium">{r.email || r.name || "Student"} <span className="text-muted-foreground">bought {planName(r.plan)}</span></p>
                  <p className="text-xs text-muted-foreground">via {a?.name || a?.email || "affiliate"} ({a?.code}) · {when(r.creditedAt || r.createdAt)}</p>
                </div>
                {r.status === "completed" ? (
                  <div className="flex items-center gap-3">
                    <span className="text-green-500 font-bold">{rupees(r.amount)}</span>
                    <Button size="sm" variant="outline" disabled={working === `c${r.id}`} onClick={() => act(`c${r.id}`, { referralId: r.id, action: "cancel" }, "Commission cancelled")}>Cancel</Button>
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">Cancelled</span>
                )}
              </div>
            )
          })}
        </div>
      )}

      {tab === "affiliates" && (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            <Input className="max-w-xs" placeholder="Search name, email, code or UPI" value={search} onChange={(e) => setSearch(e.target.value)} />
            {([["all", "All"], ["review", `Needs review (${reviewCount})`], ["hold", `On hold (${onHold})`]] as ["all" | "review" | "hold", string][]).map(([k, l]) => (
              <Button key={k} size="sm" variant={filter === k ? "default" : "outline"} onClick={() => setFilter(k)}>{l}</Button>
            ))}
          </div>
          {affiliateList.map((a) => {
            const mine = data.referrals.filter((r) => String(r.affiliateId) === String(a.id))
            const mineSold = mine.filter((r) => r.status === "completed").length
            const isOpen = open === a.id
            return (
              <div key={a.id} className="rounded-xl border border-white/10 bg-white/5 text-sm">
                <button className="w-full px-4 py-3 flex flex-wrap items-center justify-between gap-2 text-left" onClick={() => setOpen(isOpen ? null : a.id)}>
                  <div>
                    <p className="font-medium">
                      {a.name || a.email} <span className="text-xs text-muted-foreground">({a.code})</span>
                      {a.status === "suspended" && <span className="ml-2 rounded-full bg-red-500/15 text-red-500 px-2 py-0.5 text-[10px] font-bold">ON HOLD</span>}
                    </p>
                    <p className="text-xs text-muted-foreground">{a.email} · UPI: {a.upiId || "not set"} · joined {day(a.createdAt)} · {mine.length} signups, {mineSold} sold</p>
                    <div className="flex flex-wrap gap-1 mt-1"><Chips id={a.id} /></div>
                  </div>
                  <div className="flex items-center gap-3 text-right text-xs">
                    <div>
                      <p>Earned <b>{rupees(a.totalEarned)}</b></p>
                      <p className="text-muted-foreground">Balance {rupees(a.pendingAmount)} · Paid {rupees(a.paidOut)}</p>
                    </div>
                    {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </button>
                {isOpen && (
                  <div className="border-t border-white/10 px-4 py-3 space-y-3">
                    <div className="flex gap-2">
                      {a.status === "suspended" ? (
                        <Button size="sm" disabled={working === `x${a.id}`} onClick={() => act(`x${a.id}`, { affiliateId: a.id, action: "reactivate" }, "Reactivated")}>Reactivate</Button>
                      ) : (
                        <Button size="sm" variant="outline" disabled={working === `x${a.id}`} onClick={() => act(`x${a.id}`, { affiliateId: a.id, action: "suspend" }, "Put on hold")}>Put on hold</Button>
                      )}
                      <p className="text-xs text-muted-foreground self-center">On hold: no commission on new sales, no new withdrawals, the code stops working.</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase text-muted-foreground mb-1">Referred students</p>
                      {mine.length === 0 && <p className="text-xs text-muted-foreground">None yet.</p>}
                      {mine.map((r) => (
                        <div key={r.id} className="flex justify-between text-xs py-0.5">
                          <span>{r.email || r.name} <span className="text-muted-foreground">· {day(r.createdAt)}</span></span>
                          <span className={r.status === "completed" ? "text-green-500" : "text-muted-foreground"}>
                            {r.status === "completed" ? `${planName(r.plan)} · ${rupees(r.amount)}` : r.status === "cancelled" ? "Cancelled" : "Not bought"}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase text-muted-foreground mb-1">Payouts</p>
                      {data.payouts.filter((p) => String(p.affiliateId) === String(a.id)).length === 0 && <p className="text-xs text-muted-foreground">None yet.</p>}
                      {data.payouts.filter((p) => String(p.affiliateId) === String(a.id)).map((p) => (
                        <div key={p.id} className="flex justify-between text-xs py-0.5">
                          <span>{rupees(p.amount)} to {p.upiId} <span className="text-muted-foreground">· {day(p.createdAt)}</span></span>
                          <span>{p.status === "approved" ? "Paid" : p.status === "rejected" ? "Rejected" : "Waiting"}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
          {affiliateList.length === 0 && <p className="text-sm text-muted-foreground">Nobody matches.</p>}
        </div>
      )}

      {tab === "activity" && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Every payout, cancellation and hold you make is recorded here.</p>
          {data.audit.length === 0 && <p className="text-sm text-muted-foreground">Nothing yet. (If you have already acted, run migrate-affiliate.js once.)</p>}
          {data.audit.map((l) => (
            <div key={l.id} className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm flex justify-between gap-3">
              <span>{l.detail}</span>
              <span className="text-xs text-muted-foreground shrink-0">{when(l.createdAt)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
