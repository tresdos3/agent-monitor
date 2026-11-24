import { describe, expect, it } from "vitest"
import { quotaNoticeFromEvents } from "../../adapters/usage/quota.js"
import { normalizeEvents } from "../../application/normalize.js"
import type { NormalizedEvent } from "../../domain/model.js"

function failed(error: unknown, created = 1): NormalizedEvent {
  return normalizeEvents([
    {
      id: `evt-${created}`,
      created,
      type: "session.execution.failed",
      data: { sessionID: "ses-1", error },
    },
  ])[0]
}

describe("quotaNoticeFromEvents", () => {
  it("detects a free usage limit from an observed failure message", () => {
    const notice = quotaNoticeFromEvents([
      failed({ type: "provider", message: "Free usage limit reached. Subscribe to keep going." }),
    ])
    expect(notice?.message).toContain("Free usage limit reached")
    expect(notice?.sessionID).toBe("ses-1")
    expect(notice?.observedAt).toBe(1)
  })

  it("detects quota errors by structured error type", () => {
    expect(quotaNoticeFromEvents([failed({ type: "QuotaExceeded", message: "rejected" })])).toBeDefined()
  })

  it("ignores ordinary failures and non-error events", () => {
    expect(quotaNoticeFromEvents([failed({ type: "provider", message: "connection reset" })])).toBeUndefined()
    expect(
      quotaNoticeFromEvents([
        {
          id: "evt-2",
          created: 2,
          kind: "session.execution.succeeded",
          sourceType: "session.execution.succeeded",
          title: "Execution succeeded",
          severity: "success",
          data: { error: { message: "quota" } },
        },
      ]),
    ).toBeUndefined()
  })

  it("returns the newest observed quota failure", () => {
    const notice = quotaNoticeFromEvents([
      failed({ type: "QuotaExceeded", message: "first" }, 1),
      failed({ type: "QuotaExceeded", message: "second" }, 2),
    ])
    expect(notice?.message).toBe("second")
    expect(notice?.observedAt).toBe(2)
  })
})
