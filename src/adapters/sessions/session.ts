import type { SessionInfo } from "@opencode/client"
import type { SessionLike } from "../../application/reducer.js"

/** Only sessions from the active location directory may link to agent definitions. */
export function sessionBelongsToLocation(session: SessionInfo, directory?: string): boolean {
  if (!directory) return true
  return session.location?.directory === directory
}

/** Map a host SessionInfo into the application's SDK-independent shape. */
export function sessionToLike(session: SessionInfo, status?: "idle" | "running"): SessionLike {
  return {
    id: session.id,
    parentID: session.parentID,
    agent: session.agent,
    model: session.model,
    title: session.title,
    outcome: session.outcome,
    status,
    cost: session.cost,
    tokens: session.tokens,
    time: session.time,
  }
}
