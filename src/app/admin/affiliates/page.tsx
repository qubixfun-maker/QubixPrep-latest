"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Users, IndianRupee, CheckCircle2, XCircle, Clock, Search, ArrowLeft, Gift, Bell, ChevronRight } from "lucide-react"
import Link from "next/link"

export default function AdminAffiliatesPage() {
  const { toast } = useToast()
  const [affiliates, setAffiliates] = useState<any[]>([])
  const [allPayouts, setAllPayouts] = useState<any[]>([])
  const [pageLoading, setPageLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<'payouts' | 'affiliates' | 'referrals'>('payouts')
  const [processing, setProcessing] = useState<number | null>(null)
  const [selectedAffiliate, setSelectedAffiliate] = useState<any>(null)

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    setPageLoading(true)
    try {
      const res = await fetch('/api/affiliate/admin')
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setAffiliates(data.affiliates || [])
      setAllPayouts(data.allPayouts || [])
    } catch (e: any) { toast({ variant: 'destructive', title: 'Error', description: e.message }) }
    setPageLoading(false)
  }

  async function handlePayoutAction(payoutId: number, action: 'approved' | 'rejected') {
    setProcessing(payoutId)
    try {
      const res = await fetch('/api/affiliate/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payoutId, action })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast({ title: action === 'approved' ? 'Payout Approved' : 'Payout Rejected' })
      fetchAll()
      setSelectedAffiliate(null)
    } catch (e: any) { toast({ variant: 'destructive', title: 'Error', description: e.message }) }
    setProcessing(null)
  }

  const pendingPayouts = allPayouts.filter(p => p.status === 'processing')
  const readyForPayout = affiliates.filter(a => (a.pendingAmount || 0) >= 500)
  const allReferrals = affiliates.flatMap(a => (a.referrals || []).map((r: any) => ({ ...r, affiliateName: a.name, affiliateCode: a.code })))
  const filtered = affiliates.filter(a =>
    a.name?.toLowerCase().includes(search.toLowerCase()) ||
    a.email?.toLowerCase().includes(search.toLowerCase()) ||
    a.code?.toLowerCase().includes(search.toLowerCase())
  )

  if (pageLoading) return <div className="h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 text-primary animate-spin" /></div>

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-4">
        <Link href="/admin"><Button variant="ghost" size="sm" className="gap-2 text-muted-foreground"><ArrowLeft className="h-4 w-4" /> Admin</Button></Link>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Gift className="h-6 w-6 text-primary" /> Affiliate Management</h1>
          <p className="text-muted-foreground text-xs mt-0.5">Manage affiliates, referrals and payouts</p>
        </div>
      </div>

      {readyForPayout.length > 0 && (
        <div className="glass rounded-2xl border border-yellow-500/30 bg-yellow-500/5 p-4 space-y-2">
          <p className="text-xs font-bold uppercase tracking-widest text-yellow-400 flex items-center gap-2"><Bell className="h-3.5 w-3.5" /> Ready for Payout ({readyForPayout.length})</p>
          <div className="flex flex-wrap gap-2">
            {readyForPayout.map(a => (
              <button key={a.id} onClick={() => setSelectedAffiliate(a)} className="text-xs px-3 py-1.5 rounded-xl bg-yellow-500/10 hover:bg-yellow-500/20 transition-colors flex items-center gap-2">
                <span className="font-semibold">{a.name || a.email}</span>
                <span className="text-yellow-400 font-bold">₹{a.pendingAmount}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Affiliates', value: String(affiliates.length), icon: Users, color: 'text-blue-400', bg: 'bg-blue-400/10' },
          { label: 'Completed Referrals', value: String(allReferrals.filter(r => r.status === 'completed').length), icon: CheckCircle2, color: 'text-green-400', bg: 'bg-green-400/10' },
          { label: 'Pending Payouts', value: '₹' + pendingPayouts.reduce((s, p) => s + Number(p.amount || 0), 0), icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
          { label: 'Total Paid Out', value: '₹' + affiliates.reduce((s, a) => s + Number(a.paidOut || 0), 0), icon: IndianRupee, color: 'text-primary', bg: 'bg-primary/10' },
        ].map((s) => (
          <div key={s.label} className="glass rounded-2xl p-4 flex items-center gap-3">
            <div className={`p-2 rounded-xl ${s.bg} ${s.color} shrink-0`}><s.icon className="h-4 w-4" /></div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{s.label}</p>
              <p className="text-base font-bold">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        {(['payouts', 'affiliates', 'referrals'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${activeTab === tab ? 'bg-primary text-white' : 'glass text-muted-foreground hover:text-white'}`}>
            {tab}{tab === 'payouts' && pendingPayouts.length > 0 && <span className="ml-1.5 bg-red-500 text-white rounded-full px-1.5 py-0.5 text-[9px]">{pendingPayouts.length}</span>}
          </button>
        ))}
      </div>

      {activeTab === 'payouts' && (
        <div className="glass rounded-2xl border border-white/10 overflow-hidden">
          {allPayouts.length === 0 ? <div className="p-8 text-center text-sm text-muted-foreground">No payout requests yet.</div> : (
            <div className="divide-y divide-white/5">
              {allPayouts.map((p: any) => {
                const aff = affiliates.find(a => a.id === p.affiliateId)
                return (
                  <div key={p.id} className="p-4 flex items-center justify-between gap-4 flex-wrap">
                    <div>
                      <p className="font-semibold text-sm">{aff?.name || aff?.email || 'Unknown'}</p>
                      <p className="text-xs text-muted-foreground">{aff?.email} · UPI: {p.upiId}</p>
                      <p className="text-xs text-muted-foreground">{new Date(p.createdAt).toLocaleDateString('en-IN')}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-green-400">₹{p.amount}</span>
                      {p.status === 'processing' ? (
                        <div className="flex gap-2">
                          <Button size="sm" className="rounded-xl bg-green-500/20 text-green-400 hover:bg-green-500/30 gap-1 border border-green-500/20" disabled={processing === p.id} onClick={() => handlePayoutAction(p.id, 'approved')}>
                            {processing === p.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />} Approve
                          </Button>
                          <Button size="sm" variant="ghost" className="rounded-xl text-red-400 hover:bg-red-500/10 gap-1" disabled={processing === p.id} onClick={() => handlePayoutAction(p.id, 'rejected')}>
                            <XCircle className="h-3 w-3" /> Reject
                          </Button>
                        </div>
                      ) : (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${p.status === 'approved' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                          {p.status === 'approved' ? 'Paid' : 'Rejected'}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'affiliates' && (
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by name, email or code..." className="pl-10 glass border-white/10" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="glass rounded-2xl border border-white/10 overflow-hidden">
            {filtered.length === 0 ? <div className="p-8 text-center text-sm text-muted-foreground">No affiliates yet.</div> : (
              <div className="divide-y divide-white/5">
                {filtered.map((a: any) => (
                  <button key={a.id} onClick={() => setSelectedAffiliate(a)} className="w-full text-left p-4 flex items-center justify-between gap-4 flex-wrap hover:bg-white/5 transition-colors">
                    <div>
                      <p className="font-semibold text-sm flex items-center gap-2">
                        {a.name || a.email}
                        {(a.pendingAmount || 0) >= 500 && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400">Payout Ready</span>}
                      </p>
                      <p className="text-xs text-muted-foreground">{a.email}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Code: <span className="font-mono font-bold text-primary">{a.code}</span> {a.plan ? `· ${a.plan}` : ''}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right"><p className="text-[10px] text-muted-foreground">Earned</p><p className="text-sm font-bold text-green-400">₹{a.totalEarned || 0}</p></div>
                      <div className="text-right"><p className="text-[10px] text-muted-foreground">Available</p><p className="text-sm font-bold text-yellow-400">₹{a.pendingAmount || 0}</p></div>
                      <div className="text-right"><p className="text-[10px] text-muted-foreground">Paid Out</p><p className="text-sm font-bold">₹{a.paidOut || 0}</p></div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'referrals' && (
        <div className="glass rounded-2xl border border-white/10 overflow-hidden">
          {allReferrals.length === 0 ? <div className="p-8 text-center text-sm text-muted-foreground">No referrals yet.</div> : (
            <div className="divide-y divide-white/5">
              {allReferrals.map((r: any) => (
                <div key={r.id} className="p-4 flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <p className="text-sm font-medium">{r.referredUserName || r.referredUserEmail}</p>
                    <p className="text-xs text-muted-foreground">Referred by: {r.affiliateName} ({r.affiliateCode})</p>
                    <p className="text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleDateString('en-IN')}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {r.status === 'completed' ? (
                      <>
                        <span className="text-sm font-bold text-green-400">₹{r.amount}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-500/10 text-green-400">Earned</span>
                      </>
                    ) : r.status === 'cancelled' ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/10 text-red-400">Cancelled</span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400">{r.chargeCount || 0}/2 payments</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <Dialog open={!!selectedAffiliate} onOpenChange={(open) => !open && setSelectedAffiliate(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {selectedAffiliate && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">{selectedAffiliate.name || selectedAffiliate.email}</DialogTitle>
                <DialogDescription>{selectedAffiliate.email} · Code: <span className="font-mono font-bold text-primary">{selectedAffiliate.code}</span></DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-3 gap-3 py-2">
                <div className="glass rounded-xl p-3 text-center"><p className="text-[10px] text-muted-foreground">Earned</p><p className="text-base font-bold text-green-400">₹{selectedAffiliate.totalEarned || 0}</p></div>
                <div className="glass rounded-xl p-3 text-center"><p className="text-[10px] text-muted-foreground">Available</p><p className="text-base font-bold text-yellow-400">₹{selectedAffiliate.pendingAmount || 0}</p></div>
                <div className="glass rounded-xl p-3 text-center"><p className="text-[10px] text-muted-foreground">Paid Out</p><p className="text-base font-bold">₹{selectedAffiliate.paidOut || 0}</p></div>
              </div>
              {selectedAffiliate.upiId && <p className="text-xs text-muted-foreground">UPI: <span className="font-mono">{selectedAffiliate.upiId}</span></p>}

              {(selectedAffiliate.pendingAmount || 0) >= 500 && (
                <div className="flex items-center gap-2 text-xs bg-yellow-500/10 text-yellow-400 rounded-xl p-3">
                  <Bell className="h-4 w-4 shrink-0" /> This affiliate has crossed the ₹500 payout threshold.
                </div>
              )}

              <div className="pt-3 space-y-2">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Referrals ({(selectedAffiliate.referrals || []).length})</p>
                {(selectedAffiliate.referrals || []).length === 0 ? (
                  <p className="text-sm text-muted-foreground">No referrals yet.</p>
                ) : (
                  <div className="glass rounded-xl border border-white/10 divide-y divide-white/5 overflow-hidden">
                    {selectedAffiliate.referrals.map((r: any) => (
                      <div key={r.id} className="p-3">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-medium">{r.referredUserName || r.referredUserEmail}</p>
                            <p className="text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleDateString('en-IN')} {r.plan ? `· ${r.plan}` : ''}</p>
                          </div>
                          {r.status === 'completed' ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-500/10 text-green-400">Earned ₹{r.amount}</span>
                          ) : r.status === 'cancelled' ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/10 text-red-400">Cancelled</span>
                          ) : (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400">{r.chargeCount || 0}/2 payments</span>
                          )}
                        </div>
                        {Array.isArray(r.chargeHistory) && r.chargeHistory.length > 0 && (
                          <div className="mt-2 pl-3 border-l-2 border-white/10 space-y-1">
                            {r.chargeHistory.map((c: any, i: number) => (
                              <p key={i} className="text-[10px] text-muted-foreground">Payment {i + 1}: ₹{c.amount} on {new Date(c.chargedAt).toLocaleDateString('en-IN')}</p>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-3 space-y-2">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Payout History ({(selectedAffiliate.payouts || []).length})</p>
                {(selectedAffiliate.payouts || []).length === 0 ? (
                  <p className="text-sm text-muted-foreground">No payout requests yet.</p>
                ) : (
                  <div className="glass rounded-xl border border-white/10 divide-y divide-white/5 overflow-hidden">
                    {selectedAffiliate.payouts.map((p: any) => (
                      <div key={p.id} className="p-3 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium">₹{p.amount} → {p.upiId}</p>
                          <p className="text-xs text-muted-foreground">{new Date(p.createdAt).toLocaleDateString('en-IN')}</p>
                        </div>
                        {p.status === 'processing' ? (
                          <div className="flex gap-2">
                            <Button size="sm" className="rounded-xl bg-green-500/20 text-green-400 hover:bg-green-500/30 gap-1 border border-green-500/20 h-7 px-2" disabled={processing === p.id} onClick={() => handlePayoutAction(p.id, 'approved')}>
                              {processing === p.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
                            </Button>
                            <Button size="sm" variant="ghost" className="rounded-xl text-red-400 hover:bg-red-500/10 gap-1 h-7 px-2" disabled={processing === p.id} onClick={() => handlePayoutAction(p.id, 'rejected')}>
                              <XCircle className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${p.status === 'approved' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                            {p.status === 'approved' ? 'Paid' : 'Rejected'}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
