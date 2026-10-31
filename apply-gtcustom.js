#!/usr/bin/env node
// 1) PYQ test: Next/Previous bar no longer hidden behind the mobile bottom menu.
// 2) Grand Test "Make your own paper": questions come only from the Grand Test papers; adds subject chips from the papers and an "image questions only" filter.
// Checks every anchor first; changes nothing on a mismatch. Safe to run twice.
const fs = require('fs'), path = require('path')
const root = process.cwd(), P = (p) => path.join(root, p)
const fail = (m) => { console.error('\nSTOPPED - nothing was changed.\n' + m + '\n'); process.exit(1) }
const rd = (p) => { if (!fs.existsSync(P(p))) fail(p + ' not found. Run this from the QubixPrep-latest folder.'); const raw = fs.readFileSync(P(p), 'utf8'); return { crlf: raw.includes('\r\n'), s: raw.replace(/\r\n/g, '\n') } }
const wr = (p, o) => fs.writeFileSync(P(p), o.crlf ? o.s.replace(/\n/g, '\r\n') : o.s)
const once = (o, a, label) => { if (o.s.split(a).length !== 2) fail(label + ': expected text not found exactly once.'); }
const writes = [], report = []

// ---- PYQ bar
{
  const f = 'src/app/pyq/start/page.tsx', o = rd(f)
  if (o.s.includes('z-[45]')) report.push('PYQ bar: already done')
  else {
    const a = 'border-t md:border-t-0 border-white/5 flex gap-2 z-20">'
    once(o, a, 'PYQ page')
    o.s = o.s.replace(a, 'border-t md:border-t-0 border-white/5 flex gap-2 z-[45]" style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}>')
    writes.push([f, o]); report.push('PYQ bar: now sits above the mobile menu')
  }
}

// ---- helper in grand-papers.ts
{
  const f = 'src/lib/grand-papers.ts', o = rd(f)
  if (o.s.includes('sampleFromPapers')) report.push('Paper sampler: already added')
  else {
    const imp = 'import type { GCredit, GQ } from "@/lib/grand"'
    once(o, imp, 'grand-papers.ts import')
    o.s = o.s.replace(imp, 'import { shuffle, type GCredit, type GQ } from "@/lib/grand"')
    o.s += `
const paperCache = new Map<string, any>()
async function paperData(db: Firestore, id: string): Promise<any | null> {
  if (paperCache.has(id)) return paperCache.get(id)
  const snap = await getDoc(doc(db, "grandPaperQs", id))
  const d = snap.exists() ? snap.data() : null
  if (d) paperCache.set(id, d)
  return d
}

/** Builds a custom paper only from the Grand Test papers: optional subject names, optional image-only. */
export async function sampleFromPapers(
  db: Firestore,
  metas: PaperMeta[],
  subjects: { id: string; name: string }[],
  opts: { total: number; names?: string[]; imageOnly?: boolean },
): Promise<{ qs: GQ[]; credits: GCredit[] }> {
  const docs = await Promise.all(metas.map((m) => paperData(db, m.id).then((d) => ({ m, d })).catch(() => ({ m, d: null as any }))))
  const want = opts.names && opts.names.length ? new Set(opts.names.map(norm)) : null
  const pool: { q: GQ; pid: string; sn: number }[] = []
  const subjCache = new Map<string, { id: string; name: string }>()
  for (const { m, d } of docs) {
    if (!d) continue
    for (const x of (d.qs || []) as any[]) {
      if (want && !want.has(norm(String(x.subj || "")))) continue
      if (opts.imageOnly && !(x.qi && x.qi.length)) continue
      const s = subjCache.get(x.subj) || matchSubject(x.subj, subjects)
      subjCache.set(x.subj, s)
      pool.push({ pid: m.id, sn: x.n, q: { key: m.id + "/" + x.n, subjectId: s.id, subjectName: x.subj, topic: m.title, question: x.q, options: x.o, correct: x.c, explanation: x.e || "", qimgs: x.qi || [], eimgs: x.ei || [] } })
    }
  }
  // Balance across subjects, then trim to the requested size.
  const by = new Map<string, typeof pool>()
  shuffle(pool).forEach((p) => { const l = by.get(p.q.subjectName) || []; l.push(p); by.set(p.q.subjectName, l) })
  const picked: typeof pool = []
  let progressed = true
  while (picked.length < opts.total && progressed) {
    progressed = false
    for (const l of by.values()) { const p = l.pop(); if (p && picked.length < opts.total) { picked.push(p); progressed = true } }
  }
  const final = shuffle(picked)
  const credits: GCredit[] = []
  final.forEach((p, k) => { ((docs.find((x) => x.m.id === p.pid)?.d?.credits || []) as GCredit[]).filter((c) => c.n === p.sn).forEach((c) => credits.push({ ...c, n: k + 1 })) })
  return { qs: final.map((p) => p.q), credits }
}
`
    writes.push([f, o]); report.push('Paper sampler added')
  }
}

