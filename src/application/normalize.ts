import type { EventKind, NormalizedEvent, Severity } from "../domain/model.js"

/**
 * High-frequency streaming events never drive sidebar rendering. They are
 * dropped here rather than throttled downstream.
 */
const IGNORED_TYPES = new Set([
  "session.text.delta",
  "session.reasoning.delta",
  "session.step.streamed",
  "session.tool.input.delta",
  "session.compaction.delta",
])

const KIND_BY_TYPE: Readonly<Record<string, EventKind>> = {
  "session.created": "session.created",
  "session.forked": "session.forked",
  "session.agent.selected": "session.agent.selected",
  "session.execution.started": "session.execution.started",
  "session.execution.succeeded": "session.execution.succeeded",
  "session.execution.failed": "session.execution.failed",
  "session.execution.interrupted": "session.execution.interrupted",
  "session.status": "session.status",
  "session.deleted": "session.deleted",
  "session.tool.input.started": "tool.input.started",
  "session.tool.called": "tool.called",
  "session.tool.success": "tool.success",
  "session.tool.failed": "tool.failed",
  "permission.asked": "permission.asked",
  "permission.replied": "permission.replied",
  "session.usage.updated": "usage.updated",
  "filesystem.changed": "filesystem.changed",
}

const TITLE_BY_KIND: Readonly<Record<EventKind, string>> = {
  "session.created": "Session created",
  "session.forked": "Agent delegated",
  "session.agent.selected": "Agent changed",
  "session.execution.started": "Execution started",
  "session.execution.succeeded": "Execution succeeded",
  "session.execution.failed": "Execution failed",
  "session.execution.interrupted": "Execution interrupted",
  "session.status": "Status changed",
  "session.deleted": "Session deleted",
  "tool.input.started": "Tool input started",
  "tool.called": "Tool called",
  "tool.success": "Tool succeeded",
  "tool.failed": "Tool failed",
  "permission.asked": "Permission requested",
  "permission.replied": "Permission resolved",
  "usage.updated": "Usage updated",
  "filesystem.changed": "File changed",
  unknown: "Unknown event",
}

function severityFor(kind: EventKind, data: Readonly<Record<string, unknown>>): Severity {
  if (kind === "session.execution.failed" || kind === "tool.failed") return "error"
  if (kind === "permission.asked") return "warning"
  if (kind === "session.execution.succeeded" || kind === "tool.success" || kind === "permission.replied") {
    return "success"
  }
  if (kind === "session.status") {
    const status = data.status
    if (typeof status === "string" && status === "retry") return "warning"
  }
  return "info"
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function stringField(value: Readonly<Record<string, unknown>>, key: string): string | undefined {
  const candidate = value[key]
  return typeof candidate === "string" && candidate.length > 0 ? candidate : undefined
}

/** Normalize one V2 event. Returns undefined for streaming noise or malformed input. */
export function normalizeEvent(input: unknown): NormalizedEvent | undefined {
  if (!isRecord(input)) return undefined

  const type = stringField(input, "type")
  if (!type || IGNORED_TYPES.has(type)) return undefined

  const data = isRecord(input.data) ? input.data : {}
  const kind = KIND_BY_TYPE[type] ?? "unknown"
  const location = isRecord(input.location) ? stringField(input.location, "directory") : undefined

  return {
    id: stringField(input, "id") ?? `${type}:${String(input.created ?? "unknown")}`,
    created: typeof input.created === "number" ? input.created : Date.now(),
    kind,
    sourceType: type,
    sessionID: stringField(data, "sessionID"),
    title: TITLE_BY_KIND[kind],
    severity: severityFor(kind, data),
    data,
    location: location ? { directory: location } : undefined,
  }
}

/** Normalize a batch, preserving order and dropping events we intentionally ignore. */
export function normalizeEvents(inputs: readonly unknown[]): NormalizedEvent[] {
  const result: NormalizedEvent[] = []
  for (const input of inputs) {
    const event = normalizeEvent(input)
    if (event) result.push(event)
  }
  return result
}
