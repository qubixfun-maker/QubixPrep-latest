import type { CaseDef, Field, Answers, SymptomAnswer } from './types'
import { resolveAttr } from './dsl'

export type DocLine =
  | { k: 'kv'; label: string; value: string }
  | { k: 'para'; text: string }
  | { k: 'list'; items: string[] }
  | { k: 'present'; label: string; items: string[] }
  | { k: 'absent'; label: string; items: string[] }
  | { k: 'vitals'; items: { label: string; value: string }[] }

export type DocSection = { id: string; title: string; lines: DocLine[] }

const arr = (v: any): string[] => (Array.isArray(v) ? v : v ? [String(v)] : []).filter(Boolean)
const clean = (s: any) => (typeof s === 'string' ? s.trim() : '')
const lc = (s: string) => (s ? s.charAt(0).toLowerCase() + s.slice(1) : s)

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

export function buildSection(sec: CaseDef['sections'][number], ans: Answers): DocSection {
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
        const p = entries.filter(([, s]) => s === 'p').map(([l]) => l)
        const a = entries.filter(([, s]) => s === 'a').map(([l]) => l)
        const lab = f.label.replace(/\s*\(.*?\)\s*/g, ' ').trim()
        if (p.length) lines.push({ k: 'present', label: lab, items: p })
        if (a.length) lines.push({ k: 'absent', label: lab, items: a })
        break
      }
      case 'complaints': {
        const entries = Object.entries((v || {}) as Record<string, string>)
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
  return c.sections.map((s) => buildSection(s, ans)).filter((s) => s.lines.length > 0)
}

/** One-paragraph opening line, in the way a case is spoken at the bedside. */
export function openingStatement(c: CaseDef, ans: Answers): string {
  const p = (ans.particulars || {}) as Record<string, any>
  const get = (k: string) => clean(p[k] ?? ans[k])
  const name = get('name')
  const age = get('age')
  const sex = arr(p.sex ?? ans.sex)[0]
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
      const e = Object.entries((ans[f.id] || {}) as Record<string, string>)
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
