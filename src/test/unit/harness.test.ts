import path from "node:path"
import { describe, expect, it } from "vitest"
import {
  acceptanceCriteria,
  inspectHarness,
  outOfScope,
} from "../../adapters/harness/inspector.js"
import { groupChecksByEvidence, verificationRatio } from "../../application/harness.js"
import type { HarnessCheck } from "../../domain/harness.js"
import type { ProjectView, TestEvidence } from "../../domain/project.js"

const fixtureDirectory = path.resolve(process.cwd(), "agent-monitor-fixtures")
const project: ProjectView = {
  branch: "feat/monitor",
  changedFiles: [{ file: "src/api.ts", status: "modified" }],
  syncedAt: 1234,
}
const evidence: TestEvidence[] = [
  { command: "npm test", status: "passed", evidence: "observed", timestamp: 1 },
]

describe("harness helpers", () => {
  it("detects declared acceptance criteria", () => {
    expect(acceptanceCriteria("## Acceptance Criteria\n- one\n- two")?.evidence).toBe("observed")
    expect(acceptanceCriteria("no criteria")?.evidence).toBe("failed")
    expect(acceptanceCriteria(undefined)?.evidence).toBe("missing")
  })

  it("flags changed files matching declared out-of-scope paths", () => {
    const spec = "## Out of scope\n- `vendor/**`\n- `secrets/*`"
    expect(outOfScope(spec, [{ file: "vendor/lib.ts", status: "added" }]).evidence).toBe("failed")
    expect(outOfScope(spec, [{ file: "src/api.ts", status: "modified" }]).evidence).toBe("observed")
    expect(outOfScope(undefined, []).evidence).toBe("missing")
  })
})

describe("harness grouping", () => {
  const checks: HarnessCheck[] = [
    { id: "a", title: "A", evidence: "verified", detail: "confirmed" },
    { id: "b", title: "B", evidence: "observed", detail: "seen" },
    { id: "c", title: "C", evidence: "declared", detail: "agent said" },
    { id: "d", title: "D", evidence: "missing", detail: "no file" },
    { id: "e", title: "E", evidence: "failed", detail: "check failed" },
  ]

  it("groups every check by evidence level", () => {
    const groups = groupChecksByEvidence(checks)
    expect(Object.values(groups).flat()).toHaveLength(checks.length)
    expect(groups.verified.map((check) => check.id)).toEqual(["a"])
    expect(groups.declared.map((check) => check.id)).toEqual(["c"])
  })

  it("computes the independently evidenced ratio", () => {
    expect(verificationRatio({ verified: 1, observed: 1, declared: 1, missing: 1, failed: 1 })).toBeCloseTo(0.4)
    expect(verificationRatio({ verified: 0, observed: 0, declared: 0, missing: 0, failed: 0 })).toBe(0)
  })
})

describe("inspectHarness", () => {
  it("produces evidence-based checks for the fake repository", async () => {
    const report = await inspectHarness({ directory: fixtureDirectory, project, evidence })
    const byID = new Map(report.checks.map((entry) => [entry.id, entry]))

    expect(byID.get("instructions")?.evidence).toBe("observed")
    expect(byID.get("specification")?.evidence).toBe("observed")
    expect(byID.get("tests")?.evidence).toBe("observed")
    expect(byID.get("acceptance")?.evidence).toBe("observed")
    expect(byID.get("test-execution")?.evidence).toBe("verified")
    expect(byID.get("approval")?.evidence).toBe("observed")
    expect(report.scores.verified).toBeGreaterThan(0)
  })

  it("reports missing evidence when no local location exists", async () => {
    const report = await inspectHarness({ project: { changedFiles: [] }, evidence: [] })
    expect(report.checks).toHaveLength(1)
    expect(report.checks[0].evidence).toBe("missing")
  })
})
