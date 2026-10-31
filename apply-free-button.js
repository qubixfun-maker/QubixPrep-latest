#!/usr/bin/env node
// Adds a "Free Access" button next to "Manage Affiliates" on the admin page. Checks first; changes nothing on a mismatch. Safe to run twice.
const fs = require('fs'), path = require('path')
const file = path.join(process.cwd(), 'src/app/admin/page.tsx')
const fail = (m) => { console.error('\nSTOPPED - nothing was changed.\n' + m + '\n'); process.exit(1) }
if (!fs.existsSync(file)) fail('Run this from the QubixPrep-latest folder.')
const raw = fs.readFileSync(file, 'utf8')
const crlf = raw.includes('\r\n')
const s = raw.replace(/\r\n/g, '\n')
if (s.includes('href="/admin/free-access"')) { console.log('Already added. Nothing to do.'); process.exit(0) }
const anchor = `          <Link href="/admin/affiliates">
            <Button variant="outline" className="rounded-xl gap-2 glass border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10">
              <Gift className="h-4 w-4" /> Manage Affiliates
            </Button>
          </Link>
`
if (s.split(anchor).length - 1 !== 1) fail('Could not find the "Manage Affiliates" button exactly once.')
if (!/\bGift\b/.test(s.split('\n').filter((l) => /^import .*lucide-react/.test(l) || /^\s+Gift,?$/.test(l)).join('\n')) && !/import[\s\S]{0,800}\bGift\b[\s\S]{0,800}from ["']lucide-react["']/.test(s)) fail('The Gift icon is not imported in the admin page.')
const add = `          <Link href="/admin/free-access">
            <Button variant="outline" className="rounded-xl gap-2 glass border-pink-500/30 text-pink-400 hover:bg-pink-500/10">
              <Gift className="h-4 w-4" /> Free Access (Influencers)
            </Button>
          </Link>
`
let out = s.replace(anchor, anchor + add)
if (crlf) out = out.replace(/\n/g, '\r\n')
fs.writeFileSync(file, out)
console.log('DONE - added the "Free Access (Influencers)" button to src/app/admin/page.tsx')
console.log('NEXT: npx tsc --noEmit, then commit and push.')
