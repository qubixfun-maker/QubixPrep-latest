const fs = require("fs")
const edit = (f, a, b) => { let s = fs.readFileSync(f, "utf8"); if (s.includes(b)) return console.log(f, "already"); if (!s.includes(a)) { console.error("anchor missing in", f); process.exit(1) } fs.writeFileSync(f, s.replace(a, b)); console.log(f, "done") }
edit("src/components/layout/app-sidebar.tsx", '{ title: "Clinical Cases", url: "/cases"', '{ title: "Ward Round", url: "/cases"')
edit("src/app/dashboard/page.tsx", '{ label: "Clinical Cases", desc: "Solve real patient scenarios"', '{ label: "Ward Round", desc: "100 live patient cases"')
edit("src/app/page.tsx", '{ name: "Clinical Cases", href: "/cases"', '{ name: "Ward Round", href: "/cases"')
edit("src/app/page.tsx", 'chip: "TRY A CASE"', 'chip: "100 LIVE CASES"')
