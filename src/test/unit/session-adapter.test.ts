import type { SessionInfo } from "@opencode/client"
import { describe, expect, it } from "vitest"
import { sessionBelongsToLocation, sessionToLike } from "../../adapters/sessions/session.js"

const session = {
  id: "ses-1",
  parentID: "ses-root",
  projectID: "prj-1",
  agent: "backend-agent",
  model: { providerID: "anthropic", id: "test-model" },
  title: "Edit API",
  outcome: "succeeded",
  cost: 0.0421,
  tokens: { input: 100, output: 20, reasoning: 3, cache: { read: 5, write: 2 } },
  time: { created: 1000, updated: 2000 },
  location: { directory: "/fake/agent-monitor-fixtures" },
} as unknown as SessionInfo

describe("sessionBelongsToLocation", () => {
  const session = { location: { directory: "/fake/agent-monitor-fixtures" } } as unknown as import("@opencode/client").SessionInfo

  it("keeps sessions from the active directory", () => {
    expect(sessionBelongsToLocation(session, "/fake/agent-monitor-fixtures")).toBe(true)
  })

  it("drops sessions from other projects", () => {
    expect(sessionBelongsToLocation(session, "/fake/another-project")).toBe(false)
  })

  it("accepts all sessions when no directory is known", () => {
    expect(sessionBelongsToLocation(session, undefined)).toBe(true)
  })
})

describe("sessionToLike", () => {
  it("maps observed host session data without inventing fields", () => {
    expect(sessionToLike(session, "running")).toEqual({
      id: "ses-1",
      parentID: "ses-root",
      agent: "backend-agent",
      model: { providerID: "anthropic", id: "test-model" },
      title: "Edit API",
      outcome: "succeeded",
      status: "running",
      cost: 0.0421,
      tokens: session.tokens,
      time: session.time,
    })
  })

  it("leaves status unknown when the host does not report one", () => {
    expect(sessionToLike(session).status).toBeUndefined()
  })
})
