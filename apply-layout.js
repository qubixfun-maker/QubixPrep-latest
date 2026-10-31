#!/usr/bin/env node
// Menu (hamburger) button on every screen size + sidebar starts closed on tablets/small laptops.
// Checks first; changes nothing on a mismatch. Safe to run twice.
const fs = require('fs'), path = require('path')
const file = path.join(process.cwd(), 'src/components/layout/layout-shell.tsx')
const fail = (m) => { console.error('\nSTOPPED - nothing was changed.\n' + m + '\n'); process.exit(1) }
if (!fs.existsSync(file)) fail('Run this from the QubixPrep-latest folder.')
const raw = fs.readFileSync(file, 'utf8'), crlf = raw.includes('\r\n')
let s = raw.replace(/\r\n/g, '\n')
const sb = path.join(process.cwd(), 'src/components/ui/sidebar.tsx')
if (!fs.existsSync(sb) || !/setOpen\b/.test(fs.readFileSync(sb, 'utf8')) || !/isMobile/.test(fs.readFileSync(sb, 'utf8'))) fail('src/components/ui/sidebar.tsx does not provide setOpen/isMobile as expected.')
if (s.includes('function AutoCollapse')) { console.log('Already applied. Nothing to do.'); process.exit(0) }

const reps = [
  ['import { useState } from "react"', 'import { useEffect, useRef, useState } from "react"'],
  ['className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-border bg-card text-foreground md:hidden"',
   'className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-border bg-card text-foreground transition-colors hover:bg-accent"'],
  ['function MobileNav() {',
   `/** On tablets and small laptops the menu starts closed so the page gets the full width. The menu button opens it any time. */
function AutoCollapse() {
  const { setOpen, isMobile } = useSidebar()
  const done = useRef(false)
  useEffect(() => {
    if (done.current) return
    done.current = true
    if (!isMobile && window.innerWidth < 1100) setOpen(false)
  }, [isMobile, setOpen])
  return null
}

function MobileNav() {`],
  ['      <MobileNav />\n', '      <AutoCollapse />\n      <MobileNav />\n'],
]
for (const [a] of reps) if (s.split(a).length - 1 !== 1) fail('Could not find this exactly once in layout-shell.tsx:\n  ' + a.split('\n')[0])
for (const [a, b] of reps) s = s.replace(a, () => b)
if (crlf) s = s.replace(/\n/g, '\r\n')
fs.writeFileSync(file, s)
console.log('DONE - menu button now shows on every screen, and the sidebar starts closed below 1100px width.')
console.log('NEXT: npx tsc --noEmit')
