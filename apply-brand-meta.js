#!/usr/bin/env node
// Switches the browser tab icon, phone home-screen icon, Google/WhatsApp share image and app manifest to the new logo.
// Checks first; changes nothing on a mismatch. Safe to run twice.
const fs = require('fs'), path = require('path')
const root = process.cwd(), src = path.join(__dirname, 'brand-files')
const fail = (m) => { console.error('\nSTOPPED - nothing was changed.\n' + m + '\n'); process.exit(1) }
const P = (p) => path.join(root, p)
const rd = (p) => { const raw = fs.readFileSync(P(p), 'utf8'); return { crlf: raw.includes('\r\n'), s: raw.replace(/\r\n/g, '\n') } }
const wr = (p, o) => fs.writeFileSync(P(p), o.crlf ? o.s.replace(/\n/g, '\r\n') : o.s)
if (!fs.existsSync(src)) fail('The brand-files folder is missing. Unzip qubix-brand2.zip into the QubixPrep-latest folder first.')
for (const f of ['src/app/layout.tsx', 'public/manifest.json', 'public/icons']) if (!fs.existsSync(P(f))) fail('Run this from the QubixPrep-latest folder. Missing ' + f)

const steps = []

// layout.tsx metadata
const L = rd('src/app/layout.tsx')
if (!L.s.includes('metadataBase')) {
  const old = `  manifest: '/manifest.json',
  icons: {
    icon: '/icons/favicon-32.png',
    apple: '/icons/apple-touch-icon.png',
  },
`
  if (L.s.split(old).length - 1 !== 1) fail('layout.tsx: the icons block is not as expected.')
  const nw = `  metadataBase: new URL('https://qubixprep.com'),
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icons/favicon-32.png?v=2', sizes: '32x32', type: 'image/png' },
      { url: '/icons/icon-192.png?v=2', sizes: '192x192', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: '/icons/apple-touch-icon.png?v=2',
  },
  openGraph: {
    title: 'QubixPrep - AI Medical Learning Platform',
    description: 'Notes, QBank, PYQs and full-length Grand Tests for MBBS and NEET-PG.',
    url: 'https://qubixprep.com',
    siteName: 'QubixPrep',
    images: [{ url: '/brand/og-image.png', width: 1200, height: 630, alt: 'QubixPrep' }],
    type: 'website',
  },
  twitter: { card: 'summary_large_image', title: 'QubixPrep', images: ['/brand/og-image.png'] },
`
  L.s = L.s.replace(old, nw)
  steps.push(() => wr('src/app/layout.tsx', L))
}

// manifest colours
const M = rd('public/manifest.json')
if (M.s.includes('"#0A0A0F"')) { M.s = M.s.replace('"background_color": "#0A0A0F"', '"background_color": "#0d1b31"'); steps.push(() => wr('public/manifest.json', M)) }

// copy icons
steps.push(() => {
  for (const f of ['apple-touch-icon.png', 'favicon-32.png', 'icon-192.png', 'icon-512.png', 'icon-maskable-192.png', 'icon-maskable-512.png']) fs.copyFileSync(path.join(src, f), P('public/icons/' + f))
  fs.mkdirSync(P('public/brand'), { recursive: true })
  fs.copyFileSync(path.join(src, 'og-image.png'), P('public/brand/og-image.png'))
  fs.copyFileSync(path.join(src, 'favicon.ico'), P('public/favicon.ico'))
  fs.copyFileSync(path.join(src, 'favicon.ico'), P('src/app/favicon.ico'))
  fs.copyFileSync(path.join(src, 'apple-touch-icon.png'), P('public/apple-touch-icon.png'))
})
steps.forEach((f) => f())
console.log('DONE - tab icon, home-screen icons, share image and manifest now use the new logo.')
console.log('NEXT: rm -rf .next && npx tsc --noEmit, then send me the sidebar lines so I can switch the logo inside the app.')
