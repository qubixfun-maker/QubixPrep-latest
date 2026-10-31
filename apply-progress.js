// Idempotent: Report button in QBank, sidebar links for My Progress and Study Plan.
const fs = require('fs')
function edit(file, test, pairs) {
  if (!fs.existsSync(file)) { console.log('MISSING FILE', file); process.exitCode = 1; return }
  const s = fs.readFileSync(file, 'utf8')
  if (s.includes(test)) { console.log('skip  ', file, '(' + test.slice(0, 28) + ')'); return }
  let out = s
  for (const [a, b] of pairs) {
    if (!out.includes(a)) { console.log('MISSING in', file, '->', a.slice(0, 70)); process.exitCode = 1; return }
    out = out.replace(a, b)
  }
  fs.writeFileSync(file, out); console.log('edited', file)
}

edit('src/app/qbank/[id]/page.tsx', 'ReportQuestion', [
  ['import { recordQbankAnswer } from "@/lib/study"', 'import { recordQbankAnswer } from "@/lib/study"\nimport ReportQuestion from "@/components/qbank/ReportQuestion"'],
  ['              {showExplanation && (\n                <div className="mt-8 space-y-4">\n',
   '              {showExplanation && (\n                <div className="mt-8 space-y-4">\n                  <ReportQuestion subjectId={subjectId} subjectName={(subject as any)?.name} topic={currentQ.topic_title} question={currentQ.question_text} />\n'],
])

edit('src/components/layout/app-sidebar.tsx', '/my-progress', [
  ['HelpCircle, LifeBuoy, RotateCcw,\n} from "lucide-react"', 'HelpCircle, LifeBuoy, RotateCcw, BarChart3, CalendarDays,\n} from "lucide-react"'],
  ['    { title: "Daily Review", url: "/review", icon: RotateCcw },\n', '    { title: "Daily Review", url: "/review", icon: RotateCcw },\n    { title: "My Progress", url: "/my-progress", icon: BarChart3 },\n    { title: "Study Plan", url: "/plan", icon: CalendarDays },\n'],
])

// Keep "Case Presentation" right after Ward Round now that three items were added above it.
edit('src/components/layout/app-sidebar.tsx', 'practise.slice(0, 7)', [
  ['{practise.slice(0, 4).map(row)}', '{practise.slice(0, 7).map(row)}'],
  ['{practise.slice(4).map(row)}', '{practise.slice(7).map(row)}'],
])
