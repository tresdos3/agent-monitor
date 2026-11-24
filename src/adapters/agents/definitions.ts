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
