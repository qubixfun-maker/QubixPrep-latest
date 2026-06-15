"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ShoppingBag, ExternalLink, Loader2, Tag } from "lucide-react"
import { usePlan } from "@/hooks/use-plan"
import { UpgradeGate } from "@/components/upgrade-gate"
import Image from "next/image"

const CATEGORIES = ["All", "Notes Pack", "Question Bank", "Flashcards", "Video Pack", "Combo Pack"]

export default function ProductsPage() {
  const { isPro, loading: planLoading } = usePlan()
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState("All")

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

  if (planLoading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>

  if (!isPro) return (
    <div className="max-w-3xl mx-auto p-4 md:p-12 space-y-8">
      <div className="text-center space-y-3">
        <ShoppingBag className="h-16 w-16 text-primary mx-auto" />
        <h1 className="text-4xl font-bold">QubixPrep Store</h1>
        <p className="text-muted-foreground text-lg">Premium study materials curated for NEET PG & USMLE</p>
      </div>
      <UpgradeGate type="ai" title="Clinician Plan Required" description="Upgrade to Clinician (₹59/mo) to access and purchase premium study products." />
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-12 space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold flex items-center gap-3">
          <ShoppingBag className="h-10 w-10 text-primary" /> QubixPrep Store
        </h1>
        <p className="text-muted-foreground text-lg">Premium study materials curated for NEET PG & USMLE</p>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map(cat => (
          <button key={cat} onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all border ${activeCategory === cat ? 'bg-primary/10 border-primary text-primary' : 'bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10'}`}>
            {cat}
          </button>
        ))}
      </div>

      {/* Products Grid */}
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
              {/* Product Image */}
              <div className="aspect-[4/3] relative overflow-hidden bg-white/5">
                {product.image_url ? (
                  <img src={product.image_url} alt={product.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 opacity-80 group-hover:opacity-100" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ShoppingBag className="h-16 w-16 opacity-10" />
                  </div>
                )}
                {/* Category Badge */}
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
    </div>
  )
}