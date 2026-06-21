"use client"

import { useState, useMemo } from "react"
import { useUser, useDoc, useFirestore } from "@/firebase"
import { doc } from "firebase/firestore"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Check, Zap, BookOpen, Crown, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

const PLANS = [
  {
    id: "free", name: "Explorer", price: 0, icon: BookOpen,
    color: "text-muted-foreground", border: "border-white/10",
    description: "Get started with limited access",
    features: ["5 free notes per subject", "All video lectures", "3 free mindmaps per subject", "10 QBank questions per subject", "Basic dashboard"],
    locked: ["Full notes library", "All mindmaps", "Unlimited QBank", "AI Tools", "Custom Test Series", "PDF AI Extraction"],
    cta: "Current Plan", razorpayPlanId: null,
  },
  {
    id: "basic", name: "Scholar", price: 29, icon: Crown,
    color: "text-accent", border: "border-accent/40", badge: "Most Popular",
    description: "Full content library unlocked",
    features: ["Everything in Explorer", "Unlimited notes access", "All mindmaps", "Full QBank — all subjects", "Custom Test Series", "Video lectures (all)"],
    locked: ["AI Tutor", "AI Summarizer", "AI Quiz Generator", "PDF AI Extraction"],
    cta: "Upgrade to Scholar", razorpayPlanId: "basic",
  },
  {
    id: "pro", name: "Clinician", price: 59, icon: Zap,
    color: "text-primary", border: "border-primary/40", badge: "All Features",
    description: "Everything + full AI suite",
    features: ["Everything in Scholar", "AI Clinical Tutor", "AI Note Summarizer", "AI Quiz Generator", "PDF AI Extraction (Vision OCR)", "Priority support"],
    locked: [],
    cta: "Upgrade to Clinician", razorpayPlanId: "pro",
  },
]

export default function PricingPage() {
  const { user } = useUser()
  const db = useFirestore()
  const { toast } = useToast()
  const [loading, setLoading] = useState<string | null>(null)

  const profileRef = useMemo(() => (!db || !user) ? null : doc(db, 'users', user.uid), [db, user])
  const { data: profile } = useDoc(profileRef)
  const currentPlan = (profile as any)?.plan || "free"

  async function handleUpgrade(plan: typeof PLANS[0]) {
    if (!user || !plan.razorpayPlanId) return
    setLoading(plan.id)

    try {
      const res = await fetch('/api/payments/create-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: plan.razorpayPlanId, userId: user.uid, email: user.email })
      })
      const data = await res.json()

      if (!res.ok || !data.subscriptionId) {
        throw new Error(data.error || 'Could not create subscription. Please try again.')
      }

      const rzp = new (window as any).Razorpay({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        subscription_id: data.subscriptionId,
        name: 'QubixPrep',
        description: `${plan.name} Plan - Monthly Subscription`,
        handler: async () => {
          toast({
            title: "Subscription Activated!",
            description: `Welcome to ${plan.name}! Your plan will update shortly.`
          })
          setTimeout(() => window.location.reload(), 2000)
        },
        prefill: { email: user.email || '' },
        theme: { color: '#7C3AED' },
        notes: {
          userId: user.uid,
          planId: plan.razorpayPlanId,
        }
      })
      rzp.open()
    } catch (e: any) {
      toast({ variant: "destructive", title: "Subscription Failed", description: e.message })
    } finally {
      setLoading(null)
    }
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
          Start free. Upgrade when you're ready. Cancel anytime — auto-renews monthly via Razorpay.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {PLANS.map((plan) => {
          const Icon = plan.icon
          const isCurrent = currentPlan === plan.id
          const isUpgrade = plan.price > 0 && !isCurrent

          return (
            <Card key={plan.id} className={`glass border-2 ${plan.border} relative overflow-hidden flex flex-col ${isCurrent ? 'ring-2 ring-primary/50' : ''}`}>
              {plan.badge && (
                <div className="absolute top-4 right-4 px-2 py-0.5 rounded-full bg-accent/20 text-accent text-[10px] font-bold uppercase tracking-widest">
                  {plan.badge}
                </div>
              )}
              {isCurrent && <div className="absolute top-0 left-0 w-full h-1 bg-primary" />}
              <CardHeader className="p-8 pb-4">
                <div className={`p-3 rounded-2xl bg-white/5 w-fit mb-4 ${plan.color}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                <p className="text-muted-foreground text-sm">{plan.description}</p>
                <div className="mt-4 flex items-end gap-1">
                  <span className="text-4xl font-bold">₹{plan.price}</span>
                  {plan.price > 0 && <span className="text-muted-foreground mb-1">/month</span>}
                  {plan.price === 0 && <span className="text-muted-foreground mb-1">forever</span>}
                </div>
              </CardHeader>

              <CardContent className="p-8 pt-0 flex flex-col flex-1">
                <div className="space-y-3 flex-1">
                  {plan.features.map((f) => (
                    <div key={f} className="flex items-start gap-3">
                      <Check className="h-4 w-4 text-green-400 shrink-0 mt-0.5" />
                      <span className="text-sm">{f}</span>
                    </div>
                  ))}
                  {plan.locked.map((f) => (
                    <div key={f} className="flex items-start gap-3 opacity-30">
                      <div className="h-4 w-4 rounded-full border border-white/20 shrink-0 mt-0.5" />
                      <span className="text-sm line-through">{f}</span>
                    </div>
                  ))}
                </div>

                <Button
                  className={`w-full mt-8 h-12 rounded-xl font-bold ${isCurrent ? 'bg-white/10 text-white cursor-default' : plan.id === 'pro' ? 'bg-primary hover:bg-primary/90 shadow-lg shadow-primary/30' : 'bg-accent/20 hover:bg-accent/30 text-accent border border-accent/30'}`}
                  disabled={isCurrent || loading === plan.id}
                  onClick={() => isUpgrade && handleUpgrade(plan)}
                >
                  {loading === plan.id ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  {isCurrent ? "✓ Current Plan" : plan.cta}
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <p className="text-center text-xs text-muted-foreground">
        Payments secured by Razorpay · Auto-renews monthly · Cancel anytime from your profile
      </p>
    </div>
  )
}
