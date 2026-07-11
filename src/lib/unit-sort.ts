// Shared helper for grouping and ordering content (mindmaps, topics, etc.) by unit.
// Understands "Unit I", "Unit 2", etc. so units sort in curriculum order, not alphabetically.

export function romanToInt(roman: string): number {
  const map: Record<string, number> = { I: 1, V: 5, X: 10, L: 50, C: 100 }
  let result = 0
  for (let i = 0; i < roman.length; i++) {
    const cur = map[roman[i]] || 0
    const next = map[roman[i + 1]] || 0
    result += cur < next ? -cur : cur
  }
  return result
}

export function unitSortKey(unitName: string | undefined | null): number {
  if (!unitName) return 9999
  const trimmed = unitName.trim()
  const romanMatch = trimmed.match(/\b([IVXLC]+)\s*$/i)
  if (romanMatch) return romanToInt(romanMatch[1].toUpperCase())
  const numMatch = trimmed.match(/(\d+)\s*$/)
  if (numMatch) return parseInt(numMatch[1])
  return 9999
}

export function groupByUnit<T extends { unitName?: string; order?: number }>(
  items: T[]
): { unitName: string; items: T[] }[] {
  const groups: Record<string, T[]> = {}
  items.forEach((item) => {
    const u = item.unitName || "Uncategorised"
    if (!groups[u]) groups[u] = []
    groups[u].push(item)
  })
  Object.values(groups).forEach((list) =>
    list.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  )
  return Object.entries(groups)
    .sort((a, b) => unitSortKey(a[0]) - unitSortKey(b[0]))
    .map(([unitName, items]) => ({ unitName, items }))
}