// ---- Grand Test page
{
  const f = 'src/app/grand-test/page.tsx', o = rd(f)
  if (o.s.includes('sampleFromPapers')) report.push('Grand Test page: already done')
  else {
    const imp = 'import { loadPaper, type PaperMeta } from "@/lib/grand-papers"'
    once(o, imp, 'import line')
    o.s = o.s.replace(imp, 'import { loadPaper, sampleFromPapers, type PaperMeta } from "@/lib/grand-papers"')

    const st = '  const [openingId, setOpeningId] = useState("")\n'
    once(o, st, 'state line')
    o.s = o.s.replace(st, st + '  const [imageOnly, setImageOnly] = useState(false)\n')

    const ch = '  const chosen = subjects.filter((s) => picked[s.id])\n  const useSubjects = chosen.length ? chosen : subjects\n'
    once(o, ch, 'chosen lines')
    o.s = o.s.replace(ch, `  const usable = useMemo(() => papers.filter((p) => p.free || canAccessContent || isAdmin), [papers, canAccessContent, isAdmin])
  const subjectChips = useMemo(() => {
    const m = new Map<string, number>()
    usable.forEach((p) => (p.subjects || []).forEach((s) => m.set(s.name, (m.get(s.name) || 0) + s.n)))
    return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([name, n]) => ({ name, n }))
  }, [usable])
  const chosen = subjectChips.filter((s) => picked[s.name])
`)

    const s1 = o.s.indexOf('  async function start() {'), s2 = o.s.indexOf('  async function startPaper(meta: PaperMeta) {')
    if (s1 < 0 || s2 < s1) fail('start() function not found.')
    o.s = o.s.slice(0, s1) + `  async function start() {
    if (!db) return
    if (!usable.length) { setErr("No Grand Test papers are available to build from yet."); return }
    setErr(""); setPhase("loading")
    const cfg = SIZES[size]
    let r: { qs: GQ[]; credits: GCredit[] } = { qs: [], credits: [] }
    try { r = await sampleFromPapers(db, usable, subjects, { total: cfg.n, names: chosen.map((c) => c.name), imageOnly }) } catch {}
    const list = r.qs
    if (list.length < 10) { setErr(imageOnly ? "Fewer than 10 image questions match this selection. Pick more subjects or switch off image-only." : "Not enough questions found for this selection. Pick more subjects."); setPhase("setup"); return }
    const mins = list.length < cfg.n ? Math.max(10, Math.round((cfg.m * list.length) / cfg.n)) : cfg.m
    const now = Date.now()
    saved.current = false
    setPaper(null); setCredits(r.credits)
    setQs(list); setAnswers({}); setMarked([]); setI(0); setStartedAt(now); setEndAt(now + mins * 60000); setMinutes(mins); setPalette(false); setPhase("exam")
  }

` + o.s.slice(s2)

    const b1 = o.s.indexOf('              <div className="space-y-3">\n                <div className="flex items-center justify-between"><h2 className="font-black">Subjects</h2>')
    const endMark = 'None selected means all subjects"}.</p>\n              </div>\n'
    const b2 = o.s.indexOf(endMark)
    if (b1 < 0 || b2 < b1) fail('Subjects block not found.')
    o.s = o.s.slice(0, b1) + `              <label className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 text-sm font-bold"><input type="checkbox" checked={imageOnly} onChange={(e) => setImageOnly(e.target.checked)} className="h-4 w-4" /> Image-based questions only</label>
              <div className="space-y-3">
                <div className="flex items-center justify-between"><h2 className="font-black">Subjects</h2>
                  <div className="flex gap-3 text-xs font-bold"><button onClick={() => setPicked(Object.fromEntries(subjectChips.map((s) => [s.name, true])))} className="text-primary">Select all</button><button onClick={() => setPicked({})} className="text-muted-foreground">Clear</button></div></div>
                <div className="flex flex-wrap gap-2">
                  {subjectChips.map((s) => <button key={s.name} onClick={() => setPicked({ ...picked, [s.name]: !picked[s.name] })} className={\`rounded-full border px-3.5 py-1.5 text-sm font-bold transition \${picked[s.name] ? "border-primary bg-primary text-white" : "border-border bg-card hover:border-primary/50"}\`}>{s.name}</button>)}
                </div>
                <p className="text-xs text-muted-foreground">{chosen.length ? \`\${chosen.length} selected\` : "None selected means all subjects"}. Questions are taken only from the Grand Test papers{usable.length < papers.length ? " you can open" : ""}.</p>
              </div>
` + o.s.slice(b2 + endMark.length)

    const bt = 'disabled={loading || !subjects.length}'
    once(o, bt, 'start button')
    o.s = o.s.replace(bt, 'disabled={loading || !usable.length}')
    writes.push([f, o]); report.push('Grand Test: custom papers now built from the GT papers, with image-only filter')
  }
}
writes.forEach(([f, o]) => wr(f, o))
console.log('DONE:\n - ' + report.join('\n - ') + '\nNEXT: rm -rf .next && npx tsc --noEmit, then commit and push.')
