import type { CaseDef, Field, Answers, SymptomAnswer } from './types'
import { resolveAttr, ATTRS } from './dsl'
import { findKb } from './clinical'

export type ExamItem = {
  label: string
  detail?: string
  meaning?: string
  test?: { name: string; how: string; why: string }
  result?: string
  tone?: 'pos' | 'neg'
  photo?: string
}

export type DocLine =
  | { k: 'kv'; label: string; value: string }
  | { k: 'exam'; label: string; present: ExamItem[]; tests: ExamItem[]; absent: string[] }
  | { k: 'para'; text: string }
  | { k: 'list'; items: string[] }
  | { k: 'present'; label: string; items: string[] }
  | { k: 'absent'; label: string; items: string[] }
  | { k: 'vitals'; items: { label: string; value: string }[] }

export type DocSection = { id: string; title: string; lines: DocLine[] }

const arr = (v: any): string[] => (Array.isArray(v) ? v : v ? [String(v)] : []).filter(Boolean)
const clean = (s: any) => (typeof s === 'string' ? s.trim() : '')
const lc = (s: string) => (s && !(s.length > 1 && s[1] === s[1].toUpperCase() && s[1] !== s[1].toLowerCase()) ? s.charAt(0).toLowerCase() + s.slice(1) : s)
const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s)

/** "3 days", "2 weeks", "More than 1 year" -> number of days (NaN if unknown). */
export function durDays(s: string): number {
  const t = (s || '').toLowerCase()
  const m = /(\d+(?:\.\d+)?)\s*(hours?|hrs?|h|days?|d|weeks?|wks?|w|months?|mos?|m|years?|yrs?|y)\b/.exec(t)
  if (!m) return NaN
  const n = parseFloat(m[1]); const u = m[2]
  let d = u.startsWith('h') ? n / 24 : u.startsWith('d') ? n : u.startsWith('w') ? n * 7 : u.startsWith('mo') || u === 'm' ? n * 30 : n * 365
  if (/more than|over|>/.test(t)) d += 1
  return d
}

/** Earliest (longest duration) first; items with unknown duration keep their order after. */
function byOnset<T>(items: T[], dur: (t: T) => string): T[] {
  const known = items.map((x, i) => ({ x, i, d: durDays(dur(x)) })).filter((e) => !isNaN(e.d))
  const rest = items.map((x, i) => ({ x, i, d: durDays(dur(x)) })).filter((e) => isNaN(e.d))
  known.sort((a, b) => b.d - a.d || a.i - b.i)
  return [...known, ...rest].map((e) => e.x)
}

function symptomText(f: Extract<Field, { t: 'symptom' }>, a: SymptomAnswer): string {
  const parts: string[] = []
  for (const ref of f.attrs) {
    const def = resolveAttr(ref)
    const v = a.a?.[def.key]
    const vals = arr(v)
    if (vals.length) parts.push(`${def.label.toLowerCase()}: ${vals.join(', ')}`)
  }
  return parts.join('; ')
}

function who(c: CaseDef | undefined, ans: Answers) {
  const p = (ans.particulars || {}) as Record<string, any>
  const sex = (arr(p.sex ?? ans.sex)[0] || '').toLowerCase()
  if (c?.id === 'paed-newborn') return { Sub: 'The baby', sub: 'the baby' }
  if (c?.subject === 'obg' && !sex) return { Sub: 'She', sub: 'she' }
  if (sex.startsWith('m')) return { Sub: 'He', sub: 'he' }
  if (sex.startsWith('f')) return { Sub: 'She', sub: 'she' }
  return { Sub: 'The patient', sub: 'the patient' }
}

const SITE_KEYS = ['site', 'where', 'part', 'quad', 'extent', 'distribution', 'part involved', 'quadrant', 'exact site']

