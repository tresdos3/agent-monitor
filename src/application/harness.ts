import type { HarnessCheck, HarnessScores } from "../domain/harness.js"
import type { EvidenceLevel } from "../domain/model.js"

export const EVIDENCE_LEVELS: readonly EvidenceLevel[] = [
  "verified",
  "observed",
  "declared",
  "missing",
  "failed",
]

export type EvidenceGroups = Readonly<Record<EvidenceLevel, readonly HarnessCheck[]>>

export function groupChecksByEvidence(checks: readonly HarnessCheck[]): EvidenceGroups {
  const groups: Record<EvidenceLevel, HarnessCheck[]> = {
    verified: [],
    observed: [],
    declared: [],
    missing: [],
    failed: [],
  }
  for (const check of checks) groups[check.evidence].push(check)
  return groups
}

export function verificationRatio(scores: HarnessScores): number {
  const total = scores.verified + scores.observed + scores.declared + scores.missing + scores.failed
  if (total === 0) return 0
  return (scores.verified + scores.observed) / total
}
