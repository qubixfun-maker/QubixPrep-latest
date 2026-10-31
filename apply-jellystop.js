// Run once from the project folder:  node apply-jellystop.js
// Adds the visible Stop button (chat header, floating button when the chat is closed, Playground page)
// and stops Jelly from starting to listen again after you press Stop.
// It checks every change first and writes nothing if a file looks different from what is expected.
const fs = require('fs')
const read = (p) => fs.readFileSync(p, 'utf8')
const problems = []
const writes = []

const IMPORT = 'import { JellyStopButton } from "@/components/jelly/JellyStopButton"\n'
const BTN = /^([ \t]*)<button aria-label=\{j\.voiceOn \? "Mute Jelly" : "Let Jelly speak"\}/m

function addImport(s) {
  if (s.includes('JellyStopButton"')) return s
  const m = s.match(/^(["']use client["'];?\r?\n)/)
  return m ? s.replace(m[1], m[1] + IMPORT) : IMPORT + s
}

// 1) Chat panel: Stop in the header + floating Stop when the panel is closed
{
  const p = 'src/components/jelly/JellyWidget.tsx'
  let s = read(p)
  if (s.includes('<JellyStopButton')) {
    console.log('widget already patched, skipping')
  } else {
    if (!BTN.test(s)) problems.push('JellyWidget: could not find the voice button')
    else s = s.replace(BTN, (all, indent) => `${indent}<JellyStopButton show={j.speaking} onStop={j.stopSpeaking} variant="header" />\n${all}`)
    const open = /^([ \t]*)<>\r?\n([ \t]*)\{j\.open && \(/m
    if (!open.test(s)) problems.push('JellyWidget: could not find the start of the panel')
    else s = s.replace(open, (all, a, b) => `${a}<>\n${b}{!j.open && j.active && <JellyStopButton show={j.speaking} onStop={j.stopSpeaking} variant="pill" />}\n${b}{j.open && (`)
    writes.push([p, addImport(s)])
  }
}

// 2) Jelly Playground page
{
  const p = 'src/app/jelly/page.tsx'
  let s = read(p)
  if (s.includes('<JellyStopButton')) {
    console.log('jelly page already patched, skipping')
  } else {
    if (!BTN.test(s)) problems.push('jelly page: could not find the voice button')
    else s = s.replace(BTN, (all, indent) => `${indent}<JellyStopButton show={j.speaking} onStop={j.stopSpeaking} variant="page" />\n${all}`)
    writes.push([p, addImport(s)])
  }
}

// 3) After a manual Stop, do not start listening again (conversation mode)
{
  const p = 'src/components/jelly/JellyProvider.tsx'
  let s = read(p)
  const from = 'onEnd: () => { setSpeaking(false); if (listenAfter && '
  if (s.includes('onEnd: (info) =>')) {
    console.log('provider already patched, skipping')
  } else {
    const n = s.split(from).length - 1
    if (n !== 1) problems.push(`JellyProvider: expected 1 onEnd handler, found ${n}`)
    else writes.push([p, s.replace(from, 'onEnd: (info) => { setSpeaking(false); if (!info?.stopped && listenAfter && ')])
  }
}

if (problems.length) {
  console.error('\nNOTHING WAS CHANGED. These did not match what I expected:')
  problems.forEach((x) => console.error(' -', x))
  console.error('\nPaste this output to Claude.')
  process.exit(1)
}
for (const [p, s] of writes) { fs.writeFileSync(p, s); console.log('updated', p) }
console.log('\nDONE.')
