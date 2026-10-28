"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Loader2, Lock } from "lucide-react"
import { usePlan } from "@/hooks/use-plan"

// Routes a free (Explorer) user may NOT open at all.
//   need: "basic" = Scholar or Clinician, "pro" = Clinician only
const RULES: { prefix: string; need: "basic" | "pro"; label: string }[] = [
  { prefix: "/spotters", need: "basic", label: "Spotters" },
  { prefix: "/quickcards", need: "basic", label: "Quick Cards" },
  { prefix: "/top-100", need: "basic", label: "Top 100 Topics" },
  { prefix: "/stories", need: "basic", label: "Med Stories" },
  { prefix: "/arena", need: "pro", label: "Arena" },
  { prefix: "/ai-tools", need: "pro", label: "AI Tools" },
]

function match(pathname: string) {
  return RULES.find((r) => pathname === r.prefix || pathname.startsWith(r.prefix + "/"))
}

export function PlanRouteGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "/"
  const { isBasic, isPro, loading } = usePlan()
  const rule = match(pathname)
  if (!rule) return <>{children}</>
  if (loading) return <div className="flex justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  const ok = rule.need === "pro" ? isPro : isBasic
  if (ok) return <>{children}</>
  const planName = rule.need === "pro" ? "Clinician" : "Scholar"
  const price = rule.need === "pro" ? "₹1,499" : "₹999"
  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center">
      <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-secondary text-primary"><Lock className="h-7 w-7" /></div>
      <h1 className="text-2xl font-bold">{rule.label} is a {planName} feature</h1>
      <p className="mt-2 text-sm text-muted-foreground">Unlock {rule.label} with the {planName} plan ({price}/year).</p>
      <Link href="/pricing" className="mt-6 inline-block rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground">See plans</Link>
    </div>
  )
}
