import { describe, expect, it } from "vitest"
import {
  appendUnique,
  eventDetail,
  eventDuration,
  filterEvents,
  mergeHistories,
} from "../../application/timeline.js"
import { normalizeEvents } from "../../application/normalize.js"
import { EMPTY_TIMELINE, type NormalizedEvent } from "../../domain/model.js"

function event(id: string, created: number, sessionID: string, kind: string, severity: "info" | "warning" | "error" | "success"): NormalizedEvent {
  const result = normalizeEvents([{ id, created, type: kind, data: { sessionID } }])[0]
  if (!result) throw new Error(`dropped ${kind}`)
  return { ...result, severity }
}

const a = event("a", 1000, "ses-1", "session.created", "info")
const b = event("b", 2000, "ses-2", "permission.asked", "warning")
const c = event("c", 3000, "ses-1", "session.tool.failed", "error")
const duplicate = { ...b }

describe("appendUnique", () => {
  it("ignores duplicate IDs", () => {
    const state = appendUnique(EMPTY_TIMELINE, b)
    expect(appendUnique(state, duplicate).events).toEqual([b])
  })

  it("keeps chronological order", () => {
    const state = appendUnique(appendUnique(EMPTY_TIMELINE, c), a)
    expect(state.events.map((entry) => entry.id)).toEqual(["a", "c"])
  })
})

describe("mergeHistories", () => {
  it("merges live and RPC history by ID and sorts by time", () => {
    const state = mergeHistories([c], [b, a, duplicate], 10)
    expect(state.events.map((entry) => entry.id)).toEqual(["a", "b", "c"])
  })

  it("drops oldest events when over the limit", () => {
    const state = mergeHistories([a, b, c], [], 2)
    expect(state.events.map((entry) => entry.id)).toEqual(["b", "c"])
  })
})

describe("eventDetail", () => {
  it("extracts observed tool and permission details", () => {
    const call = normalizeEvents([
      { id: "e1", created: 1, type: "session.tool.called", data: { id: "c1", input: { command: "npm test" } } },
    ])[0]
    const permission = normalizeEvents([
      {
        id: "e2",
        created: 2,
        type: "permission.asked",
        data: { id: "p1", action: "edit", resources: ["src/api.ts"] },
      },
    ])[0]
    expect(eventDetail(call)).toBe("command: npm test")
    expect(eventDetail(permission)).toBe("edit src/api.ts")
  })

  it("returns undefined when no reliable detail exists", () => {
    expect(eventDetail(event("e3", 1, "ses-1", "session.status", "info"))).toBeUndefined()
  })
})

describe("eventDuration", () => {
  it("pairs tool calls with their outcome", () => {
    const events = normalizeEvents([
      { id: "e1", created: 1000, type: "session.tool.called", data: { id: "c1", input: {} } },
      { id: "e2", created: 1500, type: "session.tool.success", data: { id: "c1", executed: true } },
    ])
    expect(eventDuration(events[0], events)).toBe(500)
  })

  it("pairs execution start with terminal event", () => {
    const events = normalizeEvents([
      { id: "e1", created: 1000, type: "session.execution.started", data: { sessionID: "ses-1" } },
      { id: "e2", created: 3000, type: "session.execution.failed", data: { sessionID: "ses-1" } },
    ])
    expect(eventDuration(events[0], events)).toBe(2000)
  })

  it("returns undefined when no terminal event exists", () => {
    const events = normalizeEvents([
      { id: "e1", created: 1000, type: "session.execution.started", data: { sessionID: "ses-1" } },
    ])
    expect(eventDuration(events[0], events)).toBeUndefined()
  })
})

describe("filterEvents", () => {
  const timeline = mergeHistories([a, b, c], [], 10)

  it("filters by session", () => {
    expect(filterEvents(timeline, { sessionID: "ses-1" }).map((entry) => entry.id)).toEqual(["a", "c"])
  })

  it("filters by kind", () => {
    expect(filterEvents(timeline, { kind: "permission.asked" }).map((entry) => entry.id)).toEqual(["b"])
  })

  it("filters by severity", () => {
    expect(filterEvents(timeline, { severity: "error" }).map((entry) => entry.id)).toEqual(["c"])
  })

  it("combines filters", () => {
    expect(filterEvents(timeline, { sessionID: "ses-1", severity: "error" }).map((entry) => entry.id)).toEqual(["c"])
  })
})
