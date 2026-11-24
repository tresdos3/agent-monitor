import { For, Show } from "solid-js"
import { EVIDENCE_LEVELS, groupChecksByEvidence, verificationRatio } from "../../application/harness.js"
import type { HarnessReport } from "../../domain/harness.js"
import { EmptyState } from "../components/EmptyState.js"
import { EvidenceRow } from "../components/EvidenceRow.js"
import { MiniBar } from "../components/MiniBar.js"
import { Section } from "../components/Section.js"
import { evidenceColor, type Styles } from "../theme.js"

export interface HarnessPanelProps {
  readonly report: () => HarnessReport | undefined
  readonly styles: Styles
}

export function HarnessPanel(props: HarnessPanelProps) {
  return (
    <box flexDirection="column" gap={1}>
      <Show
        when={props.report()}
        keyed
        fallback={<EmptyState message="Harness evidence unavailable" hint="Project files could not be inspected" styles={props.styles} />}
      >
        {(report: HarnessReport) => {
          const groups = groupChecksByEvidence(report.checks)
          const ratio = verificationRatio(report.scores)
          const evidenced = report.scores.verified + report.scores.observed
          return (
            <box flexDirection="column" gap={1}>
              <Section title="VERIFICATION SUMMARY" styles={props.styles}>
                <box flexDirection="row" gap={2}>
                  <text fg={props.styles.success}>Verified {report.scores.verified}</text>
                  <text fg={props.styles.info}>Observed {report.scores.observed}</text>
                  <text fg={props.styles.warning}>Declared {report.scores.declared}</text>
                  <text fg={props.styles.faint}>Missing {report.scores.missing}</text>
                  <text fg={props.styles.error}>Failed {report.scores.failed}</text>
                </box>
                <MiniBar value={evidenced} max={Math.max(report.checks.length, 1)} styles={props.styles} color={props.styles.success} />
                <text fg={props.styles.muted}>{Math.round(ratio * 100)}% independently evidenced</text>
              </Section>

              <For each={EVIDENCE_LEVELS}>
                {(level) => (
                  <Show when={groups[level].length > 0}>
                    <Section title={level.toUpperCase()} styles={props.styles} titleColor={evidenceColor(props.styles, level)}>
                      <For each={groups[level]}>
                        {(check) => <EvidenceRow check={check} styles={props.styles} />}
                      </For>
                    </Section>
                  </Show>
                )}
              </For>

              <text fg={props.styles.faint}>Agent self-reports are Declared, never Verified.</text>
            </box>
          )
        }}
      </Show>
    </box>
  )
}
