import type { PricingEstimate, UsageSnapshot } from "../../domain/project.js"

export const PRICING_SOURCE = "host model catalog (models.dev)"
export const PRICING_VERSION = "2.4.1"
export const PRICING_DATE = "2026-11-23"

export interface CostTier {
  readonly tier?: { readonly size?: number }
  readonly input: number
  readonly output: number
  readonly cache: { readonly read: number; readonly write: number }
}

export interface ModelLike {
  readonly providerID?: string
  readonly id?: string
  readonly modelID?: string
  readonly cost?: readonly CostTier[]
}

export function findModel(
  models: readonly ModelLike[],
  providerID: string | undefined,
  modelID: string | undefined,
): ModelLike | undefined {
  if (!providerID || !modelID) return undefined
  return models.find((model) => model.providerID === providerID && (model.id === modelID || model.modelID === modelID))
}

/**
 * Compute an independent estimate from dated model cost tiers.
 * Returns undefined when token fields, pricing, or tier semantics are
 * ambiguous — the UI then shows `Unavailable` instead of guessing.
 */
export function estimateCost(usage: UsageSnapshot, models: readonly ModelLike[]): PricingEstimate | undefined {
  const { input, output, cacheRead, cacheWrite, model } = usage
  if (input === undefined || output === undefined || cacheRead === undefined || cacheWrite === undefined || !model) {
    return undefined
  }

  const slash = model.indexOf("/")
  const providerID = slash > 0 ? model.slice(0, slash) : undefined
  const modelID = slash > 0 ? model.slice(slash + 1) : model
  const tiers = findModel(models, providerID, modelID)?.cost
  if (!tiers || tiers.length === 0) return undefined

  const sizes = tiers.map((tier) => tier.tier?.size).filter((size): size is number => typeof size === "number")
  if (sizes.length > 1 && new Set(sizes).size > 1) return undefined

  const tier = tiers[0]
  const amount =
    (input * tier.input + output * tier.output + cacheRead * tier.cache.read + cacheWrite * tier.cache.write) / 1_000_000

  return {
    amount,
    source: PRICING_SOURCE,
    version: PRICING_VERSION,
    date: PRICING_DATE,
    tierSize: tier.tier?.size,
  }
}
