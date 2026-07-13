import fs from 'fs'

function replaceOnce(file, oldStr, newStr, label) {
  let content = fs.readFileSync(file, 'utf8')
  const count = content.split(oldStr).length - 1
  if (count !== 1) {
    console.error(`FAIL [${label}] in ${file} — found ${count} matches (expected 1)`)
    process.exitCode = 1
    return
  }
  content = content.replace(oldStr, newStr)
  fs.writeFileSync(file, content, 'utf8')
  console.log(`OK   [${label}] in ${file}`)
}

const f = 'src/app/page.tsx'

replaceOnce(f,
`  Trophy, Search, Crown, Star, Zap, CheckCircle2,
  ShoppingBag, ArrowRight,`,
`  Trophy, Search, Crown, Star, Zap, CheckCircle2,
  ShoppingBag, ArrowRight, Users,`,
  'import Users icon')

replaceOnce(f,
`    {
      title: "Smart Search",
      desc: "Search across every subject, note, and mindmap.",
      href: "/search",
      icon: Search,
      tone: "coral" as const,
      locked: false,
      badge: "Free",
    },
  ]`,
`    {
      title: "Smart Search",
      desc: "Search across every subject, note, and mindmap.",
      href: "/search",
      icon: Search,
      tone: "coral" as const,
      locked: false,
      badge: "Free",
    },
    {
      title: "Affiliate Program",
      desc: \`Earn ₹\${isBasic ? 29 : 59} for every friend who subscribes.\`,
      href: "/affiliate",
      icon: Users,
      tone: "gold" as const,
      locked: isFree,
      badge: "Scholar",
    },
  ]`,
  'add affiliate tool card')

replaceOnce(f,
`  const toneClasses: Record<string, string> = {
    violet: "bg-primary/15 text-primary",
    blue: "bg-accent/15 text-accent",
    coral: "bg-orange-400/15 text-orange-400",
  }`,
`  const toneClasses: Record<string, string> = {
    violet: "bg-primary/15 text-primary",
    blue: "bg-accent/15 text-accent",
    coral: "bg-orange-400/15 text-orange-400",
    gold: "bg-yellow-400/15 text-yellow-400",
  }`,
  'add gold tone class')

console.log('\nDone.')
