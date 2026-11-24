import type { EvidenceLevel } from "./model.js"

export interface UsageSnapshot {
  readonly sessionID: string
  readonly input?: number
  readonly output?: number
  readonly reasoning?: number
  readonly cacheRead?: number
  readonly cacheWrite?: number
  readonly total?: number
  readonly reportedCost?: number
  readonly model?: string
  readonly timestamp?: number
}

export interface PricingEstimate {
  readonly amount: number
  readonly source: string
  readonly version: string
  readonly date: string
  readonly tierSize?: number
}

export interface ChangedFile {
  readonly file: string
  readonly status: "added" | "deleted" | "modified"
  readonly additions?: number
  readonly deletions?: number
}

export interface ProjectView {
  readonly branch?: string
  readonly defaultBranch?: string
  readonly changedFiles: readonly ChangedFile[]
  readonly syncedAt?: number
}

export interface TestEvidence {
  readonly command: string
  readonly sessionID?: string
  readonly status: "passed" | "failed" | "unknown"
  readonly evidence: EvidenceLevel
  readonly timestamp?: number
}

export interface MonitorSettings {
  readonly compact: boolean
  readonly showEstimate: boolean
}
