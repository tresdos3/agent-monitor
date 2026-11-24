import type { HarnessReport } from "../../domain/harness.js"
import { verificationRatio } from "../../application/harness.js"
import { MiniBar } from "./MiniBar.js"
import { UnavailableState } from "./UnavailableState.js"
import type { Styles } from "../theme.js"

export interface VerificationSummaryProps {
  readonly report: () => HarnessReport | undefined
  readonly styles: Styles
}

/** Compact one-line scoreboard reused by Overview and Harness. */
export function VerificationSummary(props: VerificationSummaryProps) {
  const report = () => props.report()
  return (
    <>
      {report() ? (
        <>
          <text fg={props.styles.muted}>
            {`Verified ${report()!.scores.verified}  Observed ${report()!.scores.observed}  Declared ${report()!.scores.declared}  Missing ${report()!.scores.missing}  Failed ${report()!.scores.failed}`}
          </text>
          <MiniBar
            value={report()!.scores.verified + report()!.scores.observed}
            max={Math.max(report()!.checks.length, 1)}
            styles={props.styles}
            color={props.styles.success}
            width={10}
          />
          <text fg={props.styles.faint}>{`${Math.round(verificationRatio(report()!.scores) * 100)}% independently evidenced`}</text>
        </>
      ) : (
        <UnavailableState label="Verification summary unavailable" styles={props.styles} />
      )}
    </>
  )
}
