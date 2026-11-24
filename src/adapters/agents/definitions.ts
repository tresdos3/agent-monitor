import type { AgentInfo } from "@opencode/client"
import type { AgentDefinition } from "../../domain/agents.js"

const BUILTIN_AGENT_IDS = new Set(["build", "plan", "general", "explore", "title", "summary", "compaction"])

export interface AgentLink {
  readonly sessionID: string
  readonly status: "running" | "idle" | "completed" | "failed" | "unknown"
  readonly note?: string
}

export function agentInfoToDefinition(info: AgentInfo, link?: AgentLink): AgentDefinition {
  return {
    id: String(info.id),
    name: String(info.name ?? info.id),
    description: typeof info.description === "string" ? info.description : undefined,
    mode: info.mode,
    hidden: Boolean(info.hidden),
    color: typeof info.color === "string" ? info.color : undefined,
    source: BUILTIN_AGENT_IDS.has(String(info.id)) ? "builtin" : "project",
    runningSessionID: link?.status === "running" ? link.sessionID : undefined,
    status: link?.status ?? "unknown",
    statusNote: link?.note,
  }
}

export interface DefinitionLinkSource {
  readonly id: string
  readonly agent?: string
  readonly lastActivity?: number
  readonly status: "running" | "idle" | "completed" | "failed" | "unknown"
  readonly statusNote?: string
}

/** Link each definition to its newest session so stale runs cannot win. */
export function linkDefinitions(
  definitions: readonly AgentDefinition[],
  sessions: readonly DefinitionLinkSource[],
): readonly AgentDefinition[] {
  const newest = new Map<string, { lastActivity: number; session: DefinitionLinkSource }>()
  for (const session of sessions) {
    if (!session.agent) continue
    const lastActivity = session.lastActivity ?? 0
    const existing = newest.get(session.agent)
    if (!existing || lastActivity >= existing.lastActivity) {
      newest.set(session.agent, { lastActivity, session })
    }
  }

  return definitions.map((definition) => {
    const entry = newest.get(definition.id)
    if (!entry) return definition
    const status = entry.session.status
    return {
      ...definition,
      runningSessionID: status === "running" ? entry.session.id : undefined,
      status,
      statusNote: entry.session.statusNote,
    }
  })
}

export function filterVisibleDefinitions(
  definitions: readonly AgentDefinition[],
  options: { readonly includeHidden?: boolean; readonly includeBuiltin?: boolean } = {},
): readonly AgentDefinition[] {
  return definitions.filter(
    (definition) =>
      (options.includeHidden || !definition.hidden) &&
      (options.includeBuiltin || definition.source !== "builtin"),
  )
}
