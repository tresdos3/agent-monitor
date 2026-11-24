import { describe, expect, it } from "vitest"
import { testEvidenceFromEvents } from "../../adapters/project/test-evidence.js"
import { normalizeEvents } from "../../application/normalize.js"

const events = normalizeEvents([
  {
    id: "e1",
    created: 1000,
    type: "session.tool.called",
    data: { id: "call-1", sessionID: "ses-1", input: { command: "npm test" }, executed: true },
  },
  {
    id: "e2",
    created: 2000,
    type: "session.tool.success",
    data: { id: "call-1", sessionID: "ses-1", executed: true },
  },
  {
    id: "e3",
    created: 3000,
    type: "session.tool.called",
    data: { id: "call-2", sessionID: "ses-1", input: { command: "npm run build" }, executed: true },
  },
  {
    id: "e4",
    created: 4000,
    type: "session.tool.failed",
    data: { id: "call-2", sessionID: "ses-1", executed: true },
  },
  {
    id: "e5",
    created: 5000,
    type: "session.tool.called",
    data: { id: "call-3", sessionID: "ses-1", input: { command: "git status" }, executed: true },
  },
])

describe("testEvidenceFromEvents", () => {
  it("records only observed test/build command outcomes", () => {
    expect(testEvidenceFromEvents(events)).toEqual([
      {
        command: "npm test",
        sessionID: "ses-1",
        status: "passed",
        evidence: "observed",
        timestamp: 2000,
      },
      {
        command: "npm run build",
        sessionID: "ses-1",
        status: "failed",
        evidence: "observed",
        timestamp: 4000,
      },
    ])
  })

  it("never treats agent text as verified evidence", () => {
    const declared = normalizeEvents([
      { id: "x", created: 1, type: "session.text.started", data: { sessionID: "ses-1", text: "all tests pass" } },
    ])
    expect(testEvidenceFromEvents(declared)).toEqual([])
  })
})
