"use client"
import { useTopSearch } from "@/components/layout/top-search"

import Link from "next/link"
import { useState } from "react"
import { ChevronRight, FileText, Loader2, Trash2, Stethoscope, Lock } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useFirestore } from "@/firebase"
import { SUBJECTS, ALL_CASES, getCase, casesFor } from "@/lib/casepres"
import { useCaseAccess, useMyCaseSheets, deleteCaseSheet } from "@/hooks/use-case-sheets"

export default function CasePresentationHub() {
  const { user, allowed, loading } = useCaseAccess()
  const { sheets, loading: sheetsLoading } = useMyCaseSheets()
  const db = useFirestore()
  const [open, setOpen] = useState<string | null>("medicine")
  const [search] = useTopSearch("Search cases…")
  const q = search.trim().toLowerCase()

  if (loading) return <div className="flex justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>

  const remove = async (id: string) => {
    if (!db || !user) return
    if (!window.confirm("Delete this saved case?")) return
    await deleteCaseSheet(db, user.uid, id)
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Case <span className="text-accent">Presentation</span></h1>
        <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
          Pick a subject and case type. The proforma questions are already there: tap the options that apply, type anything extra, then press <b>Present case</b> for a professional write-up you can print or present.
        </p>
        {!allowed && (
          <div className="mt-4 rounded-2xl border border-accent/30 bg-accent/10 p-4 flex items-center gap-3 flex-wrap">
            <Lock className="h-5 w-5 text-accent" />
            <div className="text-sm flex-1 min-w-[200px]">Case Presentation is available to subscribers. Scholar is ₹999/year.</div>
            <Link href="/pricing"><Button size="sm">View plans</Button></Link>
          </div>
        )}
      </div>

      {user && allowed && (
        <section className="space-y-3">
          <h2 className="text-lg font-bold">My saved cases</h2>
          {sheetsLoading ? <Loader2 className="h-5 w-5 animate-spin text-primary" /> : sheets.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing saved yet. Start a case below: it saves automatically.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {sheets.map((s) => {
                const c = getCase(s.caseType)
                return (
                  <div key={s.id} className="glass rounded-2xl border border-white/10 p-4 flex items-center gap-3">
                    <Link href={`/case-presentation/${s.caseType}/${s.id}`} className="flex-1 min-w-0">
                      <div className="font-semibold truncate">{s.title || "Untitled case"}</div>
                      <div className="text-xs text-muted-foreground truncate">{c?.title ?? s.caseType}{s.updatedAt?.toDate ? ` · ${s.updatedAt.toDate().toLocaleDateString()}` : ""}</div>
                    </Link>
                    <button onClick={() => remove(s.id)} className="p-2 text-muted-foreground hover:text-destructive" aria-label="Delete"><Trash2 className="h-4 w-4" /></button>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-lg font-bold">Start a new case</h2>
        <div className="space-y-3">
          {SUBJECTS.map((s) => {
            const cases = casesFor(s.id).filter((c) => !q || `${c.title} ${c.blurb}`.toLowerCase().includes(q))
            if (q && cases.length === 0) return null
            const isOpen = !!q || open === s.id
            return (
              <div key={s.id} className="glass rounded-3xl border border-white/10 overflow-hidden">
                <button onClick={() => setOpen(isOpen ? null : s.id)} className="w-full flex items-center gap-3 p-5 text-left">
                  <div className="p-3 rounded-2xl bg-primary/10 text-primary"><Stethoscope className="h-5 w-5" /></div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold">{s.name}</div>
                    <div className="text-xs text-muted-foreground">{s.blurb}</div>
                  </div>
                  <Badge variant="outline">{cases.length} cases</Badge>
                  <ChevronRight className={`h-5 w-5 text-muted-foreground transition-transform ${isOpen ? "rotate-90" : ""}`} />
                </button>
                {isOpen && (
                  <div className="grid gap-2 sm:grid-cols-2 p-4 pt-0">
                    {cases.map((c) => (
                      <Link key={c.id} href={`/case-presentation/${c.id}/new`} className="rounded-2xl border border-white/10 p-4 hover:border-primary/50 transition-colors flex items-start gap-3">
                        <FileText className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                        <div className="min-w-0">
                          <div className="font-semibold leading-tight">{c.title}</div>
                          <div className="text-xs text-muted-foreground mt-1">{c.blurb}</div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
        <p className="text-xs text-muted-foreground">{ALL_CASES.length} case types across {SUBJECTS.length} subjects.</p>
      </section>
    </div>
  )
}
