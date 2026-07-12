"use client"

import { useEffect, useState } from "react"
import { useUser } from "@/firebase"
import { usePlan } from "@/hooks/use-plan"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Copy, CheckCircle2, Users, Wallet, Brain, IndianRupee, AlertCircle, Gift, Link2, Crown, Star, Zap } from "lucide-react"
import Link from "next/link"
import { useRequireAuth } from "@/hooks/use-require-auth"

export default function AffiliatePage() {
  const { user, loading } = useUser()
  const { isFree, isBasic, isPro, plan, loading: planLoading } = usePlan()
  const { checkingAuth } = useRequireAuth()
  const { toast } = useToast()
  const [affiliate, setAffiliate] = useState<any>(null)
  const [referrals, setReferrals] = useState<any[]>([])
  const [payouts, setPayouts] = useState<any[]>([])
  const [pageLoading, setPageLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showPayoutForm, setShowPayoutForm] = useState(false)
  const [upiId, setUpiId] = useState("")
  const [payoutAmount, setPayoutAmount] = useState("")
  const [submittingPayout, setSubmittingPayout] = useState(false)
  const [savedUpiInput, setSavedUpiInput] = useState("")
  const [savingUpi, setSavingUpi] = useState(false)

  useEffect(() => {
    if (!user || planLoading) return
    fetchStatus()
  }, [user, planLoading])

  async function fetchStatus() {
    if (!user) return
    setPageLoading(true)
    try {
      const res = await fetch(`/api/affiliate/status?userId=${user.uid}`)
      const data = await res.json()
      if (data.affiliate) {
        setAffiliate(data.affiliate)
        setReferrals(data.referrals || [])
        setPayouts(data.payouts || [])
        setSavedUpiInput(data.affiliate.upiId || "")
      }
    } catch (e) { console.error(e) }
    setPageLoading(false)
  }

  async function handleJoin() {
    if (!user) return
    setJoining(true)
    try {
      const res = await fetch('/api/affiliate/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid, userName: user.displayName || 'User', userEmail: user.email, plan })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast({ title: 'Welcome to the Affiliate Program!', description: 'Your referral code is ready.' })
      fetchStatus()
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Error', description: e.message })
    }
    setJoining(false)
  }

  async function handleSaveUpi() {
    if (!user || !savedUpiInput.trim()) return
    setSavingUpi(true)
    try {
      const res = await fetch('/api/affiliate/status', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid, upiId: savedUpiInput.trim() })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast({ title: 'UPI ID Saved', description: 'This will be used for future payouts.' })
      fetchStatus()
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Error', description: e.message })
    }
    setSavingUpi(false)
  }

  function openPayoutForm() {
    setUpiId(affiliate?.upiId || "")
    setShowPayoutForm(true)
  }

  async function handlePayoutRequest() {
    if (!user || !upiId || !payoutAmount) return
    setSubmittingPayout(true)
    try {
      const res = await fetch('/api/affiliate/payout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid, upiId, amount: Number(payoutAmount) })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast({ title: 'Payout Requested!', description: 'We will process it within 3-5 business days.' })
      setShowPayoutForm(false)
      setUpiId("")
      setPayoutAmount("")
      fetchStatus()
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Error', description: e.message })
    }
    setSubmittingPayout(false)
  }

  function copyLink() {
    if (!affiliate) return
    const link = `${window.location.origin}/signup?ref=${affiliate.code}`
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      toast({ title: 'Copied!', description: 'Referral link copied to clipboard.' })
    })
  }

  if (checkingAuth || loading || planLoading || pageLoading) {
    return <div className="h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 text-primary animate-spin" /></div>
  }

  if (isFree) {
    return (
      <div className="max-w-lg mx-auto p-6 md:p-12 flex items-center justify-center min-h-[70vh]">
        <div className="glass rounded-3xl p-8 text-center space-y-4 border border-primary/20 w-full">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
            <Gift className="h-7 w-7 text-primary" />
          </div>
          <h2 className="text-xl font-bold">Turn Your Network Into Income</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">Every MBBS student you know is a potential subscriber. Upgrade to Scholar or Clinician to unlock your referral link and start getting paid for every friend who joins.</p>
          <div className="glass rounded-2xl p-4 border border-white/10 text-left space-y-2">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">How it works</p>
            <div className="space-y-1.5 text-xs text-muted-foreground">
              <p>• Share your unique referral link with classmates</p>
              <p>• They sign up and subscribe to any plan</p>
              <p>• Once they've paid for 2 months, you get paid too</p>
              <p>• Earn ₹29 or ₹59 per referral (whatever plan they choose)</p>
              <p>• Withdraw straight to your UPI once you hit ₹500</p>
            </div>
          </div>
          <Link href="/pricing"><Button className="w-full rounded-xl bg-primary gap-2"><Crown className="h-4 w-4" /> Upgrade & Start Earning</Button></Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Gift className="h-6 w-6 text-primary" /> Affiliate Program</h1>
        <p className="text-muted-foreground text-sm mt-1">Get paid for every friend who joins QubixPrep through you</p>
      </div>

      {!affiliate ? (
        <div className="glass rounded-3xl p-8 border border-primary/20 space-y-6">
          <div>
            <h2 className="text-lg font-bold">You're Eligible — Start Earning Today</h2>
            <p className="text-sm text-muted-foreground mt-1">Your classmates are already searching for something like QubixPrep. Be the one who tells them, and get paid for it.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { icon: Link2, label: 'Share your link', desc: 'One link, unlimited referrals' },
              { icon: Users, label: 'Friend subscribes', desc: 'Any plan, ₹29 or ₹59/month' },
              { icon: IndianRupee, label: 'You get paid', desc: 'Earn on every single referral' },
            ].map((s, i) => (
              <div key={i} className="glass rounded-2xl p-4 border border-white/5 space-y-2">
                <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center"><s.icon className="h-4 w-4 text-primary" /></div>
                <p className="font-semibold text-sm">{s.label}</p>
                <p className="text-xs text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
          <Button onClick={handleJoin} disabled={joining} className="rounded-xl bg-primary gap-2 shadow-lg shadow-primary/30">
            {joining ? <Loader2 className="h-4 w-4 animate-spin" /> : <Gift className="h-4 w-4" />}
            {joining ? 'Setting up...' : 'Get My Referral Link'}
          </Button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Referral Code', value: affiliate.code, icon: Link2, color: 'text-primary', bg: 'bg-primary/10' },
              { label: 'Total Earned', value: '₹' + (affiliate.totalEarned || 0), icon: IndianRupee, color: 'text-green-400', bg: 'bg-green-400/10' },
              { label: 'Available', value: '₹' + (affiliate.pendingAmount || 0), icon: Wallet, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
              { label: 'Referrals', value: String(referrals.length), icon: Users, color: 'text-accent', bg: 'bg-accent/10' },
            ].map((s) => (
              <div key={s.label} className="glass rounded-2xl p-4 flex items-center gap-3">
                <div className={`p-2 rounded-xl ${s.bg} ${s.color} shrink-0`}><s.icon className="h-4 w-4" /></div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{s.label}</p>
                  <p className="text-sm font-bold">{s.value}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="glass rounded-2xl p-5 border border-white/10 space-y-3">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Your Referral Link</p>
            <div className="flex gap-2">
              <div className="flex-1 glass rounded-xl px-3 py-2 text-sm text-muted-foreground border border-white/5 truncate">
                {typeof window !== 'undefined' ? `${window.location.origin}/signup?ref=${affiliate.code}` : `/signup?ref=${affiliate.code}`}
              </div>
              <Button onClick={copyLink} size="sm" className="rounded-xl gap-2 shrink-0">
                {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Copied' : 'Copy'}
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">When your friend signs up and stays subscribed for 2 months, you earn ₹29 (Scholar) or ₹59 (Clinician) — whichever plan they pick.</p>
          </div>

          <div className="glass rounded-2xl p-5 border border-white/10 space-y-3">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Your UPI ID</p>
            <p className="text-[11px] text-muted-foreground -mt-2">Save this once and we'll use it automatically for every payout.</p>
            <div className="flex gap-2">
              <Input placeholder="yourname@upi" value={savedUpiInput} onChange={e => setSavedUpiInput(e.target.value)} className="glass border-white/10" />
              <Button onClick={handleSaveUpi} disabled={savingUpi || !savedUpiInput.trim()} size="sm" className="rounded-xl gap-2 shrink-0">
                {savingUpi ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                {savingUpi ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>

          <div className="glass rounded-2xl p-5 border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-sm">Withdraw Earnings</p>
                <p className="text-xs text-muted-foreground mt-0.5">Available: ₹{affiliate.pendingAmount || 0} · Minimum: ₹500</p>
              </div>
              {(affiliate.pendingAmount || 0) >= 500 && !showPayoutForm && (
                <Button size="sm" onClick={openPayoutForm} className="rounded-xl gap-2">
                  <Wallet className="h-4 w-4" /> Request Payout
                </Button>
              )}
            </div>
            {(affiliate.pendingAmount || 0) < 500 && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-white/5 rounded-xl p-3">
                <AlertCircle className="h-4 w-4 shrink-0" />
                You need ₹{500 - (affiliate.pendingAmount || 0)} more to reach the ₹500 minimum payout threshold.
              </div>
            )}
            {showPayoutForm && (
              <div className="space-y-3 pt-2 border-t border-white/10">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">UPI ID</label>
                  <Input placeholder="yourname@upi" value={upiId} onChange={e => setUpiId(e.target.value)} className="glass border-white/10" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Amount (max ₹{affiliate.pendingAmount})</label>
                  <Input type="number" placeholder="Enter amount" value={payoutAmount} onChange={e => setPayoutAmount(e.target.value)} className="glass border-white/10" max={affiliate.pendingAmount} min={500} />
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setShowPayoutForm(false)} className="rounded-xl">Cancel</Button>
                  <Button size="sm" onClick={handlePayoutRequest} disabled={submittingPayout || !upiId || !payoutAmount} className="rounded-xl gap-2">
                    {submittingPayout ? <Loader2 className="h-4 w-4 animate-spin" /> : <IndianRupee className="h-4 w-4" />}
                    {submittingPayout ? 'Submitting...' : 'Submit Request'}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {referrals.length > 0 && (
            <div className="glass rounded-2xl border border-white/10 overflow-hidden">
              <div className="p-4 border-b border-white/10"><p className="font-semibold text-sm">Referral History</p></div>
              <div className="divide-y divide-white/5">
                {referrals.map((r: any) => (
                  <div key={r.id} className="p-4 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium">{r.referredUserName || r.referredUserEmail}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{new Date(r.createdAt).toLocaleDateString('en-IN')}</p>
                    </div>
                    {r.status === 'completed' ? (
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-green-400">₹{r.amount}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-500/10 text-green-400">Earned</span>
                      </div>
                    ) : r.status === 'cancelled' ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/10 text-red-400">Cancelled</span>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          {[0, 1].map(i => (
                            <div key={i} className={`w-2 h-2 rounded-full ${(r.chargeCount || 0) > i ? 'bg-primary' : 'bg-white/10'}`} />
                          ))}
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400">
                          {r.chargeCount || 0}/2 payments
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {payouts.length > 0 && (
            <div className="glass rounded-2xl border border-white/10 overflow-hidden">
              <div className="p-4 border-b border-white/10"><p className="font-semibold text-sm">Payout History</p></div>
              <div className="divide-y divide-white/5">
                {payouts.map((p: any) => (
                  <div key={p.id} className="p-4 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium">₹{p.amount} → {p.upiId}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{new Date(p.createdAt).toLocaleDateString('en-IN')}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${p.status === 'approved' ? 'bg-green-500/10 text-green-400' : p.status === 'rejected' ? 'bg-red-500/10 text-red-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
                      {p.status === 'approved' ? 'Paid' : p.status === 'rejected' ? 'Rejected' : 'Processing'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
