// Idempotent: readable rank card, admin shortcut banner + clearer admin button.
const fs = require('fs')
function edit(file, test, pairs) {
  if (!fs.existsSync(file)) { console.log('MISSING FILE', file); process.exitCode = 1; return }
  let s = fs.readFileSync(file, 'utf8')
  if (s.includes(test)) { console.log('skip  ', file, '(' + test.slice(0, 30) + ')'); return }
  let out = s
  for (const [a, b] of pairs) {
    if (!out.includes(a)) { console.log('MISSING in', file, '->', a.slice(0, 70)); process.exitCode = 1; return }
    out = out.replace(a, b)
  }
  fs.writeFileSync(file, out); console.log('edited', file)
}

const hub = 'src/app/cases/page.tsx'
edit(hub, 'slate-900/70', [
  ['<div className="rounded-3xl bg-white/15 p-4 backdrop-blur">', '<div className="rounded-3xl bg-slate-900/70 p-4 text-white shadow-xl ring-1 ring-white/25 backdrop-blur">'],
])
edit(hub, 'adminNeedsCases', [
  ['import { useCollection, useFirestore } from "@/firebase"\nimport { collection } from "firebase/firestore"',
   'import { useCollection, useDoc, useFirestore, useUser } from "@/firebase"\nimport { collection, doc } from "firebase/firestore"'],
  ['  const casesRef = useMemo(() => (!db ? null : collection(db, "cases")), [db])',
   '  const { user } = useUser()\n  const profileRef = useMemo(() => (!db || !user ? null : doc(db, "users", user.uid)), [db, user])\n  const { data: profile } = useDoc(profileRef)\n  const casesRef = useMemo(() => (!db ? null : collection(db, "cases")), [db])'],
  ['  const q = search.trim().toLowerCase()\n',
   '  const q = search.trim().toLowerCase()\n  const adminNeedsCases = (profile as any)?.role === "admin" && !loading && all.length < 300\n'],
  ['      {loading ? (\n        <div className="flex h-64',
   '      {adminNeedsCases && (\n        <Link href="/admin?ward=1" className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border-2 border-dashed border-rose-400 bg-rose-50 p-4 transition hover:bg-rose-100">\n          <div><p className="text-sm font-black text-rose-700">Admin: only {all.length} of 300 Ward Round cases exist</p><p className="text-xs font-medium text-rose-600">Open the generator, then click “Generate 100 cases” and “Generate 200 expert cases”.</p></div>\n          <span className="rounded-full bg-gradient-to-r from-rose-600 to-orange-500 px-4 py-2 text-xs font-black text-white shadow">Open generator →</span>\n        </Link>\n      )}\n\n      {loading ? (\n        <div className="flex h-64'],
])

const adm = 'src/app/admin/page.tsx'
edit(adm, 'Ward Round Cases (generate', [
  ['<Button onClick={() => { setIsManagingCases(true); fetchAllCases(); }} variant="outline" className="rounded-xl gap-2 glass">\n            <HelpCircle className="h-4 w-4" /> Manage Cases',
   '<Button onClick={() => { setIsManagingCases(true); fetchAllCases(); }} className="rounded-xl gap-2 bg-gradient-to-r from-rose-600 to-orange-500 text-white">\n            <HelpCircle className="h-4 w-4" /> Ward Round Cases (generate 100 / 200 expert)'],
])
edit(adm, 'wardAutoOpen', [
  ['  const profileRef = useMemo(() => (!db || !user) ? null : doc(db, \'users\', user.uid), [db, user])\n',
   '  const wardAutoOpen = useRef(false)\n  useEffect(() => {\n    if (wardAutoOpen.current || !user || typeof window === "undefined") return\n    if (new URLSearchParams(window.location.search).get("ward") === "1") { wardAutoOpen.current = true; setIsManagingCases(true); fetchAllCases() }\n  }, [user])\n  const profileRef = useMemo(() => (!db || !user) ? null : doc(db, \'users\', user.uid), [db, user])\n'],
])
