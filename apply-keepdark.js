// Idempotent: the site's global CSS turns "white/10"-style colours light unless the dark panel carries "keep-dark".
// This adds it to the dark hero panels, flashcard tiles and the full-screen flashcard deck.
const fs = require('fs')
function sub(file, find, repl) {
  if (!fs.existsSync(file)) { console.log('MISSING FILE', file); process.exitCode = 1; return }
  const s = fs.readFileSync(file, 'utf8')
  if (!s.includes(find)) { console.log('skip  ', file); return }
  fs.writeFileSync(file, s.split(find).join(repl)); console.log('edited', file)
}
const HERO = 'className="relative overflow-hidden rounded-[2rem]'
for (const f of ['src/app/cases/page.tsx', 'src/app/arena/page.tsx', 'src/app/review/page.tsx', 'src/app/my-progress/page.tsx', 'src/app/plan/page.tsx', 'src/app/grand-test/page.tsx', 'src/app/faq/page.tsx', 'src/app/support/page.tsx', 'src/app/flashcards/[subjectId]/page.tsx'])
  sub(f, HERO, 'className="keep-dark relative overflow-hidden rounded-[2rem]')
sub('src/app/flashcards/[subjectId]/page.tsx', 'className="fcl-tile group', 'className="keep-dark fcl-tile group')
sub('src/components/flashcards/ImmersiveDeck.tsx', 'className="fixed inset-0 z-[80] overflow-hidden text-white"', 'className="keep-dark fixed inset-0 z-[80] overflow-hidden text-white"')
