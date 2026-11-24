import type { PermissionRequest } from "@opencode/client"
import { describe, expect, it } from "vitest"
import {
  permissionFromEvent,
  permissionRequestToView,
  permissionToView,
} from "../../adapters/permissions/permission.js"
import { normalizeEvent } from "../../application/normalize.js"

const request = {
  id: "perm-1",
  sessionID: "ses-backend",
  action: "edit",
  resources: ["src/api.ts"],
  source: { type: "tool", messageID: "msg-1", id: "call-1" },
  message: "Allow edit?",
} as unknown as PermissionRequest

describe("permissionToView", () => {
  it("maps a native request without inventing a timestamp", () => {
    expect(permissionRequestToView(request, { agent: "backend-agent" })).toEqual({
      id: "perm-1",
      sessionID: "ses-backend",
      action: "edit",
      resources: ["src/api.ts"],
      toolID: "call-1",
      message: "Allow edit?",
      requestedAt: undefined,
      agent: "backend-agent",
      status: "pending",
    })
  })

  it("uses Unavailable-ready undefined values for malformed input", () => {
    expect(permissionToView({})).toMatchObject({
      id: "unknown",
      sessionID: "unknown",
      action: "unknown",
      resources: [],
      requestedAt: undefined,
    })
  })
})

describe("permissionFromEvent", () => {
  it("takes the timestamp from the observed permission.asked event", () => {
    const event = normalizeEvent({
      id: "evt-1",
      created: 1730000000000,
      type: "permission.asked",
      data: {
        id: "perm-2",
        sessionID: "ses-test",
        action: "shell",
        resources: ["npm test"],
      },
    })!
    expect(permissionFrom(event)?.requestedAt).toBe(1730000000000)
  })

  it("ignores non-permission events", () => {
    const event = normalizeEvent({ id: "evt-2", created: 1, type: "session.created", data: {} })!
    expect(permissionFromEvent(event)).toBeUndefined()
  })
})

function permissionFrom(event: NonNullable<ReturnType<typeof normalizeEvent>>) {
  return permissionFromEvent(event, { agent: "test-agent" })
}
