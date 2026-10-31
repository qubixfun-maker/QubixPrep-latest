// Idempotent: spaced repetition, wrong-answer notebook, account-synced progress wiring.
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

edit('firestore.rules', 'match /srs/', [
  ['      match /quickCardState/{cardId} {',
   `      match /srs/{id} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
      match /quickCardState/{cardId} {`],
])

edit('src/app/qbank/[id]/page.tsx', 'recordQbankAnswer', [
  ['import { useJelly } from "@/components/jelly/jelly-store"', 'import { useJelly } from "@/components/jelly/jelly-store"\nimport { recordQbankAnswer } from "@/lib/study"'],
  ["doc(db, 'users', subjectId)", "doc(db, 'subjects', subjectId)"],
  ['      if (optionIndex === currentQ.correct_answer_index) setScore(s => s + 1)\n',
   `      if (optionIndex === currentQ.correct_answer_index) setScore(s => s + 1)
      if (db && user) {
        recordQbankAnswer(db, user.uid, {
          id: (currentQ as any).id,
          subjectId,
          topic: currentQ.topic_title || "General",
          question: currentQ.question_text,
          options: currentOptions,
          correct: currentQ.correct_answer_index,
          explanation: currentQ.explanation,
        }, optionIndex).catch(() => {})
      }
`],
])

edit('src/app/cases/page.tsx', 'syncWardProgress', [
  ['import { loadProgress,', 'import { syncWardProgress } from "@/lib/ward-sync"\nimport { loadProgress,'],
  ['  const adminNeedsCases =', '  useEffect(() => { if (db && user) syncWardProgress(db, user.uid).then(setProg).catch(() => {}) }, [db, user])\n  const adminNeedsCases ='],
])

edit('src/app/cases/[caseId]/page.tsx', 'syncWardProgress', [
  ['import { saveResult, rankFor } from "@/lib/ward-progress"', 'import { saveResult, rankFor } from "@/lib/ward-progress"\nimport { syncWardProgress } from "@/lib/ward-sync"'],
  ['    setGain(r.gain)\n', '    setGain(r.gain)\n    try { const u = getAuth().currentUser; if (db && u) syncWardProgress(db, u.uid).catch(() => {}) } catch {}\n'],
])

edit('src/components/layout/app-sidebar.tsx', '/review', [
  ['HelpCircle, LifeBuoy,\n} from "lucide-react"', 'HelpCircle, LifeBuoy, RotateCcw,\n} from "lucide-react"'],
  ['    { title: "QBank", url: "/qbank", icon: Database },\n', '    { title: "Daily Review", url: "/review", icon: RotateCcw },\n    { title: "QBank", url: "/qbank", icon: Database },\n'],
])

// Mind map bookmarks / revision flags follow the account (merged with this device).
edit('src/app/mindmaps/[id]/[mindmapId]/page.tsx', 'mindmapMarks', [
  ['import { useDoc, useFirestore } from "@/firebase"', 'import { useDoc, useFirestore, useUser } from "@/firebase"'],
  ['import { doc } from "firebase/firestore"', 'import { doc, getDoc, setDoc } from "firebase/firestore"'],
  ['  const db = useFirestore()\n', '  const db = useFirestore()\n  const { user } = useUser()\n'],
  [`  useEffect(() => {
    setSaved(readList("mm-saved").includes(mindmapId))
    setFlagged(readList("mm-revise").includes(mindmapId))
  }, [mindmapId])
`, `  useEffect(() => {
    setSaved(readList("mm-saved").includes(mindmapId))
    setFlagged(readList("mm-revise").includes(mindmapId))
  }, [mindmapId])
  useEffect(() => {
    if (!db || !user) return
    getDoc(doc(db, "users", user.uid, "progress", "mindmapMarks")).then((snap) => {
      const d: any = snap.exists() ? snap.data() : {}
      const merge = (key: string, remote: string[]) => { const m = Array.from(new Set([...readList(key), ...(remote || [])])); writeList(key, m); return m }
      const s = merge("mm-saved", d.saved), r = merge("mm-revise", d.revise)
      setSaved(s.includes(mindmapId)); setFlagged(r.includes(mindmapId))
    }).catch(() => {})
  }, [db, user, mindmapId])
`],
  ['    writeList(key, list); set(!on); flash(!on ? onMsg : offMsg)\n',
   `    writeList(key, list); set(!on); flash(!on ? onMsg : offMsg)
    if (db && user) setDoc(doc(db, "users", user.uid, "progress", "mindmapMarks"), { [key === "mm-saved" ? "saved" : "revise"]: list }, { merge: true }).catch(() => {})
`],
])

// Flashcards: every Known / Again tap schedules the card for review.
edit('src/components/flashcards/ImmersiveDeck.tsx', 'onGrade', [
  ['type Card = { front: string; back: string }', 'type Card = { id?: string; front: string; back: string }'],
  ['{ cards, subject, unit, backHref }: { cards: Card[]; subject: string; unit?: string; backHref: string })', '{ cards, subject, unit, backHref, onGrade }: { cards: Card[]; subject: string; unit?: string; backHref: string; onGrade?: (card: Card, ok: boolean) => void })'],
  ['    if (index >= total - 1) setDone(true); else setIndex(index + 1)\n  }, [card, cardIdx, index, total])', '    try { if (onGrade && card) onGrade(card, ok) } catch {}\n    if (index >= total - 1) setDone(true); else setIndex(index + 1)\n  }, [card, cardIdx, index, total, onGrade])'],
])
const gradeLine = (chap) => `      onGrade={(c, ok) => { if (db && user) gradeFlashcard(db, user.uid, { subjectId, subjectName: subject ? (subject as any).name : undefined, chapter: ${chap}, front: c.front, back: c.back }, ok).catch(() => {}) }}\n`
edit('src/app/flashcards/[subjectId]/chapter/[chapterName]/page.tsx', 'gradeFlashcard', [
  ['import { useDoc, useCollection, useFirestore } from "@/firebase"', 'import { useDoc, useCollection, useFirestore, useUser } from "@/firebase"'],
  ['import ImmersiveDeck from', 'import { gradeFlashcard } from "@/lib/study"\nimport ImmersiveDeck from'],
  ['  const db = useFirestore()\n', '  const db = useFirestore()\n  const { user } = useUser()\n'],
  ['      backHref={`/flashcards/${subjectId}`}\n', '      backHref={`/flashcards/${subjectId}`}\n' + gradeLine('chapterName')],
])
edit('src/app/flashcards/[subjectId]/[deckId]/page.tsx', 'gradeFlashcard', [
  ['import { useDoc, useFirestore } from "@/firebase"', 'import { useDoc, useFirestore, useUser } from "@/firebase"'],
  ['import ImmersiveDeck from', 'import { gradeFlashcard } from "@/lib/study"\nimport ImmersiveDeck from'],
  ['  const db = useFirestore()\n', '  const db = useFirestore()\n  const { user } = useUser()\n'],
  ['      backHref={`/flashcards/${subjectId}`}\n', '      backHref={`/flashcards/${subjectId}`}\n' + gradeLine('d?.chapterName || d?.title || undefined')],
])
