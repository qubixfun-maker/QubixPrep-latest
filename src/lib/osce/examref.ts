import { getCase } from '@/lib/casepres'
import type { Field } from '@/lib/casepres'

const optionsOf = (f: Field): string[] => ('options' in f ? f.options : [])

/**
 * The examination vocabulary of a case-presentation proforma: general signs plus every examination
 * section, with the signs and options a student is expected to look for. Used to keep improvised
 * findings in the same terms as the proforma.
 */
export function examReference(proformaId?: string, max = 1800): string {
  const c = proformaId ? getCase(proformaId) : undefined
  if (!c) return ''
  const gi = c.sections.findIndex((s) => s.id === 'gpe')
  const body = c.sections.filter((s, i) => (gi >= 0 ? i > gi : /exam/i.test(s.title)) && s.id !== 'closing')
  const lines: string[] = []
  for (const s of body) {
    const parts: string[] = []
    for (const f of s.fields) {
      if (f.t === 'vitals' || f.t === 'text' || f.t === 'date' || f.t === 'area' || f.t === 'symptom') continue
      const o = optionsOf(f)
      parts.push(o.length ? `${f.label}: ${o.slice(0, 16).join(', ')}` : f.label)
    }
    if (parts.length) lines.push(`${s.title} -> ${parts.join(' | ')}`)
  }
  return lines.join('\n').slice(0, max)
}
