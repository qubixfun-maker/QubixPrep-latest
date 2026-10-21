// Remove Study Feed completely; add Med Stories (live medical news as web stories). Safe to run twice.
const fs = require("fs")
const rd = (f) => fs.readFileSync(f, "utf8")
const wr = (f, s) => fs.writeFileSync(f, s)
function edit(f, label, fn) { const s = rd(f); const r = fn(s); if (r === null) console.log(label + ": already done / anchor missing"); else { wr(f, r); console.log(label + ": done") } }
function once(s, a, b) { return s.split(a).length - 1 === 1 ? s.replace(a, () => b) : null }

// 1. Delete the Study Feed page
if (fs.existsSync("src/app/feed")) { fs.rmSync("src/app/feed", { recursive: true, force: true }); console.log("study feed page: removed") } else console.log("study feed page: already removed")

// 2. Sidebar
edit("src/components/layout/app-sidebar.tsx", "sidebar", (s) => {
  if (s.includes("/stories")) return null
  let r = once(s, 'Plus, Star,', 'Plus, Star, Newspaper,')
  if (!r) return null
  return once(r, '{ title: "Study Feed", url: "/feed", icon: Flame },', '{ title: "Med Stories", url: "/stories", icon: Newspaper },')
})

// 3. Admin panel button
edit("src/app/admin/page.tsx", "admin button", (s) => {
  const re = /\n          <Link href="\/feed">\s*<Button[^>]*>\s*<Flame className="h-4 w-4" \/> Study Feed\s*<\/Button>\s*<\/Link>/
  return re.test(s) ? s.replace(re, "") : null
})

// 4. Old /dashboard page link
edit("src/app/dashboard/page.tsx", "old dashboard link", (s) =>
  once(s, '<Link href="/feed"><Flame className="h-4 w-4" /> Study Feed</Link>', '<Link href="/stories"><Flame className="h-4 w-4" /> Med Stories</Link>'))

// 5. Home dashboard card
edit("src/app/page.tsx", "home card", (s) => {
  if (s.includes('href: "/stories"')) return null
  const anchor = '  { name: "Jelly AI", href: "/jelly"'
  return once(s, anchor, '  { name: "Med Stories", href: "/stories", micro: "LIVE · MEDICAL NEWS", title: "Fresh from the\\nmedical world", tagline: "Swipe through today\'s stories.", emoji: "📰", bg: "#fde4dc", fg: "#8a3a2a", chip: "LIVE · FREE", chipKind: "free", body: "New medical news as web stories, straight from trusted sources.", foot: "Open stories" },\n' + anchor)
})
