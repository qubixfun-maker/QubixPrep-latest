// Idempotent: Ward Round v3 (expert cases) wiring for hub, admin and Arena co-op.
const fs = require('fs')
function edit(file, test, pairs) {
  if (!fs.existsSync(file)) { console.log('MISSING FILE', file); process.exitCode = 1; return }
  let s = fs.readFileSync(file, 'utf8')
  if (s.includes(test)) { console.log('skip  ', file); return }
  let out = s
  for (const [a, b] of pairs) {
    if (!out.includes(a)) { console.log('MISSING in', file, '->', a.slice(0, 70)); process.exitCode = 1; return }
    out = out.replace(a, b)
  }
  fs.writeFileSync(file, out); console.log('edited', file)
}

edit('src/app/cases/page.tsx', 'expertOnly', [
  ['const DIFF: Record<string, string> = { easy: "bg-emerald-500", medium: "bg-amber-500", hard: "bg-rose-500" }',
   'const DIFF: Record<string, string> = { easy: "bg-emerald-500", medium: "bg-amber-500", hard: "bg-rose-500", expert: "bg-gradient-to-r from-rose-600 to-orange-500" }'],
  ['  const [group, setGroup] = useState("All")\n', '  const [group, setGroup] = useState("All")\n  const [expertOnly, setExpertOnly] = useState(false)\n'],
  ['(group === "All" || (c.specialty || "General") === group) && (!q ||', '(group === "All" || (c.specialty || "General") === group) && (!expertOnly || c.difficulty === "expert") && (!q ||'],
  [', [all, group, q])', ', [all, group, q, expertOnly])'],
  ['<div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">\n',
   '<div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">\n            <button onClick={() => setExpertOnly((v) => !v)} className={`flex shrink-0 items-center gap-1 rounded-full border px-4 py-2 text-xs font-extrabold transition ${expertOnly ? "border-rose-600 bg-gradient-to-r from-rose-600 to-orange-500 text-white shadow-md" : "border-rose-300 bg-rose-50 text-rose-700 hover:border-rose-500"}`}><Flame className="h-3.5 w-3.5" /> Expert only <span className="opacity-70">{all.filter((c) => c.difficulty === "expert").length}</span></button>\n'],
  ['<p className="line-clamp-2 min-h-[2.5rem] text-sm font-extrabold leading-snug text-slate-900">{c.title}</p>\n',
   '<p className="line-clamp-2 min-h-[2.5rem] text-sm font-extrabold leading-snug text-slate-900">{c.title}</p>\n          {c.difficulty === "expert" && <p className="text-[10px] font-extrabold uppercase tracking-wider text-rose-600">🔥 {c.stages?.length || 9} steps · procedures · timed</p>}\n'],
  ['100 live patients across every subject. Take the history,', '300 live patients across every subject, with 200 expert cases that add procedures, scans, lab reports, timed decisions and mid-case complications. Take the history,'],
  ['all.length || 100', 'all.length || 300'],
])

edit('src/app/admin/page.tsx', 'handleGenerate100(true)', [
  ['async function handleGenerate100() {', 'async function handleGenerate100(expert: boolean = false) {'],
  ['if (!confirm("Generate the 100 Ward Round cases? It takes about 10-15 minutes. Keep this tab open. Cases that already exist are skipped.")) return',
   'if (!confirm(expert ? "Generate the 200 EXPERT Ward Round cases? It takes about 45-75 minutes. Keep this tab open. Cases that already exist are skipped." : "Generate the 100 Ward Round cases? It takes about 10-15 minutes. Keep this tab open. Cases that already exist are skipped.")) return'],
  ['const todo = CASE_TOPICS.filter((t) => !have.has(t.id))', 'const todo = CASE_TOPICS.filter((t) => !!t.expert === expert && !have.has(t.id))'],
  ['<Button onClick={handleGenerate100} disabled={!!batchRun?.running} className="rounded-lg gap-2">',
   '<Button onClick={() => handleGenerate100(false)} disabled={!!batchRun?.running} className="rounded-lg gap-2">'],
  ['Generate 100 cases\n              </Button>',
   'Generate 100 cases\n              </Button>\n              <Button onClick={() => handleGenerate100(true)} disabled={!!batchRun?.running} className="rounded-lg gap-2 bg-gradient-to-r from-rose-600 to-orange-500 text-white">\n                {batchRun?.running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />} Generate 200 expert cases\n              </Button>'],
])

