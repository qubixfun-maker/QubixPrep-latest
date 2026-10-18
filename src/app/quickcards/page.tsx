"use client"

import { useMemo } from "react"
import Link from "next/link"
import { doc } from "firebase/firestore"
import { useUser, useDoc, useFirestore } from "@/firebase"
import { useFeatureSettings, useCardCounts, useCardStates } from "@/hooks/use-quickcards"
import { SORTED_FEATURES } from "@/lib/quickcards/cardFeatures"
import { getFeatureIcon } from "@/components/quickcards/icons"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Loader2, ChevronRight } from "lucide-react"
import type { GateType } from "@/types/quickcards"

const GATE_NAME: Record<GateType, string> = {
  free: "Subscription",
  basic: "Scholar",
  pro: "Clinician",
  addon: "Add-on",
}

export default function QuickCardsHubPage() {
  const { user } = useUser()
  const db = useFirestore()
  const { settings, loading } = useFeatureSettings()
  const counts = useCardCounts()
  const states = useCardStates()

  const profileRef = useMemo(() => (!db || !user) ? null : doc(db, "users", user.uid), [db, user])
  const { data: profile } = useDoc(profileRef)
  const isAdmin = (profile as any)?.role === "admin"

  const revisedByFeature = useMemo(() => {
    const out: Record<string, number> = {}
    Object.values(states).forEach((s) => {
      if (s.revised && s.feature) out[s.feature] = (out[s.feature] || 0) + 1
    })
    return out
  }, [states])

  if (loading) {
    return <div className="flex justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  }

  const features = SORTED_FEATURES.filter((f) => isAdmin || settings[f.slug]?.visible !== false)

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Quick<span className="text-accent">Cards</span></h1>
        <p className="text-sm text-muted-foreground mt-1">Dense, exam-ready reference cards for MBBS and NEET-PG. Tap a section to start.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f) => {
          const Icon = getFeatureIcon(f.icon)
          const total = counts[f.slug] ?? 0
          const revised = Math.min(revisedByFeature[f.slug] || 0, total)
          const pct = total ? Math.round((revised / total) * 100) : 0
          const s = settings[f.slug]
          return (
            <Link
              key={f.slug}
              href={`/quickcards/${f.slug}`}
              className="group glass rounded-3xl border border-white/10 p-5 space-y-4 hover:border-primary/50 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="p-3 rounded-2xl bg-primary/10 text-primary"><Icon className="h-6 w-6" /></div>
                <div className="flex-1 min-w-0">
                  <h2 className="font-bold leading-tight">{f.name}</h2>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{f.description}</p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline">{total} {total === 1 ? "card" : "cards"}</Badge>
                {s && <Badge variant="outline">{GATE_NAME[s.gate]}</Badge>}
                {s && !s.visible && <Badge variant="destructive">Hidden</Badge>}
              </div>
              {user && total > 0 && (
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-muted-foreground">
                    <span>My progress</span>
                    <span>{revised} / {total}</span>
                  </div>
                  <Progress value={pct} />
                </div>
              )}
            </Link>
          )
        })}
      </div>

      {features.length === 0 && (
        <div className="text-center text-muted-foreground py-16 border border-dashed border-white/10 rounded-2xl">Nothing here yet. Check back soon.</div>
      )}
    </div>
  )
}