function attrPhrase(key: string, label: string, vals: string[]): { text?: string; site?: string } {
  const v = vals.map(lc)
  const j = joinNice(v)
  const one = v[0]
  const k = (key in ATTRS ? key : label.toLowerCase()).toLowerCase()
  if (SITE_KEYS.includes(k)) return { site: j }
  switch (k) {
    case 'duration': return {}
    case 'onset': return { text: `${one} in onset` }
    case 'progression': return { text: `${one} in course` }
    case 'severity': return { text: `${one} in severity` }
    case 'side': case 'limb': {
      if (one === 'right' || one === 'left') return { text: `involving the ${one} side` }
      if (one === 'both' || one === 'bilateral') return { text: 'involving both sides' }
      return { text: one }
    }
    case 'nature': return { text: `${one} in nature` }
    case 'radiation': return { text: one === 'none' ? 'with no radiation' : `radiating ${j}` }
    case 'aggravating': return { text: `aggravated by ${j}` }
    case 'relieving': return { text: `relieved by ${j}` }
    case 'timing': case 'timing / pattern': case 'pattern': return { text: j }
    case 'episodes': return { text: one === 'single episode' ? 'occurring as a single episode' : one }
    case 'amount': return { text: `${one} in amount` }
    case 'colour': return { text: `${j} in colour` }
    case 'discharge': case 'type': return { text: `${j} in type` }
    case 'smell': return { text: j }
    case 'trauma': return { text: j }
    case 'grade': return { text: `grade ${vals[0]}` }
    case 'associated': case 'associated symptoms': return { text: `associated with ${j}` }
    case 'symptoms': case 'features': return { text: `with ${j}` }
    case 'triggers': return { text: `triggered by ${j}` }
    case 'clots': case 'pain': case 'after attack': case 'voice': case 'movements': case 'frequency': case 'changes': return { text: j }
    case 'change': return { text: j }
    case 'to': return { text: `to ${j}` }
    default: return { text: `${label.toLowerCase()}: ${j}` }
  }
}

function symptomCore(f: Extract<Field, { t: 'symptom' }>, a: SymptomAnswer): string {
  const clauses: string[] = []
  const sites: string[] = []
  for (const ref of f.attrs) {
    const def = resolveAttr(ref)
    const vals = arr(a.a?.[def.key])
    if (!vals.length) continue
    const r = attrPhrase(def.key, def.label, vals)
    if (r.site) sites.push(r.site)
    if (r.text) clauses.push(r.text)
  }
  const label = lc(f.label) + (sites.length ? ` (${sites.join(', ')})` : '')
  return clauses.length ? `${label}, ${joinNice(clauses)}` : label
}

function agoPhrase(d: string) {
  const t = lc(d.trim())
  return /^more than/.test(t) ? `${t} back` : `about ${t} back`
}

/** The history of present illness told as a story, in chronological order. */
function hpiLines(sec: CaseDef['sections'][number], ans: Answers, c?: CaseDef): DocLine[] {
  const { Sub, sub } = who(c, ans)
  const syms = sec.fields.filter((f): f is Extract<Field, { t: 'symptom' }> => f.t === 'symptom')
  const present = syms.filter((f) => (ans[f.id] as SymptomAnswer | undefined)?.s === 'p')
  const absent = syms.filter((f) => (ans[f.id] as SymptomAnswer | undefined)?.s === 'a')
  const durOf = (f: Extract<Field, { t: 'symptom' }>) => arr((ans[f.id] as SymptomAnswer).a?.duration)[0] || ''
  const ordered = byOnset(present, durOf)
  const out: string[] = []
  let prev = ''
  ordered.forEach((f, n) => {
    const a = ans[f.id] as SymptomAnswer
    const core = symptomCore(f, a)
    const d = durOf(f)
    if (n === 0) {
      out.push(d ? `${Sub} was alright ${agoPhrase(d)}, then ${sub} noticed ${core}.` : `${Sub} gives history of ${core}.`)
    } else if (d && prev && durDays(d) === durDays(prev)) {
      out.push(`${Sub} also complains of ${core}, which started at the same time.`)
    } else if (d) {
      out.push(`${Sub} also complains of ${core}, which started ${agoPhrase(d)}.`)
    } else {
      out.push(`${Sub} also complains of ${core}.`)
    }
    if (d) prev = d
  })
  // other findings fields in the history (risk factors, also-ask lists)
  const extraKv: DocLine[] = []
  for (const f of sec.fields) {
    if (f.t === 'findings') {
      const e = Object.entries((ans[f.id] || {}) as Record<string, 'p' | 'a'>)
      const p = e.filter(([, s]) => s === 'p').map(([l]) => lc(l))
      const a = e.filter(([, s]) => s === 'a').map(([l]) => lc(l))
      if (p.length) {
        if (/^onset/i.test(f.label)) out.push(`The onset was ${joinNice(p)}.`)
        else if (/risk|predispos|precipit/i.test(f.label)) out.push(`Relevant risk factors include ${joinNice(p)}.`)
        else out.push(`${Sub} also gives history of ${joinNice(p)}.`)
      }
      if (a.length) out.push(`There is no history of ${joinNice(a)}.`)
    } else if (f.t === 'choice') {
      const v = arr(ans[f.id])
      if (v.length) out.push(/^course/i.test(f.label) ? `The course has been ${joinNice(v.map(lc))}.` : `${f.label}: ${v.join(', ')}.`)
    } else if (f.t === 'text' || f.t === 'date' || f.t === 'area') {
      if (clean(ans[f.id])) extraKv.push({ k: 'kv', label: f.label, value: clean(ans[f.id]) })
    }
  }
  if (absent.length) out.push(`There is no history of ${joinNice(absent.map((f) => lc(f.label)))}.`)
  const lines: DocLine[] = []
  if (out.length) lines.push({ k: 'para', text: out.join(' ') })
  return [...lines, ...extraKv]
}

