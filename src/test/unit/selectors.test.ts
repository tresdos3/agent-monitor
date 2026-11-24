import { describe, expect, it } from "vitest"
import hierarchy from "../../../agent-monitor-fixtures/fixtures/agents/scenario-1-hierarchy.json"
import stale from "../../../agent-monitor-fixtures/fixtures/failures/scenario-8-stale-session.json"
import {
  isStale,
  selectAgentTree,
  selectCurrentActivity,
  selectOverview,
} from "../../application/selectors.js"
import { buildAgentTree, type SessionLike } from "../../application/reducer.js"
import { normalizeEvents } from "../../application/normalize.js"
import { EMPTY_TIMELINE, type NormalizedEvent } from "../../domain/model.js"

const sessions = hierarchy.sessions as unknown as SessionLike[]
const nodes = buildAgentTree(sessions)

function event(id: string, created: number, type: string, data: Record<string, unknown>): NormalizedEvent {
  const normalized = normalizeEvents([{ id, created, type, data }])[0]
  if (!normalized) throw new Error(`unexpected dropped event: ${type}`)
  return normalized
}

describe("selectOverview", () => {
  it("counts observed statuses and derived waiting separately", () => {
    expect(selectOverview(nodes)).toEqual({
      running: 2,
      waiting: 0,
      completed: 1,
      failed: 0,
      unknown: 1,
    })
  })

  it("treats a pending permission as derived waiting", () => {
    const pending = new Map([["ses-test", 1]])
    expect(selectOverview(nodes, pending).waiting).toBe(1)
    expect(selectOverview(nodes, pending).running).toBe(2)
  })
})

describe("selectAgentTree", () => {
  it("places children under their parent with depth", () => {
    expect(selectAgentTree(nodes).map((entry) => [entry.node.id, entry.depth])).toEqual([
      ["ses-orchestrator", 0],
      ["ses-backend", 1],
      ["ses-test", 1],
      ["ses-docs", 1],
    ])
  })
})

describe("selectCurrentActivity", () => {
  it("derives tool from observed data and file as inferred", () => {
    const timeline = {
      ...EMPTY_TIMELINE,
      events: [
        event("e1", 1000, "session.execution.started", { sessionID: "ses-backend" }),
        event("e2", 2000, "session.tool.input.started", {
          sessionID: "ses-backend",
          name: "edit",
        }),
        event("e3", 3000, "session.tool.called", {
          sessionID: "ses-backend",
          input: { filePath: "src/api.ts" },
        }),
        event("e4", 4000, "session.execution.succeeded", { sessionID: "ses-backend" }),
      ],
    }

    expect(selectCurrentActivity("ses-backend", timeline, nodes)).toEqual({
      sessionID: "ses-backend",
      agent: "backend-agent",
      tool: { name: "edit", evidence: "observed" },
      file: { path: "src/api.ts", evidence: "inferred" },
      durationMs: 3000,
    })
  })

  it("returns undefined when nothing is observable", () => {
    expect(selectCurrentActivity("missing", EMPTY_TIMELINE, nodes)).toBeUndefined()
  })
})

describe("isStale", () => {
  it("detects a stale session from the fake fixture", () => {
    const staleNode = buildAgentTree([
      { id: stale.sessionID, status: "idle", time: { updated: stale.lastActivity } },
    ])[0]
    expect(isStale(staleNode, stale.lastActivity + stale.staleAfterMs + 1, stale.staleAfterMs)).toBe(true)
    expect(isStale(staleNode, stale.lastActivity + 1000, stale.staleAfterMs)).toBe(false)
  })
})
