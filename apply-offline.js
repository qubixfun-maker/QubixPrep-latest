// Idempotent: Firestore offline cache + offline banner.
const fs = require('fs')
function edit(file, test, pairs) {
  if (!fs.existsSync(file)) { console.log('MISSING FILE', file); process.exitCode = 1; return }
  const s = fs.readFileSync(file, 'utf8')
  if (s.includes(test)) { console.log('skip  ', file, '(' + test.slice(0, 28) + ')'); return }
  let out = s
  for (const [a, b] of pairs) {
    if (!out.includes(a)) { console.log('MISSING in', file, '->', a.slice(0, 70)); process.exitCode = 1; return }
    out = out.replace(a, b)
  }
  fs.writeFileSync(file, out); console.log('edited', file)
}

edit('src/firebase/index.ts', 'persistentLocalCache', [
  ["import { getFirestore, Firestore } from 'firebase/firestore';", "import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager, Firestore } from 'firebase/firestore';"],
  ['  const db = getFirestore(app);\n', `  // Keep previously opened content on the device so it also opens without internet.
  let db: Firestore;
  try {
    db = initializeFirestore(app, { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) });
  } catch {
    db = getFirestore(app); // already initialised, or this browser blocks local storage
  }
`],
])

edit('src/app/layout.tsx', 'OfflineBanner', [
  ["import { ServiceWorkerRegister } from '@/components/service-worker-register';", "import { ServiceWorkerRegister } from '@/components/service-worker-register';\nimport { OfflineBanner } from '@/components/offline-banner';"],
  ['<ServiceWorkerRegister />', '<ServiceWorkerRegister />\n          <OfflineBanner />'],
])
