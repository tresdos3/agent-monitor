import { readFile, readdir } from "node:fs/promises"
import path from "node:path"
import type { HarnessCheck, HarnessReport, HarnessScores } from "../../domain/harness.js"
import type { EvidenceLevel } from "../../domain/model.js"
import type { ProjectView, TestEvidence } from "../../domain/project.js"

export interface InspectionInput {
  readonly directory?: string
  readonly project: ProjectView
  readonly evidence: readonly TestEvidence[]
}

interface FileRead {
  readonly text?: string
  readonly level: EvidenceLevel
}

async function readFileSafe(directory: string, relative: string): Promise<FileRead> {
  try {
    return { text: await readFile(path.join(directory, relative), "utf8"), level: "observed" }
  } catch (cause) {
    const code = (cause as { code?: string }).code
    return { level: code === "ENOENT" ? "missing" : "failed" }
  }
}

async function firstFile(directory: string, candidates: readonly string[]): Promise<FileRead> {
  let sawFailure = false
  for (const candidate of candidates) {
    const result = await readFileSafe(directory, candidate)
    if (result.text !== undefined) return { text: result.text, level: "observed" }
    if (result.level === "failed") sawFailure = true
  }
  return { level: sawFailure ? "failed" : "missing" }
}

function check(id: string, title: string, level: EvidenceLevel, detail: string, resource?: string): HarnessCheck {
  return { id, title, evidence: level, detail, resource }
}