export function isFieldFilled(f: Field, ans: Answers): boolean {
  const v = ans[f.id]
  switch (f.t) {
    case 'text': case 'date': case 'area': return !!clean(v)
    case 'choice': return arr(v).length > 0
    case 'findings': return !!v && Object.keys(v).length > 0
    case 'complaints': return !!v && Object.keys(v).length > 0
    case 'symptom': return !!v && !!v.s
    case 'vitals': return !!v && Object.values(v).some((x) => !!clean(x as string))
  }
}

export function buildSection(sec: CaseDef['sections'][number], ans: Answers, c?: CaseDef): DocSection {
  if (sec.id === 'hpi' && sec.fields.some((f) => f.t === 'symptom')) {
    const lines = hpiLines(sec, ans, c)
    if (lines.length) return { id: sec.id, title: sec.title, lines }
  }
  const lines: DocLine[] = []
  const negatives: string[] = []
  for (const f of sec.fields) {
    const v = ans[f.id]
    switch (f.t) {
      case 'text': case 'date': case 'area': {
        if (clean(v)) lines.push({ k: 'kv', label: f.label, value: clean(v) })
        break
      }
      case 'choice': {
        const vals = arr(v)
        if (vals.length) lines.push({ k: 'kv', label: f.label, value: vals.join(', ') })
        break
      }
      case 'findings': {
        const entries = Object.entries((v || {}) as Record<string, 'p' | 'a'>)
        const det = (ans[f.id + '__d'] || {}) as Record<string, string>
        const ph = (ans[f.id + '__p'] || {}) as Record<string, string>
        const present: ExamItem[] = [], tests: ExamItem[] = [], absent: string[] = []
        for (const [label, st] of entries) {
          if (st !== 'p' && st !== 'a') continue
          const kb = findKb(label)
          const detail = st === 'p' ? clean(det[label]) : ''
          if (kb && kb.how) {
            tests.push({
              label, detail: detail || undefined, photo: st === 'p' ? ph[label] : undefined,
              test: { name: kb.name || label, how: kb.how, why: kb.why || '' },
              result: st === 'p' ? kb.pt || 'Positive' : kb.at || 'Negative',
              tone: st === 'p' ? 'pos' : 'neg',
              meaning: st === 'p' ? kb.p : kb.a,
            })
          } else if (st === 'p') present.push({ label, detail: detail || undefined, meaning: kb?.p, photo: ph[label] })
          else absent.push(label)
        }
        const lab = f.label.replace(/\s*\(.*?\)\s*/g, ' ').trim()
        if (present.length || tests.length || absent.length) lines.push({ k: 'exam', label: lab, present, tests, absent })
        break
      }
      case 'complaints': {
        const entries = byOnset(Object.entries((v || {}) as Record<string, string>), ([, d]) => d)
        if (entries.length) lines.push({ k: 'list', items: entries.map(([l, d]) => (clean(d) ? `${l} for ${clean(d)}` : l)) })
        break
      }
      case 'symptom': {
        const a = (v || {}) as SymptomAnswer
        if (a.s === 'p') {
          const t = symptomText(f, a)
          lines.push({ k: 'kv', label: f.label, value: t || 'present' })
        } else if (a.s === 'a') negatives.push(f.label)
        break
      }
      case 'vitals': {
        const x = (v || {}) as Record<string, string>
        const items = VITAL_FIELDS(f.paeds).filter((vf) => clean(x[vf.key])).map((vf) => ({ label: vf.label, value: `${clean(x[vf.key])}${vf.unit ? ' ' + vf.unit : ''}` }))
        const bmi = calcBmi(x)
        if (bmi && !items.find((i) => i.label === 'BMI')) items.push({ label: 'BMI', value: `${bmi} kg/m2` })
        if (items.length) lines.push({ k: 'vitals', items })
        break
      }
    }
  }
  if (negatives.length) lines.push({ k: 'absent', label: 'No history of', items: negatives })
  return { id: sec.id, title: sec.title, lines }
}

