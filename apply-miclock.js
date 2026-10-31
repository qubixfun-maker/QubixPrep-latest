// Idempotent: stops the OSCE mic and the "Hey Jelly" listener from fighting over the microphone.
const fs = require('fs')
const EDITS = {
 "src/components/osce/voice.tsx": [
  [
   "import { splitSentences, type Gender } from \"@/lib/osce/shared\"\n",
   "import { splitSentences, type Gender } from \"@/lib/osce/shared\"\nimport { micAcquire } from \"@/lib/mic-lock\"\n"
  ],
  [
   "  const want = useRef(false); const timer = useRef<any>(null); const startedAt = useRef(0)\n",
   "  const want = useRef(false); const timer = useRef<any>(null); const startedAt = useRef(0)\n  const release = useRef<null | (() => void)>(null)\n"
  ],
  [
   "    setListening(false); clearTimeout(timer.current)\n    const t = `${finalRef.current} ${interimRef.current}`.trim()",
   "    setListening(false); clearTimeout(timer.current); release.current?.(); release.current = null\n    const t = `${finalRef.current} ${interimRef.current}`.trim()"
  ],
  [
   "    return () => { want.current = false; clearTimeout(timer.current); try { recRef.current?.abort() } catch {} }\n  }, [])",
   "    return () => { want.current = false; clearTimeout(timer.current); release.current?.(); release.current = null; try { recRef.current?.abort() } catch {} }\n  }, [])"
  ],
  [
   "    finalRef.current = \"\"; interimRef.current = \"\"; setInterim(\"\"); setError(\"\"); heard.current = false\n    try {\n",
   "    finalRef.current = \"\"; interimRef.current = \"\"; setInterim(\"\"); setError(\"\"); heard.current = false\n    // tell the \"Hey Jelly\" listener to let go of the microphone first (Chrome allows one speech recognizer at a time)\n    release.current?.(); release.current = micAcquire()\n    await new Promise((r) => setTimeout(r, 400))\n    try {\n"
  ],
  [
   "          return\n        }\n      }\n      const r = make();",
   "          release.current?.(); release.current = null\n          return\n        }\n      }\n      const r = make();"
  ],
  [
   "    } catch (e: any) { want.current = false; setListening(false); setError(\"Could not start",
   "    } catch (e: any) { want.current = false; setListening(false); release.current?.(); release.current = null; setError(\"Could not start"
  ]
 ],
 "src/components/jelly/useWakeWord.ts": [
  [
   "import { useEffect, useRef, useState } from \"react\"\n",
   "import { useEffect, useRef, useState } from \"react\"\nimport { useMicBusy } from \"@/lib/mic-lock\"\n"
  ],
  [
   "  const active = enabled && !paused\n",
   "  const micBusy = useMicBusy() // another part of the app (for example the OSCE mic) is using speech recognition\n  const active = enabled && !paused && !micBusy\n"
  ]
 ]
}
const NEW = {
 "src/lib/mic-lock.ts": "\"use client\"\n\nimport { useSyncExternalStore } from \"react\"\n\n/**\n * Chrome lets only one speech recognizer run at a time. Anything that wants the microphone calls\n * micAcquire() and calls the returned function when it is done; the always-on \"Hey Jelly\" listener\n * watches this and steps aside while the microphone is taken.\n */\nlet holders = 0\nconst subs = new Set<() => void>()\nconst emit = () => subs.forEach((f) => f())\n\nexport function micAcquire(): () => void {\n  holders++; emit()\n  let done = false\n  return () => { if (done) return; done = true; holders = Math.max(0, holders - 1); emit() }\n}\n\nexport function useMicBusy(): boolean {\n  return useSyncExternalStore(\n    (cb) => { subs.add(cb); return () => { subs.delete(cb) } },\n    () => holders > 0,\n    () => false,\n  )\n}\n"
}
for (const f of Object.keys(EDITS)) {
  let s = fs.readFileSync(f, 'utf8'); let bad = false, changed = false
  for (const [a, b] of EDITS[f]) {
    if (s.includes(b)) continue
    if (!s.includes(a)) { console.log('MISSING anchor in', f, ':', a.slice(0, 60).replace(/\n/g, ' ')); bad = true; continue }
    s = s.replace(a, () => b); changed = true
  }
  if (!bad && changed) { fs.writeFileSync(f, s); console.log('edited', f) } else if (!bad) console.log('skip  ', f)
  else process.exitCode = 1
}
for (const f of Object.keys(NEW)) { fs.writeFileSync(f, NEW[f]); console.log('wrote ', f) }
