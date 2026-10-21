// Idempotent: wires the Arena into rules, nav, dashboard, home and the Ward Round player.
const fs = require('fs')
function edit(file, test, fn) {
  let s = fs.readFileSync(file, 'utf8')
  if (s.includes(test)) { console.log('skip  ', file); return }
  const out = fn(s)
  if (out === s) { console.log('NOCHANGE (check manually)', file); return }
  fs.writeFileSync(file, out); console.log('edited', file)
}
edit('firestore.rules', 'match /rooms/{roomId}', (s) => {
  const i = s.lastIndexOf('  }\n}')
  const add = `    // Arena (multiplayer): every write goes through the Admin SDK API routes.
    match /rooms/{roomId} { allow read: if request.auth != null; allow write: if false; }
    match /arenaStats/{uid} { allow read: if request.auth != null; allow write: if false; }
    match /roomSecrets/{id} { allow read, write: if false; }
    match /arenaMeta/{id} { allow read, write: if false; }
`
  return s.slice(0, i) + add + s.slice(i)
})
edit('src/components/layout/app-sidebar.tsx', '"/arena"', (s) =>
  s.replace('Star, Newspaper,', 'Star, Newspaper, Swords,')
   .replace('    { title: "Ward Round", url: "/cases", icon: Stethoscope },', '    { title: "Ward Round", url: "/cases", icon: Stethoscope },\n    { title: "Arena", url: "/arena", icon: Swords },'))
edit('src/app/dashboard/page.tsx', '"/arena"', (s) =>
  s.replace('  Stethoscope,\n', '  Stethoscope,\n  Swords,\n')
   .replace(/(\{ label: "Ward Round"[^\n]*\n)/, '$1              { label: "Arena", desc: "Duels, co-op and leaderboards", href: "/arena", icon: Swords, color: "text-fuchsia-400" },\n'))
edit('src/app/page.tsx', 'href: "/arena"', (s) =>
  s.replace(/(  \{ name: "Ward Round"[^\n]*\n)/, '$1  { name: "The Arena", href: "/arena", micro: "PLAY · COMPETE", title: "Study with\\nfriends", tagline: "Duels, co-op and seasons.", emoji: "⚔️", bg: "#efe0ff", fg: "#5b2d9c", chip: "MULTIPLAYER", chipKind: "free", body: "Race friends on MCQs, battle on flashcards, treat patients as a team.", foot: "Enter the arena" },\n'))
edit('src/app/cases/[caseId]/page.tsx', 'arena-client', (s) =>
  s.replace('import { saveResult, rankFor } from "@/lib/ward-progress"', 'import { saveResult, rankFor } from "@/lib/ward-progress"\nimport { getAuth } from "firebase/auth"\nimport { arena } from "@/lib/arena-client"')
   .replace('    setRankInfo(rankFor(r.progress.xp))\n', '    setRankInfo(rankFor(r.progress.xp))\n    const au = getAuth().currentUser\n    if (au && !arrested) arena(au, "xp", { caseId, percent, stars }).catch(() => {})\n'))
