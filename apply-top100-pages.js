// Adds the Firestore rules for the new Top 100 topic sheets (idempotent).
const fs = require("fs")
const f = "firestore.rules"
if (!fs.existsSync(f)) { console.log("STOP: firestore.rules not found."); process.exit(1) }
let s = fs.readFileSync(f, "utf8"); const crlf = s.includes("\r\n"); if (crlf) s = s.replace(/\r\n/g, "\n")
if (s.includes("top100Pages")) { console.log("Rules already added."); process.exit(0) }
const anchor = /(\n\s*match \/databases\/\{database\}\/documents \{\n)/
if (!anchor.test(s)) { console.log("STOP: could not find the main rules block. Nothing changed."); process.exit(1) }
const block = fs.readFileSync("rules-block.txt", "utf8").replace(/\r\n/g, "\n")
s = s.replace(anchor, (m) => m + "\n" + block + "\n")
fs.writeFileSync(f, crlf ? s.replace(/\n/g, "\r\n") : s)
console.log("Done: Top 100 rules added to firestore.rules. Now run: firebase deploy --only firestore:rules")
