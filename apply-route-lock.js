// Wraps page content in PlanRouteGuard (locks Spotters, Quick Cards, Top 100, Med Stories, Arena, AI Tools for free users)
const fs = require("fs"), path = require("path")
const f = path.join("src", "components", "layout", "layout-shell.tsx")
if (!fs.existsSync(f)) { console.log("STOP: " + f + " not found"); process.exit(1) }
let s = fs.readFileSync(f, "utf8")
if (s.includes("PlanRouteGuard")) { console.log("Already applied."); process.exit(0) }
const crlf = s.includes("\r\n"); if (crlf) s = s.replace(/\r\n/g, "\n")
const re = /(<main[^>]*>\s*)\{children\}(\s*<\/main>)/
if (!re.test(s)) { console.log("STOP: could not find <main>{children}</main> in layout-shell.tsx. Nothing changed."); process.exit(1) }
const imp = 'import { PlanRouteGuard } from "@/components/layout/plan-route-guard"\n'
const firstCode = s.search(/^(const|function|export|type|let) /m)
const lastImport = [...s.matchAll(/^import .*$/gm)].filter(m => firstCode < 0 || m.index < firstCode).pop()
if (!lastImport) { console.log("STOP: no import block found. Nothing changed."); process.exit(1) }
s = s.slice(0, lastImport.index + lastImport[0].length) + "\n" + imp.trimEnd() + s.slice(lastImport.index + lastImport[0].length)
s = s.replace(re, "$1<PlanRouteGuard>{children}</PlanRouteGuard>$2")
if (crlf) s = s.replace(/\n/g, "\r\n")
fs.writeFileSync(f, s)
console.log("Done: route lock added to layout-shell.tsx")
