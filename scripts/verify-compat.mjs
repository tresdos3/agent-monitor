import { execFileSync } from "node:child_process"
import { readFileSync } from "node:fs"

const packageJson = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"))
const expected = packageJson.dependencies?.["@opencode/plugin"]

if (!expected) {
  console.error("verify:compat: @opencode/plugin is not a pinned dependency")
  process.exit(1)
}

let output
try {
  output = execFileSync("opencode", ["--version"], { encoding: "utf8" }).trim()
} catch {
  console.error("verify:compat: could not run `opencode --version`")
  process.exit(1)
}

const match = /v?(\d+\.\d+\.\d+)/.exec(output)
if (!match) {
  console.error(`verify:compat: could not parse version from "${output}"`)
  process.exit(1)
}

const installed = match[1]
if (installed !== expected.replace(/^v/, "")) {
  console.error(`verify:compat: host ${installed} does not match @opencode/plugin ${expected}`)
  process.exit(1)
}

console.log(`verify:compat: host ${installed} matches @opencode/plugin ${expected}`)
