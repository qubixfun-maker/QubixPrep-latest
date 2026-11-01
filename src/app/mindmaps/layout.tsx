"use client"
import Link from "next/link"
import { Loader2 } from "lucide-react"
import { usePlan } from "@/hooks/use-plan"
import { useUser, useDoc, useFirestore } from "@/firebase"
import { useMemo } from "react"
import { doc } from "firebase/firestore"

// Mind Maps are hidden from students for now. Admins can still open and check them.
export default function MindmapsLayout({ children }: { children: React.ReactNode }) {
  const { user } = useUser()
  const db = useFirestore()
  const ref = useMemo(() => (!db || !user ? null : doc(db, "users", user.uid)), [db, user])
  const { data: profile, loading } = useDoc(ref)
  usePlan()
  if (loading) return <div className="flex justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  if ((profile as any)?.role !== "admin") {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <h1 className="text-2xl font-extrabold">Mind Maps are coming soon</h1>
        <p className="mt-2 text-sm text-muted-foreground">We are improving them. In the meantime, use Rapid Revision Notes and Flashcards.</p>
        <Link href="/notes" className="mt-6 inline-block rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground">Open notes</Link>
      </div>
    )
  }
  return <>{children}</>
}