edit('src/components/arena/ArenaCoop.tsx', "kind !== 'sequence'", [
  ['const stages = c.stages || []', "const stages = (c.stages || []).filter((s: any) => s.kind !== 'sequence')"],
])
edit('src/app/api/arena/[action]/route.ts', "kind !== 'sequence'", [
  ['const stages = c?.stages || []', "const stages = (c?.stages || []).filter((s: any) => s.kind !== 'sequence')"],
])

edit('src/ai/case-topics.ts', 'EXPERT_RAW', [
  ["// 100 curated Ward Round cases. Format: group | topic | difficulty (e/m/h) | setting\n",
   "import { EXPERT_RAW } from './case-topics-expert';\n// 100 curated Ward Round cases (ward-001..100) + 200 expert cases (ward-101..300).\n// Format: group | topic | difficulty (e/m/h) | setting\n"],
  ["export type CaseTopic = { id: string; group: string; topic: string; difficulty: 'easy' | 'medium' | 'hard'; setting: string };",
   "export type CaseTopic = { id: string; group: string; topic: string; difficulty: 'easy' | 'medium' | 'hard' | 'expert'; setting: string; expert?: boolean };"],
  ["export const CASE_TOPICS: CaseTopic[] = RAW.trim()", "const BASE: CaseTopic[] = RAW.trim()"],
])
{
  const f = 'src/ai/case-topics.ts'
  let s = fs.readFileSync(f, 'utf8')
  if (!s.includes('export const CASE_TOPICS')) {
    s += `const EXPERT: CaseTopic[] = EXPERT_RAW.trim().split('\\n').map((line, i) => {
  const [group, topic, setting] = line.split('|');
  return { id: 'ward-' + String(i + 101).padStart(3, '0'), group, topic, difficulty: 'expert', setting, expert: true };
});
export const CASE_TOPICS: CaseTopic[] = [...BASE, ...EXPERT];
`
    fs.writeFileSync(f, s); console.log('edited', f, '(topics list)')
  }
}

