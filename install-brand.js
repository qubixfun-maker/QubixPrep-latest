#!/usr/bin/env node
// Copies the new QubixPrep logo files into public/brand and the root icon files. Changes nothing else.
const fs = require('fs'), path = require('path')
const root = process.cwd(), src = path.join(__dirname, 'brand-files')
const fail = (m) => { console.error('\nSTOPPED - nothing was changed.\n' + m + '\n'); process.exit(1) }
if (!fs.existsSync(path.join(root, 'package.json')) || !fs.existsSync(path.join(root, 'src'))) fail('Run this from the QubixPrep-latest folder.')
if (!fs.existsSync(src)) fail('The brand-files folder is missing. Unzip qubix-brand.zip into the QubixPrep-latest folder first.')
const pub = path.join(root, 'public'), brand = path.join(pub, 'brand')
fs.mkdirSync(brand, { recursive: true })
let n = 0
for (const f of fs.readdirSync(src)) { fs.copyFileSync(path.join(src, f), path.join(brand, f)); n++ }
// Favicons the browser looks for by default
fs.copyFileSync(path.join(src, 'favicon.ico'), path.join(pub, 'favicon.ico'))
fs.copyFileSync(path.join(src, 'apple-touch-icon.png'), path.join(pub, 'apple-touch-icon.png'))
// Next.js App Router also picks up src/app/favicon.ico and src/app/icon.png first, so replace those if present
const appDir = path.join(root, 'src', 'app')
const replaced = []
for (const [name, from] of [['favicon.ico', 'favicon.ico'], ['icon.png', 'icon-512.png'], ['apple-icon.png', 'apple-touch-icon.png'], ['opengraph-image.png', 'og-image.png'], ['twitter-image.png', 'og-image.png']]) {
  if (fs.existsSync(path.join(appDir, name))) { fs.copyFileSync(path.join(src, from), path.join(appDir, name)); replaced.push('src/app/' + name) }
}
console.log('DONE - copied ' + n + ' files into public/brand, and updated public/favicon.ico and public/apple-touch-icon.png.')
if (replaced.length) console.log('Also replaced: ' + replaced.join(', '))
console.log('NEXT: send me the output of the search command so I can switch the logo inside the app screens.')
