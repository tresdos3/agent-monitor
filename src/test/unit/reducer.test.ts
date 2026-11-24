import { describe, expect, it } from "vitest"
import { appendEvent, buildAgentTree, mapSessionStatus, type SessionLike } from "../../application/reducer.js"
import { EMPTY_TIMELINE, type NormalizedEvent } from "../../domain/model.js"

function event(id: string): NormalizedEvent {
  return {
    id,
    created: Number(id),
    kind: "session.created",
    sourceType: "session.created",
    title: "Session created",
    severity: "info",
    data: {},
  }
}

describe("appendEvent", () => {
  it("keeps a bounded history, dropping oldest first", () => {
    let state = appendEvent(EMPTY_TIMELINE, event("1"), 2)
    state = appendEvent(state, event("2"), 2)
    state = appendEvent(state, event("3"), 2)
    expect(state.events.map((entry) => entry.id)).toEqual(["2", "3"])
  })
})

describe("mapSessionStatus", () => {
  it("maps V2 status values", () => {
    expect(mapSessionStatus("busy")).toEqual({ status: "running" })
    expect(mapSessionStatus("running")).toEqual({ status: "running" })
    expect(mapSessionStatus("retry")).toEqual({ status: "running", note: "retry" })
    expect(mapSessionStatus("idle")).toEqual({ status: "idle" })
  })
})

describe("buildAgentTree with live subagent state", () => {
  it("prefers event overrides and active sessions over stale cache", () => {
    const sessions: SessionLike[] = [{ id: "ses-child", agent: "backend", status: "idle" }]
    const nodes = buildAgentTree(sessions, {
      statusOverrides: new Map([["ses-child", "running"]]),
      statusNotes: new Map([["ses-child", "retry"]]),
      activeSessions: new Set(["ses-child"]),
    })
    expect(nodes[0].status).toBe("running")
    expect(nodes[0].statusNote).toBe("retry")
    expect(nodes[0].statusEvidence).toBe("observed")
  })

  it("prefers a durable outcome over a stale running override", () => {
    const nodes = buildAgentTree(
      [{ id: "ses-1", agent: "backend", outcome: "succeeded", status: "idle" }],
      { statusOverrides: new Map([["ses-1", "running"]]), statusNotes: new Map([["ses-1", "completed"]]) },
    )
    expect(nodes[0].status).toBe("completed")
    expect(nodes[0].statusNote).toBe("completed")
  })

  it("uses active-session data when no event override exists", () => {
    const nodes = buildAgentTree([{ id: "ses-child", status: "idle" }], {
      activeSessions: new Set(["ses-child"]),
    })
    expect(nodes[0].status).toBe("running")
  })
})

describe("buildAgentTree", () => {
  const sessions: SessionLike[] = [
    {
      id: "root",
      agent: "orchestrator",
      model: { providerID: "anthropic", id: "test-model" },
      title: "Orchestrate",
      status: "running",
      tokens: { input: 10, output: 4, reasoning: 1, cache: { read: 2, write: 3 } },
      cost: 0.01,
    },
    { id: "child-1", parentID: "root", agent: "backend-agent", outcome: "failed" },
    { id: "child-2", parentID: "root", agent: "docs-agent", outcome: "succeeded" },
    { id: "child-3", parentID: "root", agent: "test-agent" },
  ]

  it("derives status only from observed session data", () => {
    const tree = buildAgentTree(sessions)
    expect(tree.map((node) => [node.id, node.status, node.statusEvidence])).toEqual([
      ["root", "running", "observed"],
      ["child-1", "failed", "observed"],
      ["child-2", "completed", "observed"],
      ["child-3", "unknown", "missing"],
    ])
  })

  it("never invents a waiting state", () => {
    const tree = buildAgentTree(sessions)
    expect(tree.some((node) => node.status === "waiting")).toBe(false)
  })

  it("preserves parent links and converts token usage", () => {
    const tree = buildAgentTree(sessions)
    expect(tree[1].parentID).toBe("root")
    expect(tree[0].tokens).toEqual({
      input: 10,
      output: 4,
      reasoning: 1,
      cacheRead: 2,
      cacheWrite: 3,
    })
    expect(tree[0].label).toBe("Orchestrate")
    expect(tree[0].model).toBe("anthropic/test-model")
  })
})