edit('src/app/cases/[caseId]/page.tsx', 'SequenceBoard', [
  ['import { ChevronLeft, Loader2, Trophy, AlertTriangle, Lightbulb, RotateCcw, CheckCircle2, XCircle, AlertCircle, Star, BookOpen } from "lucide-react"',
   'import { ChevronLeft, Loader2, Trophy, AlertTriangle, Lightbulb, RotateCcw, CheckCircle2, XCircle, AlertCircle, Star, BookOpen, Flame } from "lucide-react"'],
  ['import { saveResult, rankFor } from "@/lib/ward-progress"',
   'import { EXTRA_CSS, LabReport, ScanViewer, AlertBanner, TimerRing, SequenceBoard, type Lab, type Scan } from "@/components/cases/ward-extras"\nimport { saveResult, rankFor } from "@/lib/ward-progress"'],
  ['type CaseOption = { id: string; label: string; outcome: string; points: number; feedback: string; finding?: string }\ntype CaseStage = { id: string; type: string; prompt: string; options: CaseOption[] }',
   'type CaseOption = { id: string; label: string; outcome: string; points: number; feedback: string; finding?: string; labs?: Lab[]; scan?: Scan }\ntype CaseStage = { id: string; type: string; kind?: string; prompt: string; options: CaseOption[]; steps?: string[]; feedback?: string; finding?: string; timeLimit?: number; alert?: { title: string; text: string } }'],
  ['  management: { emoji: "💊", label: "Management", grad: "from-emerald-500 to-green-500", head: "Patient response" },\n}',
   '  management: { emoji: "💊", label: "Management", grad: "from-emerald-500 to-green-500", head: "Patient response" },\n  procedure: { emoji: "🧰", label: "Procedure", grad: "from-sky-500 to-blue-600", head: "Procedure outcome" },\n  complication: { emoji: "🚨", label: "Complication", grad: "from-red-600 to-rose-500", head: "What happens next" },\n  counselling: { emoji: "🤝", label: "Counselling & plan", grad: "from-indigo-500 to-violet-500", head: "Outcome" },\n}\nconst TIMEOUT: CaseOption = { id: "timeout", label: "No decision (time ran out)", outcome: "unsafe", points: -5, feedback: "You ran out of time. In a real emergency hesitation costs lives: commit to the best next step quickly.", finding: "" }'],
  ['    const xp = Math.max(0, score) + stars * 15\n', '    const xp = Math.round((Math.max(0, score) + stars * 15) * (c.difficulty === "expert" ? 1.5 : 1))\n'],
  ['const best = stage?.options.find((o) => o.outcome === "optimal")', 'const best = stage?.options?.find((o) => o.outcome === "optimal")'],
  ['    setMaxScore((m) => m + Math.max(...stage.options.map((x) => x.points)))', '    setMaxScore((m) => m + (stage.kind === "sequence" ? 10 : Math.max(...stage.options.map((x) => x.points))))'],
  ['    if (arrested || stageIndex + 1 >= stages.length) setFinished(true)\n    else setStageIndex(stageIndex + 1)',
   '    if (arrested || stageIndex + 1 >= stages.length) setFinished(true)\n    else {\n      if (stages[stageIndex + 1]?.alert) { setStability((s) => Math.max(8, s - 12)); setShake((k) => k + 1) }\n      setStageIndex(stageIndex + 1)\n    }'],
  ['  function restart() {', `  function submitSequence(correct: number, total: number) {
    const frac = total ? correct / total : 0
    const outcome = frac === 1 ? "optimal" : frac >= 0.6 ? "acceptable" : frac >= 0.34 ? "wrong" : "unsafe"
    const points = outcome === "unsafe" ? -5 : Math.round(10 * frac)
    const summary = frac === 1 ? "Perfect order, every step in the right place." : \`\${correct} of \${total} steps were in the right place.\`
    pick({ id: "seq", label: "Procedure", outcome, points, feedback: \`\${summary} \${stage.feedback || ""}\`.trim(), finding: stage.finding || "" })
  }
  function restart() {`],
  ['      <style>{SCENE_CSS}</style>\n      <Link href="/cases"', '      <style>{SCENE_CSS + EXTRA_CSS}</style>\n      <Link href="/cases"'],
  ['            {c.specialty && <span className="rounded-full bg-primary px-3 py-1 text-[11px] font-extrabold text-white shadow">{c.specialty}</span>}',
   '            {c.specialty && <span className="rounded-full bg-primary px-3 py-1 text-[11px] font-extrabold text-white shadow">{c.specialty}</span>}\n            {c.difficulty === "expert" && <span className="flex items-center gap-1 rounded-full bg-gradient-to-r from-rose-600 to-orange-500 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-white shadow"><Flame className="h-3 w-3" /> Expert</span>}'],
  ['<div className={`grid h-10 w-10 place-items-center rounded-full text-lg text-white shadow ${dot}', '<div className={`grid h-9 w-9 place-items-center rounded-full text-base text-white shadow sm:h-10 sm:w-10 sm:text-lg ${dot}'],
  ['<div className="flex items-center justify-between gap-1 rounded-2xl border border-black/5 bg-white p-3 shadow-sm">', '<div className="flex items-center justify-between gap-0.5 rounded-2xl border border-black/5 bg-white p-2 shadow-sm sm:gap-1 sm:p-3">'],
  ['          {stage && (\n            <div key={stage.id} className="wr-rise', '          {stage?.alert && !picked && <AlertBanner alert={stage.alert} />}\n\n          {stage && (\n            <div key={stage.id} className="wr-rise'],
  ['                <span className="text-xs font-bold opacity-90">Step {stageIndex + 1} of {stages.length}</span>\n              </div>',
   '                <span className="flex items-center gap-3 text-xs font-bold opacity-90">\n                  {stage.timeLimit ? <TimerRing seconds={stage.timeLimit} runKey={stage.id} active={!picked && !finished} onExpire={() => pick(TIMEOUT)} /> : null}\n                  Step {stageIndex + 1} of {stages.length}\n                </span>\n              </div>'],
  ['                <div className="grid gap-3 sm:grid-cols-2">\n                  {stage.options.map((o, i) => {',
   '                {stage.kind === "sequence" && stage.steps ? (\n                  <SequenceBoard stageId={stage.id} prompt={stage.prompt} steps={stage.steps} done={!!picked} onSubmit={submitSequence} />\n                ) : (\n                <div className="grid gap-3 sm:grid-cols-2">\n                  {stage.options.map((o, i) => {'],
  ['                  })}\n                </div>\n\n                {picked && (() => {', '                  })}\n                </div>\n                )}\n\n                {picked && (() => {'],
  ['                      {picked.finding && (', '                      {picked.scan && <ScanViewer scan={picked.scan} />}\n                      {picked.labs && picked.labs.length > 0 && <LabReport labs={picked.labs} />}\n                      {picked.finding && ('],
])
