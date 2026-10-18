"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { doc } from "firebase/firestore"
import { ref as storageRef, uploadBytes } from "firebase/storage"
import { useUser, useDoc, useFirestore, useStorage } from "@/firebase"
import { useFeatureCards, useFeatureSettings, useCardImages } from "@/hooks/use-quickcards"
import { CARD_FEATURES, SORTED_FEATURES, getFeature, type CardFeatureConfig } from "@/lib/quickcards/cardFeatures"
import { parseCardFilename, parseCardName, type ParsedCardFile } from "@/lib/quickcards/parse-filename"
import { compressCardImage, makeThumbnail, makeBlurData } from "@/lib/quickcards/compress"
import { getFeatureIcon } from "@/components/quickcards/icons"
import type { QuickCard, GateType, Audience } from "@/types/quickcards"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Lock, ArrowLeft, Upload, CheckCircle2, AlertTriangle, Trash2, Pencil, Search, Layers } from "lucide-react"

const GATE_LABELS: Record<GateType, string> = {
  free: "Any subscriber",
  basic: "Any subscriber (Scholar or Clinician)",
  pro: "Clinician plan only",
  addon: "Separate paid add-on",
}

async function callAdminApi(user: any, payload: Record<string, any>) {
  const idToken = await user.getIdToken()
  const res = await fetch("/api/admin/quickcards", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken, ...payload }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || "Request failed")
  return data
}

type QueueItem = {
  key: string
  file: File
  previewUrl: string
  name: string
  status: "idle" | "uploading" | "done" | "failed"
  message?: string
}

