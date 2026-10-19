// Wires Case Presentation into the sidebar and Firestore rules. Safe to run twice.
import fs from 'node:fs'

const sb = 'src/components/layout/app-sidebar.tsx'
let s = fs.readFileSync(sb, 'utf8')
if (!s.includes('CasePresentationMenuItem')) {
  s = s.replace('import { QuickCardsMenuItems } from "@/components/quickcards/menu-items"\n',
    'import { QuickCardsMenuItems } from "@/components/quickcards/menu-items"\nimport { CasePresentationMenuItem } from "@/components/casepres/menu-item"\n')
  s = s.replace('              <QuickCardsMenuItems pathname={pathname} onNavigate={closeOnMobile} />\n',
    '              <QuickCardsMenuItems pathname={pathname} onNavigate={closeOnMobile} />\n              <CasePresentationMenuItem pathname={pathname} onNavigate={closeOnMobile} />\n')
  if (!s.includes('CasePresentationMenuItem pathname')) { console.error('Could not find the QuickCards line in app-sidebar.tsx'); process.exit(1) }
  fs.writeFileSync(sb, s); console.log('sidebar updated')
} else console.log('sidebar already done')

const fr = 'firestore.rules'
let r = fs.readFileSync(fr, 'utf8')
if (!r.includes('caseSheets')) {
  const anchor = /      match \/quickCardState\/\{cardId\} \{\n        allow read, write: if request\.auth != null && request\.auth\.uid == userId;\n      \}\n/
  const add = `
      // Case Presentation: saved case sheets. Only subscribers (Scholar / Clinician) and admins can create or edit.
      match /caseSheets/{sheetId} {
        allow read, delete: if request.auth != null && request.auth.uid == userId;
        allow create, update: if request.auth != null && request.auth.uid == userId && (
          get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == "admin" ||
          get(/databases/$(database)/documents/users/$(request.auth.uid)).data.plan in ["basic", "pro"]
        );
      }
`
  if (!anchor.test(r)) { console.error('Could not find quickCardState in firestore.rules'); process.exit(1) }
  r = r.replace(anchor, (m) => m + add)
  fs.writeFileSync(fr, r); console.log('firestore.rules updated (remember to publish them)')
} else console.log('rules already done')
