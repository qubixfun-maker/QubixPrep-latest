"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useUser } from "@/firebase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { Loader2, ArrowLeft, Gift, CheckCircle2, XCircle } from "lucide-react"

type Grant = {
  id: string; email: string; name: string; plan: "basic" | "pro"; days: number
  expiresAt: number; note: string; grantedAt: number; revoked: boolean
}
type Result = { email: string; ok: boolean; message: string }

const day = (d: number) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
const planName = (p: string) => (p === "pro" ? "Clinician" : "Scholar")
const PRESETS = [30, 90, 180, 365]

export default function FreeAccessPage() {
  const { user } = useUser()
  const { toast } = useToast()
  const [emails, setEmails] = useState("")
  const [plan, setPlan] = useState<"basic" | "pro">("basic")
  const [days, setDays] = useState(90)
  const [note, setNote] = useState("")
  const [busy, setBusy] = useState(false)
  const [results, setResults] = useState<Result[]>([])
  const [grants, setGrants] = useState<Grant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [search, setSearch] = useState("")

  const api = useCallback(
    async (init?: RequestInit) => {
      if (!user) throw new Error("Please sign in.")
      const token = await user.getIdToken()
      const res = await fetch("/api/admin/free-access", { ...init, headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` } })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || json.error) throw new Error(json.error || "Something went wrong.")
      return json
    },
    [user]
  )

  const load = useCallback(async () => {
    if (!user) return
    setError("")
    try {
      setGrants((await api()).grants || [])
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [user, api])

  useEffect(() => { load() }, [load])

  async function grant(e: React.FormEvent) {
    e.preventDefault()
    const list = emails.split(/[\s,;]+/).map((x) => x.trim()).filter(Boolean)
    if (list.length === 0) { toast({ variant: "destructive", title: "Enter at least one email" }); return }
    setBusy(true)
    setResults([])
    try {
      const j = await api({ method: "POST", body: JSON.stringify({ emails: list, plan, days, note }) })
      setResults(j.results || [])
      const ok = (j.results || []).filter((r: Result) => r.ok).length
      toast({ title: ok ? `Free access given to ${ok} ${ok === 1 ? "person" : "people"}` : "Nobody was changed" })
      // keep only the emails that did not work, so they can be fixed and retried
      const failed = (j.results || []).filter((r: Result) => !r.ok).map((r: Result) => r.email)
      setEmails(failed.join("\n"))
      await load()
    } catch (err: any) {
      toast({ variant: "destructive", title: "Failed", description: err.message })
    } finally {
      setBusy(false)
    }
  }

  async function revoke(id: string) {
    setBusy(true)
    try {
      const j = await api({ method: "POST", body: JSON.stringify({ action: "revoke", id }) })
      toast({ title: j.message || "Revoked" })
      setConfirmId(null)
      await load()
    } catch (err: any) {
      toast({ variant: "destructive", title: "Failed", description: err.message })
    } finally {
      setBusy(false)
    }
  }

  const now = Date.now()
  const shown = grants.filter((g) => !search || (g.email + " " + g.name + " " + g.note).toLowerCase().includes(search.toLowerCase()))
  const activeCount = grants.filter((g) => !g.revoked && g.expiresAt > now).length

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 p-4 md:p-8">
      <div>
        <Link href="/admin" className="mb-2 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Admin</Link>
        <h1 className="flex items-center gap-2 text-2xl font-black"><Gift className="h-6 w-6 text-primary" /> Free access</h1>
        <p className="mt-1 text-sm text-muted-foreground">Give influencers and partners a plan for free. They must have signed up first. The plan starts at once and ends automatically on the date shown.</p>
      </div>

      <form onSubmit={grant} className="space-y-4 rounded-2xl border border-border bg-card p-5">
        <div>
          <label className="mb-1.5 block text-sm font-bold">Email addresses</label>
          <textarea
            value={emails}
            onChange={(e) => setEmails(e.target.value)}
            rows={3}
            placeholder={"influencer1@gmail.com\ninfluencer2@gmail.com"}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary"
          />
          <p className="mt-1 text-xs text-muted-foreground">One per line (or separated by commas). Up to 50 at a time.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-bold">Plan</label>
            <div className="grid grid-cols-2 gap-2">
              {([["basic", "Scholar", "no AI"], ["pro", "Clinician", "with AI"]] as const).map(([v, n, s]) => (
                <button type="button" key={v} onClick={() => setPlan(v)}
                  className={`rounded-xl border px-3 py-2.5 text-left text-sm transition ${plan === v ? "border-primary bg-primary/10 ring-1 ring-primary" : "border-border hover:bg-accent"}`}>
                  <b className="block">{n}</b><span className="text-xs text-muted-foreground">{s}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-bold">For how long</label>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((d) => (
                <button type="button" key={d} onClick={() => setDays(d)}
                  className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition ${days === d ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-accent"}`}>
                  {d === 365 ? "1 year" : `${d} days`}
                </button>
              ))}
              <Input type="number" min={1} max={730} value={days} onChange={(e) => setDays(Number(e.target.value))} className="h-9 w-24" aria-label="Custom days" />
            </div>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-bold">Note <span className="font-normal text-muted-foreground">(for your records)</span></label>
          <Input value={note} onChange={(e) => setNote(e.target.value)} maxLength={80} placeholder="e.g. Dr Rahul - Instagram collab, Nov 2026" />
        </div>

        <Button type="submit" disabled={busy} className="w-full sm:w-auto">
          {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Gift className="mr-2 h-4 w-4" />}
          Give free {planName(plan)} for {days} days
        </Button>

        {results.length > 0 && (
          <ul className="space-y-1.5 rounded-xl bg-muted/50 p-3 text-sm">
            {results.map((r) => (
              <li key={r.email} className="flex items-start gap-2">
                {r.ok ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" /> : <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />}
                <span><b>{r.email}</b> — {r.message}</span>
              </li>
            ))}
          </ul>
        )}
      </form>

      <section>
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-black">Free grants</h2>
            <p className="text-xs text-muted-foreground">{activeCount} active · {grants.length} in total</p>
          </div>
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search email, name or note" className="w-full sm:w-64" />
        </div>

        {loading ? (
          <div className="flex h-24 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
        ) : error ? (
          <p className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm">{error}</p>
        ) : shown.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">No free grants yet.</p>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            {shown.map((g) => {
              const status = g.revoked ? "Revoked" : g.expiresAt > now ? "Active" : "Expired"
              const tone = status === "Active" ? "bg-green-500/15 text-green-700 dark:text-green-400" : status === "Revoked" ? "bg-red-500/15 text-red-600" : "bg-muted text-muted-foreground"
              return (
                <div key={g.id} className="flex flex-wrap items-center gap-3 border-b border-border p-3.5 last:border-b-0">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-bold">{g.name || g.email}</div>
                    <div className="truncate text-xs text-muted-foreground">{g.email}{g.note ? ` · ${g.note}` : ""}</div>
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    <div><b className="text-foreground">{planName(g.plan)}</b> · {g.days} days</div>
                    <div>{g.revoked ? "Given" : status === "Active" ? "Ends" : "Ended"} {day(g.revoked ? g.grantedAt : g.expiresAt)}</div>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-black ${tone}`}>{status}</span>
                  {!g.revoked && status === "Active" && (
                    confirmId === g.id ? (
                      <div className="flex gap-1.5">
                        <Button size="sm" className="bg-red-600 text-white hover:bg-red-700" disabled={busy} onClick={() => revoke(g.id)}>Yes, take back</Button>
                        <Button size="sm" variant="outline" onClick={() => setConfirmId(null)}>No</Button>
                      </div>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => setConfirmId(g.id)}>Revoke</Button>
                    )
                  )}
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
