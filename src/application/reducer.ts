import type { AgentNode, NormalizedEvent, TimelineState, TokenUsage } from "../domain/model.js"

export interface SessionLike {
  readonly id: string
  readonly parentID?: string
  readonly agent?: string
  readonly model?: { readonly providerID: string; readonly id: string; readonly variant?: string }
  readonly title?: string
  readonly outcome?: "succeeded" | "failed" | "interrupted"
  readonly status?: "idle" | "running"
  readonly cost?: number
  readonly tokens?: {
    readonly input: number
    readonly output: number
    readonly reasoning: number
    readonly cache: { readonly read: number; readonly write: number }
  }
  readonly time?: { readonly created?: number; readonly updated?: number }
}

/** Append to a bounded timeline. Oldest events are dropped first. */
export function appendEvent(state: TimelineState, event: NormalizedEvent, limit = state.limit): TimelineState {
  const events = [...state.events, event]
  return {
    limit,
    events: events.length > limit ? events.slice(events.length - limit) : events,
  }
}

function toUsage(tokens: SessionLike["tokens"]): TokenUsage | undefined {
  if (!tokens) return undefined
  return {
    input: tokens.input,
    output: tokens.output,
    reasoning: tokens.reasoning,
    cacheRead: tokens.cache?.read ?? 0,
    cacheWrite: tokens.cache?.write ?? 0,
  }
}

/** Map V2 SessionStatus values into the internal agent status. */
export function mapSessionStatus(status: string): { readonly status: "running" | "idle"; readonly note?: string } {
  if (status === "busy" || status === "running") return { status: "running" }
  if (status === "retry") return { status: "running", note: "retry" }
  return { status: "idle" }
}

export interface AgentTreeOptions {
  readonly statusOverrides?: ReadonlyMap<string, AgentNode["status"]>
  readonly statusNotes?: ReadonlyMap<string, string>
  readonly activeSessions?: ReadonlySet<string>
}

/**
 * Build the agent tree from sessions. Status is derived only from observed
 * host data; "waiting" is not invented here because V2 has no such
 * first-class session state. Event overrides and server-active sessions win
 * over potentially stale cache values.
 */
export function buildAgentTree(sessions: readonly SessionLike[], options: AgentTreeOptions = {}): AgentNode[] {
  return sessions.map((session) => {
    let status: AgentNode["status"] = "unknown"
    let statusEvidence: AgentNode["statusEvidence"] = "missing"

    const override = options.statusOverrides?.get(session.id)
    if (session.outcome === "failed") {
      status = "failed"
      statusEvidence = "observed"
    } else if (session.outcome === "succeeded") {
      status = "completed"
      statusEvidence = "observed"
    } else if (session.outcome === "interrupted") {
      status = "idle"
      statusEvidence = "observed"
    } else if (override) {
      status = override
      statusEvidence = "observed"
    } else if (options.activeSessions?.has(session.id)) {
      status = "running"
      statusEvidence = "observed"
    } else if (session.status === "running") {
      status = "running"
      statusEvidence = "observed"
    } else if (session.status === "idle") {
      status = "idle"
      statusEvidence = "observed"
    }

    return {
      id: session.id,
      agent: session.agent,
      parentID: session.parentID,
      model: session.model ? `${session.model.providerID}/${session.model.id}` : undefined,
      label: session.title ?? session.agent ?? session.id,
      status,
      statusEvidence,
      statusNote: options.statusNotes?.get(session.id),
      cost: session.cost,
      tokens: toUsage(session.tokens),
      lastActivity: session.time?.updated ?? session.time?.created,
    }
  })
}
