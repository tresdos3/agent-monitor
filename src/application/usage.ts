import type { AgentNode, TokenUsage } from "../domain/model.js"

export interface UsageTotals {
  readonly input: number
  readonly output: number
  readonly reasoning: number
  readonly cacheRead: number
  readonly cacheWrite: number
  readonly total: number
}

export interface AgentUsage extends UsageTotals {
  readonly id: string
  readonly label: string
  readonly agent?: string
  readonly model?: string
}

export interface ModelUsage extends UsageTotals {
  readonly model: string
}

function emptyTokens(): TokenUsage {
  return { input: 0, output: 0, reasoning: 0, cacheRead: 0, cacheWrite: 0 }
}

export function sumUsage(tokens: TokenUsage): UsageTotals {
  return {
    ...tokens,
    total: tokens.input + tokens.output + tokens.reasoning + tokens.cacheRead + tokens.cacheWrite,
  }
}

export function usageByAgent(nodes: readonly AgentNode[]): readonly AgentUsage[] {
  return nodes
    .filter((node): node is AgentNode & { tokens: TokenUsage } => node.tokens !== undefined)
    .map((node) => ({ id: node.id, label: node.label, agent: node.agent, model: node.model, ...sumUsage(node.tokens) }))
}

export function usageByModel(nodes: readonly AgentNode[]): readonly ModelUsage[] {
  const grouped = new Map<string, TokenUsage>()
  for (const node of nodes) {
    if (!node.tokens || !node.model) continue
    const current = grouped.get(node.model) ?? emptyTokens()
    grouped.set(node.model, {
      input: current.input + node.tokens.input,
      output: current.output + node.tokens.output,
      reasoning: current.reasoning + node.tokens.reasoning,
      cacheRead: current.cacheRead + node.tokens.cacheRead,
      cacheWrite: current.cacheWrite + node.tokens.cacheWrite,
    })
  }
  return [...grouped.entries()].map(([model, tokens]) => ({ model, ...sumUsage(tokens) }))
}
