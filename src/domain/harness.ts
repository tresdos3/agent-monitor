import type { EvidenceLevel } from "./model.js"

export interface HarnessCheck {
  readonly id: string
  readonly title: string
  readonly evidence: EvidenceLevel
  readonly detail: string
  readonly resource?: string
}

export interface HarnessScores {
  readonly verified: number
  readonly observed: number
  readonly declared: number
  readonly missing: number
  readonly failed: number
}

export interface HarnessReport {
  readonly checks: readonly HarnessCheck[]
  readonly scores: HarnessScores
  readonly generatedAt: number
}
