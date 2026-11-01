"use client"

import { useMemo } from "react"
import { collection, orderBy, query } from "firebase/firestore"
import { useCollection, useFirestore } from "@/firebase"
import { usePlan } from "@/hooks/use-plan"

/** Free students get the first chapter of each subject (in the order the chapter list shows them). Scholar, Clinician and admins get all. */
export function useLongAnswerAccess(subjectId: string) {
  const db = useFirestore()
  const { canAccessContent, loading: planLoading } = usePlan()
  const q = useMemo(() => (!db ? null : query(collection(db, "subjects", subjectId, "essayChapters"), orderBy("title", "asc"))), [db, subjectId])
  const { data: chapters, loading } = useCollection(q)
  const freeId: string | null = chapters && chapters.length ? (chapters[0] as any).id : null
  const isLocked = (chapterId: string) => !canAccessContent && freeId !== null && chapterId !== freeId
  return { isLocked, loading: planLoading || loading, canAccessContent }
}
