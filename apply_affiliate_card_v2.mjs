import fs from 'fs'

const f = 'src/app/page.tsx'
let content = fs.readFileSync(f, 'utf8')
let changed = false

if (!/\bUsers\b/.test(content.slice(0, content.indexOf('from "lucide-react"')))) {
  const importEnd = content.indexOf('} from "lucide-react"')
  if (importEnd === -1) {
    console.error('FAIL: could not find the lucide-react import block')
    process.exit(1)
  }
  const before = content.slice(0, importEnd)
  const trimmed = before.replace(/,?\s*$/, '')
  content = trimmed + ',\n  Users,\n' + content.slice(importEnd)
  changed = true
  console.log('OK   added Users to lucide-react import')
} else {
  console.log('SKIP Users icon already imported')
}

if (!content.includes('Affiliate Program')) {
  const searchIdx = content.indexOf('"Smart Search"')
  if (searchIdx === -1) {
    console.error('FAIL: could not find the "Smart Search" tool entry — paste your current tools array to Claude')
    process.exit(1)
  }
  const closeIdx = content.indexOf('},', searchIdx)
  if (closeIdx === -1) {
    console.error('FAIL: could not find the end of the Smart Search object')
    process.exit(1)
  }
  const insertAt = closeIdx + 2
  const affiliateBlock = `
    {
      title: "Affiliate Program",
      desc: \`Earn ₹\${isBasic ? 29 : 59} for every friend who subscribes.\`,
      href: "/affiliate",
      icon: Users,
      tone: "gold" as const,
      locked: isFree,
      badge: "Scholar",
    },`
  content = content.slice(0, insertAt) + affiliateBlock + content.slice(insertAt)
  changed = true
  console.log('OK   inserted Affiliate Program tool card')
} else {
  console.log('SKIP Affiliate card already present')
}

if (!content.includes('gold:')) {
  const toneIdx = content.indexOf('const toneClasses')
  if (toneIdx === -1) {
    console.error('FAIL: could not find toneClasses object — paste it to Claude')
    process.exit(1)
  }
  const closeBrace = content.indexOf('}', toneIdx)
  const before = content.slice(0, closeBrace)
  const trimmed = before.replace(/,?\s*$/, '')
  content = trimmed + ',\n    gold: "bg-yellow-400/15 text-yellow-400",\n  ' + content.slice(closeBrace)
  changed = true
  console.log('OK   added gold tone class')
} else {
  console.log('SKIP gold tone already present')
}

if (changed) {
  fs.writeFileSync(f, content, 'utf8')
  console.log('\nSaved src/app/page.tsx')
} else {
  console.log('\nNothing to change — affiliate card already fully set up.')
}
