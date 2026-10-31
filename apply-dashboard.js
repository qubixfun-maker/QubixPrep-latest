// Run once from the project folder:  node apply-dashboard.js
// 1) Day streak now counts real activity (questions, flashcards, and the Case of the Day on the home page).
// 2) "Items completed" (always 0) becomes "Questions answered".
// 3) The home page gets a compact "More ways to study" section (Long Answers, Case Presentation, Spot & Identify, Grand Test, Custom Quiz, AI Tools, Daily Review, Study Plan).
// 4) Case Presentation is added to the sidebar.
// 5) The 1st / 2nd / 3rd year grouping is removed from Notes, Flashcards, Mind Maps and Top 100: subjects show as one A-Z list.
// Every file is checked first. If any file looks different from what is expected, NOTHING is written.
const fs = require('fs')
const problems = []
const writes = []
const read = (p) => { const raw = fs.readFileSync(p, 'utf8'); return { cr: raw.includes('\r\n'), s: raw.replace(/\r\n/g, '\n') } }
const queue = (p, cr, s) => writes.push([p, cr ? s.replace(/\n/g, '\r\n') : s])
function once(s, from, to, label, p) {
  const n = s.split(from).length - 1
  if (n !== 1) { problems.push(`${p}: expected 1 "${label}", found ${n}`); return s }
  return s.replace(from, () => to)
}

// ---------- new file: streak helper ----------
{
  const p = 'src/lib/streak.ts'
  if (fs.existsSync(p)) console.log(p + ' exists, skipping')
  else writes.push([p, `import { dayKey } from "@/lib/study"

type Days = Record<string, { q?: number; f?: number }> | undefined

const active = (days: Days, k: string) => { const x = (days || {})[k]; return !!x && ((x.q || 0) + (x.f || 0)) > 0 }

/** Consecutive study days ending today (or yesterday, if today is not done yet). */
export function streakOf(days: Days) {
  let n = 0
  const d = new Date()
  if (!active(days, dayKey(d))) d.setDate(d.getDate() - 1)
  while (active(days, dayKey(d))) { n++; d.setDate(d.getDate() - 1) }
  return n
}

export const doneToday = (days: Days) => active(days, dayKey())
`])
}

// ---------- study.ts: record the Case of the Day ----------
{
  const p = 'src/lib/study.ts'; const { cr, s } = read(p)
  if (s.includes('recordDailyCase')) console.log('study.ts already patched, skipping')
  else queue(p, cr, once(s, '/** Grand Test: one stats write', `/** The Case of the Day on the home page: counts as today's activity, so it keeps the streak alive. */
export async function recordDailyCase(db: Firestore, uid: string, ok: boolean) { await bumpStats(db, uid, { kind: "q", ok }) }

/** Grand Test: one stats write`, 'Grand Test comment', p))
}

// ---------- home page ----------
{
  const p = 'src/app/page.tsx'; const { cr, s: s0 } = read(p)
  let s = s0
  if (s.includes('MORE_WAYS')) console.log('home page already patched, skipping')
  else {
    s = once(s, 'import { Button } from "@/components/ui/button"\n', `import { Button } from "@/components/ui/button"
import { loadStats, dayKey, recordDailyCase } from "@/lib/study"
import { streakOf, doneToday } from "@/lib/streak"
`, 'Button import', p)
    s = once(s, 'const SUBJECT_STYLES:', `const MORE_WAYS = [
  { emoji: "📝", name: "Long Answers", note: "Essays and short answers", href: "/long-answers", bg: "#e4efda" },
  { emoji: "🧑‍⚕️", name: "Case Presentation", note: "Present like in the viva", href: "/case-presentation", bg: "#d9f1f8" },
  { emoji: "🔬", name: "Spot & Identify", note: "Specimens and slides", href: "/spotters", bg: "#ffe6ed" },
  { emoji: "⏱️", name: "Grand Test", note: "Full-length mock paper", href: "/grand-test", bg: "#fff0bf" },
  { emoji: "🧠", name: "Custom Quiz", note: "Build your own test", href: "/test-series", bg: "#eee5ff" },
  { emoji: "✨", name: "AI Tools", note: "Summarise and quiz", href: "/ai-tools", bg: "#e8e0ff" },
  { emoji: "🔁", name: "Daily Review", note: "Cards due today", href: "/review", bg: "#d8f4e9" },
  { emoji: "🗓️", name: "Study Plan", note: "Plan your week", href: "/plan", bg: "#ffe2d3" },
]

const SUBJECT_STYLES:`, 'SUBJECT_STYLES', p)
    s = once(s, `  const streak = (profile as any)?.streakCount || 0\n`, `  const [stats, setStats] = useState<Awaited<ReturnType<typeof loadStats>> | null>(null)
  useEffect(() => {
    if (!db || !user) return
    let on = true
    loadStats(db, user.uid).then((x) => { if (on) setStats(x) }).catch(() => { if (on) setStats({}) })
    return () => { on = false }
  }, [db, user])
  const streak = streakOf(stats?.days)
  const studiedToday = doneToday(stats?.days)
  const answeredTotal = stats ? (stats.total?.a || 0) : null
`, 'streakCount line', p)
    // remove the old "completed" counter (it always showed 0)
    const re = /  const \[completed, setCompleted\] = useState<number \| null>\(null\)\n  useEffect\(\(\) => \{[\s\S]*?\n  \}, \[db, user\]\)\n\n/
    if (!re.test(s)) problems.push(p + ': could not find the "completed" counter block')
    else s = s.replace(re, '')
    s = once(s, `  const askJelly = () =>`, `  const recordDaily = (ok: boolean) => {
    if (!db || !user) return
    const k = \`qp_daily_\${user.uid}_\${dayKey()}\`
    try { if (localStorage.getItem(k)) return; localStorage.setItem(k, "1") } catch {}
    recordDailyCase(db, user.uid, ok).then(() => loadStats(db, user.uid)).then(setStats).catch(() => {})
  }
  const askJelly = () =>`, 'askJelly line', p)
    s = once(s, '{streak > 0 ? `You\'re on a ${streak}-day streak. Answer today\'s case to keep it going!` : "Answer today\'s case to start your streak."}',
      '{studiedToday ? (streak > 1 ? `Today is done. ${streak}-day streak, see you tomorrow!` : "Today is done. Come back tomorrow to build your streak!") : streak > 0 ? `You\'re on a ${streak}-day streak. Answer today\'s case to keep it going!` : "Answer today\'s case to start your streak."}', 'mission text', p)
    s = once(s, '{ bg: "#e7f8e9", icon: "✅", value: completed === null ? "…" : String(completed), label: "Items completed" },',
      '{ bg: "#e7f8e9", icon: "✅", value: answeredTotal === null ? "…" : String(answeredTotal), label: "Questions answered" },', 'completed stat', p)
    s = once(s, 'onClick={() => { if (!answered) setSelectedIdx(opt.idx) }}', 'onClick={() => { if (answered) return; setSelectedIdx(opt.idx); recordDaily(opt.idx === dq.correct_answer_index) }}', 'daily answer click', p)
    s = once(s, '      {/* QuickCards */}', `      {/* More ways to study */}
      <section>
        <div className="mb-3.5">
          <h2 className="text-[21px] font-black tracking-tight">More ways to study 🎒</h2>
          <p className="mt-1 text-xs text-muted-foreground">Everything else, one tap away.</p>
        </div>
        <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4 md:gap-3">
          {MORE_WAYS.map((m) => (
            <Link key={m.name} href={user ? m.href : "/signup"} className="group flex items-center gap-3 rounded-[18px] border border-border bg-card p-3 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/10">
              <div className="grid h-[42px] w-[42px] shrink-0 place-items-center rounded-[13px] text-[21px]" style={{ background: m.bg }}>{m.emoji}</div>
              <div className="min-w-0">
                <b className="block truncate text-[13px] leading-tight">{m.name}</b>
                <small className="block truncate text-[11px] text-muted-foreground">{m.note}</small>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* QuickCards */}`, 'QuickCards comment', p)
    queue(p, cr, s)
  }
}

