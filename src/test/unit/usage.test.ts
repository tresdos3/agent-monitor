import { describe, expect, it } from "vitest"
import { usageByAgent, usageByModel } from "../../application/usage.js"
import type { AgentNode } from "../../domain/model.js"
import { estimateCost, findModel, PRICING_DATE, PRICING_SOURCE, PRICING_VERSION } from "../../adapters/usage/pricing.js"
import { usageFromTokens } from "../../adapters/usage/usage.js"

describe("usageFromTokens", () => {
  it("maps all token fields and computes a total", () => {
    expect(
      usageFromTokens({
        sessionID: "ses-1",
        tokens: { input: 10, output: 4, reasoning: 1, cacheRead: 2, cacheWrite: 3 },
        cost: 0.01,
        model: "anthropic/test",
      }),
    ).toMatchObject({
      sessionID: "ses-1",
      input: 10,
      output: 4,
      reasoning: 1,
      cacheRead: 2,
      cacheWrite: 3,
      total: 20,
      reportedCost: 0.01,
      model: "anthropic/test",
    })
  })

  it("leaves missing values undefined", () => {
    expect(usageFromTokens({ sessionID: "ses-2" })).toMatchObject({
      total: undefined,
      reportedCost: undefined,
    })
  })
})

const models = [
  {
    providerID: "anthropic",
    id: "test",
    cost: [{ input: 1, output: 2, cache: { read: 0.5, write: 1.5 } }],
  },
]

describe("usage aggregation", () => {
  const tokens = { input: 10, output: 5, reasoning: 2, cacheRead: 3, cacheWrite: 1 }
  const nodes: AgentNode[] = [
    {
      id: "ses-1",
      agent: "backend",
      label: "Backend",
      model: "anthropic/test",
      tokens,
      status: "running",
      statusEvidence: "observed",
    },
    {
      id: "ses-2",
      agent: "docs",
      label: "Docs",
      model: "anthropic/test",
      tokens,
      status: "completed",
      statusEvidence: "observed",
    },
    { id: "ses-3", agent: "test", label: "Test", status: "idle", statusEvidence: "missing" },
  ]

  it("aggregates per-agent usage only when tokens are observed", () => {
    const usage = usageByAgent(nodes)
    expect(usage.map((entry) => entry.id)).toEqual(["ses-1", "ses-2"])
    expect(usage[0].total).toBe(21)
  })

  it("aggregates per-model usage", () => {
    expect(usageByModel(nodes)).toEqual([
      {
        model: "anthropic/test",
        input: 20,
        output: 10,
        reasoning: 4,
        cacheRead: 6,
        cacheWrite: 2,
        total: 42,
      },
    ])
  })
})

describe("estimateCost", () => {
  it("computes an estimate with provenance", () => {
    const usage = usageFromTokens({
      sessionID: "ses-1",
      tokens: { input: 1_000_000, output: 1_000_000, reasoning: 0, cacheRead: 0, cacheWrite: 0 },
      model: "anthropic/test",
    })
    expect(estimateCost(usage, models)).toEqual({
      amount: 3,
      source: PRICING_SOURCE,
      version: PRICING_VERSION,
      date: PRICING_DATE,
      tierSize: undefined,
    })
  })

  it("returns undefined for missing token data or model", () => {
    expect(estimateCost(usageFromTokens({ sessionID: "ses-1" }), models)).toBeUndefined()
  })

  it("returns undefined when multiple tier sizes make selection ambiguous", () => {
    const usage = usageFromTokens({
      sessionID: "ses-1",
      tokens: { input: 1, output: 1, reasoning: 0, cacheRead: 0, cacheWrite: 0 },
      model: "anthropic/test",
    })
    const ambiguous = [
      {
        providerID: "anthropic",
        id: "test",
        cost: [
          { tier: { size: 8000 }, input: 1, output: 2, cache: { read: 0, write: 0 } },
          { tier: { size: 200000 }, input: 3, output: 4, cache: { read: 0, write: 0 } },
        ],
      },
    ]
    expect(estimateCost(usage, ambiguous)).toBeUndefined()
  })

  it("finds a model by provider and ID", () => {
    expect(findModel(models, "anthropic", "test")).toBe(models[0])
    expect(findModel(models, "other", "test")).toBeUndefined()
  })
})
