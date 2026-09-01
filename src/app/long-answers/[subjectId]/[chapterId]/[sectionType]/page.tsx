"use client"

import { useMemo, useState, useEffect, use } from "react"
import { useDoc, useFirestore } from "@/firebase"
import { doc } from "firebase/firestore"
import { ChevronDown, ChevronLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import { useRequireAuth } from "@/hooks/use-require-auth"
import { getSubjectColor } from "@/lib/subject-colors"

const SECTION_LABEL: Record<string, string> = {
  'long-essays': 'Long Essays',
  'short-essays': 'Short Essays',
  'short-answers': 'Short Answers',
}

type QAItem = { questionHtml: string; answerHtml: string }
type AnswerSection = { heading: string | null; bodyHtml: string }

function parseQaItems(html: string): QAItem[] {
  if (typeof document === "undefined") return []
  const container = document.createElement("div")
  container.innerHTML = html
  return Array.from(container.querySelectorAll(".qa-item")).map((el) => ({
    questionHtml: el.querySelector(".qa-question")?.innerHTML || "",
    answerHtml: el.querySelector(".qa-answer")?.innerHTML || "",
  }))
}

function parseAnswerSections(answerHtml: string): AnswerSection[] {
  if (typeof document === "undefined") return [{ heading: null, bodyHtml: answerHtml }]
  const container = document.createElement("div")
  container.innerHTML = answerHtml
  const children = Array.from(container.children)
  const hasHeadings = children.some((el) => el.tagName === "H4")
  if (!hasHeadings) return [{ heading: null, bodyHtml: answerHtml }]

  const sections: AnswerSection[] = []
  let current: AnswerSection | null = null
  for (const el of children) {
    if (el.tagName === "H4") {
      if (current) sections.push(current)
      current = { heading: el.innerHTML, bodyHtml: "" }
    } else {
      if (!current) current = { heading: null, bodyHtml: "" }
      current.bodyHtml += el.outerHTML
    }
  }
  if (current) sections.push(current)
  return sections
}

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
  const [expanded, setExpanded] = useState<Record<number, boolean>>({})

  useEffect(() => {
    if (section && (section as any).html) {
      setItems(parseQaItems((section as any).html))
    }
  }, [section])

  const { checkingAuth } = useRequireAuth()
  const color = getSubjectColor(subject ? (subject as any).name : subjectId)

  if (checkingAuth || subjectLoading || chapterLoading || sectionLoading) return <div className="h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 text-primary animate-spin" /></div>

  function toggle(index: number) {
    setExpanded((prev) => ({ ...prev, [index]: !prev[index] }))
  }

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-12 space-y-8 animate-in slide-in-from-right-4 duration-700">
      <div>
        <Link href={`/long-answers/${subjectId}/${chapterId}`} className={`text-xs font-bold uppercase tracking-widest ${color.text} flex items-center gap-1 mb-4 hover:underline w-fit`}>
          <ChevronLeft className="h-3 w-3" /> Back to Sections
        </Link>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{SECTION_LABEL[sectionType] || sectionType}</h1>
        <p className="text-muted-foreground mt-2">{(chapter as any)?.title || ''} &middot; {subject ? (subject as any).name : ''}</p>
      </div>

      {items.length > 0 ? (
        <div className="space-y-3">
          {items.map((item, i) => (
            <div key={i} className={`rounded-2xl glass border ${color.border} overflow-hidden transition-all duration-300`}>
              <button
                onClick={() => toggle(i)}
                className="w-full text-left p-5 flex items-start justify-between gap-4 hover:bg-white/5 transition-colors"
              >
                <div className="qa-question flex-1" dangerouslySetInnerHTML={{ __html: item.questionHtml }} />
                <ChevronDown className={`h-5 w-5 shrink-0 mt-1 ${color.text} transition-transform duration-300 ${expanded[i] ? 'rotate-180' : ''}`} />
              </button>
              {expanded[i] && (
                <div className="px-5 pb-5 pt-1 border-t border-white/5 animate-in slide-in-from-top-2 duration-300 space-y-3">
                  {parseAnswerSections(item.answerHtml).map((section, si) => (
                    <div key={si} className={`qa-section qa-section-c${(si % 4) + 1}`}>
                      {section.heading && <h4 dangerouslySetInnerHTML={{ __html: section.heading }} />}
                      <div className="qa-answer" dangerouslySetInnerHTML={{ __html: section.bodyHtml }} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-muted-foreground rounded-2xl glass border-none">
          No questions found in this section.
        </div>
      )}
    </div>
  )
}
