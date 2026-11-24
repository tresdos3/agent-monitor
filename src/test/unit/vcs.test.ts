import { describe, expect, it } from "vitest"
import { projectFromVcs } from "../../adapters/git/vcs.js"

describe("projectFromVcs", () => {
  it("maps branch and wrapped status data", () => {
    const view = projectFromVcs(
      { branch: { current: "feat/monitor", default: "main" } },
      {
        data: [
          { file: "src/api.ts", status: "modified", additions: 12, deletions: 3 },
          { file: "src/new.ts", status: "added", additions: 40, deletions: 0 },
          { file: "old.md", status: "deleted", additions: 0, deletions: 5 },
        ],
      },
      1234,
    )

    expect(view.branch).toBe("feat/monitor")
    expect(view.defaultBranch).toBe("main")
    expect(view.syncedAt).toBe(1234)
    expect(view.changedFiles.map((file) => [file.file, file.status])).toEqual([
      ["src/api.ts", "modified"],
      ["src/new.ts", "added"],
      ["old.md", "deleted"],
    ])
  })

  it("uses Unavailable-ready empty values when VCS is missing", () => {
    expect(projectFromVcs(undefined, undefined, 1)).toEqual({
      branch: undefined,
      defaultBranch: undefined,
      changedFiles: [],
      syncedAt: 1,
    })
  })

  it("ignores unknown file statuses", () => {
    expect(projectFromVcs(undefined, { data: [{ file: "x", status: "renamed" }] }).changedFiles).toEqual([])
  })
})
