import { describe, expect, it } from "vitest"
import fixture from "../fixtures/spike-events.json"
import { normalizeEvent, normalizeEvents } from "../../application/normalize.js"

describe("normalizeEvent", () => {
  it("maps a known V2 event and keeps session identity", () => {
    const event = normalizeEvent(fixture[0])
    expect(event).toMatchObject({
      id: "evt-1",
      kind: "session.created",
      sourceType: "session.created",
      sessionID: "ses-orchestrator",
      severity: "info",
      title: "Session created",
    })
    expect(event?.location?.directory).toBe("/fake/agent-monitor-fixtures")
  })

  it("does not mistake a permission request id for a session id", () => {
    const event = normalizeEvent(fixture[3])
    expect(event?.kind).toBe("permission.asked")
    expect(event?.sessionID).toBe("ses-backend")
    expect(event?.severity).toBe("warning")
  })

  it("marks failures as errors", () => {
    expect(normalizeEvent(fixture[4])?.severity).toBe("error")
    expect(normalizeEvent(fixture[4])?.kind).toBe("tool.failed")
  })

  it("drops high-frequency stream events", () => {
    expect(normalizeEvent(fixture[5])).toBeUndefined()
  })

  it("keeps unknown events as unknown without fabricating data", () => {
    const event = normalizeEvent(fixture[6])
    expect(event?.kind).toBe("unknown")
    expect(event?.title).toBe("Unknown event")
    expect(event?.severity).toBe("info")
  })

  it("ignores malformed input", () => {
    expect(normalizeEvent(null)).toBeUndefined()
    expect(normalizeEvent("not an event")).toBeUndefined()
    expect(normalizeEvent({})).toBeUndefined()
  })

  it("normalizes a batch in order, filtering noise", () => {
    const events = normalizeEvents(fixture)
    expect(events.map((event) => event.kind)).toEqual([
      "session.created",
      "session.forked",
      "tool.input.started",
      "permission.asked",
      "tool.failed",
      "unknown",
    ])
  })
})
