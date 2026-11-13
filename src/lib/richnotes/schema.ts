// Structured "rich note" format (QubixPrep exam-notes style). The AI returns DATA in this
// shape; the app draws the coloured boxes, tables and trees itself, so layout is always consistent.
// Inline marks inside any text:  **bold phrase**  -> bold with yellow underline,  [[key term]] -> maroon.

export type Tone = 'green' | 'yellow' | 'pink'

export type Block =
  | { type: 'para'; text: string }
  | { type: 'bullets'; title?: string; items: string[] }
  | { type: 'table'; title?: string; headers: string[]; rows: string[][] }
  | { type: 'tree'; title?: string; root: string; branches: { label: string; items: string[] }[] }
  | { type: 'flow'; title?: string; steps: { text: string; key?: boolean }[] }
  | { type: 'callout'; tone: Tone; title: string; text?: string; items?: string[] }
  | { type: 'mnemonic'; title?: string; text: string; expansion?: string[] }

export type Section = { heading: string; blocks: Block[] }

export type RichNote = {
  title: string
  citation?: string
  definition: { text: string; simple?: string }
  answerGuide: string[]
  sections: Section[]
  examPointers: { m10?: string; m5?: string; m3?: string; viva?: string }
  recap: string[]
}

export type RichMeta = { status: 'draft' | 'published'; convertedAt: number; model?: string }
export type StoredRich = RichNote & RichMeta

const str = (v: any, max = 700): string => (typeof v === 'string' ? v.trim().slice(0, max) : '')
const strList = (v: any, maxItems = 30, max = 400): string[] =>
  Array.isArray(v) ? v.map((x) => str(x, max)).filter(Boolean).slice(0, maxItems) : []

function cleanBlock(b: any): Block | null {
  if (!b || typeof b !== 'object') return null
  switch (b.type) {
    case 'para': { const text = str(b.text, 1200); return text ? { type: 'para', text } : null }
    case 'bullets': { const items = strList(b.items); return items.length ? { type: 'bullets', title: str(b.title, 120) || undefined, items } : null }
    case 'table': {
      const headers = strList(b.headers, 8, 80)
      const rows = Array.isArray(b.rows) ? b.rows.map((r: any) => strList(r, headers.length || 8, 500)).filter((r: string[]) => r.length > 0).slice(0, 40) : []
      if (headers.length < 2 || rows.length === 0) return null
      const w = headers.length
      return { type: 'table', title: str(b.title, 120) || undefined, headers, rows: rows.map((r: string[]) => Array.from({ length: w }, (_, i) => r[i] || '')) }
    }
    case 'tree': {
      const branches = Array.isArray(b.branches) ? b.branches.map((x: any) => ({ label: str(x?.label, 80), items: strList(x?.items, 12, 160) })).filter((x: any) => x.label).slice(0, 6) : []
      const root = str(b.root, 140)
      return root && branches.length ? { type: 'tree', title: str(b.title, 120) || undefined, root, branches } : null
    }
    case 'flow': {
      const steps = Array.isArray(b.steps) ? b.steps.map((s: any) => (typeof s === 'string' ? { text: str(s, 220) } : { text: str(s?.text, 220), key: !!s?.key })).filter((s: any) => s.text).slice(0, 14) : []
      return steps.length >= 2 ? { type: 'flow', title: str(b.title, 120) || undefined, steps } : null
    }
    case 'callout': {
      const tone: Tone = b.tone === 'green' || b.tone === 'pink' ? b.tone : 'yellow'
      const title = str(b.title, 120); const text = str(b.text, 1200); const items = strList(b.items, 14)
      return title && (text || items.length) ? { type: 'callout', tone, title, text: text || undefined, items: items.length ? items : undefined } : null
    }
    case 'mnemonic': {
      const text = str(b.text, 300)
      return text ? { type: 'mnemonic', title: str(b.title, 120) || undefined, text, expansion: strList(b.expansion, 14, 200) } : null
    }
  }
  return null
}

/** Coerces untrusted AI output into a safe RichNote, or returns null if too little survives. */
export function sanitizeRichNote(raw: any): RichNote | null {
  if (!raw || typeof raw !== 'object') return null
  const title = str(raw.title, 160)
  const defText = str(raw.definition?.text, 1500)
  if (!title || !defText) return null
  const sections: Section[] = (Array.isArray(raw.sections) ? raw.sections : [])
    .map((s: any) => ({ heading: str(s?.heading, 120), blocks: (Array.isArray(s?.blocks) ? s.blocks : []).map(cleanBlock).filter(Boolean) as Block[] }))
    .filter((s: Section) => s.heading && s.blocks.length > 0).slice(0, 16)
  if (sections.length === 0) return null
  const ep = raw.examPointers || {}
  return {
    title,
    citation: str(raw.citation, 200) || undefined,
    definition: { text: defText, simple: str(raw.definition?.simple, 400) || undefined },
    answerGuide: strList(raw.answerGuide, 14, 80),
    sections,
    examPointers: { m10: str(ep.m10, 600) || undefined, m5: str(ep.m5, 600) || undefined, m3: str(ep.m3, 600) || undefined, viva: str(ep.viva, 600) || undefined },
    recap: strList(raw.recap, 8, 300),
  }
}
