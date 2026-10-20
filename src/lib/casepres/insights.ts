import type { CaseDef, Answers, Field } from './types'
import { INSIGHTS, type Hint, type Viva } from './insights-data'
import { INSIGHTS2 } from './insights-data2'
import { INSIGHTS3 } from './insights-data3'
const ALL = { ...INSIGHTS, ...INSIGHTS2, ...INSIGHTS3 }
import { buildDocument, buildSection, openingStatement, isFieldFilled, type ExamItem } from './format'

const arr = (v: any): string[] => (Array.isArray(v) ? v : v ? [String(v)] : []).filter(Boolean)
const clean = (s: any) => (typeof s === 'string' ? s.trim() : '')

/** Everything the student marked present / typed, lower-cased. */
function presentCorpus(c: CaseDef, ans: Answers): string[] {
  const out: string[] = []
  for (const sec of c.sections) for (const f of sec.fields) collect(f, ans, out, false)
  return out
}
/** Everything touched (present OR absent), used for the checklist. */
function touchedCorpus(c: CaseDef, ans: Answers): string[] {
  const out: string[] = []
  for (const sec of c.sections) for (const f of sec.fields) collect(f, ans, out, true)
  return out
}
function collect(f: Field, ans: Answers, out: string[], withAbsent: boolean) {
  const v = ans[f.id]
  const push = (s: any) => { const t = clean(s).toLowerCase(); if (t) out.push(t) }
  switch (f.t) {
    case 'text': case 'date': case 'area': push(v); if (withAbsent && clean(v)) push(f.label); break
    case 'choice': arr(v).forEach((x) => push(f.label + ' ' + x)); arr(v).forEach(push); break
    case 'complaints': Object.entries(v || {}).forEach(([l, d]) => { push(l); push(l + ' ' + d) }); break
    case 'findings': {
      const det = ans[f.id + '__d'] || {}
      Object.entries(v || {}).forEach(([l, st]) => {
        if (st === 'p') { push(l); push(det[l]); push(l + ' ' + (det[l] || '')) }
        else if (st === 'a' && withAbsent) push(l)
      })
      break
    }
    case 'symptom': {
      if (v?.s === 'p') {
        push(f.label)
        Object.values(v.a || {}).forEach((x) => arr(x as any).forEach((y) => push(f.label + ' ' + y)))
      } else if (v?.s === 'a' && withAbsent) push(f.label)
      break
    }
    case 'vitals': if (v && Object.values(v).some((x) => !!clean(x as string))) { push('vital signs'); Object.entries(v).forEach(([k, x]) => clean(x as string) && push(k + ' ' + x)); push(f.label) } break
  }
}

const has = (corpus: string[], needle: string) => corpus.some((c) => c.includes(needle))

export type DxHint = { dx: string; why: string; score: number }
export function diagnosisHints(c: CaseDef, ans: Answers): DxHint[] {
  const ins = ALL[c.id]
  if (!ins) return []
  const corpus = presentCorpus(c, ans)
  if (!corpus.length) return []
  const res: DxHint[] = []
  for (const h of ins.hints as Hint[]) {
    if (h.all && !h.all.every((n) => has(corpus, n))) continue
    const hits = h.any ? h.any.filter((n) => has(corpus, n)).length : 0
    const need = h.any ? (h.min ?? 1) : 0
    if (h.any && hits < need) continue
    if (!h.all && !h.any) continue
    res.push({ dx: h.dx, why: h.why, score: hits + (h.all ? h.all.length : 0) })
  }
  return res.sort((a, b) => b.score - a.score).slice(0, 3)
}

export type CheckItem = { name: string; done: boolean }
export type Checklist = { sections: { title: string; done: boolean }[]; must: CheckItem[]; percent: number }
export function examChecklist(c: CaseDef, ans: Answers): Checklist {
  const ins = ALL[c.id]
  const touched = touchedCorpus(c, ans)
  const sections = c.sections.map((s) => ({ title: s.title, done: s.fields.some((f) => isFieldFilled(f, ans)) }))
  const must = (ins?.must || []).map((m) => ({ name: m.n, done: m.m.some((n) => has(touched, n.toLowerCase())) }))
  const total = sections.length + must.length
  const done = sections.filter((s) => s.done).length + must.filter((m) => m.done).length
  return { sections, must, percent: total ? Math.round((done / total) * 100) : 0 }
}

export function vivaFor(c: CaseDef): Viva[] {
  return ALL[c.id]?.viva || []
}

export type ShortCase = { text: string; words: number; seconds: number }
export function shortCase(c: CaseDef, ans: Answers): ShortCase {
  const parts: string[] = [openingStatement(c, ans)]
  const secs = c.sections
  const hpi = secs.find((s) => s.id === 'hpi')
  if (hpi) {
    const d = buildSection(hpi, ans, c)
    const paras = d.lines.filter((l) => l.k === 'para') as { k: 'para'; text: string }[]
    if (paras.length) parts.push(paras.map((p) => p.text).join(' '))
  }
  const pos: string[] = []
  const tests: string[] = []
  for (const s of buildDocument(c, ans)) {
    if (s.id === 'hpi') continue
    for (const l of s.lines) {
      if (l.k === 'exam') {
        l.present.forEach((i: ExamItem) => pos.push(i.detail ? `${i.label.toLowerCase()} (${i.detail})` : i.label.toLowerCase()))
        l.tests.filter((t) => t.tone === 'pos').forEach((t) => tests.push(`${t.test!.name} was positive${t.meaning ? `, which means ${t.meaning.charAt(0).toLowerCase() + t.meaning.slice(1)}` : ''}`))
      }
    }
  }
  if (pos.length) parts.push(`On examination, the important findings were ${pos.slice(0, 8).join(', ')}.`)
  if (tests.length) parts.push(tests.slice(0, 4).join('. ') + '.')
  const dx = clean(ans.provDx)
  if (dx) parts.push(`My provisional diagnosis is ${dx.charAt(0).toLowerCase() + dx.slice(1)}${/[.!?]$/.test(dx) ? '' : '.'}`)
  const ddx = clean(ans.ddx)
  if (ddx) parts.push(`The differential diagnoses I would consider are ${ddx.charAt(0).toLowerCase() + ddx.slice(1)}${/[.!?]$/.test(ddx) ? '' : '.'}`)
  const text = parts.join('\n\n')
  const words = text.split(/\s+/).filter(Boolean).length
  return { text, words, seconds: Math.round((words / 130) * 60) }
}
