"use client"
import { useState } from "react"
import ReactMarkdown from "react-markdown"

type Card = { q: string; a: string }
const Q_RE = /^\s*[-*]*\s*\**\s*(?:Q(?:uestion)?\s*\d*)\s*[:.)]\s*\**\s*(.+)$/i
const A_RE = /^\s*[-*]*\s*\**\s*(?:A(?:nswer)?\s*\d*)\s*[:.)]\s*\**\s*(.+)$/i

/** Splits a reply into flashcards (Q:/A: pairs) and the leftover text (e.g. the mnemonic). */
export function parseCards(text: string): { cards: Card[]; rest: string } {
  const cards: Card[] = []
  const rest: string[] = []
  let cur: { q: string; a?: string } | null = null
  const push = () => { if (cur && cur.a) cards.push({ q: cur.q, a: cur.a }); cur = null }
  for (const line of text.split("\n")) {
    const q = line.match(Q_RE); const a = line.match(A_RE)
    if (q) { push(); cur = { q: q[1].replace(/\*+/g, "").trim() } }
    else if (a && cur) cur.a = a[1].replace(/\*+/g, "").trim()
    else if (cur && cur.a && line.trim()) cur.a += " " + line.trim().replace(/\*+/g, "")
    else if (!line.trim()) { if (cur?.a) push() }
    else { push(); rest.push(line) }
  }
  push()
  return { cards, rest: rest.join("\n").trim() }
}

function FlipCard({ c, i, open, toggle }: { c: Card; i: number; open: boolean; toggle: () => void }) {
  return (
    <button onClick={toggle} className={`w-full rounded-2xl p-3 text-left shadow-sm transition-all hover:-translate-y-0.5 ${open ? "bg-[#d8f4e9] text-[#17543f]" : "bg-gradient-to-br from-[#7552ee] to-[#9b7bff] text-white"}`}>
      <span className="mb-1 flex items-center justify-between text-[10px] font-black uppercase tracking-widest opacity-80">
        <span>{open ? "Answer" : `Card ${i + 1} · tap to flip`}</span><span>{open ? "↺" : "↻"}</span>
      </span>
      <span className="block text-[13px] font-bold leading-snug">{open ? c.a : c.q}</span>
    </button>
  )
}

export function JellyBody({ text, role }: { text: string; role: "user" | "jelly" }) {
  const [open, setOpen] = useState<Record<number, boolean>>({})
  const parsed = role === "jelly" ? parseCards(text) : null
  if (parsed && parsed.cards.length >= 2) {
    const all = parsed.cards.every((_, i) => open[i])
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between text-[11px] font-bold text-muted-foreground">
          <span>🃏 {parsed.cards.length} flashcards</span>
          <button className="rounded-full bg-secondary px-2.5 py-1 text-primary" onClick={() => setOpen(Object.fromEntries(parsed.cards.map((_, i) => [i, !all])))}>{all ? "Hide all" : "Show all answers"}</button>
        </div>
        <div className="grid gap-2">
          {parsed.cards.map((c, i) => <FlipCard key={i} c={c} i={i} open={!!open[i]} toggle={() => setOpen((o) => ({ ...o, [i]: !o[i] }))} />)}
        </div>
        {parsed.rest && <div className="prose prose-sm max-w-none [&>*]:my-1.5"><ReactMarkdown>{parsed.rest}</ReactMarkdown></div>}
      </div>
    )
  }
  return <div className="prose prose-sm max-w-none [--tw-prose-body:#2b2740] [--tw-prose-bold:#4326b5] [--tw-prose-bullets:#7552ee] [--tw-prose-counters:#7552ee] prose-headings:text-[#43299a] prose-strong:text-[#4326b5] [&>*]:my-1.5"><ReactMarkdown>{text}</ReactMarkdown></div>
}
