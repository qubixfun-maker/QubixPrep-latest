import type { Answers } from '../types'

/** Helpers for writing complete sample cases. Labels must match the case sheet exactly. */
export type Sym = { s: 'p'; a: Record<string, string[]> } | { s: 'a' }
export const P = (a: Record<string, string[]>): Sym => ({ s: 'p', a })
export const A: Sym = { s: 'a' }
export const F = (p: string[], a: string[] = []): Record<string, 'p' | 'a'> => {
  const o: Record<string, 'p' | 'a'> = {}
  p.forEach((x) => (o[x] = 'p'))
  a.forEach((x) => (o[x] = 'a'))
  return o
}
export const who = (name: string, age: string, sex: 'Male' | 'Female', occupation: string, address: string): Answers => ({
  name, age, sex: [sex], occupation, address, doa: '2026-10-12', doe: '2026-10-13',
})
export const merge = (...parts: Answers[]): Answers => Object.assign({}, ...parts)
export const lines = (...l: string[]) => l.join('\n')
