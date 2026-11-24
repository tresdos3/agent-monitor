export interface AgentDefinition {
  readonly id: string
  readonly name: string
  readonly description?: string
  readonly mode: "subagent" | "primary" | "all"
  readonly hidden: boolean
  readonly color?: string
  readonly source: "project" | "builtin"
  readonly runningSessionID?: string
  readonly status: "running" | "idle" | "completed" | "failed" | "unknown"
  readonly statusNote?: string
}
