#!/usr/bin/env node
// Makes the Arena (hub, lobby, live duel, challenge, co-op) fit phone screens.
// Checks every anchor first; changes nothing on a mismatch. Safe to run twice.
const fs = require('fs'), path = require('path')
const root = process.cwd(), P = (p) => path.join(root, p)
const fail = (m) => { console.error('\nSTOPPED - nothing was changed.\n' + m + '\n'); process.exit(1) }
const files = {}
const get = (p) => { if (!files[p]) { if (!fs.existsSync(P(p))) fail(p + ' not found. Run this from the QubixPrep-latest folder.'); const raw = fs.readFileSync(P(p), 'utf8'); files[p] = { crlf: raw.includes('\r\n'), s: raw.replace(/\r\n/g, '\n') } } return files[p] }
const cnt = (s, a) => s.split(a).length - 1
let changed = 0, already = 0
const rep = (p, from, to, expected = 1) => {
  const o = get(p)
  if (cnt(o.s, to) >= expected) { already++; return }
  if (cnt(o.s, from) !== expected) fail(`${p}: expected to find this ${expected} time(s) but found ${cnt(o.s, from)}:\n${from.slice(0, 120)}`)
  o.s = o.s.split(from).join(to); changed++
}
const HUB = 'src/app/arena/page.tsx', ROOM = 'src/app/arena/room/[code]/page.tsx', DUEL = 'src/components/arena/ArenaDuel.tsx', COOP = 'src/components/arena/ArenaCoop.tsx'

// Hub
rep(HUB, '<div className="mx-auto max-w-5xl space-y-6 p-3 md:p-8">', '<div className="mx-auto max-w-5xl space-y-5 overflow-x-clip p-3 pb-28 md:space-y-6 md:p-8 md:pb-8">')
rep(HUB, 'p-7 text-white shadow-2xl md:p-10', 'p-5 text-white shadow-2xl sm:p-7 md:p-10')
rep(HUB, 'text-4xl font-black md:text-5xl', 'text-3xl font-black sm:text-4xl md:text-5xl')
rep(HUB, 'text-[9rem] opacity-20', 'text-[6rem] opacity-20 sm:text-[9rem]')
rep(HUB, '<div className="grid gap-4 lg:grid-cols-[1fr_340px]">', '<div className="grid gap-4 lg:grid-cols-[1fr_340px] [&>*]:min-w-0">')
rep(HUB, 'className="h-12 flex-1 rounded-xl border border-black/10 px-4 text-center text-lg font-black uppercase tracking-[0.3em]"', 'className="h-12 min-w-0 flex-1 rounded-xl border border-black/10 px-2 text-center text-lg font-black uppercase tracking-[0.2em] sm:px-4 sm:tracking-[0.3em]"')
rep(HUB, 'className="h-12 rounded-xl px-6 font-black"', 'className="h-12 shrink-0 rounded-xl px-4 font-black sm:px-6"')

// Room shell
rep(ROOM, '<div className="mx-auto max-w-5xl space-y-5 p-3 md:p-8">', '<div className="mx-auto max-w-5xl space-y-5 overflow-x-clip p-3 pb-28 md:p-8 md:pb-8">')

// Duel
rep(DUEL, '<div className="grid gap-5 lg:grid-cols-[1fr_300px]">', '<div className="grid gap-5 lg:grid-cols-[1fr_300px] [&>*]:min-w-0">')
rep(DUEL, 'rounded-3xl border border-black/5 bg-white p-6 shadow-lg', 'rounded-3xl border border-black/5 bg-white p-4 shadow-lg sm:p-6', 2)
rep(DUEL, 'mt-2 text-lg font-bold leading-snug text-slate-900', 'mt-2 break-words text-base font-bold leading-snug text-slate-900 sm:text-lg', 2)
rep(DUEL, '<span className="text-sm font-semibold text-slate-800">{o}</span>', '<span className="min-w-0 flex-1 break-words text-sm font-semibold text-slate-800">{o}</span>', 2)
rep(DUEL, 'flex items-center gap-3 rounded-2xl border-2 p-4 text-left transition-all', 'flex w-full items-center gap-3 rounded-2xl border-2 p-3 text-left transition-all sm:p-4', 2)
rep(DUEL, '<div className="flex items-center justify-between text-xs font-black uppercase tracking-widest text-muted-foreground">\n          <span>Question {cur.idx + 1}', '<div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-[11px] font-black uppercase tracking-wider text-muted-foreground sm:text-xs sm:tracking-widest">\n          <span>Question {cur.idx + 1}')
rep(DUEL, '<div className="flex items-center justify-between text-xs font-black uppercase tracking-widest text-muted-foreground">\n        <span>Question {qi + 1}', '<div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-[11px] font-black uppercase tracking-wider text-muted-foreground sm:text-xs sm:tracking-widest">\n        <span>Question {qi + 1}')

// Co-op
rep(COOP, '<div className="grid gap-4 lg:grid-cols-[1fr_330px]">', '<div className="grid gap-4 lg:grid-cols-[1fr_330px] [&>*]:min-w-0">')
rep(COOP, 'flex items-start gap-3 rounded-2xl border-2 p-4 text-left transition-all', 'flex w-full items-start gap-3 rounded-2xl border-2 p-3 text-left transition-all sm:p-4')
rep(COOP, '<span className="pt-1 text-sm font-semibold leading-snug text-slate-800">{o.label}</span>', '<span className="min-w-0 flex-1 break-words pt-1 text-sm font-semibold leading-snug text-slate-800">{o.label}</span>')
rep(COOP, '<div className="space-y-4 p-5">', '<div className="space-y-4 p-4 sm:p-5">')
rep(COOP, '<div className="rounded-2xl rounded-tl-sm border border-black/5 bg-white p-4 shadow-sm">', '<div className="min-w-0 rounded-2xl rounded-tl-sm border border-black/5 bg-white p-4 shadow-sm">')

if (changed === 0) { console.log('Already applied. Nothing to do.'); process.exit(0) }
for (const [p, o] of Object.entries(files)) fs.writeFileSync(P(p), o.crlf ? o.s.replace(/\n/g, '\r\n') : o.s)
console.log(`DONE: ${changed} Arena layout fixes applied. NEXT: rm -rf .next && npx tsc --noEmit, then commit and push.`)
