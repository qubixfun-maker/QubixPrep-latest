// Idempotent: makes the mind map viewer survive unusual data instead of crashing the page.
const fs = require('fs')
function edit(file, test, pairs) {
  if (!fs.existsSync(file)) { console.log('MISSING FILE', file); process.exitCode = 1; return }
  const s = fs.readFileSync(file, 'utf8')
  if (s.includes(test)) { console.log('skip  ', file, '(' + test.slice(0, 28) + ')'); return }
  let out = s
  for (const [a, b] of pairs) {
    if (!out.includes(a)) { console.log('MISSING in', file, '->', a.slice(0, 70)); process.exitCode = 1; return }
    out = out.replace(a, b)
  }
  fs.writeFileSync(file, out); console.log('edited', file)
}

edit('src/components/mindmap/MindMapCanvas.tsx', 'function sanitize', [
  ['type N = {', `// Generated maps sometimes carry lists or objects where text is expected; flatten everything to plain text.
const str = (v: any, d = 0): string => v == null ? "" : d > 4 ? "" : Array.isArray(v) ? v.map((x) => str(x, d + 1)).filter(Boolean).join(" ") : typeof v === "object" ? Object.values(v).map((x) => str(x, d + 1)).filter(Boolean).join(" ") : String(v)
function sanitize(n: any, d = 0): MindmapNode {
  const o: MindmapNode = { name: str(n?.name).trim() || "Untitled" }
  const def = str(n?.definition).trim(), mech = str(n?.mechanism).trim(), ex = str(n?.examples).trim()
  if (def) o.definition = def
  if (mech) o.mechanism = mech
  if (ex) o.examples = ex
  const b = n?.branches
  const list: any[] = Array.isArray(b) ? b : b && typeof b === "object" ? Object.values(b) : []
  if (d < 8 && list.length) o.branches = list.filter((x) => x && typeof x === "object").map((x) => sanitize(x, d + 1))
  return o
}

type N = {`],
  ['const tree = useMemo(() => build(root, "r", 0, ROOT_COLOR), [root])', 'const tree = useMemo(() => build(sanitize(root), "r", 0, ROOT_COLOR), [root])'],
])

edit('src/app/mindmaps/[id]/[mindmapId]/page.tsx', 'SafeBoundary', [
  ['import MindMapCanvas from "@/components/mindmap/MindMapCanvas"', 'import MindMapCanvas from "@/components/mindmap/MindMapCanvas"\nimport SafeBoundary from "@/components/mindmap/SafeBoundary"'],
  ['  const mm = mindmap as any\n', `  const mm = mindmap as any
  const mapData = (() => { try { const d = typeof mm.data === "string" ? JSON.parse(mm.data) : mm.data; return d && (Array.isArray(d.branches) || d.centralTopic) ? d : null } catch { return null } })()
`],
  ['{mm.type === "radial" && mm.data ? (\n          <MindMapCanvas root={{ name: mm.data.centralTopic, branches: mm.data.branches }} />',
   '{mapData ? (\n          <SafeBoundary><MindMapCanvas root={{ name: mapData.centralTopic, branches: mapData.branches }} /></SafeBoundary>'],
])
