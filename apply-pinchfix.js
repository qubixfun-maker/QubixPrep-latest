// Idempotent: fixes the crash when two fingers pinch a mind map and lift.
const fs = require('fs')
const file = 'src/components/mindmap/MindMapCanvas.tsx'
const s = fs.readFileSync(file, 'utf8')
const a = 'if (last.current) { zoomAt(cx - r.left, cy - r.top, d / (last.current.d || d)); setView((v) => ({ ...v, x: v.x + (cx - last.current!.x), y: v.y + (cy - last.current!.y) })) }'
const b = 'if (last.current) { const lx = last.current.x, ly = last.current.y, ld = last.current.d || d; zoomAt(cx - r.left, cy - r.top, d / ld); setView((v) => ({ ...v, x: v.x + (cx - lx), y: v.y + (cy - ly) })) }'
if (s.includes('const lx = last.current.x')) console.log('skip  ', file)
else if (!s.includes(a)) { console.log('MISSING in', file); process.exitCode = 1 }
else { fs.writeFileSync(file, s.replace(a, b)); console.log('edited', file) }
