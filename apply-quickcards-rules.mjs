// Adds the QuickCards rules to firestore.rules. Safe to run twice (it skips if already applied).
import fs from 'node:fs'

const file = 'firestore.rules'
let content = fs.readFileSync(file, 'utf8')

if (content.includes('quickCards')) {
  console.log('firestore.rules already has QuickCards rules - nothing to do.')
  process.exit(0)
}

const adminCheck = `request.auth != null &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin'`

function insertAfter(anchor, addition) {
  const count = content.split(anchor).length - 1
  if (count !== 1) {
    console.error(`Expected exactly 1 match for anchor, found ${count}:\n${anchor}`)
    process.exit(1)
  }
  content = content.replace(anchor, anchor + addition)
}

function insertBefore(anchor, addition) {
  const count = content.split(anchor).length - 1
  if (count !== 1) {
    console.error(`Expected exactly 1 match for anchor, found ${count}:\n${anchor}`)
    process.exit(1)
  }
  content = content.replace(anchor, addition + anchor)
}

// 1) Per-user bookmark / revised state
insertAfter(
  `      match /feedProgress/{cardId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
`,
  `
      match /quickCardState/{cardId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
`
)

// 2) Cards and feature settings
insertBefore(
  `    match /dashboardBanners/{bannerId} {`,
  `    match /quickCards/{cardId} {
      allow read: if resource.data.status == 'published' || (${adminCheck});
      allow create, update, delete: if ${adminCheck};
    }
    match /quickCardSettings/{slug} {
      allow read: if true;
      allow write: if ${adminCheck};
    }
`
)

fs.writeFileSync(file, content)
console.log('Done: QuickCards rules added to firestore.rules.')
console.log('Now publish them: Firebase console -> Firestore -> Rules -> paste the file contents -> Publish.')
