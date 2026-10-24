"use client"

import { useState } from "react"
import { useUser } from "@/firebase"
import { usePlan } from "@/hooks/use-plan"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Check, Zap, BookOpen, Crown, Sparkles, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

type SkuId = "basic" | "pro" | "upgrade"

const PLANS = [
  {
    id: "free", name: "Explorer", price: 0, icon: BookOpen,
    color: "text-muted-foreground", border: "border-white/10",
    description: "Try the app before you buy",
    features: [
      "A few free notes, QBank questions, flashcards, mind maps and long answers in every subject",
      "1 free PYQ session",
      "1 free case presentation",
      "A few free spotters",
      "2 free Ward Round cases",
    ],
    locked: ["Top 100 Topics", "Full libraries", "Jelly AI and AI Tools"],
  },
  {
    id: "basic", name: "Scholar", price: 999, icon: Crown,
    color: "text-accent", border: "border-accent/40", badge: "Yearly Plan",
    description: "The full content library, no AI",
    features: [
      "Everything in Explorer",
      "Unlimited notes, QBank, flashcards, mind maps and long answers",
      "Full PYQ series with images",
      "Case Presentation and unlimited Ward Round",
      "All spotters and QuickCards",
      "Top 100 Topics",
      "All video lectures",
    ],
    locked: ["Jelly AI", "AI Tutor and AI Tools", "OSCE Stations"],
  },
  {
    id: "pro", name: "Clinician", price: 1499, icon: Sparkles,
    color: "text-primary", border: "border-primary/50", badge: "With AI",
    description: "Everything in Scholar, plus all AI features",
    features: [
      "Everything in Scholar",
      "Jelly AI study companion",
      "AI Tutor, Summarizer and Quiz Generator",
      "OSCE Stations",
    ],
    locked: [] as string[],
  },
]

