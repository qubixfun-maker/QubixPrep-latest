"use client"

import { useState, useEffect, useMemo } from "react"
import { supabase } from "@/lib/supabase"
import { useUser, useFirestore, useDoc, useCollection } from "@/firebase"
import { doc, collection } from "firebase/firestore"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ShoppingBag, ExternalLink, Loader2, Tag, FileDown, CheckCircle2 } from "lucide-react"
import { usePlan } from "@/hooks/use-plan"
import { UpgradeGate } from "@/components/upgrade-gate"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

const CATEGORIES = ["All", "Notes Pack", "Question Bank", "Flashcards", "Video Pack", "Combo Pack"]
const YEAR_LABEL: Record<string, string> = { "1st": "1st Year", "2nd": "2nd Year", "3rd": "3rd Year" }
const YEAR_ORDER = ["1st", "2nd", "3rd"]

export default function ProductsPage() {
  const { isPro, loading: planLoading } = usePlan()
  const { user } = useUser()
  const db = useFirestore()
  const { toast } = useToast()

  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState("All")
  const [buyingPackId, setBuyingPackId] = useState<string | null>(null)

  const profileRef = useMemo(() => (!db || !user) ? null : doc(db, "users", user.uid), [db, user])
  const { data: profile } = useDoc(profileRef)
  const purchasedNotePacks: string[] = (profile as any)?.purchasedNotePacks || []

  const notePacksRef = useMemo(() => (!db ? null : collection(db, "notePacks")), [db])
  const { data: notePacksRaw, loading: notePacksLoading } = useCollection(notePacksRef)
  const notePacks = useMemo(() => {
    const list = ((notePacksRaw as any[]) || []).filter((p) => p.active !== false)
    return list.sort((a, b) => YEAR_ORDER.indexOf(a.year) - YEAR_ORDER.indexOf(b.year))
  }, [notePacksRaw])

  useEffect(() => {
    async function fetchProducts() {
      const { data } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
      setProducts(data || [])
      setLoading(false)
    }
    fetchProducts()
  }, [])

  const filtered = activeCategory === "All"
    ? products
    : products.filter(p => p.category === activeCategory)

  async function handleBuyNotePack(pack: any) {
    if (!user) {
      toast({ variant: "destructive", title: "Please log in first" })
      return
    }
    setBuyingPackId(pack.id)
    try {
      const res = await fetch("/api/notepacks/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packId: pack.id, userId: user.uid })
      })
      const data = await res.json()
      if (!res.ok || !data.orderId) throw new Error(data.error || "Could not start checkout")

      const rzp = new (window as any).Razorpay({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        order_id: data.orderId,
        amount: data.amount,
        currency: "INR",
        name: "QubixPrep",
        description: data.title || pack.title,
        handler: async (response: any) => {
          try {
            const verifyRes = await fetch("/api/notepacks/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                userId: user.uid,
                packId: pack.id
              })
            })
            const verifyData = await verifyRes.json()
            if (!verifyRes.ok) throw new Error(verifyData.error || "Payment verification failed")
            toast({ title: "Purchase Successful!", description: `You now have access to ${pack.title}.` })
          } catch (e: any) {
            toast({ variant: "destructive", title: "Verification Failed", description: e.message })
          }
        },
        prefill: { email: user.email || "" },
        theme: { color: "#7C3AED" },
        notes: { userId: user.uid, packId: pack.id }
      })
      rzp.open()
    } catch (e: any) {
      toast({ variant: "destructive", title: "Purchase Failed", description: e.message })
    } finally {
      setBuyingPackId(null)
    }
  }

  if (planLoading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-12 space-y-12 animate-in fade-in duration-500">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold flex items-center gap-3">
          <ShoppingBag className="h-10 w-10 text-primary" /> QubixPrep Store
        </h1>
        <p className="text-muted-foreground text-lg">Premium study materials curated for NEET PG & USMLE</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold flex items-center gap-2"><FileDown className="h-6 w-6 text-primary" /> Year Notes</h2>
          <p className="text-sm text-muted-foreground">Complete year-wise notes, one-time purchase. Viewable only inside the app.</p>
        </div>

        {notePacksLoading ? (
          <div className="h-32 flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : notePacks.length === 0 ? (
          <div className="text-center py-10 glass rounded-2xl text-muted-foreground text-sm">Year Notes coming soon.</div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {notePacks.map((pack: any) => {
              const owned = purchasedNotePacks.includes(pack.id)
              return (
                <Card key={pack.id} className="glass border-none overflow-hidden">
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest">{YEAR_LABEL[pack.year] || pack.year}</span>
                      {owned && <CheckCircle2 className="h-5 w-5 text-green-400" />}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{pack.title}</h3>
                      {pack.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{pack.description}</p>}
                    </div>
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-2xl font-bold text-primary">₹{pack.price}</span>
                      {owned ? (
                        <Link href={`/notes-packs/${pack.id}`}>
                          <Button size="sm" className="rounded-xl gap-1.5 text-xs font-bold">View Notes</Button>
                        </Link>
                      ) : (
                        <Button
                          size="sm"
                          className="rounded-xl gap-1.5 text-xs font-bold"
                          disabled={buyingPackId === pack.id}
                          onClick={() => handleBuyNotePack(pack)}
                        >
                          {buyingPackId === pack.id ? <Loader2 className="h-3 w-3 animate-spin" /> : null} Buy Now
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Curated Products</h2>

        {!isPro ? (
          <UpgradeGate type="ai" title="Clinician Plan Required" description="Upgrade to Clinician (₹59/mo) to access and purchase premium study products." />
        ) : (
          <>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(cat => (
                <button key={cat} onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all border ${activeCategory === cat ? 'bg-primary/10 border-primary text-primary' : 'bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10'}`}>
                  {cat}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="h-64 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : filtered.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center glass rounded-3xl space-y-3">
                <ShoppingBag className="h-12 w-12 opacity-10" />
                <p className="text-muted-foreground">No products in this category yet.</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filtered.map(product => (
                  <Card key={product.id} className="glass border-none overflow-hidden group hover:scale-[1.02] transition-all duration-300">
                    <div className="aspect-[4/3] relative overflow-hidden bg-white/5">
                      {product.image_url ? (
                        <img src={product.image_url} alt={product.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 opacity-80 group-hover:opacity-100" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingBag className="h-16 w-16 opacity-10" />
                        </div>
                      )}
                      <div className="absolute top-3 left-3 px-2 py-1 rounded-full bg-black/60 backdrop-blur text-[9px] font-bold uppercase tracking-widest text-white flex items-center gap-1">
                        <Tag className="h-2.5 w-2.5" /> {product.category}
                      </div>
                    </div>

                    <CardContent className="p-5 space-y-4">
                      <div className="space-y-1">
                        <h3 className="font-bold text-sm leading-tight group-hover:text-primary transition-colors">{product.title}</h3>
                        {product.description && (
                          <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">{product.description}</p>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xl font-bold text-primary">₹{product.price}</span>
                        <a href={product.buy_link} target="_blank" rel="noopener noreferrer">
                          <Button size="sm" className="rounded-xl h-9 px-4 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 gap-1.5 text-xs font-bold">
                            Buy Now <ExternalLink className="h-3 w-3" />
                          </Button>
                        </a>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
