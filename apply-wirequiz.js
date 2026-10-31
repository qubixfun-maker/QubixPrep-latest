// Idempotent: Custom Quiz and PYQ sessions now feed My Progress, the wrong-answer notebook and Daily Review.
const fs = require('fs')
function edit(file, test, pairs) {
  if (!fs.existsSync(file)) { console.log('MISSING FILE', file); process.exitCode = 1; return }
  let s = fs.readFileSync(file, 'utf8')
  if (s.includes(test)) { console.log('skip  ', file); return }
  for (const [a, b] of pairs) { if (!s.includes(a)) { console.log('MISSING', file, a.slice(0, 50)); process.exitCode = 1; return } s = s.replace(a, b) }
  fs.writeFileSync(file, s); console.log('edited', file)
}
const effect = (subj) => `
  const progressSaved = useRef(false)
  useEffect(() => {
    if (!finished || progressSaved.current || !db || !user || questions.length === 0) return
    progressSaved.current = true
    const src: Record<number, number> = mode === 'practice' ? lockedAnswers : answers
    recordBulk(db, user.uid, questions.map((q: any, n: number) => ({ subjectId: String(${subj}), topic: q.topic_title || q.subject || "General", question: q.question_text, options: [q.option1, q.option2, q.option3, q.option4].filter(Boolean), correct: q.correct_answer_index, explanation: q.explanation, picked: src[n] ?? null }))).catch(() => {})
  }, [finished])
`
for (const [file, subj] of [['src/app/test-series/start/page.tsx', 'q.subject_id || q.subject || "general"'], ['src/app/pyq/start/page.tsx', 'q.subject_id || q.subject || "pyq"']]) {
  edit(file, 'progressSaved', [
    ['import { useState, useEffect, Suspense } from "react"', 'import { useState, useEffect, useRef, Suspense } from "react"\nimport { useFirestore } from "@/firebase"\nimport { recordBulk } from "@/lib/study"'],
    ['  const { user } = useUser()\n', '  const { user } = useUser()\n  const db = useFirestore()\n'],
    ['  const [lockedAnswers, setLockedAnswers] = useState<Record<number, number>>({})\n', '  const [lockedAnswers, setLockedAnswers] = useState<Record<number, number>>({})\n' + effect(subj)],
  ])
}
