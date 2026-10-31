// Adds "Spot & Identify" to the sidebar. Safe to run twice.
const fs = require("fs")
const p = "src/components/layout/app-sidebar.tsx"
let s = fs.readFileSync(p, "utf8")
if (s.includes('url: "/spotters"')) { console.log("skip (already added)"); process.exit(0) }
const a = "CalendarDays, Timer,\n} from \"lucide-react\""
const b = '    { title: "OSCE Stations", url: "/osce-stations", icon: Stethoscope },\n'
if (!s.includes(a) || !s.includes(b)) { console.log("MISSING anchor - tell Claude"); process.exit(1) }
s = s.replace(a, "CalendarDays, Timer, Microscope,\n} from \"lucide-react\"")
s = s.replace(b, b + '    { title: "Spot & Identify", url: "/spotters", icon: Microscope },\n')
fs.writeFileSync(p, s); console.log("edited", p)
