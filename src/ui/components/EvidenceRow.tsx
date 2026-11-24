import { Show } from "solid-js"
import type { HarnessCheck } from "../../domain/harness.js"
import { evidenceColor, evidenceGlyph, type Styles } from "../theme.js"

export interface EvidenceRowProps {
  readonly check: HarnessCheck
  readonly styles: Styles
}

export function EvidenceRow(props: EvidenceRowProps) {
  const color = () => evidenceColor(props.styles, props.check.evidence)
  return (
    <box flexDirection="column">
      <box flexDirection="row" gap={1}>
        <text fg={color()}>{evidenceGlyph(props.check.evidence)}</text>
        <text fg={color()}>{props.check.evidence}</text>
        <text fg={props.styles.base}>{props.check.title}</text>
      </box>
      <text fg={props.styles.muted}>{props.check.detail}</text>
      <Show when={props.check.resource} keyed>
        {(resource: string) => <text fg={props.styles.faint}>{resource}</text>}
      </Show>
    </box>
  )
}
