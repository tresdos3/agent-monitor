import type { NormalizedEvent } from "../../domain/model.js"

/**
 * Observed host quota notice. The host has no dedicated quota event in v2.4.1:
 * a free-model limit arrives as a generic `session.execution.failed` with a
 * free-form `error.type` / `error.message`. We only report text we actually
 * observed; nothing is inferred, estimated, or auto-retried.
 */
export interface QuotaNotice {
  readonly message: string
  readonly sessionID?: string
  readonly observedAt: number
}

const QUOTA_PATTERN =
  /quota|usage limit|limit reached|limit exceeded|limit exhausted|budget exceeded|insufficient (?:quota|balance)|upgrade|subscribe|free usage/i

function structuredError(data: Readonly<Record<string, unknown>>): Readonly<Record<string, unknown>> | undefined {
  const error = data.error
  if (typeof error !== "object" || error === null || Array.isArray(error)) return undefined
  return error as Readonly<Record<string, unknown>>
}

/** Detect a quota notice from normalized failure events, newest first. */
export function quotaNoticeFromEvents(events: readonly NormalizedEvent[]): QuotaNotice | undefined {
  for (let index = events.length - 1; index >= 0; index--) {
    const event = events[index]
    if (event.kind !== "session.execution.failed" && event.kind !== "tool.failed") continue
    const error = structuredError(event.data)
    if (!error) continue
    const type = typeof error.type === "string" ? error.type : ""
    const message = typeof error.message === "string" ? error.message : ""
    if (!QUOTA_PATTERN.test(`${type} ${message}`)) continue
    return {
      message: message || type,
      ...(event.sessionID ? { sessionID: event.sessionID } : {}),
      observedAt: event.created,
    }
  }
  return undefined
}
