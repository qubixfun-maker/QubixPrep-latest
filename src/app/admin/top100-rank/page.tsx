"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useUser, useFirestore, useDoc } from "@/firebase"
import { collection, doc, getDocs, writeBatch } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ChevronDown, Loader2, Save, Wand2 } from "lucide-react"
import { type NotesLink } from "@/lib/top100-link"
import { BANK_LOADERS, bankKeyFor, fromBank, rankTopics, TYPE_WEIGHT, type ExamQ, type Gap, type NoteTopicIn, type Ranked } from "@/lib/top100-rank"

/**
 * Builds a subject's Top 100 from the University Exams question bank (long essays, short essays, short answers):
 * every topic of Rapid Revision Notes is scored by how many exam questions are about it, and the best ones become the list.
 * Each saved topic opens its own notes page.
 */

const WEIGHT: Record<string, number> = { "long-essays": 3, "short-essays": 2, "short-answers": 1 }
const flat = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "")
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
function qaTexts(html: string): string[] {
  const box = document.createElement("div")
  box.innerHTML = html
  return Array.from(box.querySelectorAll(".qa-question")).map((el) => (el.textContent || "").replace(/\s+/g, " ").trim()).filter(Boolean)
}

export default function Top100RankPage() {
  const { user } = useUser()
  const db = useFirestore()
  const profileRef = useMemo(() => (!db || !user ? null : doc(db, "users", user.uid)), [db, user])
  const { data: profile, loading } = useDoc(profileRef)
  const isAdmin = (profile as any)?.role === "admin"

  const [subjects, setSubjects] = useState<{ id: string; name: string }[]>([])
  const [subjectId, setSubjectId] = useState("")
  const [limit, setLimit] = useState(100)
  const [busy, setBusy] = useState("")
  const [msg, setMsg] = useState("")
  const [ranked, setRanked] = useState<Ranked[] | null>(null)
  const [gaps, setGaps] = useState<Gap[]>([])
  const [useBank, setUseBank] = useState(true)
  const [qCount, setQCount] = useState(0)
  const [off, setOff] = useState<Set<string>>(new Set())
  const [open, setOpen] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!db || !isAdmin) return
    getDocs(collection(db, "subjects")).then((s) => {
      const l = s.docs.map((d) => ({ id: d.id, name: String((d.data() as any).name || d.id) })).sort((a, b) => a.name.localeCompare(b.name))
      setSubjects(l); setSubjectId(l[0]?.id || "")
    }).catch((e) => setMsg("Could not load subjects: " + (e?.message || e)))
  }, [db, isAdmin])

  async function analyse() {
    if (!db || !subjectId) return
    setBusy("Reading the exam questions…"); setMsg(""); setRanked(null); setGaps([]); setOff(new Set()); setOpen(null)
    try {
      const subj = subjects.find((x) => x.id === subjectId)
      const bankKey = bankKeyFor(subj?.name || subjectId)
      let questions: ExamQ[] = []
      let source = ""
      if (bankKey && useBank) {
        // 1) the exam question bank files: every question with the number of times it came up in past exams
        const rows = (await BANK_LOADERS[bankKey]()).default
        questions = fromBank(rows)
        source = `exam question bank (${rows.length} questions, repeat counts included)`
      } else {
        // 1) the long answers stored in the app
        const chapters = await getDocs(collection(db, "subjects", subjectId, "essayChapters"))
        let done = 0
        for (const ch of chapters.docs) {
          const snap = await getDocs(collection(db, "subjects", subjectId, "essayChapters", ch.id, "sections"))
          snap.docs.forEach((d) => { const w = WEIGHT[d.id] || 1; qaTexts(String((d.data() as any).html || "")).forEach((t) => questions.push({ text: t, w, chapter: String((ch.data() as any).title || "") })) })
          done++
          setBusy(`Reading the exam questions… ${done}/${chapters.size} chapters`)
        }
        source = "long answers in the app"
      }
      setQCount(questions.length)

      // 2) every topic of the notes
      setBusy("Reading the notes…")
      const idx = await getDocs(collection(db, "notesIndex"))
      const topics: NoteTopicIn[] = []
      idx.docs.forEach((d) => {
        const x: any = d.data()
        if (String(x.subjectId) !== subjectId) return
        ;(Array.isArray(x.topics) ? x.topics : []).forEach((t: any, i: number) => {
          if (!t?.name) return
          topics.push({ name: String(t.name), chapterTitle: String(x.chapterTitle || ""), link: { subjectId, textbookId: String(x.textbookId), chapterId: String(x.chapterId), topicIndex: i }, depth: Number(t.depth) || 0 })
        })
      })

      // 3) score
      setBusy("Matching questions to topics…")
      const { ranked: out, gaps: g } = rankTopics(questions, topics)
      setRanked(out); setGaps(g)
      setMsg(questions.length === 0 ? "No exam questions were found for this subject." : topics.length === 0 ? "This subject has no notes topics yet." : `${questions.length} questions read from the ${source}. ${out.length} of your notes topics are asked about.`)
    } catch (e: any) { setMsg("Failed: " + (e?.message || e)) }
    setBusy("")
  }

  const chosen = useMemo(() => (ranked || []).filter((r) => !off.has(r.key)).slice(0, limit), [ranked, off, limit])

  // writes one subject's list to top100Pages, replacing what was there
  async function writeList(subj: { id: string; name: string }, items: { name: string; link: NotesLink; questions?: number }[]) {
    if (!db) return
    const existing = await getDocs(collection(db, "top100Pages"))
    const mine = existing.docs.filter((d) => { const x: any = d.data(); return flat(String(x.subjectKey || "")) === flat(subj.id) || flat(String(x.subjectKey || "")) === flat(subj.name) || flat(String(x.subject || "")) === flat(subj.name) })
    const first: any = mine[0]?.data()
    const subjectKey = first?.subjectKey || slug(subj.name)
    const subjectLabel = first?.subject || subj.name
    const ids = new Set(items.map((_, i) => `${subjectKey}-${String(i + 1).padStart(2, "0")}`))
    let batch = writeBatch(db); let n = 0
    const flush = async () => { await batch.commit(); batch = writeBatch(db); n = 0 }
    const now = Date.now()
    for (let i = 0; i < items.length; i++) {
      const r = items[i]
      batch.set(doc(db, "top100Pages", `${subjectKey}-${String(i + 1).padStart(2, "0")}`), { subject: subjectLabel, subjectKey, order: i + 1, title: r.name, updatedAt: now, notesLink: r.link, source: "exam-question-bank", questionCount: r.questions ?? 0 })
      if (++n >= 400) await flush()
    }
    for (const d of mine) { if (!ids.has(d.id)) { batch.delete(doc(db, "top100Pages", d.id)); if (++n >= 400) await flush() } }
    if (n) await flush()
  }

  async function save() {
    if (!db || !ranked || !chosen.length) return
    const subj = subjects.find((s) => s.id === subjectId)!
    if (!confirm(`Replace the Top list for ${subj.name} with these ${chosen.length} topics? Each opens its Rapid Revision Notes page.`)) return
    setSaving(true); setMsg("")
    try {
      await writeList(subj, chosen.map((r) => ({ name: r.name, link: r.link, questions: r.questions })))
      setMsg(`Saved. ${subj.name} now has ${chosen.length} topics, each opening its notes page. Students may need to reopen the app to see it.`)
    } catch (e: any) { setMsg("Save failed: " + (e?.message || e)) }
    setSaving(false)
  }

  // a file with every notes topic, to hand to Claude for matching
  async function exportNotes() {
    if (!db) return
    setBusy("Collecting your notes topics…"); setMsg("")
    try {
      const idx = await getDocs(collection(db, "notesIndex"))
      const bySubject = new Map<string, any[]>()
      idx.docs.forEach((d) => {
        const x: any = d.data()
        const list = bySubject.get(String(x.subjectId)) || []
        list.push({ ch: String(x.chapterId), tb: String(x.textbookId), title: String(x.chapterTitle || ""), topics: (Array.isArray(x.topics) ? x.topics : []).map((t: any) => String(t?.name || "")) })
        bySubject.set(String(x.subjectId), list)
      })
      const out = { exportedAt: new Date().toISOString(), subjects: subjects.map((s) => ({ id: s.id, name: s.name, chapters: bySubject.get(s.id) || [] })) }
      const blob = new Blob([JSON.stringify(out)], { type: "application/json" })
      const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "notes-topics.json"; a.click()
      setMsg(`Downloaded notes-topics.json (${idx.size} chapters). Send that file to Claude.`)
    } catch (e: any) { setMsg("Export failed: " + (e?.message || e)) }
    setBusy("")
  }

  // a ready-made list from Claude: { lists: [{ subjectId, subjectName, items: [{ name, link }] }] }
  async function importLists(file: File) {
    if (!db) return
    setSaving(true); setMsg("")
    try {
      const data = JSON.parse(await file.text())
      const lists = Array.isArray(data?.lists) ? data.lists : []
      if (!lists.length) throw new Error("No lists found in this file")
      if (!confirm(`Replace the Top list for ${lists.map((l: any) => l.subjectName).join(", ")}?`)) { setSaving(false); return }
      for (const l of lists) await writeList({ id: String(l.subjectId), name: String(l.subjectName) }, (l.items || []).map((i: any) => ({ name: String(i.name), link: i.link, questions: i.questions })))
      setMsg(`Imported ${lists.length} subject list${lists.length === 1 ? "" : "s"}. Students may need to reopen the app to see them.`)
    } catch (e: any) { setMsg("Import failed: " + (e?.message || e)) }
    setSaving(false)
  }

  if (loading) return <div className="flex items-center justify-center py-24"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
  if (!isAdmin) return <div className="mx-auto max-w-xl p-8 text-center text-sm text-red-500">Admins only.</div>

  return (
    <div className="mx-auto max-w-4xl space-y-5 p-4 md:p-8">
      <div className="flex items-center gap-3">
        <Link href="/admin"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <h1 className="text-xl font-bold">Build Top 100 from exam questions</h1>
      </div>
      <p className="text-sm text-muted-foreground">
        Finds which Rapid Revision Notes topics the exams ask about most, and ranks them. For the subjects with an exam question bank (Anatomy, Physiology, Forensic Medicine, ENT, Ophthalmology, Community Medicine, Medicine, Surgery, OBG, Paediatrics, Orthopaedics) it uses every question with the number of times it came up in past exams. Other subjects use the long answers in the app. Long essays count most, and a question asked four times counts four times. Only topics that exist in your notes can be picked, so each one opens its notes page. Questions that no note covers are listed at the bottom, so you know what to write next.
      </p>

      <div className="flex flex-wrap items-end gap-3 rounded-2xl border bg-white p-4">
        <label className="text-xs font-bold">Subject
          <select value={subjectId} onChange={(e) => { setSubjectId(e.target.value); setRanked(null) }} className="mt-1 block rounded-lg border px-3 py-2 text-sm font-medium">
            {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </label>
        <label className="text-xs font-bold">How many topics
          <input type="number" min={10} max={200} value={limit} onChange={(e) => setLimit(Math.max(10, Math.min(200, Number(e.target.value) || 100)))} className="mt-1 block w-24 rounded-lg border px-3 py-2 text-sm font-medium" />
        </label>
        {bankKeyFor(subjects.find((x) => x.id === subjectId)?.name || "") && (
          <label className="flex items-center gap-2 text-xs font-bold"><input type="checkbox" checked={useBank} onChange={(e) => setUseBank(e.target.checked)} className="h-4 w-4" /> Use the exam question bank (with repeat counts)</label>
        )}
        <Button onClick={analyse} disabled={!!busy || !subjectId} className="gap-2">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />} Analyse</Button>
        {busy && <span className="text-xs text-muted-foreground">{busy}</span>}
      </div>
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-dashed bg-white p-4">
        <p className="min-w-0 flex-1 text-xs text-muted-foreground"><b className="text-foreground">Let Claude do the matching:</b> download your notes topics, send the file to Claude, then import the finished lists it gives you.</p>
        <Button variant="outline" onClick={exportNotes} disabled={!!busy || subjects.length === 0}>Download notes topics</Button>
        <label className="inline-flex cursor-pointer items-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-slate-50">
          Import finished lists
          <input type="file" accept="application/json,.json" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) importLists(f); e.currentTarget.value = "" }} />
        </label>
      </div>
      {msg && <p className="rounded-xl bg-violet-50 px-4 py-3 text-sm font-semibold text-violet-900">{msg}</p>}

      {ranked && ranked.length > 0 && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-bold">{chosen.length} topics selected{ranked.length < limit ? ` (only ${ranked.length} topics are asked about)` : ""} · untick any you don&apos;t want, the next best moves up</p>
            <Button onClick={save} disabled={saving || !chosen.length} className="gap-2">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save as Top list</Button>
          </div>
          <ol className="space-y-2">
            {ranked.map((r) => {
              const rank = chosen.findIndex((c) => c.key === r.key)
              const on = !off.has(r.key)
              return (
                <li key={r.key} className={`rounded-2xl border bg-white ${on && rank >= 0 ? "" : "opacity-45"}`}>
                  <div className="flex items-center gap-3 p-3">
                    <input type="checkbox" checked={on} onChange={() => setOff((o) => { const n = new Set(o); on ? n.add(r.key) : n.delete(r.key); return n })} className="h-4 w-4" aria-label={`Include ${r.name}`} />
                    <span className="w-8 shrink-0 text-center text-sm font-black text-violet-700">{rank >= 0 ? rank + 1 : "–"}</span>
                    <div className="min-w-0 flex-1">
                      <p className="break-words text-sm font-bold">{r.name}</p>
                      <p className="break-words text-xs text-muted-foreground">{r.chapterTitle}</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-violet-100 px-2.5 py-1 text-[11px] font-black text-violet-800">{r.questions} Q · score {Math.round(r.score)}</span>
                    <button onClick={() => setOpen(open === r.key ? null : r.key)} aria-label="Show questions" className="shrink-0 p-1"><ChevronDown className={`h-4 w-4 transition-transform ${open === r.key ? "rotate-180" : ""}`} /></button>
                  </div>
                  {open === r.key && <ul className="space-y-1 border-t px-4 py-3 text-xs text-muted-foreground">{r.samples.map((s, i) => <li key={i}>• {s}</li>)}</ul>}
                </li>
              )
            })}
          </ol>
          {gaps.length > 0 && (
            <details className="rounded-2xl border bg-white p-4">
              <summary className="cursor-pointer text-sm font-bold">Asked often, but not in your notes ({gaps.length}) · worth writing notes for</summary>
              <ul className="mt-3 space-y-1.5 text-xs text-muted-foreground">
                {gaps.map((g, i) => <li key={i}>• <b className="text-foreground">{g.label}</b> · score {Math.round(g.score)}</li>)}
              </ul>
            </details>
          )}
        </>
      )}
    </div>
  )
}
