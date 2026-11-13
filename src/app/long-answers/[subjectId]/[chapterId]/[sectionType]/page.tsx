"use client"

import { useMemo, useState, useEffect, use } from "react"
import { useDoc, useFirestore } from "@/firebase"
import { doc } from "firebase/firestore"
import { Loader2 } from "lucide-react"
import { useRequireAuth } from "@/hooks/use-require-auth"
import { useLongAnswerAccess } from "@/hooks/use-long-answer-access"
import { UpgradeGate } from "@/components/upgrade-gate"
import { ZoomReader } from "@/components/notes/zoom-reader"

const SECTION_LABEL: Record<string, string> = {
  'long-essays': 'Long Essays',
  'short-essays': 'Short Essays',
  'short-answers': 'Short Answers',
}

type QAItem = { questionHtml: string; answerHtml: string }

function parseQaItems(html: string): QAItem[] {
  if (typeof document === "undefined") return []
  const container = document.createElement("div")
  container.innerHTML = html
  return Array.from(container.querySelectorAll(".qa-item")).map((el) => ({
    questionHtml: el.querySelector(".qa-question")?.innerHTML || "",
    answerHtml: el.querySelector(".qa-answer")?.innerHTML || "",
  }))
}

// Exam-answer-sheet look: white page, big hand-drawn title between green bars, bold question,
// "Answer:" label, green label tabs for headings, circle bullets.
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Gochi+Hand&family=Itim&display=swap');
.qp-la { background:#fff; color:#26283d; font-family:'Itim', system-ui, sans-serif; font-size:15.5px; line-height:1.6; padding:18px 16px 40px; }
.qp-la .la-title { display:flex; align-items:center; gap:10px; margin:6px 0 4px; }
.qp-la .la-title i { flex:1; height:14px; border-radius:8px; background:#2fb59a; }
.qp-la .la-title h2 { font-family:'Gochi Hand', cursive; font-size:26px; color:#14295c; text-align:center; line-height:1.15; max-width:70%; }
.qp-la .la-sub { text-align:center; color:#64748b; font-size:13px; margin-bottom:18px; }
.qp-la .la-item { padding:16px 0 18px; border-top:1.5px solid #e5e7eb; }
.qp-la .la-item:first-of-type { border-top:0; }
.qp-la .la-q { font-weight:700; font-size:16.5px; color:#14295c; }
.qp-la .la-q .qa-number { margin-right:6px; }
.qp-la .qa-repeat { text-transform:none !important; letter-spacing:0 !important; margin-top:0 !important; display:inline-block; margin-left:8px; padding:1px 9px; border-radius:999px; background:#fdf3d6; color:#8a6100; font-size:11px; font-weight:700; vertical-align:middle; }
.qp-la .la-ans { margin-top:10px; font-family:'Gochi Hand', cursive; font-size:17px; color:#14295c; }
.qp-la .la-a { margin-top:2px; }
.qp-la .la-a h1, .qp-la .la-a h2, .qp-la .la-a h3, .qp-la .la-a h4, .qp-la .la-a h5 {
  display:inline-block; margin:14px 0 6px; padding:2px 9px; border-radius:3px; background:#c9ece5; color:#0f5d50;
  font-size:12.5px; font-weight:700; letter-spacing:.04em; text-transform:uppercase; }
.qp-la .la-a p { margin:6px 0; }
.qp-la .la-a ul, .qp-la .la-a ol { margin:6px 0; padding-left:22px; }
.qp-la .la-a ul { list-style:circle; }
.qp-la .la-a ol { list-style:decimal; }
.qp-la .la-a li { margin:3px 0; padding-left:2px; }
.qp-la .la-a li::marker { color:#14295c; }
.qp-la .la-a strong, .qp-la .la-a b { color:#14295c; }
.qp-la .la-a table { width:100%; border-collapse:collapse; margin:10px 0; font-size:13.5px; }
.qp-la .la-a th { background:#8fb3e8; color:#14295c; border:1px solid #94a3b8; padding:5px 7px; font-weight:400; font-family:'Gochi Hand', cursive; }
.qp-la .la-a td { border:1px solid #94a3b8; padding:5px 7px; vertical-align:top; }
.qp-la img { max-width:100%; height:auto; }
`

export default function LongAnswersQuestionsPage({ params }: { params: Promise<{ subjectId: string; chapterId: string; sectionType: string }> }) {
  const { subjectId, chapterId, sectionType } = use(params)
  const db = useFirestore()

  const subjectRef = useMemo(() => (!db ? null : doc(db, 'subjects', subjectId)), [db, subjectId])
  const { data: subject, loading: subjectLoading } = useDoc(subjectRef)

  const chapterRef = useMemo(() => (!db ? null : doc(db, 'subjects', subjectId, 'essayChapters', chapterId)), [db, subjectId, chapterId])
  const { data: chapter, loading: chapterLoading } = useDoc(chapterRef)

  const sectionRef = useMemo(() => (!db ? null : doc(db, 'subjects', subjectId, 'essayChapters', chapterId, 'sections', sectionType)), [db, subjectId, chapterId, sectionType])
  const { data: section, loading: sectionLoading } = useDoc(sectionRef)

  const [items, setItems] = useState<QAItem[]>([])
  useEffect(() => {
    if (section && (section as any).html) setItems(parseQaItems((section as any).html))
  }, [section])

  const { checkingAuth } = useRequireAuth()
  const access = useLongAnswerAccess(subjectId)

  if (checkingAuth || access.loading || subjectLoading || chapterLoading || sectionLoading) return <div className="h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 text-primary animate-spin" /></div>
  if (access.isLocked(chapterId)) return (
    <div className="max-w-xl mx-auto p-6 pt-12">
      <UpgradeGate type="content" title="This chapter is for subscribers" description="The first chapter of every subject is free. Subscribe to Scholar (₹999/year) to unlock all long answers." />
    </div>
  )

  const chapterTitle = (chapter as any)?.title || ''
  const label = SECTION_LABEL[sectionType] || sectionType

  return (
    <ZoomReader>
      <style>{CSS}</style>
      <div className="qp-la">
        <div className="la-title"><i /><h2>{label}</h2><i /></div>
        <p className="la-sub">{chapterTitle}{chapterTitle && subject ? ' · ' : ''}{subject ? (subject as any).name : ''}</p>

        {items.length > 0 ? items.map((item, i) => (
          <div key={i} className="la-item">
            <div className="la-q" dangerouslySetInnerHTML={{ __html: item.questionHtml }} />
            <div className="la-ans">Answer:</div>
            <div className="la-a" dangerouslySetInnerHTML={{ __html: item.answerHtml }} />
          </div>
        )) : (
          <div className="py-16 text-center text-slate-500">No questions found in this section.</div>
        )}
      </div>
    </ZoomReader>
  )
}
