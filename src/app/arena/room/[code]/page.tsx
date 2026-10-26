"use client"

import { use, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { doc } from "firebase/firestore"
import { ChevronLeft, Loader2 } from "lucide-react"
import { useDoc, useFirestore, useUser } from "@/firebase"
import { arena } from "@/lib/arena-client"
import { SCENE_CSS } from "@/components/cases/ward-scenes"
import { ArenaDuel } from "@/components/arena/ArenaDuel"
import { ArenaCoop } from "@/components/arena/ArenaCoop"

export default function ArenaRoomPage({ params }: { params: Promise<{ code: string }> }) {
  const { code: raw } = use(params)
  const code = raw.toUpperCase()
  const router = useRouter()
  const db = useFirestore()
  const { user, loading: authLoading } = useUser()
  const roomRef = useMemo(() => (!db ? null : doc(db, "rooms", code)), [db, code])
  const { data: room, loading } = useDoc(roomRef)
  const [joinErr, setJoinErr] = useState("")
  const joining = useRef(false)

  useEffect(() => { if (!authLoading && !user) router.replace(`/login?next=/arena/room/${code}`) }, [authLoading, user, router, code])

  const r = room as any
  const inRoom = !!(r && user && r.players?.[user.uid])
  useEffect(() => {
    if (!user || !r || inRoom || joining.current) return
    joining.current = true
    arena(user, "join", { code }).catch((e) => setJoinErr(e.message))
  }, [user, r, inRoom, code])

  if (authLoading || loading || !user) return <div className="flex h-screen items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
  if (!r) return <Shell><div className="rounded-3xl border border-dashed border-black/15 bg-white p-12 text-center"><p className="text-5xl">🔍</p><p className="mt-3 text-lg font-extrabold">Room not found</p><p className="mt-1 text-sm text-muted-foreground">Check the code ({code}) or ask your friend to share the link again.</p></div></Shell>
  if (joinErr) return <Shell><div className="rounded-3xl border border-rose-200 bg-rose-50 p-8 text-center"><p className="text-lg font-extrabold text-rose-700">{joinErr}</p></div></Shell>
  if (!inRoom) return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>

  return (
    <Shell>
      {r.kind === "coop" ? <ArenaCoop room={r} user={user} code={code} /> : <ArenaDuel room={r} user={user} code={code} />}
    </Shell>
  )
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-5xl space-y-5 overflow-x-clip p-3 pb-28 md:p-8 md:pb-8">
      <style>{SCENE_CSS}</style>
      <Link href="/arena" className="flex w-fit items-center gap-1 text-xs font-bold uppercase tracking-widest text-primary hover:underline"><ChevronLeft className="h-3 w-3" /> Back to Arena</Link>
      {children}
    </div>
  )
}
