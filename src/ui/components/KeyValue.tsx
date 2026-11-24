import { Show } from "solid-js"
import type { Styles } from "../theme.js"
import { truncate } from "../theme.js"

export interface KeyValueProps {
  readonly label: string
  readonly value: string
  readonly styles: Styles
  readonly maxValue?: number
  readonly valueColor?: Styles["base"]
  readonly primary?: boolean
}

export function KeyValue(props: KeyValueProps) {
  const shown = () => (props.maxValue ? truncate(props.value, props.maxValue) : props.value)
  return (
    <box flexDirection="row" gap={1}>
      <text fg={props.styles.muted}>{props.label}:</text>
      <Show when={props.primary} fallback={<text fg={props.valueColor ?? props.styles.base}>{shown()}</text>}>
        <text fg={props.valueColor ?? props.styles.action}>
          <strong>{shown()}</strong>
        </text>
      </Show>
    </box>
  )
}
