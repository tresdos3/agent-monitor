/**
 * Internal domain models. These are deliberately independent of host SDK
 * types so the UI never depends on event payload shapes.
 */

export type EventKind =
  | "session.created"
  | "session.forked"
  | "session.agent.selected"
  | "session.execution.started"
  | "session.execution.succeeded"
  | "session.execution.failed"
  | "session.execution.interrupted"
  | "session.status"
  | "session.deleted"
  | "tool.input.started"
  | "tool.called"
  | "tool.success"
  | "tool.failed"
  | "permission.asked"
  | "permission.replied"
  | "usage.updated"
  | "filesystem.changed"
  | "unknown"

export type Severity = "info" | "success" | "warning" | "error"

export type EvidenceLevel = "verified" | "observed" | "declared" | "missing" | "failed"

export interface TokenUsage {
  readonly input: number
  readonly output: number
  readonly reasoning: number
  readonly cacheRead: number
  readonly cacheWrite: number
}

/** A V2 server event reduced to the smallest honest internal representation. */
export interface NormalizedEvent {
  readonly id: string
  readonly created: number
  readonly kind: EventKind
  readonly sourceType: string
  readonly sessionID?: string
  readonly title: string
  readonly severity: Severity
  readonly data: Readonly<Record<string, unknown>>
  readonly location?: { readonly directory: string; readonly workspaceID?: string }
}

export interface AgentNode {
  /** In V2 an "agent run" is represented by a session, so this is a session ID. */
  readonly id: string
  readonly agent?: string
  readonly parentID?: string
  readonly model?: string
  readonly label: string
  readonly status: "running" | "idle" | "completed" | "failed" | "waiting" | "unknown"
  readonly statusEvidence: EvidenceLevel
  readonly statusNote?: string
  readonly currentTool?: string
  readonly currentFile?: { readonly path: string; readonly evidence: EvidenceLevel }
  readonly cost?: number
  readonly tokens?: TokenUsage
  readonly lastActivity?: number
}

export interface TimelineState {
  readonly events: readonly NormalizedEvent[]
  readonly limit: number
}

export const EMPTY_TIMELINE: TimelineState = { events: [], limit: 200 }

export function totalTokens(usage: TokenUsage): number {
  return usage.input + usage.output + usage.reasoning + usage.cacheRead + usage.cacheWrite
}
