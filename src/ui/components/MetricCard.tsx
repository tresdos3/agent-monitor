import type { RGBA } from "@opentui/core"
import { Show } from "solid-js"
import type { Styles } from "../theme.js"

export interface MetricCardProps {
  readonly label: string
  readonly value: string | number
  readonly color: RGBA
  readonly styles: Styles
  readonly hint?: string
}

export function MetricCard(props: MetricCardProps) {
  return (
    <box border borderColor={props.styles.border} flexGrow={1} shouldFill={false} gap={1}>
      <text fg={props.styles.muted}>{props.label}</text>
      <text fg={props.color}>
        <strong>{props.value}</strong>
      </text>
      <Show when={props.hint} keyed>
        {(hint: string) => <text fg={props.styles.faint}>{hint}</text>}
      </Show>
    </box>
  )
}