export const VITAL_FIELDS = (paeds?: boolean) => [
  { key: 'pulse', label: 'Pulse', unit: '/min' },
  { key: 'bp', label: 'Blood pressure', unit: 'mmHg' },
  { key: 'rr', label: 'Respiratory rate', unit: '/min' },
  { key: 'temp', label: 'Temperature', unit: '' },
  { key: 'spo2', label: 'SpO2', unit: '%' },
  { key: 'jvp', label: 'JVP', unit: '' },
  { key: 'height', label: 'Height', unit: 'cm' },
  { key: 'weight', label: 'Weight', unit: 'kg' },
  ...(paeds ? [{ key: 'crt', label: 'Capillary refill', unit: '' }] : []),
]

export function calcBmi(x: Record<string, string>): string {
  const h = parseFloat(x?.height), w = parseFloat(x?.weight)
  if (!h || !w || h < 30) return ''
  return (w / Math.pow(h / 100, 2)).toFixed(1)
}

export function buildDocument(c: CaseDef, ans: Answers): DocSection[] {
  return c.sections.map((s) => buildSection(s, ans, c)).filter((s) => s.lines.length > 0)
}

/** One-paragraph opening line, in the way a case is spoken at the bedside. */
export function openingStatement(c: CaseDef, ans: Answers): string {
  const p = (ans.particulars || {}) as Record<string, any>
  const get = (k: string) => clean(p[k] ?? ans[k])
  const name = get('name')
  const age = get('age')
  const sex = arr(p.sex ?? ans.sex)[0] || (c.subject === 'obg' ? 'Female' : '')
  const occ = get('occupation')
  const addr = get('address')
  const who: string[] = []
  const isNb = c.id === 'paed-newborn'
  if (name) who.push(isNb ? `Baby ${name}` : /^\d/.test(age) ? name : name)
  else who.push(isNb ? 'A newborn' : 'A patient')
  const demo = [age ? (/[a-z]/i.test(age) ? age : `${age}-year-old`) : '', sex ? sex.toLowerCase() : ''].filter(Boolean).join(' ')
  let s = who[0] + (demo ? `, a ${demo}` : '')
  if (occ) s += `, ${lc(occ)}`
  if (addr) s += `, resident of ${addr}`
  const ccs = findComplaints(c, ans)
  if (ccs.length) s += `, presented with ${joinNice(ccs)}.`
  else s += '.'
  return s
}

function findComplaints(c: CaseDef, ans: Answers): string[] {
  for (const sec of c.sections) for (const f of sec.fields) {
    if (f.t === 'complaints') {
      const e = byOnset(Object.entries((ans[f.id] || {}) as Record<string, string>), ([, d]) => d)
      return e.map(([l, d]) => (clean(d) ? `${lc(l)} for ${clean(d)}` : lc(l)))
    }
  }
  return []
}

function joinNice(a: string[]) {
  if (a.length <= 1) return a.join('')
  return a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1]
}

export function docToText(c: CaseDef, ans: Answers): string {
  const out: string[] = [c.title.toUpperCase(), '', openingStatement(c, ans), '']
  for (const s of buildDocument(c, ans)) {
    out.push(s.title.toUpperCase())
    for (const l of s.lines) {
      if (l.k === 'kv') out.push(`${l.label}: ${l.value}`)
      else if (l.k === 'para') out.push(l.text)
      else if (l.k === 'list') l.items.forEach((i, n) => out.push(`${n + 1}. ${i}`))
      else if (l.k === 'exam') {
        const bits = (i: ExamItem) => `${i.label}${i.detail ? ` (${i.detail})` : ''}${i.meaning ? `: ${i.meaning}` : ''}`
        l.present.forEach((i) => out.push(`- ${bits(i)}`))
        l.tests.forEach((i) => {
          out.push(`- ${i.test!.name}: ${i.result}${i.detail ? ` (${i.detail})` : ''}${i.meaning ? `. ${i.meaning}` : ''}`)
          if (i.test!.how) out.push(`    Method: ${i.test!.how}`)
          if (i.test!.why) out.push(`    Purpose: ${i.test!.why}`)
        })
        if (l.absent.length) out.push(`${l.label} (absent / normal): ${l.absent.join(', ')}`)
      }
      else if (l.k === 'present') out.push(`${l.label} (present): ${l.items.join(', ')}`)
      else if (l.k === 'absent') out.push(`${l.label}${l.label.startsWith('No ') ? '' : ' (absent)'}: ${l.items.join(', ')}`)
      else if (l.k === 'vitals') out.push(l.items.map((i) => `${i.label} ${i.value}`).join(' | '))
    }
    out.push('')
  }
  return out.join('\n')
}

export function sheetTitle(c: CaseDef, ans: Answers): string {
  const name = clean(ans.name)
  const age = clean(ans.age)
  return [name, age ? `${age}` : ''].filter(Boolean).join(', ') || 'Untitled case'
}
