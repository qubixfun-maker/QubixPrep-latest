"use client"

import { useEffect, useState } from "react"
import { useFirestore } from "@/firebase"
import { collection, getDocs, doc, updateDoc, query, orderBy } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Users, IndianRupee, CheckCircle2, XCircle, Clock, Search, ArrowLeft, Gift, Wallet } from "lucide-react"
import Link from "next/link"

export default function AdminAffiliatesPage() {
  const db = useFirestore()
  const { toast } = useToast()
  const [affiliates, setAffiliates] = useState<any[]>([])
  const [payoutRequests, setPayoutRequests] = useState<any[]>([])
  const [referrals, setReferrals] = useState<any[]>([])
  const [pageLoading, setPageLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<'payouts' | 'affiliates' | 'referrals'>('payouts')
  const [processing, setProcessing] = useState<string | null>(null)

  useEffect(() => { if (db) fetchAll() }, [db])

  async function fetchAll() {
    if (!db) return
    setPageLoading(true)
    try {
      const [affSnap, paySnap, refSnap] = await Promise.all([
        getDocs(collection(db, 'affiliates')),
        getDocs(query(collection(db, 'payoutRequests'), orderBy('createdAt', 'desc'))),
        getDocs(query(collection(db, 'referrals'), orderBy('createdAt', 'desc'))),
      ])
      setAffiliates(affSnap.docs.map(d => ({ id: d.id, ...d.data() })))
      setPayoutRequests(paySnap.docs.map(d => ({ id: d.id, ...d.data() })))
      setReferrals(refSnap.docs.map(d => ({ id: d.id, ...d.data() })))
    } catch (e: any) { toast({ variant: 'destructive', title: 'Error', description: e.message }) }
    setPageLoading(false)
  }

  async function handlePayoutAction(payoutId: string, affiliateId: string, amount: number, action: 'approved' | 'rejected') {
    if (!db) return
    setProcessing(payoutId)
    try {
      await updateDoc(doc(db, 'payoutRequests', payoutId), { status: action })
      const aff = affiliates.find(a => a.id === affiliateId)
      if (action === 'approved' && aff) {
        await updateDoc(doc(db, 'affiliates', affiliateId), { paidOut: (aff.paidOut || 0) + amount })
      } else if (action === 'rejected' && aff) {
        await updateDoc(doc(db, 'affiliates', affiliateId), { pendingAmount: (aff.pendingAmount || 0) + amount })
      }
      toast({ title: action === 'approved' ? 'Payout Approved' : 'Payout Rejected' })
      fetchAll()
    } catch (e: any) { toast({ variant: 'destructive', title: 'Error', description: e.message }) }
    setProcessing(null)
  }

  const pendingPayouts = payoutRequests.filter(p => p.status === 'pending')
  const filtered = affiliates.filter(a =>
    a.userName?.toLowerCase().includes(search.toLowerCase()) ||
    a.userEmail?.toLowerCase().includes(search.toLowerCase()) ||
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

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Affiliates', value: String(affiliates.length), icon: Users, color: 'text-blue-400', bg: 'bg-blue-400/10' },
          { label: 'Completed Referrals', value: String(referrals.filter(r => r.status === 'completed').length), icon: CheckCircle2, color: 'text-green-400', bg: 'bg-green-400/10' },
          { label: 'Pending Payouts', value: '₹' + pendingPayouts.reduce((s, p) => s + (p.amount || 0), 0), icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
          { label: 'Total Paid Out', value: '₹' + affiliates.reduce((s, a) => s + (a.paidOut || 0), 0), icon: IndianRupee, color: 'text-primary', bg: 'bg-primary/10' },
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
          {payoutRequests.length === 0 ? <div className="p-8 text-center text-sm text-muted-foreground">No payout requests yet.</div> : (
            <div className="divide-y divide-white/5">
              {payoutRequests.map((p: any) => (
                <div key={p.id} className="p-4 flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <p className="font-semibold text-sm">{p.affiliateName}</p>
                    <p className="text-xs text-muted-foreground">{p.affiliateEmail} · UPI: {p.upiId}</p>
                    <p className="text-xs text-muted-foreground">{new Date(p.createdAt).toLocaleDateString('en-IN')}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-green-400">₹{p.amount}</span>
                    {p.status === 'pending' ? (
                      <div className="flex gap-2">
                        <Button size="sm" className="rounded-xl bg-green-500/20 text-green-400 hover:bg-green-500/30 gap-1 border border-green-500/20" disabled={processing === p.id} onClick={() => handlePayoutAction(p.id, p.affiliateId, p.amount, 'approved')}>
                          {processing === p.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />} Approve
                        </Button>
                        <Button size="sm" variant="ghost" className="rounded-xl text-red-400 hover:bg-red-500/10 gap-1" disabled={processing === p.id} onClick={() => handlePayoutAction(p.id, p.affiliateId, p.amount, 'rejected')}>
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
              ))}
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
                  <div key={a.id} className="p-4 flex items-center justify-between gap-4 flex-wrap">
                    <div>
                      <p className="font-semibold text-sm">{a.userName}</p>
                      <p className="text-xs text-muted-foreground">{a.userEmail}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Code: <span className="font-mono font-bold text-primary">{a.code}</span> · {a.plan}</p>
                    </div>
                    <div className="flex gap-4">
                      <div className="text-right"><p className="text-[10px] text-muted-foreground">Earned</p><p className="text-sm font-bold text-green-400">₹{a.totalEarned || 0}</p></div>
                      <div className="text-right"><p className="text-[10px] text-muted-foreground">Available</p><p className="text-sm font-bold text-yellow-400">₹{a.pendingAmount || 0}</p></div>
                      <div className="text-right"><p className="text-[10px] text-muted-foreground">Paid Out</p><p className="text-sm font-bold">₹{a.paidOut || 0}</p></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'referrals' && (
        <div className="glass rounded-2xl border border-white/10 overflow-hidden">
          {referrals.length === 0 ? <div className="p-8 text-center text-sm text-muted-foreground">No referrals yet.</div> : (
            <div className="divide-y divide-white/5">
              {referrals.map((r: any) => (
                <div key={r.id} className="p-4 flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <p className="text-sm font-medium">{r.referredUserEmail}</p>
                    <p className="text-xs text-muted-foreground">Referred by: {affiliates.find(a => a.id === r.referrerId)?.userName || r.referrerId}</p>
                    <p className="text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleDateString('en-IN')}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-green-400">₹{r.amount}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${r.status === 'completed' ? 'bg-green-500/10 text-green-400' : r.status === 'cancelled' ? 'bg-red-500/10 text-red-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
                      {r.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
