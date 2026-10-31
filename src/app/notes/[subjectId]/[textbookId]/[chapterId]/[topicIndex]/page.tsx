"use client"

import { use, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useDoc, useFirestore, useUser } from "@/firebase"
import { doc, getDoc } from "firebase/firestore"
import { ChevronLeft, Loader2 } from "lucide-react"
import { useRequireAuth } from "@/hooks/use-require-auth"
import { getSubjectColor } from "@/lib/subject-colors"
import { NoteBody } from "@/components/notes/note-body"
import { UpgradeGate } from "@/components/upgrade-gate"
import { Top100Toggle } from "@/components/top100/Top100Toggle"

export default function NotesTopicDetailPage({ params }: { params: Promise<{ subjectId: string; textbookId: string; chapterId: string; topicIndex: string }> }) {
  const { subjectId, textbookId, chapterId, topicIndex } = use(params)
  const db = useFirestore()
  const { user } = useUser()

  const subjectRef = useMemo(() => (!db ? null : doc(db, 'subjects', subjectId)), [db, subjectId])
  const { data: subject, loading: subjectLoading } = useDoc(subjectRef)
  const profileRef = useMemo(() => (!db || !user ? null : doc(db, 'users', user.uid)), [db, user])
  const { data: profile } = useDoc(profileRef)
  const isAdmin = (profile as any)?.role === 'admin'

  // The note text is protected by the database rule: only paid members, admins and free-sample chapters can read it.
  const docKey = `${textbookId}__${chapterId}`
  const [notes, setNotes] = useState<any>(null)
  const [state, setState] = useState<'loading' | 'ready' | 'locked' | 'error'>('loading')
  useEffect(() => {
    if (!db || !user) return
    let cancelled = false
    setState('loading')
    getDoc(doc(db, 'subjects', subjectId, 'textNotes', docKey))
      .then((snap) => { if (!cancelled) { setNotes(snap.exists() ? snap.data() : null); setState('ready') } })
      .catch((e: any) => { if (!cancelled) setState(e?.code === 'permission-denied' ? 'locked' : 'error') })
    return () => { cancelled = true }
  }, [db, user, subjectId, docKey])

  // opened from Top 100: the Back button returns there. Read after load so the page needs no extra loading wrapper.
  const [fromTop100, setFromTop100] = useState(false)
  useEffect(() => { setFromTop100(new URLSearchParams(window.location.search).get('from') === 'top-100') }, [])

  const { checkingAuth } = useRequireAuth()
  const color = getSubjectColor(subject ? (subject as any).name : subjectId)

  if (checkingAuth || subjectLoading || state === 'loading') {
    return <div className="h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 text-primary animate-spin" /></div>
  }

  const topics = ((notes as any)?.topics || []) as { name: string; markdown: string }[]
  const topic = topics[parseInt(topicIndex, 10)]

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-12 space-y-8 animate-in slide-in-from-right-4 duration-700">
      <div>
        <Link href={fromTop100 ? '/top-100' : `/notes/${subjectId}/${textbookId}/${chapterId}`} className={`text-xs font-bold uppercase tracking-widest ${color.text} flex items-center gap-1 mb-4 hover:underline w-fit`}>
          <ChevronLeft className="h-3 w-3" /> {fromTop100 ? 'Back to Top 100' : 'Back to Topics'}
        </Link>
        {state === 'ready' && (
          <>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{topic?.name || 'Topic'}</h1>
            <p className="text-muted-foreground mt-2">{(notes as any)?.chapterTitle || ''} &middot; {subject ? (subject as any).name : ''}</p>
            {topic && isAdmin && <Top100Toggle subjectId={subjectId} subjectName={subject ? (subject as any).name : subjectId} textbookId={textbookId} chapterId={chapterId} topicIndex={parseInt(topicIndex, 10)} name={topic.name} chapterTitle={(notes as any)?.chapterTitle || ''} markdown={topic.markdown} />}
          </>
        )}
      </div>

      {state === 'locked' && (
        <UpgradeGate type="content" title="These notes are for members" description="Get Scholar (₹999/year) to read every chapter. A few sample chapters in each subject stay free." />
      )}
      {state === 'error' && <div className="text-center py-16 text-muted-foreground rounded-2xl glass border-none">Could not load this topic. Check your connection and try again.</div>}

      {state === 'ready' && (topic ? (
        <NoteBody markdown={topic.markdown} borderClass={color.border} protectWith={isAdmin ? undefined : (user?.email || user?.uid)} />
      ) : (
        <div className="text-center py-16 text-muted-foreground rounded-2xl glass border-none">Topic not found.</div>
      ))}
    </div>
  )
}
