"use client"
import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { ArrowLeft, BookOpen, Bone, Bug, ChevronRight, Dna, FlaskConical, HeartPulse, Loader2, Microscope, Pill, Scale, Stethoscope, Users } from "lucide-react"
import { useUser } from "@/firebase"
import { useTopSearch } from "@/components/layout/top-search"
import { compareSubjects, getSubjectYear } from "@/lib/subject-year"

type Doc = { id: string; title: string; subject: string; subjectKey: string; chapter: number; status?: string }

// look of each big subject button (icon + colour)
const SUBJECT_STYLE: Record<string, { icon: any; grad: string }> = {
  anatomy: { icon: Bone, grad: "from-amber-500 to-orange-600" },
  physiology: { icon: HeartPulse, grad: "from-rose-500 to-red-600" },
  biochemistry: { icon: FlaskConical, grad: "from-emerald-500 to-teal-600" },
  pathology: { icon: Microscope, grad: "from-fuchsia-500 to-purple-600" },
  microbiology: { icon: Bug, grad: "from-lime-500 to-green-600" },
  pharmacology: { icon: Pill, grad: "from-sky-500 to-blue-600" },
  "community-medicine": { icon: Users, grad: "from-cyan-500 to-sky-600" },
  "forensic-medicine": { icon: Scale, grad: "from-slate-600 to-zinc-800" },
}
const FALLBACK = [{ icon: Stethoscope, grad: "from-indigo-500 to-violet-600" }, { icon: Dna, grad: "from-pink-500 to-rose-600" }]

export default function Top100Page() {
  const { user } = useUser()
  const [docs, setDocs] = useState<Doc[] | null>(null)
  const [subject, setSubject] = useState<string>("")
  const [search] = useTopSearch("Search topics…")
  const q = search.trim().toLowerCase()

  useEffect(() => {
    if (!user) return
    let on = true
    ;(async () => {
      try {
        const idToken = await user.getIdToken()
        const res = await fetch("/api/top100/list", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ idToken }) })
        const out = await res.json()
        if (on) setDocs((out.docs || []).filter((d: Doc) => d.status === "published" || d.status === undefined))
      } catch { if (on) setDocs([]) }
    })()
    return () => { on = false }
  }, [user])

  const subjects = useMemo(() => {
    const m = new Map<string, { name: string; n: number }>()
    ;(docs || []).forEach((p) => { const e = m.get(p.subjectKey); m.set(p.subjectKey, { name: p.subject, n: (e?.n || 0) + 1 }) })
    return Array.from(m.entries()).sort((a, b) => compareSubjects(a[1].name, b[1].name))
  }, [docs])

  // with only one subject uploaded, go straight to its list
  const active = subject || (subjects.length === 1 ? subjects[0][0] : "")
  const current = subjects.find(([k]) => k === active)
  const styleOf = (key: string, i: number) => SUBJECT_STYLE[key] || FALLBACK[i % FALLBACK.length]
  const shown = useMemo(() => (docs || []).filter((p) => (q ? p.title.toLowerCase().includes(q) : p.subjectKey === active)), [docs, active, q])

  const yearGroups = useMemo(() => {
    const out: { label: string; items: [string, { name: string; n: number }][] }[] = []
    subjects.forEach((e) => {
      const label = getSubjectYear(e[1].name).label
      const g = out[out.length - 1]
      if (g && g.label === label) g.items.push(e); else out.push({ label, items: [e] })
    })
    return out
  }, [subjects])

  if (docs === null) return <div className="flex justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>

  // 1) subject picker (only when more than one subject has been uploaded)
  if (!active && !q) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-3xl font-bold tracking-tight">Top 100 <span className="text-accent">Topics</span></h1>
        <p className="mt-1 text-sm text-muted-foreground">Choose a subject. Each topic is one exam-ready answer sheet.</p>
        {docs.length === 0 && <p className="py-16 text-center text-sm text-muted-foreground">Topics are being added. Please check back soon.</p>}
        <div className="mt-6 space-y-8">
          {yearGroups.map((g) => (
            <section key={g.label} className="space-y-3">
              <h2 className="flex items-center gap-3 text-sm font-black uppercase tracking-[0.2em] text-primary">{g.label}<span className="h-px flex-1 bg-border" /></h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {g.items.map(([key, s]) => {
                  const st = styleOf(key, subjects.findIndex(([k]) => k === key)); const Icon = st.icon
                  return (
                    <button key={key} onClick={() => { setSubject(key); window.scrollTo({ top: 0 }) }}
                      className={`group relative flex h-40 flex-col justify-end overflow-hidden rounded-3xl bg-gradient-to-br ${st.grad} p-5 text-left text-white shadow-md transition active:scale-[0.98] hover:shadow-xl`}>
                      <Icon className="absolute -right-4 -top-4 h-32 w-32 rotate-12 opacity-20 transition group-hover:scale-110" />
                      <Icon className="absolute right-5 top-5 h-10 w-10 opacity-90" />
                      <span className="text-2xl font-extrabold leading-tight">{s.name}</span>
                      <span className="mt-1 text-sm font-semibold opacity-90">{s.n} topics</span>
                    </button>
                  )
                })}
              </div>
            </section>
          ))}
        </div>
      </div>
    )
  }

  // 2) topic list of one subject (or search results across all subjects)
  const st = current ? styleOf(active, subjects.findIndex(([k]) => k === active)) : null
  const Icon = st?.icon
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {!q && current && st && Icon ? (
        <>
          {subjects.length > 1 && (
            <button onClick={() => setSubject("")} className="mb-3 inline-flex items-center gap-1 text-sm font-bold text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> All subjects</button>
          )}
          <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${st.grad} p-6 text-white shadow-md`}>
            <Icon className="absolute -right-4 -top-4 h-36 w-36 rotate-12 opacity-20" />
            <h1 className="text-3xl font-extrabold tracking-tight">{current[1].name}</h1>
            <p className="mt-1 text-sm font-semibold opacity-90">Top {current[1].n} topics · tap one to open</p>
          </div>
        </>
      ) : (
        <h1 className="text-2xl font-bold tracking-tight">Search results</h1>
      )}

      <div className="mt-5 space-y-3">
        {shown.map((p) => (
          <Link key={p.id} href={`/top-100/${p.id}`} className="flex items-center gap-4 rounded-3xl border border-border bg-card px-5 py-5 shadow-sm transition active:scale-[0.99] hover:border-primary/40">
            <BookOpen className="h-6 w-6 shrink-0 text-primary" />
            <span className="min-w-0 flex-1 text-lg font-medium leading-snug">
              {p.title}
              {q && <span className="block text-xs font-semibold text-muted-foreground">{p.subject}</span>}
            </span>
            {p.chapter > 0 && <span className="shrink-0 rounded-full bg-muted px-2.5 py-0.5 text-xs font-bold text-muted-foreground">Ch {p.chapter}</span>}
            <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
          </Link>
        ))}
        {shown.length === 0 && <p className="py-12 text-center text-sm text-muted-foreground">{q ? "No topic matches your search." : "No topics yet."}</p>}
      </div>
    </div>
  )
}
