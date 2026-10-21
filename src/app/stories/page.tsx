"use client"
import { useCallback, useEffect, useMemo, useState } from "react"
import { Loader2, RefreshCw } from "lucide-react"
import { useUser } from "@/firebase"
import { useRequireAuth } from "@/hooks/use-require-auth"
import { useTopSearch } from "@/components/layout/top-search"
import { StoryViewer, styleFor, timeAgo, type Story } from "@/components/stories/StoryViewer"

export default function StoriesPage() {
  const { user } = useUser()
  const { checkingAuth } = useRequireAuth()
  const [search] = useTopSearch("Search medical news…")
  const [stories, setStories] = useState<Story[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [tag, setTag] = useState("All")
  const [open, setOpen] = useState<number | null>(null)
  const [bad, setBad] = useState<Record<string, boolean>>({})

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true); setError("")
    try {
      const idToken = await user.getIdToken()
      const res = await fetch("/api/med-stories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ idToken }) })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || "Could not load stories")
      setStories(d.stories || [])
    } catch (e: any) { setError(e.message || "Could not load stories") }
    setLoading(false)
  }, [user])
  useEffect(() => { load() }, [load])

  const tags = useMemo(() => ["All", ...Array.from(new Set(stories.map((s) => s.tag)))], [stories])
  const shown = useMemo(() => {
    const q = search.trim().toLowerCase()
    return stories.filter((s) => (tag === "All" || s.tag === tag) && (!q || `${s.title} ${s.source} ${s.tag}`.toLowerCase().includes(q)))
  }, [stories, tag, search])

  if (checkingAuth) return <div className="h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 text-primary animate-spin" /></div>

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 md:px-8 md:py-10 space-y-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight">Med Stories 📰</h1>
          <p className="mt-1 text-sm text-muted-foreground">Fresh medical news from around the world, as swipeable stories. Updated through the day.</p>
        </div>
        <button onClick={load} disabled={loading} className="flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-2 text-xs font-extrabold text-primary disabled:opacity-60">
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {tags.map((t) => (
          <button key={t} onClick={() => setTag(t)} className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-extrabold transition-all ${tag === t ? "bg-primary text-white shadow-md" : "border border-border bg-card text-muted-foreground hover:text-primary"}`}>{t}</button>
        ))}
      </div>

      {loading && stories.length === 0 ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => <div key={i} className="aspect-[9/14] animate-pulse rounded-3xl bg-muted" />)}
        </div>
      ) : error && stories.length === 0 ? (
        <div className="rounded-2xl glass p-10 text-center space-y-3">
          <p className="text-muted-foreground">{error}</p>
          <button onClick={load} className="rounded-full bg-primary px-4 py-2 text-xs font-extrabold text-white">Try again</button>
        </div>
      ) : shown.length === 0 ? (
        <div className="rounded-2xl glass p-10 text-center text-muted-foreground">No stories match.</div>
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
          {shown.map((s, i) => {
            const st = styleFor(s.tag)
            const img = s.image && !bad[s.id] ? s.image : null
            return (
              <button key={s.id} onClick={() => setOpen(i)} className="group relative aspect-[9/14] overflow-hidden rounded-3xl text-left shadow-[0_12px_30px_-14px_rgba(40,20,90,0.5)] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_24px_40px_-16px_rgba(40,20,90,0.6)] focus-visible:ring-4 focus-visible:ring-primary/40 focus-visible:outline-none" style={{ background: `linear-gradient(160deg, ${st.from}, ${st.to})` }}>
                {img ? <img src={img} alt="" loading="lazy" referrerPolicy="no-referrer" onError={() => setBad((b) => ({ ...b, [s.id]: true }))} className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" /> : <span className="absolute right-3 top-8 text-[90px] leading-none opacity-30" aria-hidden>{st.emoji}</span>}
                <span className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-black/30" />
                <span className="absolute left-3 top-3 rounded-full bg-white/85 px-2.5 py-1 text-[10px] font-black text-black">{st.emoji} {s.tag}</span>
                <span className="absolute inset-x-0 bottom-0 p-3.5 text-white">
                  <strong className="line-clamp-4 block text-[15px] font-black leading-tight drop-shadow">{s.title}</strong>
                  <small className="mt-1.5 block truncate text-[11px] font-bold opacity-80">{s.source} · {timeAgo(s.date)}</small>
                </span>
              </button>
            )
          })}
        </div>
      )}
      <p className="text-center text-[11px] text-muted-foreground">Headlines and summaries come from the sources shown. Tap through to read each article on its original site. News is for learning, not for treating patients.</p>

      {open !== null && shown[open] && <StoryViewer stories={shown} start={open} onClose={() => setOpen(null)} />}
    </div>
  )
}
