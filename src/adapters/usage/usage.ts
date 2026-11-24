import type { TokenUsage } from "../../domain/model.js"
import type { UsageSnapshot } from "../../domain/project.js"

export function usageFromTokens(input: {
  readonly sessionID: string
  readonly tokens?: TokenUsage
  readonly cost?: number
  readonly model?: string
  readonly timestamp?: number
}): UsageSnapshot {
  const tokens = input.tokens
  return {
    sessionID: input.sessionID,
    input: tokens?.input,
    output: tokens?.output,
    reasoning: tokens?.reasoning,
    cacheRead: tokens?.cacheRead,
    cacheWrite: tokens?.cacheWrite,
    total: tokens
      ? tokens.input + tokens.output + tokens.reasoning + tokens.cacheRead + tokens.cacheWrite
      : undefined,
    reportedCost: input.cost,
    model: input.model,
    timestamp: input.timestamp,
  }
}
