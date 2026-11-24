import type { AgentNode, NormalizedEvent, TimelineState } from "../domain/model.js"

export interface Overview {
  readonly running: number
  readonly waiting: number
  readonly completed: number
  readonly failed: number
  readonly unknown: number
}

export interface TreeNode {
  readonly node: AgentNode
  readonly depth: number
}

export interface ActivityView {
  readonly sessionID: string
  readonly agent?: string
  readonly tool?: { readonly name: string; readonly evidence: "observed" }
  readonly file?: { readonly path: string; readonly evidence: "inferred" }
  readonly durationMs?: number
}

const FILE_KEYS = ["filePath", "path", "file", "filename", "target"] as const

export function selectOverview(
  nodes: readonly AgentNode[],
  pendingBySession: ReadonlyMap<string, number> = new Map(),
): Overview {
  const overview = { running: 0, waiting: 0, completed: 0, failed: 0, unknown: 0 }
  for (const node of nodes) {
    if ((pendingBySession.get(node.id) ?? 0) > 0) {
      overview.waiting++
      continue
    }
    switch (node.status) {
      case "running":
        overview.running++
        break
      case "completed":
        overview.completed++
        break
      case "failed":
        overview.failed++
        break
      default:
        overview.unknown++
    }
  }
  return overview
}

/** Depth-first tree with roots first; orphaned children are shown at depth 0. */
export function selectAgentTree(nodes: readonly AgentNode[]): TreeNode[] {
  const byID = new Map(nodes.map((node) => [node.id, node]))
  const children = new Map<string | undefined, AgentNode[]>()
  for (const node of nodes) {
    const parent = node.parentID && byID.has(node.parentID) ? node.parentID : undefined
    const list = children.get(parent) ?? []
    list.push(node)
    children.set(parent, list)
  }

  const result: TreeNode[] = []
  const seen = new Set<string>()
  const visit = (parent: string | undefined, depth: number): void => {
    for (const node of children.get(parent) ?? []) {
      if (seen.has(node.id)) continue
      seen.add(node.id)
      result.push({ node, depth })
      visit(node.id, depth + 1)
    }
  }
  visit(undefined, 0)
  for (const node of nodes) {
    if (!seen.has(node.id)) result.push({ node, depth: 0 })
  }
  return result
}

function inferredFile(input: Readonly<Record<string, unknown>>): string | undefined {
  for (const key of FILE_KEYS) {
    const value = input[key]
    if (typeof value === "string" && value.length > 0) return value
  }
  return undefined
}

/** Latest observable tool/file activity for a session, with honest evidence. */
export function selectCurrentActivity(
  sessionID: string,
  timeline: TimelineState,
  nodes: readonly AgentNode[],
): ActivityView | undefined {
  const events = selectSessionEvents(timeline, sessionID)
  const node = nodes.find((candidate) => candidate.id === sessionID)
  let tool: ActivityView["tool"]
  let file: ActivityView["file"]
  let started: number | undefined

  for (const event of events) {
    if (event.kind === "session.execution.started" && started === undefined) started = event.created
    if (!tool && event.kind === "tool.input.started") {
      const name = event.data.name
      if (typeof name === "string") tool = { name, evidence: "observed" }
    }
    if (!file && event.kind === "tool.called" && typeof event.data.input === "object" && event.data.input !== null) {
      const path = inferredFile(event.data.input as Record<string, unknown>)
      if (path) file = { path, evidence: "inferred" }
    }
  }

  if (!node && events.length === 0) return undefined
  const last = events.at(-1)?.created ?? node?.lastActivity
  return {
    sessionID,
    agent: node?.agent,
    tool,
    file,
    durationMs: started !== undefined && last !== undefined ? Math.max(0, last - started) : undefined,
  }
}

export function selectSessionEvents(timeline: TimelineState, sessionID: string): NormalizedEvent[] {
  return timeline.events.filter((event) => event.sessionID === sessionID)
}

export function isStale(node: AgentNode, now: number, thresholdMs: number): boolean {
  return node.lastActivity !== undefined && now - node.lastActivity > thresholdMs
}
