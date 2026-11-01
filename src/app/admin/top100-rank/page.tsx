"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useUser, useFirestore, useDoc } from "@/firebase"
import { collection, doc, getDocs, writeBatch } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ChevronDown, Loader2, Save, Wand2 } from "lucide-react"
import { tokens, type NotesLink } from "@/lib/top100-link"

/**
 * Builds a subject's Top 100 from the University Exams question bank (long essays, short essays, short answers):
 * every topic of Rapid Revision Notes is scored by how many exam questions are about it, and the best ones become the list.
 * Each saved topic opens its own notes page.
 */

type Ranked = { key: string; name: string; chapterTitle: string; link: NotesLink; score: number; questions: number; repeats: number; samples: string[] }

const WEIGHT: Record<string, number> = { "long-essays": 3, "short-essays": 2, "short-answers": 1 }
const flat = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "")
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
// words that open an exam question but say nothing about the topic
const FILLER = new Set(["describe", "discuss", "explain", "write", "note", "notes", "short", "briefly", "enumerate", "classify", "define", "mention", "list", "outline", "give", "what", "how", "why", "mcq", "marks", "etc", "example", "examples", "management", "treatment", "causes", "features", "clinical", "diagnosis"])

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
    setBusy("Reading the exam questions…"); setMsg(""); setRanked(null); setOff(new Set()); setOpen(null)
    try {
      // 1) every exam question of this subject
      const chapters = await getDocs(collection(db, "subjects", subjectId, "essayChapters"))
      const all: { text: string; w: number }[] = []
      let done = 0
      for (const ch of chapters.docs) {
        const snap = await getDocs(collection(db, "subjects", subjectId, "essayChapters", ch.id, "sections"))
        snap.docs.forEach((d) => { const w = WEIGHT[d.id] || 1; qaTexts(String((d.data() as any).html || "")).forEach((t) => all.push({ text: t, w })) })
        done++
        setBusy(`Reading the exam questions… ${done}/${chapters.size} chapters`)
      }
      setQCount(all.length)

      // 2) every topic of the notes
      setBusy("Reading the notes…")
      const idx = await getDocs(collection(db, "notesIndex"))
      type T = { name: string; chapterTitle: string; link: NotesLink; tk: string[]; depth: number }
      const topics: T[] = []
      idx.docs.forEach((d) => {
        const x: any = d.data()
        if (String(x.subjectId) !== subjectId) return
        ;(Array.isArray(x.topics) ? x.topics : []).forEach((t: any, i: number) => {
          if (!t?.name) return
          const tk = tokens(String(t.name)).filter((w) => !FILLER.has(w))
          if (!tk.length) return
          topics.push({ name: String(t.name), chapterTitle: String(x.chapterTitle || ""), link: { subjectId, textbookId: String(x.textbookId), chapterId: String(x.chapterId), topicIndex: i }, tk, depth: Number(t.depth) || 0 })
        })
      })
      // names that recur in many chapters ("Classification", "Clinical features") are headings, not topics
      const seen = new Map<string, Set<string>>()
      topics.forEach((t) => { const k = t.tk.join(" "); (seen.get(k) || seen.set(k, new Set()).get(k)!).add(t.link.chapterId) })
      const usable = topics.filter((t) => (seen.get(t.tk.join(" "))?.size || 0) < 3 && (t.tk.length >= 2 || t.tk[0].length >= 6))

      // 3) score
      setBusy("Matching questions to topics…")
      const score = new Map<string, Ranked>()
      const seenQ = new Map<string, number>()
      all.forEach((q) => { const n = tokens(q.text).join(" "); seenQ.set(n, (seenQ.get(n) || 0) + 1) })
      all.forEach((q) => {
        const qs = new Set(tokens(q.text))
        const hits = usable.filter((t) => t.tk.filter((w) => qs.has(w)).length / t.tk.length >= 0.85)
        if (!hits.length) return
        // the most specific topic wins ("bioavailability and bioequivalence" beats "bioavailability")
        const best = Math.max(...hits.map((h) => h.tk.length))
        const picked = hits.filter((h) => h.tk.length === best).slice(0, 2)
        const repeat = (seenQ.get(tokens(q.text).join(" ")) || 1) > 1
        picked.forEach((t) => {
          const key = `${t.link.chapterId}|${t.link.topicIndex}`
          const r = score.get(key) || { key, name: t.name, chapterTitle: t.chapterTitle, link: t.link, score: 0, questions: 0, repeats: 0, samples: [] }
          r.score += q.w + (repeat ? 1 : 0); r.questions++; if (repeat) r.repeats++
          if (r.samples.length < 4) r.samples.push(q.text)
          score.set(key, r)
        })
      })
      // one entry per topic name (a topic can sit in two chapters); keep the better scoring one
      const byName = new Map<string, Ranked>()
      Array.from(score.values()).forEach((r) => { const k = flat(r.name); const o = byName.get(k); if (!o || r.score > o.score) byName.set(k, r) })
      const out = Array.from(byName.values()).sort((a, b) => b.score - a.score || b.questions - a.questions)
      setRanked(out)
      setMsg(all.length === 0 ? "No exam questions were found for this subject." : `${all.length} exam questions read. ${out.length} notes topics are asked about.`)
    } catch (e: any) { setMsg("Failed: " + (e?.message || e)) }
    setBusy("")
  }

  const chosen = useMemo(() => (ranked || []).filter((r) => !off.has(r.key)).slice(0, limit), [ranked, off, limit])

  async function save() {
    if (!db || !ranked || !chosen.length) return
    const subj = subjects.find((s) => s.id === subjectId)!
    if (!confirm(`Replace the Top list for ${subj.name} with these ${chosen.length} topics? Each opens its Rapid Revision Notes page.`)) return
    setSaving(true); setMsg("")
    try {
      const existing = await getDocs(collection(db, "top100Pages"))
      const mine = existing.docs.filter((d) => { const x: any = d.data(); return flat(String(x.subjectKey || "")) === flat(subj.id) || flat(String(x.subjectKey || "")) === flat(subj.name) || flat(String(x.subject || "")) === flat(subj.name) })
      const first: any = mine[0]?.data()
      const subjectKey = first?.subjectKey || slug(subj.name)
      const subjectLabel = first?.subject || subj.name
      const ids = new Set(chosen.map((_, i) => `${subjectKey}-${String(i + 1).padStart(2, "0")}`))
      let batch = writeBatch(db); let n = 0
      const flush = async () => { await batch.commit(); batch = writeBatch(db); n = 0 }
      const now = Date.now()
      for (let i = 0; i < chosen.length; i++) {
        const r = chosen[i]
        batch.set(doc(db, "top100Pages", `${subjectKey}-${String(i + 1).padStart(2, "0")}`), { subject: subjectLabel, subjectKey, order: i + 1, title: r.name, updatedAt: now, notesLink: r.link, source: "university-exams", questionCount: r.questions })
        if (++n >= 400) await flush()
      }
      for (const d of mine) { if (!ids.has(d.id)) { batch.delete(doc(db, "top100Pages", d.id)); if (++n >= 400) await flush() } }
      if (n) await flush()
      setMsg(`Saved. ${subjectLabel} now has ${chosen.length} topics, each opening its notes page. Students may need to reopen the app to see it.`)
    } catch (e: any) { setMsg("Save failed: " + (e?.message || e)) }
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
        Reads every long essay, short essay and short answer of a subject, finds which Rapid Revision Notes topics they are about, and ranks the topics by how often they are asked. Long essays count most; a question that appears more than once counts extra. Only topics that exist in the notes can be picked, so each one opens its notes page.
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
        <Button onClick={analyse} disabled={!!busy || !subjectId} className="gap-2">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />} Analyse</Button>
        {busy && <span className="text-xs text-muted-foreground">{busy}</span>}
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
                    <span className="shrink-0 rounded-full bg-violet-100 px-2.5 py-1 text-[11px] font-black text-violet-800">{r.questions} Q{r.repeats ? ` · ${r.repeats} repeated` : ""}</span>
                    <button onClick={() => setOpen(open === r.key ? null : r.key)} aria-label="Show questions" className="shrink-0 p-1"><ChevronDown className={`h-4 w-4 transition-transform ${open === r.key ? "rotate-180" : ""}`} /></button>
                  </div>
                  {open === r.key && <ul className="space-y-1 border-t px-4 py-3 text-xs text-muted-foreground">{r.samples.map((s, i) => <li key={i}>• {s}</li>)}</ul>}
                </li>
              )
            })}
          </ol>
        </>
      )}
    </div>
  )
}
