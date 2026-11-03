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
  const { user, loading: userLoading } = useUser()
  const [sheet, setSheet] = useState<CaseSheet | null>(null)
  const [loading, setLoading] = useState(!!id)
  const [error, setError] = useState(false)
  useEffect(() => {
    if (!id) { setLoading(false); return }
    // wait for sign-in to finish: reading before that looks like "no such case" and used to open an empty form
    if (userLoading || !db) { setLoading(true); return }
    if (!user) { setLoading(false); return }
    setLoading(true); setError(false)
    let done = false
    let unsub: (() => void) | null = null
    // One-shot read: later edits are local state, so a live listener would fight with typing.
    unsub = onSnapshot(
      doc(db, "users", user.uid, "caseSheets", id),
      { includeMetadataChanges: true },
      (snap) => {
        if (snap.exists()) {
          setSheet({ ...(snap.data() as any), id: snap.id } as CaseSheet)
        } else if (snap.metadata.fromCache) {
          return // an empty answer from the local cache is not proof the case is gone; wait for the server
        } else {
          setSheet(null)
        }
        setLoading(false)
        done = true
        if (unsub) unsub()
      },
      () => { setError(true); setLoading(false) }
    )
    if (done) unsub()
    return () => { if (unsub) unsub() }
  }, [id, db, user, userLoading])
  return { sheet, loading, error }
}
