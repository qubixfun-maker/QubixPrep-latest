"use client"

import { useState, useMemo } from "react"
import { useFirestore, useCollection } from "@/firebase"
import { collection, collectionGroup, query, deleteDoc, doc } from "firebase/firestore"
import Link from "next/link"
import { Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type NoteDoc = {
  id: string
  subjectId: string
  textbookId: string
  chapterId: string
  chapterTitle: string
  topicCount?: number
}

export default function NotesManagerPage() {
  const db = useFirestore()

  const subjectsQuery = useMemo(() => (!db ? null : query(collection(db, "subjects"))), [db])
  const { data: subjects } = useCollection(subjectsQuery)
  const subjectNameById = useMemo(() => {
    const map: Record<string, string> = {}
    subjects?.forEach((s: any) => { map[s.id] = s.name })
    return map
  }, [subjects])

  const notesQuery = useMemo(() => (!db ? null : query(collectionGroup(db, "textNotes"))), [db])
  const { data: notesRaw, loading } = useCollection(notesQuery)
  const notes = notesRaw as NoteDoc[] | null

  const [subjectFilter, setSubjectFilter] = useState("")
  const [search, setSearch] = useState("")
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    let list = notes || []
    if (subjectFilter) list = list.filter((n) => n.subjectId === subjectFilter)
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter((n) => (n.chapterTitle || "").toLowerCase().includes(q))
    }
    return [...list].sort((a, b) => {
      const subjA = subjectNameById[a.subjectId] || a.subjectId
      const subjB = subjectNameById[b.subjectId] || b.subjectId
      if (subjA !== subjB) return subjA.localeCompare(subjB)
      return (a.chapterTitle || "").localeCompare(b.chapterTitle || "")
    })
  }, [notes, subjectFilter, search, subjectNameById])

  async function handleDelete(note: NoteDoc) {
    if (!db) return
    if (!confirm(`Delete "${note.chapterTitle}"? This removes all its topics and cannot be undone.`)) return
    setDeletingId(note.id)
    try {
      await deleteDoc(doc(db, "subjects", note.subjectId, "textNotes", note.id))
    } catch (err: any) {
      alert(`Could not delete: ${err.message || "unknown error"}`)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-12 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Manage Notes</h1>
        <p className="text-muted-foreground mt-2">
          View and delete chapter notes generated via AI Notes Generator (or any other notes pipeline that writes into the same collection). Deleting removes the chapter and all its topics from the student-facing Notes section.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-3">
        <select className="rounded-lg border bg-background p-2 md:w-64" value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)}>
          <option value="">All subjects</option>
          {subjects?.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <Input placeholder="Search chapter title..." value={search} onChange={(e) => setSearch(e.target.value)} className="glass border-white/10 flex-1" />
      </div>

      {loading ? (
        <p className="text-muted-foreground text-sm">Loading...</p>
      ) : filtered.length === 0 ? (
        <p className="text-muted-foreground text-sm">No notes found{subjectFilter || search ? " for this filter" : ""}.</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((note) => (
            <div key={`${note.subjectId}__${note.id}`} className="flex items-center justify-between gap-3 rounded-xl border p-3">
              <div className="min-w-0 flex-1">
                <p className="font-medium truncate">{note.chapterTitle}</p>
                <p className="text-xs text-muted-foreground">
                  {subjectNameById[note.subjectId] || note.subjectId}
                  {" · "}
                  {note.textbookId === "ai-generated" ? "AI Generated" : note.textbookId}
                  {typeof note.topicCount === "number" ? ` · ${note.topicCount} topic${note.topicCount === 1 ? "" : "s"}` : ""}
                </p>
              </div>
              <Link
                href={`/notes/${note.subjectId}/${note.textbookId}/${note.chapterId}`}
                className="text-sm text-primary underline shrink-0"
              >
                View
              </Link>
              <Button
                onClick={() => handleDelete(note)}
                disabled={deletingId === note.id}
                variant="outline"
                size="sm"
                className="shrink-0 border-destructive/40 text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
