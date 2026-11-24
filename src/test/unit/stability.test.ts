import { describe, expect, it } from "vitest"
import { appendUnique, mergeHistories } from "../../application/timeline.js"
import { buildAgentTree } from "../../application/reducer.js"
import { normalizeEvents } from "../../application/normalize.js"
import { EMPTY_TIMELINE, type NormalizedEvent } from "../../domain/model.js"

function bulkEvents(count: number): NormalizedEvent[] {
  const inputs = Array.from({ length: count }, (_, index) => ({
    id: `evt-${index}`,
    created: index,
    type: "session.status",
    data: { sessionID: `ses-${index % 10}` },
  }))
  return normalizeEvents(inputs)
}

describe("stability", () => {
  it("keeps a bounded timeline under a large event volume", () => {
    let state = EMPTY_TIMELINE
    for (const event of bulkEvents(5_000)) {
      state = appendUnique(state, event, 200)
    }
    expect(state.events).toHaveLength(200)
    expect(state.events.at(-1)?.id).toBe("evt-4999")
    expect(state.events[0].id).toBe("evt-4800")
  })

  it("bounds merged live and RPC histories", () => {
    const live = bulkEvents(2_000)
    const rpc = bulkEvents(2_000).map((event) => ({ ...event, id: `rpc-${event.id}` }))
    const state = mergeHistories(live, rpc, 200)
    expect(state.events).toHaveLength(200)
  })

  it("builds a tree for many sessions", () => {
    const sessions = Array.from({ length: 100 }, (_, index) => ({
      id: `ses-${index}`,
      parentID: index === 0 ? undefined : "ses-0",
      agent: `agent-${index % 4}`,
      status: "idle" as const,
    }))
    const tree = buildAgentTree(sessions)
    expect(tree).toHaveLength(100)
    expect(tree[0].id).toBe("ses-0")
    expect(tree.filter((node) => node.parentID === "ses-0")).toHaveLength(99)
  })
})