export function acceptanceCriteria(spec: string | undefined): HarnessCheck {
  if (spec === undefined) return check("acceptance", "Acceptance criteria", "missing", "No project specification found")
  const match = /^#{1,4}\s*Acceptance Criteria\s*$/im.exec(spec)
  if (!match) return check("acceptance", "Acceptance criteria", "failed", "No acceptance criteria section found")
  const after = spec.slice(match.index + match[0].length)
  const items = after
    .split(/\n#{1,4}\s/)[0]
    .split("\n")
    .filter((line) => /^\s*(?:[-*]|\d+\.)\s+/.test(line)).length
  if (items === 0) return check("acceptance", "Acceptance criteria", "failed", "Acceptance criteria section is empty")
  return check("acceptance", "Acceptance criteria", "observed", `${items} criteria declared`)
}

async function tests(directory: string): Promise<HarnessCheck> {
  const pkg = await readFileSafe(directory, "package.json")
  if (pkg.text === undefined) return check("tests", "Tests", pkg.level, "No package.json found", "package.json")

  let hasTestScript = false
  try {
    const parsed = JSON.parse(pkg.text) as { scripts?: Record<string, unknown> }
    hasTestScript = typeof parsed.scripts?.test === "string"
  } catch {
    return check("tests", "Tests", "failed", "package.json is not valid JSON", "package.json")
  }
  if (!hasTestScript) return check("tests", "Tests", "failed", "No test script declared", "package.json")

  try {
    const entries = await readdir(path.join(directory, "tests"))
    const count = entries.filter((entry) => /\.(test|spec)\.[cm]?[jt]sx?$/.test(entry)).length
    if (count === 0) return check("tests", "Tests", "failed", "No test files found", "tests/")
    return check("tests", "Tests", "observed", `${count} test files, test script declared`, "tests/")
  } catch {
    return check("tests", "Tests", "failed", "No test directory found", "tests/")
  }
}

function matchesDeclaredPath(file: string, declared: string): boolean {
  const base = declared.replace(/\/\*\*$|\/\*$/, "")
  return file === base || file.startsWith(`${base}/`) || file.includes(base)
}

export function outOfScope(
  spec: string | undefined,
  changedFiles: readonly { readonly file: string; readonly status?: string }[],
): HarnessCheck {
  if (spec === undefined) return check("scope", "Out-of-scope modifications", "missing", "No project specification found")
  const match = /^#{1,4}\s*Out of scope\s*$/im.exec(spec)
  if (!match) return check("scope", "Out-of-scope modifications", "missing", "No out-of-scope declaration found")
  const section = spec.slice(match.index + match[0].length).split(/\n#{1,4}\s/)[0]
  const paths = [...section.matchAll(/`([^`]+)`/g)]
    .map((item) => item[1])
    .filter((value) => value.includes("/") || value.includes("."))
  if (paths.length === 0) return check("scope", "Out-of-scope modifications", "missing", "No declared out-of-scope paths")

  const matches = changedFiles.filter((file) => paths.some((declared) => matchesDeclaredPath(file.file, declared)))
  if (matches.length > 0) {
    return check("scope", "Out-of-scope modifications", "failed", `Changed paths match out-of-scope list: ${matches.map((m) => m.file).join(", ")}`)
  }
  return check("scope", "Out-of-scope modifications", "observed", "No changed file matched the declared out-of-scope paths")
}

function approvalCheckpoints(instructions: string | undefined, spec: string | undefined): HarnessCheck {
  const sources = [instructions, spec].filter((value): value is string => value !== undefined)
  if (sources.length === 0) return check("approval", "Human approval checkpoints", "missing", "No instruction or spec files found")
  const found = sources.some((text) =>
    /human approval|approval checkpoint|requires approval|approve.*human|human.*approve/i.test(text),
  )
  return found
    ? check("approval", "Human approval checkpoints", "observed", "Approval language found in project instructions")
    : check("approval", "Human approval checkpoints", "failed", "No approval checkpoint declared")
}

function score(checks: readonly HarnessCheck[]): HarnessScores {
  const scores = { verified: 0, observed: 0, declared: 0, missing: 0, failed: 0 }
  for (const entry of checks) scores[entry.evidence]++
  return scores
}

/** Evidence-based harness inspection. Reads only local files, never prompts. */
export async function inspectHarness(input: InspectionInput): Promise<HarnessReport> {
  const checks: HarnessCheck[] = []

  if (!input.directory) {
    return {
      checks: [check("location", "Project location", "missing", "No local location available")],
      scores: score([]),
      generatedAt: Date.now(),
    }
  }

  const directory = input.directory
  const instructions = await readFileSafe(directory, "AGENTS.md")
  checks.push(
    check(
      "instructions",
      "Project instructions",
      instructions.level,
      instructions.text ? "AGENTS.md found" : "No AGENTS.md found",
      "AGENTS.md",
    ),
  )

  const spec = await firstFile(directory, ["PROJECT_SPEC.md", "docs/PRODUCT_SPEC.md"])
  checks.push(
    check(
      "specification",
      "Project specification",
      spec.level,
      spec.text ? "Specification file found" : "No specification file found",
    ),
  )

  const plan = await firstFile(directory, ["IMPLEMENTATION_PLAN.md", "docs/IMPLEMENTATION_PLAN.md"])
  checks.push(
    check("plan", "Implementation plan", plan.level, plan.text ? "Plan file found" : "No implementation plan found"),
  )

  checks.push(acceptanceCriteria(spec.text))
  checks.push(await tests(directory))

  const executed = input.evidence.filter((item) => item.evidence === "observed" && item.status !== "unknown")
  checks.push(
    check(
      "test-execution",
      "Observed test/build execution",
      executed.length > 0 ? "verified" : "missing",
      executed.length > 0 ? `${executed.length} observed command outcome(s)` : "No observed test/build execution",
    ),
  )

  changedFiles: {
    if (input.project.syncedAt === undefined) {
      checks.push(check("changes", "Changed files", "missing", "VCS status unavailable"))
    } else {
      checks.push(
        check(
          "changes",
          "Changed files",
          "observed",
          input.project.changedFiles.length === 0
            ? "No changed files observed"
            : `${input.project.changedFiles.length} changed file(s) observed`,
        ),
      )
    }
  }

  checks.push(outOfScope(spec.text, input.project.changedFiles))
  checks.push(approvalCheckpoints(instructions.text, spec.text))

  return { checks, scores: score(checks), generatedAt: Date.now() }
}
