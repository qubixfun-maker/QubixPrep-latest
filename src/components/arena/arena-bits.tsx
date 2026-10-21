"use client"

import { useEffect, useState } from "react"
import { Copy, Share2, Check } from "lucide-react"
import { nowMs } from "@/lib/arena-client"

/** Re-renders every `ms` with the server-corrected time. */
export function useClock(ms = 250) {
  const [t, setT] = useState(() => nowMs())
  useEffect(() => { const id = setInterval(() => setT(nowMs()), ms); return () => clearInterval(id) }, [ms])
  return t
}

const COLORS = ["#7c6fd6", "#ef6c8b", "#f59e0b", "#14b8a6", "#3b82f6", "#a855f7"]
export const colorFor = (i: number) => COLORS[i % COLORS.length]

export function Avatar({ name, i = 0, size = 36 }: { name: string; i?: number; size?: number }) {
  return (
    <span className="grid shrink-0 place-items-center rounded-full font-black text-white shadow" style={{ width: size, height: size, background: colorFor(i), fontSize: size * 0.42 }}>
      {(name || "?").trim()[0]?.toUpperCase()}
    </span>
  )
}

export function Scoreboard({ room, meUid, compact }: { room: any; meUid: string; compact?: boolean }) {
  const ids: string[] = room.order || Object.keys(room.players)
  const rows = ids.map((id, i) => ({ id, i, ...room.players[id] })).sort((a, b) => (b.score || 0) - (a.score || 0))
  const top = Math.max(1, ...rows.map((r) => r.score || 0))
  return (
    <div className="space-y-2">
      {rows.map((r, rank) => (
        <div key={r.id} className={`flex items-center gap-3 rounded-2xl border p-2.5 ${r.id === meUid ? "border-primary/40 bg-primary/5" : "border-black/5 bg-white"}`}>
          <span className="w-5 text-center text-sm font-black text-muted-foreground">{rank === 0 ? "🥇" : rank === 1 ? "🥈" : rank === 2 ? "🥉" : rank + 1}</span>
          <Avatar name={r.name} i={r.i} size={compact ? 28 : 36} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-extrabold text-slate-900">{r.name}{r.id === meUid ? " (you)" : ""}</p>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-black/10"><div className="h-full rounded-full transition-all duration-700" style={{ width: ((r.score || 0) / top) * 100 + "%", background: colorFor(r.i) }} /></div>
          </div>
          <span className="text-base font-black tabular-nums text-slate-900">{r.score || 0}</span>
        </div>
      ))}
    </div>
  )
}

export function ShareBar({ code, label }: { code: string; label: string }) {
  const [copied, setCopied] = useState(false)
  const link = typeof window !== "undefined" ? `${window.location.origin}/arena/room/${code}` : ""
  const text = `⚔️ ${label}\nJoin me on QubixPrep Arena. Code: ${code}\n${link}`
  const copy = async () => { try { await navigator.clipboard.writeText(link) } catch {} setCopied(true); setTimeout(() => setCopied(false), 1600) }
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="rounded-xl bg-slate-900 px-4 py-2 font-mono text-xl font-black tracking-[0.3em] text-white">{code}</span>
      <button onClick={copy} className="flex items-center gap-1.5 rounded-xl border border-black/10 bg-white px-3 py-2 text-xs font-extrabold text-slate-800 hover:border-primary">
        {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />} {copied ? "Copied" : "Copy link"}
      </button>
      <a href={`https://wa.me/?text=${encodeURIComponent(text)}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 rounded-xl bg-[#25d366] px-3 py-2 text-xs font-extrabold text-white shadow hover:opacity-90">
        <Share2 className="h-4 w-4" /> WhatsApp
      </a>
    </div>
  )
}