// ---------- sidebar ----------
{
  const p = 'src/components/layout/app-sidebar.tsx'; const { cr, s } = read(p)
  if (s.includes('/case-presentation')) console.log('sidebar already has Case Presentation, skipping')
  else queue(p, cr, once(s, '    { title: "Spot & Identify", url: "/spotters", icon: Microscope },\n', '    { title: "Case Presentation", url: "/case-presentation", icon: Stethoscope },\n    { title: "Spot & Identify", url: "/spotters", icon: Microscope },\n', 'Spot & Identify item', p))
}

// ---------- remove the year grouping ----------
for (const p of ['src/app/notes/page.tsx', 'src/app/flashcards/page.tsx', 'src/app/mindmaps/page.tsx']) {
  const { cr, s: s0 } = read(p); let s = s0
  if (!s.includes('groupedByYear')) { console.log(p + ' has no year grouping, skipping'); continue }
  const memo = /  const groupedByYear = useMemo\(\(\) => \{[\s\S]*?\n  \}, \[(filtered|subjects, search)\]\)\n/
  const view = /<div className="space-y-10">\s*\{groupedByYear\.map\(\(group\) => \(\s*<div key=\{group\.label\} className="space-y-4">\s*<h2[^>]*>\{group\.label\}<\/h2>\s*(<div className="grid[^"]*">)\s*\{group\.items\.map\(\(subject: any\) => \{([\s\S]*?)\}\)\}\s*<\/div>\s*<\/div>\s*\)\)\}\s*<\/div>/
  if (!memo.test(s)) problems.push(p + ': year-grouping block not found')
  else if (!view.test(s)) problems.push(p + ': year-grouping view not found')
  else {
    s = s.replace(memo, `  const sortedSubjects = useMemo(() => [...filtered].sort((a: any, b: any) => String(a.name).localeCompare(String(b.name))), [filtered])\n`)
    s = s.replace(view, (_m, grid, body) => `${grid}\n                {sortedSubjects.map((subject: any) => {${body}})}\n              </div>`)
    s = s.replace(/import \{ getSubjectYear \} from "@\/lib\/subject-year"\n/, '')
    if (/getSubjectYear|groupedByYear/.test(s)) problems.push(p + ': year code still present after patch')
    else queue(p, cr, s)
  }
}
{
  const p = 'src/app/top-100/page.tsx'; const { cr, s: s0 } = read(p)
  if (!s0.includes('getSubjectYear')) console.log(p + ' already year-free, skipping')
  else {
    let s = once(s0, '.sort((a, b) => getSubjectYear(a[0]).order - getSubjectYear(b[0]).order || a[0].localeCompare(b[0]))', '.sort((a, b) => a[0].localeCompare(b[0]))', 'year sort', p)
    s = s.replace(/import \{ getSubjectYear \} from "@\/lib\/subject-year"\n/, '')
    if (/getSubjectYear/.test(s)) problems.push(p + ': year code still present')
    else queue(p, cr, s)
  }
}

if (problems.length) { console.error('NOTHING WAS CHANGED.\n- ' + problems.join('\n- ')); process.exit(1) }
writes.forEach(([p, c]) => fs.writeFileSync(p, c))
console.log('DONE. Files updated:\n  ' + (writes.map((w) => w[0]).join('\n  ') || 'none'))
