"use client"

import { use, useMemo, useState, useCallback } from "react"
import Link from "next/link"
import { doc, setDoc, serverTimestamp } from "firebase/firestore"
import { useUser, useDoc, useFirestore } from "@/firebase"
import { useFeatureSettings, useFeatureCards, useCardImages, useCardStates } from "@/hooks/use-quickcards"
import { getFeature } from "@/lib/quickcards/cardFeatures"
import { getFeatureIcon } from "@/components/quickcards/icons"
import { CardViewer } from "@/components/quickcards/card-viewer"
import type { QuickCard, GateType } from "@/types/quickcards"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Lock, ArrowLeft, Search, Bookmark, CheckCircle2, Crown } from "lucide-react"

const GATE_NAME: Record<GateType, string> = {
  free: "Subscription",
  basic: "Scholar plan",
  pro: "Clinician plan",
  addon: "Add-on",
}

export default function QuickCardsFeaturePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const feature = getFeature(slug)
  const { user } = useUser()
  const db = useFirestore()
  const { toast } = useToast()
  const { isAdmin } = usePlanAdmin()
  const { settings, loading: settingsLoading } = useFeatureSettings()
  const { cards, loading: cardsLoading } = useFeatureCards(slug)
  const { urls, featureAccess, loading: imagesLoading, error: imagesError } = useCardImages(slug)
  const states = useCardStates()

  const [tab, setTab] = useState<"all" | "mine">("all")
  const [search, setSearch] = useState("")
  const [audience, setAudience] = useState<"all" | "MBBS" | "NEET-PG">("all")
  const [tag, setTag] = useState<string>("")
  const [viewerIndex, setViewerIndex] = useState<number | null>(null)
  const [lockedCard, setLockedCard] = useState<QuickCard | null>(null)

  const gate = settings[slug]?.gate ?? feature?.defaultGate ?? "basic"
  const visible = settings[slug]?.visible !== false

  const progress = useMemo(() => {
    const revised = cards.filter((c) => states[c.id]?.revised).length
    return { revised, total: cards.length, pct: cards.length ? Math.round((revised / cards.length) * 100) : 0 }
  }, [cards, states])

  const availableTags = useMemo(() => {
    const present = new Set(cards.flatMap((c) => c.tags || []))
    const ordered = (feature?.tags || []).filter((t) => present.has(t))
    const extras = Array.from(present).filter((t) => !(feature?.tags || []).includes(t))
    return [...ordered, ...extras]
  }, [cards, feature])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return cards.filter((c) => {
      if (tab === "mine" && !states[c.id]?.bookmarked) return false
      if (audience !== "all" && c.audience !== "both" && c.audience !== audience) return false
      if (tag && !(c.tags || []).includes(tag)) return false
      if (q && !(c.cardId.toLowerCase().includes(q) || (c.title || "").toLowerCase().includes(q) || (c.tags || []).some((t) => t.toLowerCase().includes(q)))) return false
      return true
    })
  }, [cards, states, tab, audience, tag, search])

  const toggleState = useCallback(
    async (card: QuickCard, field: "bookmarked" | "revised") => {
      if (!user || !db) {
        toast({ title: "Sign in to save your progress", description: "Bookmarks and revision progress are saved to your account." })
        return
      }
      const current = !!states[card.id]?.[field]
      try {
        await setDoc(
          doc(db, "users", user.uid, "quickCardState", card.id),
          { [field]: !current, feature: slug, updatedAt: serverTimestamp() },
          { merge: true }
        )
      } catch (e: any) {
        toast({ variant: "destructive", title: "Could not save", description: e.message })
      }
    },
    [user, db, states, slug, toast]
  )

  function openCard(card: QuickCard) {
    const u = urls[card.id]
    if (!u || u.locked) {
      setLockedCard(card)
      return
    }
    setViewerIndex(filtered.findIndex((c) => c.id === card.id))
  }

  if (!feature) {
    return <div className="max-w-md mx-auto py-24 text-center text-muted-foreground">This section does not exist. <Link href="/quickcards" className="text-primary underline">Back to QuickCards</Link></div>
  }
  if (settingsLoading) {
    return <div className="flex justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  }
  if (!visible && !isAdmin) {
    return <div className="max-w-md mx-auto py-24 text-center text-muted-foreground">This section is not available right now. <Link href="/quickcards" className="text-primary underline">Back to QuickCards</Link></div>
  }

  const Icon = getFeatureIcon(feature.icon)
  const loading = cardsLoading || imagesLoading

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-start gap-3">
        <Link href="/quickcards"><Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button></Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2"><Icon className="h-7 w-7 text-primary shrink-0" /> {feature.name}</h1>
          <p className="text-sm text-muted-foreground">{feature.description}</p>
        </div>
        <Badge variant="outline" className="shrink-0">{GATE_NAME[gate]}</Badge>
      </div>

      {user && cards.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Revised {progress.revised} of {progress.total}</span>
            <span>{progress.pct}%</span>
          </div>
          <Progress value={progress.pct} />
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-xl border border-white/10 p-1">
          <Button size="sm" variant={tab === "all" ? "default" : "ghost"} onClick={() => setTab("all")}>All cards</Button>
          <Button size="sm" variant={tab === "mine" ? "default" : "ghost"} onClick={() => setTab("mine")} className="gap-1"><Bookmark className="h-3.5 w-3.5" /> My cards</Button>
        </div>
        <div className="relative flex-1 min-w-[200px]">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search cards" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="inline-flex rounded-xl border border-white/10 p-1">
          {(["all", "MBBS", "NEET-PG"] as const).map((a) => (
            <Button key={a} size="sm" variant={audience === a ? "secondary" : "ghost"} onClick={() => setAudience(a)}>{a === "all" ? "Both" : a}</Button>
          ))}
        </div>
      </div>

      {availableTags.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground mr-1">{feature.filterLabel}:</span>
          <button type="button" onClick={() => setTag("")} className={`px-3 py-1 rounded-full text-xs border transition-colors ${!tag ? "bg-primary/20 border-primary text-primary" : "border-white/10 text-muted-foreground hover:bg-white/5"}`}>All</button>
          {availableTags.map((t) => (
            <button key={t} type="button" onClick={() => setTag(tag === t ? "" : t)} className={`px-3 py-1 rounded-full text-xs border transition-colors ${tag === t ? "bg-primary/20 border-primary text-primary" : "border-white/10 text-muted-foreground hover:bg-white/5"}`}>{t}</button>
          ))}
        </div>
      )}

      {imagesError && <p className="text-sm text-destructive">{imagesError}</p>}

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center text-muted-foreground py-16 border border-dashed border-white/10 rounded-2xl">
          {cards.length === 0 ? "No cards here yet. Check back soon." : tab === "mine" ? "You have not bookmarked any cards yet." : "No cards match your filters."}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {filtered.map((c) => {
            const u = urls[c.id]
            const locked = !u || u.locked
            const st = states[c.id]
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => openCard(c)}
                className="group relative text-left rounded-2xl overflow-hidden border border-white/10 bg-card/50 hover:border-primary/50 transition-colors"
              >
                <div
                  className="aspect-[3/4] bg-white/5 bg-cover bg-center"
                  style={c.blurData ? { backgroundImage: `url(${c.blurData})` } : undefined}
                >
                  {!locked && u?.thumb && (
                    <img src={u.thumb} alt={c.title} loading="lazy" decoding="async" className="h-full w-full object-cover object-top" />
                  )}
                  {locked && (
                    <div className="h-full w-full flex flex-col items-center justify-center gap-2 backdrop-blur-xl bg-black/40">
                      <Lock className="h-6 w-6 text-white/80" />
                      <span className="text-[11px] text-white/80">{GATE_NAME[gate]}</span>
                    </div>
                  )}
                </div>
                <div className="p-2.5">
                  <span className="font-mono text-[10px] font-bold text-primary">{c.cardId}</span>
                  {c.title && c.title !== c.cardId && <p className="text-xs font-medium leading-snug line-clamp-2">{c.title}</p>}
                </div>
                <div className="absolute top-2 right-2 flex gap-1">
                  {st?.bookmarked && <span className="rounded-full bg-black/60 p-1"><Bookmark className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" /></span>}
                  {st?.revised && <span className="rounded-full bg-black/60 p-1"><CheckCircle2 className="h-3.5 w-3.5 text-green-400" /></span>}
                </div>
              </button>
            )
          })}
        </div>
      )}

      {viewerIndex !== null && viewerIndex >= 0 && (
        <CardViewer
          cards={filtered}
          index={viewerIndex}
          urls={urls}
          states={states}
          onIndexChange={setViewerIndex}
          onClose={() => setViewerIndex(null)}
          onToggleBookmark={(c) => toggleState(c, "bookmarked")}
          onToggleRevised={(c) => toggleState(c, "revised")}
        />
      )}

      <Dialog open={!!lockedCard} onOpenChange={(o) => { if (!o) setLockedCard(null) }}>
        <DialogContent className="max-w-sm text-center">
          <DialogHeader className="items-center">
            <div className="p-4 rounded-full bg-accent/10 text-accent mb-2"><Crown className="h-8 w-8" /></div>
            <DialogTitle>{gate === "addon" ? "Available as an add-on" : `${GATE_NAME[gate]} required`}</DialogTitle>
            <DialogDescription>
              {!user
                ? "QuickCards are for subscribers. Log in with your subscribed account to open them."
                : gate === "addon"
                ? `${feature.name} is a separate add-on. Contact us to unlock it.`
                : `Upgrade to open every card in ${feature.name}.`}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2 pt-2">
            {!user ? (
              <>
                <Link href="/login"><Button className="w-full">Log in</Button></Link>
                <Link href="/pricing"><Button variant="outline" className="w-full">View plans</Button></Link>
              </>
            ) : (
              <Link href="/pricing"><Button className="w-full gap-2"><Lock className="h-4 w-4" /> View plans</Button></Link>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Only used so admins can preview a hidden section; the images API enforces the real check.
function usePlanAdmin() {
  const { user } = useUser()
  const db = useFirestore()
  const profileRef = useMemo(() => (!db || !user) ? null : doc(db, "users", user.uid), [db, user])
  const { data: profile } = useDoc(profileRef)
  return { isAdmin: (profile as any)?.role === "admin" }
}