export default function AdminQuickCardsPage() {
  const { user, loading: authLoading } = useUser()
  const db = useFirestore()
  const profileRef = useMemo(() => (!db || !user) ? null : doc(db, "users", user.uid), [db, user])
  const { data: profile, loading: profileLoading } = useDoc(profileRef)
  const isAdmin = (profile as any)?.role === "admin"

  const [activeSlug, setActiveSlug] = useState(SORTED_FEATURES[0].slug)
  const [refreshKey, setRefreshKey] = useState(0)

  if (authLoading || profileLoading) {
    return <div className="flex justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  }
  if (!user || !isAdmin) {
    return (
      <div className="max-w-md mx-auto py-24 text-center space-y-4">
        <Lock className="h-10 w-10 mx-auto text-muted-foreground" />
        <p className="text-muted-foreground">Admin access required.</p>
        <Link href="/"><Button variant="outline">Back home</Button></Link>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin"><Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button></Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">QuickCards</h1>
          <p className="text-sm text-muted-foreground">Upload card images, then publish them per feature.</p>
        </div>
      </div>

      <BulkUpload user={user} onUploaded={() => setRefreshKey((k) => k + 1)} onJump={setActiveSlug} />

      <Tabs value={activeSlug} onValueChange={setActiveSlug}>
        <div className="overflow-x-auto pb-1">
          <TabsList className="h-auto flex-nowrap w-max">
            {SORTED_FEATURES.map((f) => (
              <TabsTrigger key={f.slug} value={f.slug} className="whitespace-nowrap">{f.name}</TabsTrigger>
            ))}
          </TabsList>
        </div>
        {SORTED_FEATURES.map((f) => (
          <TabsContent key={f.slug} value={f.slug} className="mt-4">
            {activeSlug === f.slug && <FeaturePanel feature={f} user={user} refreshKey={refreshKey} />}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Bulk upload                                                         */
/* ------------------------------------------------------------------ */

function BulkUpload({ user, onUploaded, onJump }: { user: any; onUploaded: () => void; onJump: (slug: string) => void }) {
  const storage = useStorage()
  const { toast } = useToast()
  const inputRef = useRef<HTMLInputElement>(null)
  const nameRefs = useRef<Record<string, HTMLInputElement | null>>({})
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [running, setRunning] = useState(false)
  const [fillFeature, setFillFeature] = useState<string>(SORTED_FEATURES[0].slug)
  const [fillStart, setFillStart] = useState("1")

  // Free the preview URLs when the page closes
  const queueRef = useRef(queue)
  queueRef.current = queue
  useEffect(() => () => queueRef.current.forEach((q) => URL.revokeObjectURL(q.previewUrl)), [])

  function onPick(files: FileList | null) {
    if (!files) return
    const sorted = Array.from(files).sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))
    const items: QueueItem[] = sorted.map((file, n) => {
      // If the file is already named like C7.png, use that as the starting name
      const guess = parseCardFilename(file.name)
      return {
        key: `${Date.now()}-${n}-${file.name}`,
        file,
        previewUrl: URL.createObjectURL(file),
        name: guess.ok ? (guess.side === "back" ? `${guess.cardId}-back` : guess.cardId) : "",
        status: "idle" as const,
      }
    })
    setQueue((q) => [...q, ...items])
  }

  function setName(key: string, name: string) {
    setQueue((q) => q.map((it) => (it.key === key ? { ...it, name, status: it.status === "failed" ? "idle" : it.status } : it)))
  }

  function removeItem(key: string) {
    setQueue((q) => {
      const it = q.find((x) => x.key === key)
      if (it) URL.revokeObjectURL(it.previewUrl)
      return q.filter((x) => x.key !== key)
    })
  }

  function clearAll() {
    queue.forEach((q) => URL.revokeObjectURL(q.previewUrl))
    setQueue([])
  }

  /** Number the photos in order: C1, C2, C3 ... for every row that has no name yet. */
  function autoFill() {
    const f = getFeature(fillFeature)
    const start = parseInt(fillStart, 10)
    if (!f || !Number.isFinite(start) || start < 1) {
      toast({ variant: "destructive", title: "Enter a start number", description: "For example 1 to begin at C1." })
      return
    }
    const prefix = f.prefixes[0]
    let n = start
    setQueue((q) => q.map((it) => (it.status === "done" || it.name.trim() ? it : { ...it, name: `${prefix}${n++}` })))
  }

  function onNameKey(e: React.KeyboardEvent<HTMLInputElement>, idx: number) {
    if (e.key === "Enter" || e.key === "ArrowDown") {
      e.preventDefault()
      const next = queue[idx + 1]
      if (next) nameRefs.current[next.key]?.focus()
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      const prev = queue[idx - 1]
      if (prev) nameRefs.current[prev.key]?.focus()
    }
  }

  // Validation for the whole batch: bad names and the same name used twice
  const analysis = useMemo(() => {
    const seen = new Map<string, number>()
    queue.forEach((it) => {
      const p = parseCardName(it.name)
      if (p.ok && it.status !== "done") {
        const k = `${p.cardId}|${p.side}`
        seen.set(k, (seen.get(k) || 0) + 1)
      }
    })
    const rows = queue.map((it) => {
      if (it.status === "done") return { ok: true as const, parsed: null as ParsedCardFile | null, error: "" }
      const p = parseCardName(it.name)
      if (!p.ok) return { ok: false as const, parsed: null, error: it.name.trim() ? p.reason : "" }
      if ((seen.get(`${p.cardId}|${p.side}`) || 0) > 1) return { ok: false as const, parsed: null, error: "Same name used twice" }
      return { ok: true as const, parsed: p, error: "" }
    })
    return rows
  }, [queue])

  async function uploadOne(i: number, item: QueueItem, p: ParsedCardFile) {
    if (!storage) throw new Error("Storage is not ready.")
    patch(i, { status: "uploading", message: "Compressing..." })
    const stamp = Date.now()
    const base = `quickcards/${p.feature.slug}/${p.cardId}`

    const full = await compressCardImage(item.file)
    const path = `${base}-${p.side}-${stamp}.${full.ext}`
    patch(i, { message: "Uploading..." })
    await uploadBytes(storageRef(storage, path), full.blob, { contentType: full.contentType })

    let thumbPath: string | undefined
    let blurData: string | undefined
    if (p.side === "front") {
      const thumb = await makeThumbnail(item.file)
      thumbPath = `${base}-thumb-${stamp}.${thumb.ext}`
      await uploadBytes(storageRef(storage, thumbPath), thumb.blob, { contentType: thumb.contentType })
      blurData = await makeBlurData(item.file)
    }

    await callAdminApi(user, {
      action: "upsert-image",
      feature: p.feature.slug,
      cardId: p.cardId,
      side: p.side,
      path,
      thumbPath,
      blurData,
    })
  }

  function patch(i: number, pt: Partial<QueueItem>) {
    setQueue((q) => q.map((it, idx) => (idx === i ? { ...it, ...pt } : it)))
  }

  async function startUpload() {
    if (analysis.some((a, i) => !a.ok && queue[i].status !== "done")) {
      toast({ variant: "destructive", title: "Fix the red rows first", description: "Every photo needs a valid, different name (or remove it)." })
      return
    }
    setRunning(true)
    let ok = 0
    let failed = 0
    const jobs = queue
      .map((item, i) => ({ item, i, p: analysis[i].parsed }))
      .filter((j): j is { item: QueueItem; i: number; p: ParsedCardFile } => !!j.p && j.item.status !== "done")
    // Fronts are done before backs; within each group run 3 at a time
    const fronts = jobs.filter((j) => j.p.side === "front")
    const backs = jobs.filter((j) => j.p.side === "back")
    for (const group of [fronts, backs]) {
      let cursor = 0
      const worker = async () => {
        while (cursor < group.length) {
          const { item, i, p } = group[cursor++]
          try {
            await uploadOne(i, item, p)
            patch(i, { status: "done", message: "Uploaded" })
            ok++
          } catch (e: any) {
            patch(i, { status: "failed", message: e.message || "Failed" })
            failed++
          }
        }
      }
      await Promise.all([worker(), worker(), worker()])
    }
    setRunning(false)
    onUploaded()
    toast({
      title: failed ? "Upload finished with errors" : "Upload complete",
      description: `${ok} uploaded${failed ? `, ${failed} failed (press Upload again to retry them)` : ""}. New cards are saved as drafts.`,
      variant: failed ? "destructive" : undefined,
    })
    const first = jobs[0]?.p
    if (first) onJump(first.feature.slug)
  }

  const pending = queue.filter((q) => q.status !== "done").length
  const unnamed = queue.filter((q) => q.status !== "done" && !q.name.trim()).length
  const problems = analysis.filter((a, i) => !a.ok && queue[i].status !== "done").length

  return (
    <Card className="glass border-white/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg"><Upload className="h-5 w-5 text-primary" /> Bulk upload</CardTitle>
        <p className="text-sm text-muted-foreground">
          Choose as many photos as you like (100+ is fine), then type the card name beside each one: <code>C7</code>, <code>M1</code>, back side <code>M1-back</code>.
          The letters pick the feature ({CARD_FEATURES.map((f) => `${f.prefixes.join("/")} = ${f.name}`).join(", ")}).
          Press Enter to jump to the next box. Re-uploading a name replaces that image.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" multiple className="hidden" onChange={(e) => { onPick(e.target.files); e.target.value = "" }} />
        <div className="flex flex-wrap gap-3 items-end">
          <Button variant="outline" onClick={() => inputRef.current?.click()} disabled={running}>Choose images</Button>
          <Button onClick={startUpload} disabled={running || pending === 0} className="gap-2">
            {running && <Loader2 className="h-4 w-4 animate-spin" />} Upload {pending > 0 ? `${pending} image${pending > 1 ? "s" : ""}` : ""}
          </Button>
          {queue.length > 0 && !running && <Button variant="ghost" onClick={clearAll}>Clear all</Button>}
        </div>

        {queue.length > 0 && (
          <div className="flex flex-wrap items-end gap-2 rounded-xl border border-white/10 p-3">
            <div className="space-y-1">
              <Label className="text-xs">Quick-number the empty boxes</Label>
              <div className="flex gap-2">
                <Select value={fillFeature} onValueChange={setFillFeature}>
                  <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SORTED_FEATURES.map((f) => <SelectItem key={f.slug} value={f.slug}>{f.name} ({f.prefixes[0]})</SelectItem>)}
                  </SelectContent>
                </Select>
                <Input value={fillStart} onChange={(e) => setFillStart(e.target.value)} inputMode="numeric" className="w-20" aria-label="Start number" />
                <Button variant="secondary" onClick={autoFill} disabled={running}>Fill in order</Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground flex-1 min-w-48">
              Photos are listed in file-name order. This numbers the empty boxes one after another (C1, C2, C3 ...); you can still edit any box.
            </p>
          </div>
        )}

        {queue.length > 0 && (
          <p className="text-xs text-muted-foreground">
            {queue.length} photo{queue.length > 1 ? "s" : ""} · {unnamed} without a name{problems - unnamed > 0 ? ` · ${problems - unnamed} with a problem` : ""}
          </p>
        )}

        {queue.length > 0 && (
          <div className="max-h-[32rem] overflow-y-auto rounded-xl border border-white/10 divide-y divide-white/5 text-sm">
            {queue.map((it, i) => {
              const a = analysis[i]
              const bad = it.status !== "done" && !a.ok
              return (
                <div key={it.key} className="flex items-center gap-3 px-3 py-2">
                  <img src={it.previewUrl} alt="" loading="lazy" decoding="async" className="h-14 w-14 rounded-lg object-cover bg-black/30 shrink-0" />
                  <div className="flex-1 min-w-0 space-y-1">
                    <Input
                      ref={(el) => { nameRefs.current[it.key] = el }}
                      value={it.name}
                      onChange={(e) => setName(it.key, e.target.value)}
                      onKeyDown={(e) => onNameKey(e, i)}
                      disabled={running || it.status === "done"}
                      placeholder="Type name, e.g. C7 or M1-back"
                      aria-label={`Card name for ${it.file.name}`}
                      className={`h-9 font-mono ${bad && it.name.trim() ? "border-destructive" : ""}`}
                    />
                    <p className="text-[11px] text-muted-foreground truncate">
                      {it.file.name}
                      {a.parsed ? ` → ${a.parsed.feature.name} · ${a.parsed.side}` : ""}
                      {bad && a.error ? <span className="text-destructive"> · {a.error}</span> : null}
                    </p>
                  </div>
                  <div className="shrink-0 text-right min-w-20">
                    {it.status === "uploading" && <span className="flex items-center gap-1 text-primary text-xs"><Loader2 className="h-3 w-3 animate-spin" />{it.message}</span>}
                    {it.status === "done" && <span className="flex items-center gap-1 text-green-500 text-xs"><CheckCircle2 className="h-4 w-4" />Done</span>}
                    {it.status === "failed" && <span className="flex items-center gap-1 text-destructive text-xs" title={it.message}><AlertTriangle className="h-4 w-4" />Failed</span>}
                    {it.status === "idle" && !running && (
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeItem(it.key)} aria-label="Remove photo"><Trash2 className="h-4 w-4" /></Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/* ------------------------------------------------------------------ */
/* Per-feature panel: settings + card list                             */
/* ------------------------------------------------------------------ */

function FeaturePanel({ feature, user, refreshKey }: { feature: CardFeatureConfig; user: any; refreshKey: number }) {
  const { toast } = useToast()
  const { settings } = useFeatureSettings()
  const { cards, loading } = useFeatureCards(feature.slug, { includeDrafts: true })
  const [imgRefresh, setImgRefresh] = useState(0)
  const { urls } = useCardImages(feature.slug, refreshKey + imgRefresh + cards.length)
  const [search, setSearch] = useState("")
  const [editing, setEditing] = useState<QuickCard | null>(null)
  const [busy, setBusy] = useState(false)

  const s = settings[feature.slug]
  const Icon = getFeatureIcon(feature.icon)

  const filtered = cards.filter((c) => {
    const q = search.trim().toLowerCase()
    if (!q) return true
    return c.cardId.toLowerCase().includes(q) || (c.title || "").toLowerCase().includes(q) || (c.tags || []).some((t) => t.toLowerCase().includes(q))
  })
  const drafts = cards.filter((c) => c.status === "draft" && c.imagePaths?.front)

  async function run(fn: () => Promise<any>, okMsg?: string) {
    setBusy(true)
    try {
      await fn()
      if (okMsg) toast({ title: okMsg })
    } catch (e: any) {
      toast({ variant: "destructive", title: "Something went wrong", description: e.message })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      <Card className="glass border-white/10">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg"><Icon className="h-5 w-5 text-primary" /> {feature.name} settings</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-6">
          <div className="flex items-center gap-3">
            <Switch
              checked={s.visible}
              disabled={busy}
              onCheckedChange={(v) => run(() => callAdminApi(user, { action: "save-settings", slug: feature.slug, visible: v, gate: s.gate }), v ? "Feature is now visible" : "Feature is now hidden")}
            />
            <Label>{s.visible ? "Shown in the app" : "Hidden from students"}</Label>
          </div>
          <div className="space-y-1.5 min-w-[240px]">
            <Label className="text-xs text-muted-foreground">Who can open these cards</Label>
            <Select value={s.gate === "free" ? "basic" : s.gate} disabled={busy} onValueChange={(v) => run(() => callAdminApi(user, { action: "save-settings", slug: feature.slug, visible: s.visible, gate: v }), "Plan gate saved")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(GATE_LABELS) as GateType[]).filter((g) => g !== "free").map((g) => <SelectItem key={g} value={g}>{GATE_LABELS[g]}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {s.gate === "addon" && (
            <p className="text-xs text-muted-foreground max-w-xs">
              Add-on access is read from <code>quickCardAddons</code> on the user document (add "{feature.slug}" to grant it).
            </p>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search by ID, title or tag" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Badge variant="outline">{cards.length} cards</Badge>
        {drafts.length > 0 && (
          <Button
            size="sm"
            disabled={busy}
            onClick={() => run(async () => {
              const r = await callAdminApi(user, { action: "bulk-update", cardIds: drafts.map((c) => c.id), fields: { status: "published" } })
              toast({ title: `Published ${r.changed} cards` })
            })}
          >
            Publish all {drafts.length} drafts
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center text-muted-foreground py-12 border border-dashed border-white/10 rounded-2xl">
          <Layers className="h-8 w-8 mx-auto mb-2 opacity-50" />
          {cards.length === 0 ? "No cards yet. Upload some images above." : "No cards match your search."}
        </div>
      ) : (
        <div className="rounded-2xl border border-white/10 divide-y divide-white/5">
          {filtered.map((c) => (
            <div key={c.id} className="flex items-center gap-3 p-3">
              <div className="h-16 w-12 shrink-0 rounded-md overflow-hidden bg-white/5 border border-white/10">
                {urls[c.id]?.thumb ? <img src={urls[c.id].thumb} alt="" className="h-full w-full object-cover" loading="lazy" /> : null}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-sm font-bold">{c.cardId}</span>
                  <Badge variant={c.status === "published" ? "default" : "outline"}>{c.status}</Badge>
                  {c.imagePaths?.back && <Badge variant="outline">Has back</Badge>}
                  {!c.imagePaths?.front && <Badge variant="destructive">No front image</Badge>}
                </div>
                <p className="text-sm truncate">{c.title}</p>
                {c.tags?.length > 0 && <p className="text-xs text-muted-foreground truncate">{c.tags.join(" · ")}</p>}
              </div>
              <span className="text-xs text-muted-foreground hidden sm:block">#{c.order}</span>
              <Button size="icon" variant="ghost" onClick={() => setEditing(c)}><Pencil className="h-4 w-4" /></Button>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <EditDialog
          card={editing}
          feature={feature}
          user={user}
          onClose={() => setEditing(null)}
          onSaved={() => setImgRefresh((k) => k + 1)}
        />
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Edit dialog                                                         */
/* ------------------------------------------------------------------ */

function EditDialog({ card, feature, user, onClose, onSaved }: { card: QuickCard; feature: CardFeatureConfig; user: any; onClose: () => void; onSaved: () => void }) {
  const { toast } = useToast()
  const [title, setTitle] = useState(card.title || "")
  const [tags, setTags] = useState<string[]>(card.tags || [])
  const [audience, setAudience] = useState<Audience>(card.audience || "both")
  const [order, setOrder] = useState(String(card.order ?? 0))
  const [status, setStatus] = useState<"draft" | "published">(card.status || "draft")
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const allTags = Array.from(new Set([...(getFeature(feature.slug)?.tags || []), ...tags]))

  function toggleTag(t: string) {
    setTags((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]))
  }

  async function save() {
    setSaving(true)
    try {
      const orderNum = Number(order)
      await callAdminApi(user, {
        action: "update-card",
        cardId: card.id,
        fields: { title, tags, audience, order: Number.isFinite(orderNum) ? orderNum : 0, isFree: false, status },
      })
      toast({ title: "Card saved" })
      onSaved()
      onClose()
    } catch (e: any) {
      toast({ variant: "destructive", title: "Could not save", description: e.message })
    } finally {
      setSaving(false)
    }
  }

  async function remove() {
    setSaving(true)
    try {
      await callAdminApi(user, { action: "delete-card", cardId: card.id })
      toast({ title: `${card.cardId} deleted` })
      onSaved()
      onClose()
    } catch (e: any) {
      toast({ variant: "destructive", title: "Could not delete", description: e.message })
      setSaving(false)
    }
  }

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit {card.cardId}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>{feature.filterLabel} tags</Label>
            <div className="flex flex-wrap gap-2">
              {allTags.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => toggleTag(t)}
                  className={`px-3 py-1 rounded-full text-xs border transition-colors ${tags.includes(t) ? "bg-primary/20 border-primary text-primary" : "border-white/10 text-muted-foreground hover:bg-white/5"}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Audience</Label>
              <Select value={audience} onValueChange={(v) => setAudience(v as Audience)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="both">MBBS and NEET-PG</SelectItem>
                  <SelectItem value="MBBS">MBBS</SelectItem>
                  <SelectItem value="NEET-PG">NEET-PG</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Order</Label>
              <Input type="number" value={order} onChange={(e) => setOrder(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as "draft" | "published")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter className="gap-2 sm:justify-between">
          {confirmDelete ? (
            <div className="flex items-center gap-2">
              <Button variant="destructive" size="sm" onClick={remove} disabled={saving}>Yes, delete card and images</Button>
              <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>Cancel</Button>
            </div>
          ) : (
            <Button variant="ghost" className="text-destructive" onClick={() => setConfirmDelete(true)} disabled={saving}>
              <Trash2 className="h-4 w-4 mr-1" /> Delete
            </Button>
          )}
          <Button onClick={save} disabled={saving} className="gap-2">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
