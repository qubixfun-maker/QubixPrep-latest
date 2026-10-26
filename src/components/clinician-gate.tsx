"use client"

import Link from "next/link"
import { Loader2, Lock } from "lucide-react"
import { usePlan } from "@/hooks/use-plan"

/** Shows the page only to Clinician (and admin) accounts. Everyone else sees an upgrade card. */
export function ClinicianGate({ feature, children }: { feature: string; children: React.ReactNode }) {
  const { canAccessAI, loading } = usePlan()
  if (loading) return <div className="flex h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  if (!canAccessAI) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center gap-4 p-8 pt-20 text-center">
        <div className="grid h-16 w-16 place-items-center rounded-2xl bg-primary/10 text-primary"><Lock className="h-8 w-8" /></div>
        <h1 className="text-2xl font-black">{feature} is part of the Clinician plan</h1>
        <p className="text-muted-foreground">Clinician (₹1,499 per year) adds every AI feature on top of everything in Scholar. You can upgrade from Scholar by paying only the difference.</p>
        <Link href="/pricing" className="rounded-full bg-primary px-6 py-3 font-extrabold text-white">See plans</Link>
      </div>
    )
  }
  return <>{children}</>
}
