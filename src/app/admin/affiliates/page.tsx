"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useUser } from "@/firebase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { Loader2, ArrowLeft, Gift } from "lucide-react"

const rupees = (n: number) => "₹" + Number(n || 0).toLocaleString("en-IN")
const day = (d: any) => (d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "")

type Tab = "payouts" | "sales" | "affiliates"

export default function AdminAffiliatesPage() {
  const { user } = useUser()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [data, setData] = useState<{ affiliates: any[]; referrals: any[]; payouts: any[] }>({ affiliates: [], referrals: [], payouts: [] })
  const [tab, setTab] = useState<Tab>("payouts")
  const [search, setSearch] = useState("")
  const [working, setWorking] = useState<string | null>(null)

  const api = useCallback(
    async (init?: RequestInit) => {
      if (!user) throw new Error("Please sign in.")
      const token = await user.getIdToken()
      const res = await fetch("/api/affiliate/admin", {
        ...init,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || json.error) throw new Error(json.error || "Something went wrong.")
      return json
    },
    [user]
  )

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setError("")
    try {
      setData(await api())
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [user, api])

  useEffect(() => { load() }, [load])

  const byId = useMemo(() => {
    const m: Record<string, any> = {}
    data.affiliates.forEach((a) => { m[a.id] = a })
    return m
  }, [data.affiliates])

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

  const q = search.trim().toLowerCase()
  const waiting = data.payouts.filter((p) => p.status === "processing")
  const sales = data.referrals.filter((r) => r.status === "completed" || r.status === "cancelled")
  const affiliates = data.affiliates.filter((a) => !q || [a.name, a.email, a.code, a.upiId].some((v) => String(v || "").toLowerCase().includes(q)))

  if (loading) return <div className="flex items-center justify-center py-24"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
  if (error) return <div className="max-w-xl mx-auto p-8 text-center text-sm text-red-500">{error}</div>

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <h1 className="text-xl font-bold flex items-center gap-2"><Gift className="h-5 w-5 text-primary" /> Affiliates</h1>
      </div>

      <div className="flex gap-2">
        {([
          ["payouts", `Payouts (${waiting.length})`],
          ["sales", `Sales (${sales.length})`],
          ["affiliates", `Affiliates (${data.affiliates.length})`],
        ] as [Tab, string][]).map(([k, label]) => (
          <Button key={k} variant={tab === k ? "default" : "outline"} size="sm" onClick={() => setTab(k)}>{label}</Button>
        ))}
      </div>

      {tab === "payouts" && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Pay the UPI id yourself, then press Mark paid. Reject if something looks wrong.</p>
          {data.payouts.length === 0 && <p className="text-sm text-muted-foreground">No payout requests yet.</p>}
          {data.payouts.map((p) => {
            const a = byId[p.affiliateId]
            return (
              <div key={p.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm">
                <div>
                  <p className="font-bold">{rupees(p.amount)} <span className="font-normal text-muted-foreground">to</span> {p.upiId}</p>
                  <p className="text-xs text-muted-foreground">{a?.name || a?.email || "Affiliate"} · {day(p.createdAt)}</p>
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
            )
          })}
        </div>
      )}

      {tab === "sales" && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">If you refund a student, press Cancel to take the commission back from the affiliate.</p>
          {sales.length === 0 && <p className="text-sm text-muted-foreground">No commissions yet.</p>}
          {sales.map((r) => {
            const a = byId[r.affiliateId]
            return (
              <div key={r.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm">
                <div>
                  <p className="font-medium">{r.email || r.name || "Student"} <span className="text-muted-foreground">bought {r.plan === "pro" ? "Clinician" : r.plan === "basic" ? "Scholar" : r.plan || "a plan"}</span></p>
                  <p className="text-xs text-muted-foreground">via {a?.name || a?.email || "affiliate"} ({a?.code}) · {day(r.creditedAt || r.createdAt)}</p>
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
          <Input placeholder="Search name, email, code or UPI" value={search} onChange={(e) => setSearch(e.target.value)} />
          {affiliates.map((a) => (
            <div key={a.id} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-medium">{a.name || a.email} <span className="text-xs text-muted-foreground">({a.code})</span></p>
                <p className="text-xs text-muted-foreground">{a.email} · UPI: {a.upiId || "not set"} · joined {day(a.createdAt)}</p>
              </div>
              <div className="text-right text-xs">
                <p>Earned <b>{rupees(a.totalEarned)}</b></p>
                <p className="text-muted-foreground">Balance {rupees(a.pendingAmount)} · Paid {rupees(a.paidOut)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
