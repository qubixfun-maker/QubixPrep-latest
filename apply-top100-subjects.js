// The zip already contains the new files; this just confirms they are in place.
const fs = require("fs"), path = require("path")
const a = path.join("src", "app", "top-100", "page.tsx"), b = path.join("src", "app", "top-100", "[id]", "page.tsx")
const ok = fs.existsSync(a) && fs.readFileSync(a, "utf8").includes("SUBJECT_STYLE") && fs.existsSync(b) && fs.readFileSync(b, "utf8").includes("pinch")
console.log(ok ? "Done: subject buttons + new zoom are in place." : "Files missing. Run this from the project root after unzip.")
