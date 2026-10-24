"use client"

import { useCallback, useEffect, useState } from "react"
import { useUser } from "@/firebase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Copy, CheckCircle2, Users, Wallet, IndianRupee, Gift, Link2, Clock } from "lucide-react"
import { useRequireAuth } from "@/hooks/use-require-auth"
import { PLAN_COMMISSION, MIN_PAYOUT } from "@/lib/affiliate"
import { REF_PARAM } from "@/lib/affiliate-link"

const rupees = (n: number) => "₹" + Number(n || 0).toLocaleString("en-IN")
const day = (d: any) => (d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "")

export default function AffiliatePage() {
  const { user } = useUser()
  const { checkingAuth } = useRequireAuth()
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [affiliate, setAffiliate] = useState<any>(null)
  const [referrals, setReferrals] = useState<any[]>([])
  const [payouts, setPayouts] = useState<any[]>([])
  const [joining, setJoining] = useState(false)
  const [copied, setCopied] = useState(false)
  const [upi, setUpi] = useState("")
  const [amount, setAmount] = useState("")
  const [busy, setBusy] = useState(false)

  const api = useCallback(
    async (path: string, init?: RequestInit) => {
      if (!user) throw new Error("Please sign in.")
      const token = await user.getIdToken()
      const res = await fetch(path, {
        ...init,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...(init?.headers || {}) },
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || data.error) throw new Error(data.error || "Something went wrong.")
      return data
    },
    [user]
  )

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const data = await api("/api/affiliate/status")
      setAffiliate(data.affiliate)
      setReferrals(data.referrals || [])
      setPayouts(data.payouts || [])
      if (data.affiliate?.upiId) setUpi((prev) => prev || data.affiliate.upiId)
    } catch (e: any) {
      toast({ variant: "destructive", title: "Could not load", description: e.message })
    } finally {
      setLoading(false)
    }
  }, [user, api, toast])

  useEffect(() => { load() }, [load])

  async function join() {
    if (!user) return
    setJoining(true)
    try {
      await api("/api/affiliate/register", {
        method: "POST",
        body: JSON.stringify({ userName: user.displayName || "", userEmail: user.email || "" }),
      })
      await load()
    } catch (e: any) {
      toast({ variant: "destructive", title: "Could not join", description: e.message })
    } finally {
      setJoining(false)
    }
  }

  async function requestPayout() {
    setBusy(true)
    try {
      await api("/api/affiliate/payout", {
        method: "POST",
        body: JSON.stringify({ upiId: upi, amount: Number(amount || affiliate?.available) }),
      })
      toast({ title: "Payout requested", description: "We will pay you on UPI soon." })
      setAmount("")
      await load()
    } catch (e: any) {
      toast({ variant: "destructive", title: "Could not request payout", description: e.message })
    } finally {
      setBusy(false)
    }
  }

  const link = affiliate && typeof window !== "undefined" ? `${window.location.origin}/signup?${REF_PARAM}=${affiliate.code}` : ""

  async function copy() {
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast({ title: "Copy this link", description: link })
    }
  }

  if (checkingAuth || loading) {
    return <div className="flex items-center justify-center py-24"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
  }

  const sold = referrals.filter((r) => r.status === "completed").length
  const joined = referrals.length
  const hasOpenRequest = payouts.some((p) => p.status === "processing")
  const canWithdraw = affiliate && affiliate.available >= MIN_PAYOUT

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Gift className="h-6 w-6 text-primary" /> Affiliate programme</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Earn <b>{rupees(PLAN_COMMISSION)}</b> every time a friend buys a yearly plan (Scholar or Clinician) using your link. Same amount for both plans.
        </p>
      </div>

      {!affiliate ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
          <p className="text-sm">Join for free to get your personal link. You are paid for each friend's first yearly plan.</p>
          <Button onClick={join} disabled={joining} className="rounded-xl h-11 font-bold gap-2">
            {joining ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />} Get my link
          </Button>
        </div>
      ) : (
        <>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-2">
            <p className="text-xs font-bold uppercase text-muted-foreground">Your link</p>
            <div className="flex gap-2">
              <Input readOnly value={link} className="font-mono text-xs" onFocus={(e) => e.target.select()} />
              <Button onClick={copy} variant="outline" className="gap-2 shrink-0">
                {copied ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />} {copied ? "Copied" : "Copy"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Your code: <b>{affiliate.code}</b>. Friends can also type it on the signup page.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { icon: Users, label: "Friends joined", value: String(joined) },
              { icon: CheckCircle2, label: "Plans sold", value: String(sold) },
              { icon: IndianRupee, label: "Total earned", value: rupees(affiliate.totalEarned) },
              { icon: Wallet, label: "Available", value: rupees(affiliate.available) },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <s.icon className="h-4 w-4 text-primary mb-2" />
                <p className="text-xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
            <p className="font-bold">Withdraw</p>
            <p className="text-xs text-muted-foreground">Minimum {rupees(MIN_PAYOUT)}. Paid to your UPI after we check the sales. Already paid out: {rupees(affiliate.paidOut)}.</p>
            <div className="grid gap-2 md:grid-cols-[1fr_140px_auto]">
              <Input placeholder="UPI id, e.g. name@okhdfcbank" value={upi} onChange={(e) => setUpi(e.target.value)} />
              <Input type="number" placeholder={String(affiliate.available || "")} value={amount} onChange={(e) => setAmount(e.target.value)} />
              <Button onClick={requestPayout} disabled={busy || !canWithdraw || hasOpenRequest} className="font-bold">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Request payout"}
              </Button>
            </div>
            {!canWithdraw && <p className="text-xs text-muted-foreground">You can withdraw once you have {rupees(MIN_PAYOUT)} available.</p>}
            {hasOpenRequest && <p className="text-xs text-amber-500">You have a payout waiting for approval.</p>}
          </div>

          <div className="space-y-2">
            <p className="font-bold">Your friends</p>
            {referrals.length === 0 && <p className="text-sm text-muted-foreground">Nobody yet. Share your link in your class group.</p>}
            {referrals.map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm">
                <div>
                  <p className="font-medium">{r.name || r.email || "Student"}</p>
                  <p className="text-xs text-muted-foreground">{r.email} · joined {day(r.createdAt)}</p>
                </div>
                {r.status === "completed" ? (
                  <span className="text-green-500 font-bold">+{rupees(r.amount)}</span>
                ) : r.status === "cancelled" ? (
                  <span className="text-xs text-muted-foreground">Cancelled</span>
                ) : (
                  <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> Not bought yet</span>
                )}
              </div>
            ))}
          </div>

          {payouts.length > 0 && (
            <div className="space-y-2">
              <p className="font-bold">Payouts</p>
              {payouts.map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm">
                  <div>
                    <p className="font-medium">{rupees(p.amount)} to {p.upiId}</p>
                    <p className="text-xs text-muted-foreground">{day(p.createdAt)}</p>
                  </div>
                  <span className={p.status === "approved" ? "text-green-500 font-bold" : p.status === "rejected" ? "text-red-500" : "text-amber-500"}>
                    {p.status === "approved" ? "Paid" : p.status === "rejected" ? "Rejected" : "Processing"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
