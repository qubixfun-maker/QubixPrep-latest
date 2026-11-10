import type { CaseDef } from './types'
import { topicOf } from './cases-util'
import type { ModelCase } from './models-obg'
import type { CaseInsight } from './insights-data'

type Hint = { dx: string; why: string; any: string[]; min?: number }
export type TopicDef = {
  id: string; base: string; title: string; blurb: string; first?: string[]; focusTitle: string; focus: string[]
  hints: Hint[]; must: [string, ...string[]][]; viva: [string, string][]; model: string; check?: string[]
}
export const G = 'Good morning sir/madam. I am presenting a case of '

/** Builds cases, insights and model cases from compact topic definitions. */
export function buildTopics(bases: CaseDef[], defs: TopicDef[]) {
  const cases = defs.map((d) => topicOf({ base: bases.find((b) => b.id === d.base)!, id: d.id, title: d.title, blurb: d.blurb, first: d.first, focusTitle: d.focusTitle, focus: d.focus }))
  const insights: Record<string, CaseInsight> = {}
  const models: Record<string, ModelCase> = {}
  for (const d of defs) {
    insights[d.id] = {
      hints: d.hints.map((x) => ({ dx: x.dx, why: x.why, any: x.any, min: Math.min(x.min ?? 2, x.any.length) })),
      must: d.must.map(([n, ...m]) => ({ n, m })),
      viva: d.viva.map(([q, a]) => ({ q, a })),
    }
    models[d.id] = { text: d.model, check: d.check }
  }
  return { cases, insights, models }
}
