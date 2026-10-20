export const YEARS = ['1st year', '2nd year', '3rd year', 'Final year', 'Intern', 'NEET-PG / INI-CET prep']
export const EXAMS = ['University exams', 'NEET-PG', 'INI-CET', 'FMGE', 'NExT', 'Not sure yet']
export const LANGS = ['English', 'Hindi', 'Kannada', 'Tamil', 'Telugu', 'Malayalam', 'Marathi', 'Bengali']
export type Depth = 'brief' | 'balanced' | 'detailed'
export type Mode = 'topic' | 'quiz' | 'viva' | 'cards' | 'plan' | 'doubt'

export type Weak = Record<string, { label: string; w: number; t: number }>

export type JellyProfile = {
  year?: string
  exam?: string
  examDate?: string
  language?: string
  depth?: Depth
  persona?: string
  voiceOn?: boolean
  voiceGender?: 'female' | 'male'
  notes: string[]
  weak: Weak
}

export const EMPTY_PROFILE: JellyProfile = { notes: [], weak: {} }

export const topicKey = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 50)

export function daysTo(iso?: string): number | null {
  if (!iso) return null
  const d = new Date(`${iso}T00:00:00`)
  if (isNaN(d.getTime())) return null
  return Math.ceil((d.getTime() - Date.now()) / 86400000)
}

/** Topics the student keeps getting wrong (at least 3 attempts and 40 percent or more wrong). */
export function weakTopics(p: JellyProfile, n = 4) {
  return Object.values(p.weak || {})
    .filter((x) => x.t >= 3 && x.w / x.t >= 0.4)
    .sort((a, b) => b.w / b.t - a.w / a.t)
    .slice(0, n)
}

/** What Jelly knows about the student, as plain text for the AI prompt. */
export function profileSummary(p: JellyProfile): string {
  const lines: string[] = []
  if (p.year) lines.push(`Year of study: ${p.year}`)
  if (p.exam) {
    const d = daysTo(p.examDate)
    lines.push(`Preparing for: ${p.exam}${d !== null && d >= 0 ? ` (${d} days to go)` : ''}`)
  }
  lines.push(`Preferred explanation depth: ${p.depth || 'balanced'}`)
  const weak = weakTopics(p)
  if (weak.length) lines.push(`Weak areas from their practice: ${weak.map((w) => `${w.label} (${w.w} wrong of ${w.t})`).join('; ')}`)
  if (p.notes?.length) lines.push(`Things the student told Jelly: ${p.notes.join('; ')}`)
  return lines.join('\n')
}

/** Cache bucket: students at a similar level share saved explanations. */
export function tierOf(p: JellyProfile): string {
  const y = p.year || ''
  const level = /^(1st|2nd)/.test(y) ? 'junior' : /Final|Intern|PG|INI/.test(y) || /PG|INI|FMGE|NExT/.test(p.exam || '') ? 'senior' : 'mid'
  return `${p.depth || 'balanced'}|${level}|${p.language || 'English'}`
}

export function nudgeLine(p: JellyProfile, name: string): string | null {
  const d = daysTo(p.examDate)
  const w = weakTopics(p, 1)[0]
  if (w) return `${name}, you have been missing ${w.label} (${w.w} of ${w.t} wrong). Shall we fix that with a quick quiz?`
  if (d !== null && d >= 0 && d <= 90) return `${d} days to your ${p.exam || 'exam'}, ${name}. Want a revision plan?`
  return null
}