export default function PricingPage() {
  const { user } = useUser()
  const { plan, expiresAt } = usePlan()
  const { toast } = useToast()
  const [loading, setLoading] = useState<SkuId | null>(null)

  const validTill = expiresAt ? new Date(expiresAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : null

  async function buy(sku: SkuId, label: string) {
    if (!user) {
      toast({ variant: "destructive", title: "Please sign in first", description: "Log in or sign up, then come back to this page." })
      return
    }
    setLoading(sku)
    try {
      const idToken = await user.getIdToken()
      const res = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sku, idToken }),
      })
      const data = await res.json()
      if (!res.ok || !data.orderId) throw new Error(data.error || "Could not start the payment. Please try again.")

      const rzp = new (window as any).Razorpay({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        order_id: data.orderId,
        amount: data.amount,
        currency: data.currency,
        name: "QubixPrep",
        description: label,
        handler: async (resp: any) => {
          try {
            const token = await user.getIdToken(true)
            const v = await fetch("/api/payments/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ ...resp, idToken: token }),
            })
            const vd = await v.json()
            if (!v.ok) throw new Error(vd.error || "Could not confirm the payment.")
            toast({ title: "Payment successful!", description: "Your plan is now active." })
            setTimeout(() => window.location.reload(), 1500)
          } catch (e: any) {
            toast({ variant: "destructive", title: "Payment received, activation pending", description: "Your plan should switch on within a minute. If it does not, contact support with your payment ID " + (resp?.razorpay_payment_id || "") })
          }
        },
        prefill: { email: user.email || "" },
        theme: { color: "#7C3AED" },
      })
      rzp.open()
    } catch (e: any) {
      toast({ variant: "destructive", title: "Payment could not start", description: e.message })
    } finally {
      setLoading(null)
    }
  }

  function action(planId: string): { text: string; disabled: boolean; sku?: SkuId; label?: string } {
    if (planId === "free") return { text: plan === "free" ? "✓ Current Plan" : "Included", disabled: true }
    if (planId === "basic") {
      if (plan === "basic") return { text: "✓ Current Plan", disabled: true }
      if (plan === "pro") return { text: "Included in Clinician", disabled: true }
      return { text: "Get Scholar for ₹999 / year", disabled: false, sku: "basic", label: "Scholar - 1 year (₹999)" }
    }
    if (plan === "pro") return { text: "✓ Current Plan", disabled: true }
    if (plan === "basic") return { text: "Upgrade to Clinician for ₹500", disabled: false, sku: "upgrade", label: "Upgrade Scholar to Clinician (₹500)" }
    return { text: "Get Clinician for ₹1,499 / year", disabled: false, sku: "pro", label: "Clinician - 1 year (₹1,499)" }
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-12 space-y-12 animate-in fade-in duration-700">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-bold tracking-widest uppercase">
          <Zap className="h-3 w-3" /> Simple Pricing
        </div>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
          Choose Your <span className="text-gradient">Learning Path</span>
        </h1>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto">
          Start free. Pay once for a full year: ₹999 for the full content library, or ₹1,499 to add every AI feature.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {PLANS.map((p) => {
          const Icon = p.icon
          const a = action(p.id)
          const isCurrent = a.text.startsWith("✓")
          return (
            <Card key={p.id} className={`glass border-2 ${p.border} relative overflow-hidden flex flex-col ${isCurrent ? "ring-2 ring-primary/50" : ""}`}>
              {"badge" in p && p.badge && (
                <div className="absolute top-4 right-4 px-2 py-0.5 rounded-full bg-accent/20 text-accent text-[10px] font-bold uppercase tracking-widest">
                  {p.badge}
                </div>
              )}
              {isCurrent && <div className="absolute top-0 left-0 w-full h-1 bg-primary" />}
              <CardHeader className="p-8 pb-4">
                <div className={`p-3 rounded-2xl bg-white/5 w-fit mb-4 ${p.color}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <CardTitle className="text-2xl font-bold">{p.name}</CardTitle>
                <p className="text-muted-foreground text-sm">{p.description}</p>
                <div className="mt-4 flex items-end gap-1">
                  <span className="text-4xl font-bold">₹{p.price.toLocaleString("en-IN")}</span>
                  {p.price > 0 ? <span className="text-muted-foreground mb-1">/year</span> : <span className="text-muted-foreground mb-1">forever</span>}
                </div>
              </CardHeader>

              <CardContent className="p-8 pt-0 flex flex-col flex-1">
                <div className="space-y-3 flex-1">
                  {p.features.map((f) => (
                    <div key={f} className="flex items-start gap-3">
                      <Check className="h-4 w-4 text-green-400 shrink-0 mt-0.5" />
                      <span className="text-sm">{f}</span>
                    </div>
                  ))}
                  {p.locked.map((f) => (
                    <div key={f} className="flex items-start gap-3 opacity-30">
                      <div className="h-4 w-4 rounded-full border border-white/20 shrink-0 mt-0.5" />
                      <span className="text-sm line-through">{f}</span>
                    </div>
                  ))}
                </div>

                <Button
                  className={`w-full mt-8 h-12 rounded-xl font-bold ${isCurrent || a.disabled ? "bg-white/10 text-white cursor-default" : p.id === "pro" ? "bg-primary hover:bg-primary/90 shadow-lg shadow-primary/30" : "bg-accent/20 hover:bg-accent/30 text-accent border border-accent/30"}`}
                  disabled={a.disabled || loading !== null}
                  onClick={() => a.sku && buy(a.sku, a.label || p.name)}
                >
                  {a.sku && loading === a.sku ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  {a.text}
                </Button>
                {isCurrent && validTill && p.id !== "free" && (
                  <p className="text-center text-xs text-muted-foreground mt-3">Valid till {validTill}</p>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      <p className="text-center text-xs text-muted-foreground">
        Payments secured by Razorpay · One payment per year, no auto-renewal · Questions? Contact support
      </p>
    </div>
  )
}
