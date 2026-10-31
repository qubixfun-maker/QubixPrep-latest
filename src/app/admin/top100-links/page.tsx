"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useUser, useFirestore, useDoc } from "@/firebase"
import { collection, deleteField, doc, getDocs, writeBatch } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Loader2, Save, Search } from "lucide-react"
import { candidatesFor, isConfident, readNotesLink, type Candidate, type NoteTopicRef } from "@/lib/top100-link"

type Row = { id: string; subject: string; subjectKey: string; order: number; title: string; saved: string | null }

const keyOf = (t: { subjectId: string; textbookId: string; chapterId: string; topicIndex: number }) => `${t.subjectId}|${t.textbookId}|${t.chapterId}|${t.topicIndex}`
const flat = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "")

export default function Top100LinksPage() {
  const { user } = useUser()
  const db = useFirestore()
  const profileRef = useMemo(() => (!db || !user ? null : doc(db, "users", user.uid)), [db, user])
  const { data: profile, loading } = useDoc(profileRef)
  const isAdmin = (profile as any)?.role === "admin"

  const [rows, setRows] = useState<Row[] | null>(null)
  const [subjects, setSubjects] = useState<{ id: string; name: string }[]>([])
  const [index, setIndex] = useState<NoteTopicRef[]>([])
  const [active, setActive] = useState("")
  const [subjectMap, setSubjectMap] = useState<Record<string, string>>({}) // top 100 subjectKey -> notes subjectId
  const [choice, setChoice] = useState<Record<string, string | null>>({})
  const [searchRow, setSearchRow] = useState<string | null>(null)
  const [q, setQ] = useState("")
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState("")

  useEffect(() => {
    if (!db || !isAdmin) return
    let on = true
    ;(async () => {
      const [pg, idx, subs] = await Promise.all([getDocs(collection(db, "top100Pages")), getDocs(collection(db, "notesIndex")), getDocs(collection(db, "subjects"))])
      if (!on) return
      const r: Row[] = pg.docs.map((d) => {
        const x: any = d.data()
        const l = readNotesLink(x)
        return { id: d.id, subject: x.subject || "", subjectKey: x.subjectKey || "", order: Number(x.order) || 0, title: x.title || d.id, saved: l ? keyOf(l) : null }
      }).sort((a, b) => a.subject.localeCompare(b.subject) || a.order - b.order)
      const pool: NoteTopicRef[] = []
      idx.forEach((d) => {
        const x: any = d.data()
        ;(Array.isArray(x.topics) ? x.topics : []).forEach((t: any, i: number) => {
          if (t?.name) pool.push({ subjectId: String(x.subjectId), textbookId: String(x.textbookId), chapterId: String(x.chapterId), topicIndex: i, name: String(t.name), chapterTitle: String(x.chapterTitle || "") })
        })
      })
      const sl = subs.docs.map((s) => ({ id: s.id, name: String((s.data() as any).name || s.id) }))
      // match each Top 100 subject to a notes subject by id or name ("community-medicine" ~ "Community Medicine")
      const map: Record<string, string> = {}
      Array.from(new Set(r.map((x) => x.subjectKey))).forEach((k) => {
        const name = r.find((x) => x.subjectKey === k)?.subject || ""
        const hit = sl.find((s) => flat(s.id) === flat(k) || flat(s.name) === flat(k) || flat(s.name) === flat(name))
        if (hit) map[k] = hit.id
      })
      setRows(r); setIndex(pool); setSubjects(sl); setSubjectMap(map)
      setActive(r[0]?.subjectKey || "")
    })().catch((e) => setMsg("Could not load: " + (e?.message || e)))
    return () => { on = false }
  }, [db, isAdmin])

  const poolOf = (subjectKey: string) => { const sid = subjectMap[subjectKey]; return sid ? index.filter((t) => t.subjectId === sid) : [] }
  const byKey = useMemo(() => { const m = new Map<string, NoteTopicRef>(); index.forEach((t) => m.set(keyOf(t), t)); return m }, [index])

  // best guesses for every topic of the open subject; saved links win, then confident matches are pre-selected
  const guesses = useMemo(() => {
    const out: Record<string, Candidate[]> = {}
    if (!rows) return out
    const pool = poolOf(active)
    rows.filter((r) => r.subjectKey === active).forEach((r) => { out[r.id] = candidatesFor(r.title, pool) })
    return out
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, active, index, subjectMap])

  useEffect(() => {
    if (!rows) return
    setChoice((prev) => {
      const next = { ...prev }
      rows.filter((r) => r.subjectKey === active).forEach((r) => {
        if (r.id in next) return
        const c = guesses[r.id] || []
        next[r.id] = r.saved ?? (isConfident(c) ? keyOf(c[0]) : null)
      })
      return next
    })
  }, [rows, active, guesses])

  if (loading || (isAdmin && rows === null && !msg)) return <div className="flex items-center justify-center py-24"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
  if (!isAdmin) return <div className="mx-auto max-w-xl p-8 text-center text-sm text-red-500">Admins only.</div>

  const subjectKeys = Array.from(new Set((rows || []).map((r) => r.subjectKey)))
  const shown = (rows || []).filter((r) => r.subjectKey === active)
  const changed = (rows || []).filter((r) => r.id in choice && (choice[r.id] ?? null) !== r.saved)
  const linkedNow = shown.filter((r) => choice[r.id]).length

  const status = (r: Row) => {
    const c = choice[r.id] ?? null
    if (!c) return { t: (guesses[r.id] || []).length ? "Check" : "No match", cls: "bg-amber-100 text-amber-800" }
    if (c === r.saved) return { t: "Linked", cls: "bg-emerald-100 text-emerald-800" }
    return { t: "Not saved", cls: "bg-violet-100 text-violet-800" }
  }

  async function save() {
    if (!db || !rows || changed.length === 0) return
    setSaving(true); setMsg("")
    try {
      for (let i = 0; i < changed.length; i += 400) {
        const batch = writeBatch(db)
        changed.slice(i, i + 400).forEach((r) => {
          const t = choice[r.id] ? byKey.get(choice[r.id] as string) : null
          // updatedAt is left alone on purpose: it is the version of the sheet image kept on students' devices
          batch.update(doc(db, "top100Pages", r.id), { notesLink: t ? { subjectId: t.subjectId, textbookId: t.textbookId, chapterId: t.chapterId, topicIndex: t.topicIndex } : deleteField() })
        })
        await batch.commit()
      }
      setRows(rows.map((r) => (r.id in choice ? { ...r, saved: choice[r.id] ?? null } : r)))
      setMsg(`Saved ${changed.length} topic${changed.length === 1 ? "" : "s"}. Students may need to reopen the app to see the change.`)
    } catch (e: any) { setMsg("Save failed: " + (e?.message || e)) }
    setSaving(false)
  }

  const results = (() => {
    const pool = poolOf(active)
    const words = q.toLowerCase().split(/\s+/).filter(Boolean)
    if (!words.length) return []
    return pool.filter((t) => words.every((w) => (t.name + " " + t.chapterTitle).toLowerCase().includes(w))).slice(0, 8)
  })()

  return (
    <div className="mx-auto max-w-4xl space-y-5 p-4 md:p-8">
      <div className="flex items-center gap-3">
        <Link href="/admin"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <h1 className="text-xl font-bold">Link Top 100 to notes</h1>
      </div>
      <p className="text-sm text-muted-foreground">
        Each Top 100 topic opens its own page in Rapid Revision Notes. Clear matches are picked for you; check the amber ones and press <b>Save</b>. A topic with no link keeps opening its revision sheet.
      </p>

      {rows && rows.length === 0 && <p className="rounded-xl border p-4 text-sm">No Top 100 topics found. Upload the subject zips first.</p>}

      <div className="flex flex-wrap gap-2">
        {subjectKeys.map((k) => {
          const rs = (rows || []).filter((r) => r.subjectKey === k)
          const done = rs.filter((r) => (r.id in choice ? choice[r.id] : r.saved)).length
          return (
            <button key={k} onClick={() => { setActive(k); setSearchRow(null) }}
              className={`rounded-full px-3.5 py-1.5 text-xs font-extrabold ${k === active ? "bg-primary text-white" : "border bg-white text-muted-foreground"}`}>
              {rs[0]?.subject || k} <span className="opacity-70">{done}/{rs.length}</span>
            </button>
          )
        })}
      </div>

      {active && !subjectMap[active] && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm">
          I could not tell which Notes subject matches <b>{shown[0]?.subject || active}</b>. Pick it:
          <select className="ml-2 rounded-md border px-2 py-1" value="" onChange={(e) => { if (e.target.value) { setSubjectMap((m) => ({ ...m, [active]: e.target.value })); setChoice((c) => { const n = { ...c }; shown.forEach((r) => { delete n[r.id] }); return n }) } }}>
            <option value="">Choose a subject…</option>
            {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      )}

      <div className="flex items-center justify-between gap-3 rounded-xl bg-secondary px-4 py-3 text-sm">
        <span><b>{linkedNow}</b> of {shown.length} topics linked in this subject{changed.length > 0 && <> · <b className="text-violet-700">{changed.length} unsaved</b></>}</span>
        <Button onClick={save} disabled={saving || changed.length === 0} className="gap-2 font-bold">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save {changed.length || ""}
        </Button>
      </div>
      {msg && <p className="text-sm font-semibold">{msg}</p>}

      <div className="space-y-2">
        {shown.map((r) => {
          const c = guesses[r.id] || []
          const sel = choice[r.id] ?? null
          const st = status(r)
          const selected = sel ? byKey.get(sel) : null
          return (
            <div key={r.id} className="rounded-2xl border bg-white p-3">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 w-7 shrink-0 text-xs font-bold text-muted-foreground">{String(r.order).padStart(2, "0")}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <b className="text-sm">{r.title}</b>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${st.cls}`}>{st.t}</span>
                  </div>
                  <select value={sel ?? ""} onChange={(e) => setChoice((m) => ({ ...m, [r.id]: e.target.value || null }))}
                    className="mt-2 w-full rounded-lg border bg-white px-2 py-1.5 text-sm">
                    <option value="">Not linked (opens the revision sheet)</option>
                    {selected && !c.some((x) => keyOf(x) === sel) && <option value={sel as string}>{selected.name} · {selected.chapterTitle}</option>}
                    {c.map((x) => <option key={keyOf(x)} value={keyOf(x)}>{x.name} · {x.chapterTitle} ({Math.round(x.score * 100)}%)</option>)}
                  </select>
                  <button onClick={() => { setSearchRow(searchRow === r.id ? null : r.id); setQ("") }} className="mt-1.5 inline-flex items-center gap-1 text-xs font-bold text-primary">
                    <Search className="h-3 w-3" /> Find another topic
                  </button>
                  {searchRow === r.id && (
                    <div className="mt-2 rounded-lg border bg-secondary/50 p-2">
                      <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Type part of the topic or chapter name…" className="w-full rounded-md border bg-white px-2 py-1.5 text-sm" />
                      <div className="mt-1.5 space-y-1">
                        {q && results.length === 0 && <p className="text-xs text-muted-foreground">Nothing found in this subject.</p>}
                        {results.map((t) => (
                          <button key={keyOf(t)} onClick={() => { setChoice((m) => ({ ...m, [r.id]: keyOf(t) })); setSearchRow(null) }}
                            className="block w-full rounded-md bg-white px-2 py-1.5 text-left text-xs hover:bg-violet-50">
                            <b>{t.name}</b> <span className="text-muted-foreground">· {t.chapterTitle}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
