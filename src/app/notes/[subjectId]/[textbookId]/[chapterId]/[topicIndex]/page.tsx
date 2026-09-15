"use client"

import { useMemo, use } from "react"
import { useDoc, useFirestore } from "@/firebase"
import { doc } from "firebase/firestore"
import { ChevronLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import ReactMarkdown, { type Components } from "react-markdown"
import remarkGfm from "remark-gfm"
import { useRequireAuth } from "@/hooks/use-require-auth"
import { getSubjectColor } from "@/lib/subject-colors"

const LATEX_SYMBOL_MAP: [RegExp, string][] = [
  [/\\rightarrow/g, '→'],
  [/\\leftarrow/g, '←'],
  [/\\leftrightarrow|\\rightleftharpoons/g, '↔'],
  [/\\uparrow/g, '↑'],
  [/\\downarrow/g, '↓'],
  [/\\geq/g, '≥'],
  [/\\leq/g, '≤'],
  [/\\neq/g, '≠'],
  [/\\approx/g, '≈'],
  [/\\times/g, '×'],
  [/\\pm/g, '±'],
  [/\\infty/g, '∞'],
  [/\\alpha/g, 'α'],
  [/\\beta/g, 'β'],
  [/\\gamma/g, 'γ'],
  [/\\delta/g, 'δ'],
  [/\\Delta/g, 'Δ'],
  [/\\mu/g, 'μ'],
  [/\\lambda/g, 'λ'],
  [/\\sigma/g, 'σ'],
]

function sanitizeMarkdown(raw: string): string {
  let text = raw
  text = text.replace(/\\text\{([^}]*)\}/g, '$1')
  for (const [pattern, replacement] of LATEX_SYMBOL_MAP) {
    text = text.replace(pattern, replacement)
  }
  text = text.replace(/\\([a-zA-Z]+)/g, '$1')
  text = text.replace(/\$([^$]*)\$/g, '$1')
  return text
}

const markdownComponents: Components = {
  table: ({ children }) => (
    <div className="overflow-x-auto -mx-2 px-2">
      <table>{children}</table>
    </div>
  ),
  img: ({ src, alt }) => (
    <img
      src={typeof src === 'string' ? src : undefined}
      alt={alt || ''}
      loading="lazy"
      className="rounded-xl border border-white/10 mx-auto max-h-[420px] w-auto object-contain"
    />
  ),
}

export default function NotesTopicDetailPage({ params }: { params: Promise<{ subjectId: string; textbookId: string; chapterId: string; topicIndex: string }> }) {
  const { subjectId, textbookId, chapterId, topicIndex } = use(params)
  const db = useFirestore()

  const subjectRef = useMemo(() => (!db ? null : doc(db, 'subjects', subjectId)), [db, subjectId])
  const { data: subject, loading: subjectLoading } = useDoc(subjectRef)

  const docKey = `${textbookId}__${chapterId}`
  const notesRef = useMemo(() => (!db ? null : doc(db, 'subjects', subjectId, 'textNotes', docKey)), [db, subjectId, docKey])
  const { data: notes, loading: notesLoading } = useDoc(notesRef)

  const { checkingAuth } = useRequireAuth()
  const color = getSubjectColor(subject ? (subject as any).name : subjectId)

  if (checkingAuth || subjectLoading || notesLoading) {
    return <div className="h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 text-primary animate-spin" /></div>
  }

  const topics = ((notes as any)?.topics || []) as { name: string; markdown: string }[]
  const topic = topics[parseInt(topicIndex, 10)]

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-12 space-y-8 animate-in slide-in-from-right-4 duration-700">
      <div>
        <Link href={`/notes/${subjectId}/${textbookId}/${chapterId}`} className={`text-xs font-bold uppercase tracking-widest ${color.text} flex items-center gap-1 mb-4 hover:underline w-fit`}>
          <ChevronLeft className="h-3 w-3" /> Back to Topics
        </Link>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{topic?.name || 'Topic'}</h1>
        <p className="text-muted-foreground mt-2">{(notes as any)?.chapterTitle || ''} &middot; {subject ? (subject as any).name : ''}</p>
      </div>

      {topic ? (
        <div
          className={`rounded-2xl glass border ${color.border} p-6 md:p-8 prose prose-invert max-w-none
            prose-headings:font-bold prose-headings:text-foreground
            prose-h1:text-2xl md:prose-h1:text-3xl
            prose-h2:text-xl prose-h2:text-primary prose-h2:mt-8 prose-h2:mb-3
            prose-h3:text-lg prose-h3:text-primary/90
            prose-strong:text-foreground
            prose-a:text-primary prose-a:no-underline hover:prose-a:underline
            prose-blockquote:border-l-primary/50 prose-blockquote:text-muted-foreground prose-blockquote:not-italic
            prose-table:border prose-table:border-white/10 prose-table:text-sm
            prose-thead:border-b prose-thead:border-white/20
            prose-th:border prose-th:border-white/10 prose-th:bg-white/5 prose-th:p-2 prose-th:text-foreground
            prose-td:border prose-td:border-white/10 prose-td:p-2
            prose-ul:marker:text-primary
            [&_ol]:list-none [&_ol]:pl-0 [&_ol]:[counter-reset:step]
            [&_ol>li]:relative [&_ol>li]:pl-9 [&_ol>li]:pb-5 [&_ol>li]:ml-3 [&_ol>li]:border-l-2 [&_ol>li]:border-primary/30
            [&_ol>li:last-child]:pb-0 [&_ol>li:last-child]:border-transparent
            [&_ol>li]:[counter-increment:step]
            [&_ol>li]:before:content-[counter(step)]
            [&_ol>li]:before:absolute [&_ol>li]:before:-left-[13px] [&_ol>li]:before:top-0
            [&_ol>li]:before:flex [&_ol>li]:before:h-6 [&_ol>li]:before:w-6
            [&_ol>li]:before:items-center [&_ol>li]:before:justify-center
            [&_ol>li]:before:rounded-full [&_ol>li]:before:bg-primary
            [&_ol>li]:before:text-[11px] [&_ol>li]:before:font-bold [&_ol>li]:before:text-primary-foreground`}
        >
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{sanitizeMarkdown(topic.markdown)}</ReactMarkdown>
        </div>
      ) : (
        <div className="text-center py-16 text-muted-foreground rounded-2xl glass border-none">
          Topic not found.
        </div>
      )}
    </div>
  )
}
