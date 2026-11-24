import {
  EMPTY_TIMELINE,
  type EventKind,
  type NormalizedEvent,
  type Severity,
  type TimelineState,
} from "../domain/model.js"

export interface TimelineFilters {
  readonly sessionID?: string
  readonly kind?: EventKind
  readonly severity?: Severity
}

export const EVENT_KINDS: readonly EventKind[] = [
  "session.created",
  "session.forked",
  "session.agent.selected",
  "session.execution.started",
  "session.execution.succeeded",
  "session.execution.failed",
  "session.execution.interrupted",
  "session.status",
  "session.deleted",
  "tool.input.started",
  "tool.called",
  "tool.success",
  "tool.failed",
  "permission.asked",
  "permission.replied",
  "usage.updated",
  "filesystem.changed",
  "unknown",
]

export const SEVERITIES: readonly Severity[] = ["info", "success", "warning", "error"]

export function appendUnique(state: TimelineState, event: NormalizedEvent, limit = state.limit): TimelineState {
  if (state.events.some((existing) => existing.id === event.id)) return state
  const events = [...state.events, event].sort((left, right) => left.created - right.created)
  return {
    limit,
    events: events.length > limit ? events.slice(events.length - limit) : events,
  }
}

export function mergeHistories(
  live: readonly NormalizedEvent[],
  rpcHistory: readonly NormalizedEvent[],
  limit = EMPTY_TIMELINE.limit,
): TimelineState {
  const byID = new Map<string, NormalizedEvent>()
  for (const event of [...live, ...rpcHistory]) byID.set(event.id, event)
  const events = [...byID.values()].sort((left, right) => left.created - right.created)
  return {
    limit,
    events: events.length > limit ? events.slice(events.length - limit) : events,
  }
}

function shortText(value: string, max = 48): string {
  return value.length <= max ? value : `${value.slice(0, max - 1)}…`
}

function strField(data: Readonly<Record<string, unknown>>, key: string): string | undefined {
  const value = data[key]
  return typeof value === "string" && value.length > 0 ? value : undefined
}

/** Extract a short, observable detail string for an event. No inferred claims. */
export function eventDetail(event: NormalizedEvent): string | undefined {
  const data = event.data
  switch (event.kind) {
    case "tool.input.started": {
      const name = strField(data, "name")
      return name ? `tool ${name}` : undefined
    }
    case "tool.called": {
      const input = typeof data.input === "object" && data.input !== null ? (data.input as Record<string, unknown>) : {}
      const command = strField(input, "command") ?? strField(input, "cmd")
      if (command) return `command: ${shortText(command)}`
      const file = ["filePath", "path", "file", "filename"].map((key) => strField(input, key)).find(Boolean)
      if (file) return `file: ${shortText(file)}`
      const id = strField(data, "id")
      return id ? `call ${id}` : undefined
    }
    case "tool.success": {
      const id = strField(data, "id")
      return id ? `call ${id} succeeded` : undefined
    }
    case "tool.failed": {
      const id = strField(data, "id")
      const error = data.error
      const message =
        typeof error === "object" && error !== null && typeof (error as { message?: unknown }).message === "string"
          ? (error as { message: string }).message
          : undefined
      return message ? shortText(message) : id ? `call ${id} failed` : undefined
    }
    case "permission.asked": {
      const action = strField(data, "action") ?? "action"
      const resources = Array.isArray(data.resources)
        ? data.resources.filter((value): value is string => typeof value === "string")
        : []
      return resources.length > 0 ? `${action} ${shortText(resources.join(", "))}` : action
    }
    case "permission.replied":
      return strField(data, "reply")
    case "session.execution.failed": {
      const error = data.error
      const message =
        typeof error === "object" && error !== null && typeof (error as { message?: unknown }).message === "string"
          ? (error as { message: string }).message
          : undefined
      return message ? shortText(message) : undefined
    }
    case "session.forked": {
      const parent = strField(data, "parentID")
      return parent ? `from ${parent}` : undefined
    }
    case "usage.updated": {
      const tokens = typeof data.tokens === "object" && data.tokens !== null ? (data.tokens as Record<string, unknown>) : {}
      const input = typeof tokens.input === "number" ? tokens.input : undefined
      const output = typeof tokens.output === "number" ? tokens.output : undefined
      return input !== undefined && output !== undefined ? `${shortText(`${input} in / ${output} out`)}` : undefined
    }
    case "filesystem.changed": {
      const file = strField(data, "file") ?? "Unavailable"
      const change = strField(data, "event") ?? "changed"
      return `${change} ${shortText(file)}`
    }
    default:
      return undefined
  }
}

const TERMINAL_KINDS = new Set(["session.execution.succeeded", "session.execution.failed", "session.execution.interrupted"])

/** Duration derived from paired observable events, or undefined when unavailable. */
export function eventDuration(event: NormalizedEvent, events: readonly NormalizedEvent[]): number | undefined {
  if (event.kind === "tool.called" || event.kind === "tool.input.started") {
    const id = strField(event.data, "id")
    if (!id) return undefined
    const terminal = events.find(
      (candidate) =>
        (candidate.kind === "tool.success" || candidate.kind === "tool.failed") &&
        strField(candidate.data, "id") === id &&
        candidate.created >= event.created,
    )
    return terminal ? Math.max(0, terminal.created - event.created) : undefined
  }

  if (event.kind === "session.execution.started") {
    const terminal = events.find(
      (candidate) =>
        TERMINAL_KINDS.has(candidate.kind) &&
        candidate.sessionID === event.sessionID &&
        candidate.created >= event.created,
    )
    return terminal ? Math.max(0, terminal.created - event.created) : undefined
  }

  return undefined
}

export function filterEvents(timeline: TimelineState, filters: TimelineFilters): NormalizedEvent[] {
  return timeline.events.filter((event) => {
    if (filters.sessionID && event.sessionID !== filters.sessionID) return false
    if (filters.kind && event.kind !== filters.kind) return false
    if (filters.severity && event.severity !== filters.severity) return false
    return true
  })
}
