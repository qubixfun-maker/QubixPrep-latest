"use client"

import { useMemo, useState } from "react"
import { useCollection, useFirestore } from "@/firebase"
import { collection } from "firebase/firestore"
import { ChevronRight, Loader2, Stethoscope, Lock, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { useRequireAuth } from "@/hooks/use-require-auth"
import { usePlan } from "@/hooks/use-plan"
import { UpgradeGate } from "@/components/upgrade-gate"

const DIFFICULTY_COLOR: Record<string, string> = {
  easy: "text-green-400",
  medium: "text-yellow-400",
  hard: "text-red-400"
}

export default function OsceStationsHubPage() {
  const db = useFirestore()
  const { canAccessContent, loading: planLoading } = usePlan()
  const [search, setSearch] = useState("")

  const stationsRef = useMemo(() => (!db ? null : collection(db, 'osceStations')), [db])
  const { data: stations, loading } = useCollection(stationsRef)

  const grouped = useMemo(() => {
    const list = ((stations as any[]) || []).filter((s) =>
      !search.trim() || s.title?.toLowerCase().includes(search.toLowerCase()) || s.specialty?.toLowerCase().includes(search.toLowerCase())
    )
    const groups: Record<string, any[]> = {}
    list.forEach((s) => {
      const key = s.specialty || "General"
      if (!groups[key]) groups[key] = []
      groups[key].push(s)
    })
    Object.values(groups).forEach((g) => g.sort((a, b) => (a.title || "").localeCompare(b.title || "")))
    return Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0]))
  }, [stations, search])

  const { checkingAuth } = useRequireAuth()
  if (checkingAuth || planLoading) return <div className="h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 text-primary animate-spin" /></div>

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-12 space-y-8 animate-in slide-in-from-bottom-4 duration-700">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">OSCE Stations</h1>
        <p className="text-muted-foreground text-lg">Timed clinical stations. Take a history, request exam and investigations, then answer the examiner out loud.</p>
      </div>

      <div className="relative w-full md:w-80">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search stations..." className="pl-10 rounded-xl glass border-white/10" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <Loader2 className="h-10 w-10 text-primary animate-spin" />
        </div>
      ) : grouped.length > 0 ? (
        <div className="space-y-6">
          {grouped.map(([specialty, list]) => (
            <div key={specialty} className="space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-1">{specialty}</h2>
              <div className="rounded-2xl glass border-none divide-y divide-white/5 overflow-hidden">
                {list.map((s: any) => {
                  const isLocked = !canAccessContent
                  const content = (
                    <div className={`flex items-center gap-4 px-6 py-4 transition-colors group ${isLocked ? 'opacity-50' : 'hover:bg-white/5'}`}>
                      <div className={`p-2 rounded-lg shrink-0 ${isLocked ? 'bg-white/5 text-muted-foreground' : 'bg-accent/10 text-accent'}`}>
                        {isLocked ? <Lock className="h-4 w-4" /> : <Stethoscope className="h-4 w-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium text-sm transition-colors ${isLocked ? '' : 'group-hover:text-accent'}`}>{s.title}</p>
                        <p className={`text-[10px] uppercase font-bold tracking-widest ${DIFFICULTY_COLOR[s.difficulty] || 'text-muted-foreground'}`}>{s.difficulty}</p>
                      </div>
                      {!isLocked && <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-accent transition-colors shrink-0" />}
                    </div>
                  )
                  return isLocked ? (
                    <Link key={s.id} href="/pricing">{content}</Link>
                  ) : (
                    <Link key={s.id} href={`/osce-stations/${s.id}`}>{content}</Link>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-20 text-center text-muted-foreground">No stations yet.</div>
      )}

      {!canAccessContent && (
        <UpgradeGate type="content" />
      )}
    </div>
  )
}
