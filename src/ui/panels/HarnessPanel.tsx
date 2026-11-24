import { For, Show } from "solid-js"
import { EVIDENCE_LEVELS, groupChecksByEvidence } from "../../application/harness.js"
import type { HarnessReport } from "../../domain/harness.js"
import { EmptyState } from "../components/EmptyState.js"
import { EvidenceRow } from "../components/EvidenceRow.js"
import { Section } from "../components/Section.js"
import { VerificationSummary } from "../components/VerificationSummary.js"
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
          return (
            <box flexDirection="column" gap={1}>
              <Section title="VERIFICATION SUMMARY" styles={props.styles}>
                <VerificationSummary report={props.report} styles={props.styles} />
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
