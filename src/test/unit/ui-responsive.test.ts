import path from "node:path"
import { describe, expect, it } from "vitest"
import hierarchy from "../../../agent-monitor-fixtures/fixtures/agents/scenario-1-hierarchy.json"
import stale from "../../../agent-monitor-fixtures/fixtures/failures/scenario-8-stale-session.json"
import missingUsage from "../../../agent-monitor-fixtures/fixtures/usage/scenario-7-missing-usage.json"
import { buildAgentTree, type SessionLike } from "../../application/reducer.js"
import { selectAgentTree, selectOverview } from "../../application/selectors.js"
import { normalizeEvents } from "../../application/normalize.js"
import { appendUnique, mergeHistories } from "../../application/timeline.js"
import { estimateCost } from "../../adapters/usage/pricing.js"
import { usageFromTokens } from "../../adapters/usage/usage.js"
import { compactNumber } from "../../ui/components/format.js"
import { allowTwoColumns, layoutMode, metricColumns } from "../../ui/layout.js"
import { EMPTY_TIMELINE, type NormalizedEvent } from "../../domain/model.js"

const sessions = hierarchy.sessions as unknown as SessionLike[]

describe("responsive layout", () => {
  it("classifies wide, medium, and narrow widths", () => {
    expect(layoutMode(120)).toBe("wide")
    expect(layoutMode(80)).toBe("medium")
    expect(layoutMode(50)).toBe("narrow")
    expect(allowTwoColumns(120)).toBe(true)
    expect(allowTwoColumns(50)).toBe(false)
  })

  it("reduces metric columns as width shrinks", () => {
    expect(metricColumns(120)).toBe(4)
    expect(metricColumns(80)).toBe(2)
    expect(metricColumns(50)).toBe(1)
  })
})

describe("overview view models from fixtures", () => {
  it("handles the empty state", () => {
    expect(selectOverview([])).toEqual({ running: 0, waiting: 0, completed: 0, failed: 0, unknown: 0 })
  })

  it("shows running agents and multiple child agents", () => {
    const nodes = buildAgentTree(sessions)
    expect(selectOverview(nodes).running).toBe(2)
    const tree = selectAgentTree(nodes)
    expect(tree.filter((entry) => entry.depth === 1).map((entry) => entry.node.id)).toEqual([
      "ses-backend",
      "ses-test",
      "ses-docs",
    ])
  })

  it("derives waiting from pending permissions and shows failed agents", () => {
    const nodes = buildAgentTree(sessions)
    expect(selectOverview(nodes, new Map([["ses-test", 1]])).waiting).toBe(1)
    const failed = buildAgentTree([{ id: "ses-failed", agent: "backend", outcome: "failed" }])
    expect(selectOverview(failed).failed).toBe(1)
  })

  it("marks stale sessions from the stale fixture", () => {
    const node = buildAgentTree([{ id: stale.sessionID, status: "idle", time: { updated: stale.lastActivity } }])[0]
    expect(node.lastActivity).toBe(stale.lastActivity)
  })
})

describe("unavailable analytics", () => {
  it("uses Unavailable-ready values when token data is missing", () => {
    const usage = usageFromTokens({ sessionID: missingUsage.sessionID })
    expect(usage.total).toBeUndefined()
    expect(compactNumber(usage.input)).toBe("Unavailable")
    expect(estimateCost(usage, [])).toBeUndefined()
  })

  it("keeps large event lists bounded", () => {
    const inputs = Array.from({ length: 1000 }, (_, index) => ({
      id: `evt-${index}`,
      created: index,
      type: "session.status",
      data: { sessionID: "ses-1" },
    }))
    let timeline = { events: [] as readonly NormalizedEvent[], limit: 200 }
    for (const event of normalizeEvents(inputs)) timeline = appendUnique(timeline, event, 200)
    expect(timeline.events).toHaveLength(200)
    expect(mergeHistories(timeline.events, [], 200).events).toHaveLength(200)
  })

  it("starts from an empty bounded timeline", () => {
    expect(EMPTY_TIMELINE.events).toEqual([])
    expect(EMPTY_TIMELINE.limit).toBe(200)
  })
})
