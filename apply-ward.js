// Ward Round: runs the three small edit scripts. New files come from the tarball.
const { execSync } = require("child_process")
for (const s of ["apply-ward-admin.js", "apply-ward-names.js"]) console.log(execSync("node " + s).toString().trim())
