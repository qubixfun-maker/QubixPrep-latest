"use client"
import { useTopSearch } from "@/components/layout/top-search"

import { useMemo, useState, use } from "react"
import { useDoc, useCollection, useFirestore, useUser } from "@/firebase"
import { doc, collection, query, where } from "firebase/firestore"
import { ChevronRight, ChevronLeft, ChevronDown, Loader2, BookOpen, Lock } from "lucide-react"
import Link from "next/link"
import { useRequireAuth } from "@/hooks/use-require-auth"
import { usePlan } from "@/hooks/use-plan"
import { getSubjectColor } from "@/lib/subject-colors"
import { groupChapters, layoutFor } from "@/lib/textbook-order"

export default function NotesSubjectPage({ params }: { params: Promise<{ subjectId: string }> }) {
  const { subjectId } = use(params)
  const db = useFirestore()
  const { user } = useUser()

  const subjectRef = useMemo(() => (!db ? null : doc(db, 'subjects', subjectId)), [db, subjectId])
  const { data: subject, loading: subjectLoading } = useDoc(subjectRef)

  // Reads the light chapter index (titles only). The note text itself stays locked until the student has a plan.
  const indexQuery = useMemo(
    () => (!db ? null : query(collection(db, 'notesIndex'), where('subjectId', '==', subjectId))),
    [db, subjectId]
  )
  const { data: indexList, loading: notesLoading } = useCollection(indexQuery)
  const notesList = useMemo(
    () => [...((indexList as any[]) || [])].sort((a, b) => String(a.chapterTitle).localeCompare(String(b.chapterTitle))),
    [indexList]
  )

  const { canAccessContent, loading: planLoading } = usePlan()
  const profileRef = useMemo(() => (!db || !user ? null : doc(db, 'users', user.uid)), [db, user])
  const { data: profile, loading: profileLoading } = useDoc(profileRef)
  const entitled = !!canAccessContent || (profile as any)?.role === 'admin'

  const { checkingAuth } = useRequireAuth()
  const [search] = useTopSearch("Search chapters…")
  const [openUnit, setOpenUnit] = useState<string | null>(null)
  const color = getSubjectColor(subject ? (subject as any).name : subjectId)

  if (checkingAuth || subjectLoading || planLoading || profileLoading) return <div className="h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 text-primary animate-spin" /></div>

  const freeCount = notesList.filter((n: any) => n.free).length
  const layout = layoutFor(subjectId, subject ? (subject as any).name : "")
  const q = search.trim().toLowerCase()
  const visible = notesList.filter((n: any) => !q || String(n.chapterTitle).toLowerCase().includes(q))
  // units in textbook order, chapters in textbook order inside each unit
  const groups = groupChapters(visible as any[], layout)

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-12 space-y-8 animate-in slide-in-from-right-4 duration-700">
      <div>
        <Link href="/notes" className={`text-xs font-bold uppercase tracking-widest ${color.text} flex items-center gap-1 mb-4 hover:underline w-fit`}>
          <ChevronLeft className="h-3 w-3" /> Back to Subjects
        </Link>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{subject ? (subject as any).name : 'Subject'}</h1>
        <p className="text-muted-foreground mt-2">{layout ? `Tap a unit to see its chapters, in the order of ${layout.book}.` : "Pick a chapter to browse its notes by topic."}</p>
      </div>

      {!entitled && notesList.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#f0d88a] bg-[#fff8e0] p-4 text-[#5a3a00]">
          <p className="text-sm font-semibold">
            {freeCount > 0 ? `${freeCount} sample chapter${freeCount === 1 ? ' is' : 's are'} free. ` : ''}Get Scholar (₹999/year) to read every chapter.
          </p>
          <Link href="/pricing" className="rounded-full bg-[#5a3a00] px-4 py-2 text-xs font-extrabold text-white">See plans</Link>
        </div>
      )}

      {notesLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : notesList.length > 0 ? (
        <div className="space-y-3">
          {groups.length === 0 && <p className="text-center text-sm text-muted-foreground py-8">No chapter matches your search.</p>}
          {groups.map((g, gi) => {
            const key = g.name + gi
            const isOpen = !!q || openUnit === key || groups.length === 1
            return (
              <section key={key} className={`rounded-2xl border ${color.border} bg-white overflow-hidden`}>
                <button
                  onClick={() => setOpenUnit(isOpen && openUnit === key ? null : key)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-4 p-5 text-left transition-colors hover:bg-muted/60"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <BookOpen className={`h-5 w-5 shrink-0 ${color.text}`} />
                    <span className={`min-w-0 break-words font-bold ${g.extra ? "text-muted-foreground" : ""}`}>{g.name || "Chapters"}</span>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="text-xs font-bold text-muted-foreground">{g.items.length} {g.items.length === 1 ? "chapter" : "chapters"}</span>
                    <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
                  </div>
                </button>
                {isOpen && (
                  <div className="grid gap-2 border-t border-border p-3 md:grid-cols-2 animate-in fade-in slide-in-from-top-1 duration-200">
                    {g.items.map((note: any) => {
                      const locked = !entitled && !note.free
                      return (
                        <Link
                          key={note.id}
                          href={`/notes/${subjectId}/${note.textbookId}/${note.chapterId}`}
                          className="flex items-center justify-between gap-3 rounded-xl border border-border p-4 transition-colors hover:bg-muted/60"
                        >
                          <div className="flex min-w-0 items-center gap-2">
                            <span className="min-w-0 break-words text-sm font-medium">{note.chapterTitle}</span>
                            {!entitled && note.free && <span className="shrink-0 rounded-full bg-[#d9f6ec] px-2 py-0.5 text-[10px] font-black text-[#17543f]">FREE</span>}
                          </div>
                          {locked ? <Lock className="h-4 w-4 shrink-0 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />}
                        </Link>
                      )
                    })}
                  </div>
                )}
              </section>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-16 text-muted-foreground rounded-2xl glass border-none">
          No notes have been generated for this subject yet.
        </div>
      )}
    </div>
  )
}
