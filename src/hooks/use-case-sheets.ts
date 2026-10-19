"use client"

import { useEffect, useMemo, useState } from "react"
import { collection, doc, onSnapshot, deleteDoc, setDoc, serverTimestamp, addDoc } from "firebase/firestore"
import { useFirestore, useUser, useDoc } from "@/firebase"

export type CaseSheet = {
  id: string
  caseType: string
  subject: string
  title: string
  answers: Record<string, any>
  updatedAt?: any
  createdAt?: any
}

/** Subscribers (Scholar or Clinician) and admins. The Firestore rules enforce the same check on writes. */
export function useCaseAccess() {
  const { user, loading: userLoading } = useUser()
  const db = useFirestore()
  const ref = useMemo(() => (!db || !user ? null : doc(db, "users", user.uid)), [db, user])
  const { data: profile, loading: profileLoading } = useDoc(ref) as any
  const isAdmin = profile?.role === "admin"
  const plan = profile?.plan
  const allowed = isAdmin || plan === "basic" || plan === "pro"
  return { user, loading: userLoading || (!!user && profileLoading), allowed, isAdmin }
}

export function useMyCaseSheets() {
  const db = useFirestore()
  const { user } = useUser()
  const [sheets, setSheets] = useState<CaseSheet[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    if (!db || !user) { setLoading(false); return }
    return onSnapshot(
      collection(db, "users", user.uid, "caseSheets"),
      (snap) => {
        const list = snap.docs.map((d) => ({ ...(d.data() as any), id: d.id })) as CaseSheet[]
        list.sort((a, b) => (b.updatedAt?.toMillis?.() ?? 0) - (a.updatedAt?.toMillis?.() ?? 0))
        setSheets(list)
        setLoading(false)
      },
      () => setLoading(false)
    )
  }, [db, user])
  return { sheets, loading }
}

const plain = (o: any) => JSON.parse(JSON.stringify(o ?? {}))

export async function saveCaseSheet(db: any, uid: string, id: string | null, data: { caseType: string; subject: string; title: string; answers: Record<string, any> }) {
  const payload = { ...data, answers: plain(data.answers), updatedAt: serverTimestamp() }
  if (id) {
    await setDoc(doc(db, "users", uid, "caseSheets", id), payload, { merge: true })
    return id
  }
  const ref = await addDoc(collection(db, "users", uid, "caseSheets"), { ...payload, createdAt: serverTimestamp() })
  return ref.id
}

export async function deleteCaseSheet(db: any, uid: string, id: string) {
  await deleteDoc(doc(db, "users", uid, "caseSheets", id))
}

export function useCaseSheet(id: string | null) {
  const db = useFirestore()
  const { user } = useUser()
  const [sheet, setSheet] = useState<CaseSheet | null>(null)
  const [loading, setLoading] = useState(!!id)
  useEffect(() => {
    if (!id || !db || !user) { setLoading(false); return }
    setLoading(true)
    // One-shot read: later edits are local state, so the live listener would fight with typing.
    const unsub = onSnapshot(doc(db, "users", user.uid, "caseSheets", id), (snap) => {
      setSheet(snap.exists() ? ({ ...(snap.data() as any), id: snap.id } as CaseSheet) : null)
      setLoading(false)
      unsub()
    }, () => setLoading(false))
    return () => unsub()
  }, [id, db, user])
  return { sheet, loading }
}
